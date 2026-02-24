export const ML_PIPELINE_GUIDE = `
# Complete End-to-End ML Pipeline with Automatic Retraining
# Copy each block into a Jupyter Notebook cell.

# ==========================================
# CELL 1: SETUP & IMPORTS
# ==========================================
import pandas as pd
import numpy as np
import os
import json
import joblib
import datetime
import warnings
from scipy.stats import ks_2samp
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
from sklearn.base import BaseEstimator

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# Configuration
PROJECT_DIR = "ml_pipeline_project"
MODELS_DIR = os.path.join(PROJECT_DIR, "saved_models")
LOGS_DIR = os.path.join(PROJECT_DIR, "logs")
DATA_HISTORY_DIR = os.path.join(PROJECT_DIR, "data_history")

# PIPELINE SETTINGS (Injectable via UI)
PIPELINE_CONFIG = {
    "drift_threshold": 0.05,        # P-value threshold for KS test
    "max_accuracy_drop": 0.05,      # 5% drop allowed before retraining
    "max_retries": 3                # Max automatic retraining attempts
}

# Create directories if they don't exist
for directory in [PROJECT_DIR, MODELS_DIR, LOGS_DIR, DATA_HISTORY_DIR]:
    os.makedirs(directory, exist_ok=True)

print("✅ Environment Setup Complete.")
print(f"📂 Project Directory: {os.path.abspath(PROJECT_DIR)}")
print(f"⚙️ Active Config: {PIPELINE_CONFIG}")


# ==========================================
# CELL 2: LOGGING & MONITORING SYSTEM
# ==========================================
class ModelMonitor:
    def __init__(self, logs_dir):
        self.logs_dir = logs_dir
        self.pred_log = os.path.join(logs_dir, "predictions.jsonl")
        self.retrain_log = os.path.join(logs_dir, "retraining.jsonl")
        self.issue_log = os.path.join(logs_dir, "data_issues.jsonl")

    def _append_json(self, filepath, data):
        """Helper to append JSON line to file"""
        data['timestamp'] = datetime.datetime.now().isoformat()
        with open(filepath, 'a') as f:
            f.write(json.dumps(data) + '\\n')

    def log_prediction(self, inputs, prediction, actual=None):
        """Log every prediction made"""
        entry = {
            'inputs': str(inputs), # Simplified for storage
            'prediction': str(prediction),
            'actual': str(actual) if actual else None
        }
        self._append_json(self.pred_log, entry)

    def log_retraining(self, trigger, old_score, new_score, status):
        """Log when model is retrained"""
        entry = {
            'event': 'retraining_attempt',
            'trigger': trigger,
            'old_model_score': old_score,
            'new_model_score': new_score,
            'status': status
        }
        self._append_json(self.retrain_log, entry)
        print(f"📝 Retraining Logged: {status} (Trigger: {trigger})")

    def log_issue(self, issue_type, description, severity='warning'):
        """Log data quality issues"""
        entry = {
            'type': issue_type,
            'description': description,
            'severity': severity
        }
        self._append_json(self.issue_log, entry)
        print(f"⚠️ {severity.upper()}: {description}")

monitor = ModelMonitor(LOGS_DIR)
print("✅ Monitoring System Initialized.")


# ==========================================
# CELL 3: VALIDATION & EDGE CASE HANDLING
# ==========================================
class DataValidator:
    def __init__(self, target_col=None):
        self.target_col = target_col

    def validate_and_clean(self, df, filename):
        """
        Runs 10 checks on the dataset.
        Returns: Cleaned DataFrame (or raises Error)
        """
        print(f"🔍 Validating {filename}...")
        
        # EDGE CASE 1: Invalid File Format (Handled by pandas read, but checked here)
        if df is None:
            raise ValueError("❌ Invalid file format or file not found.")

        # EDGE CASE 2: Empty Dataset
        if df.shape[0] == 0 or df.shape[1] == 0:
            raise ValueError("❌ Dataset is empty.")

        # EDGE CASE 3: Excessive Missing Data (>80%)
        missing_threshold = 0.8
        for col in df.columns:
            if df[col].isnull().mean() > missing_threshold:
                monitor.log_issue("missing_data", f"Dropped col '{col}' (>80% missing)")
                df.drop(columns=[col], inplace=True)

        # EDGE CASE 4: Excessive Duplicates (>50%)
        dup_threshold = 0.5
        if df.duplicated().mean() > dup_threshold:
            monitor.log_issue("duplicates", "High duplicate count detected. Dropping duplicates.", "warning")
            df.drop_duplicates(inplace=True)

        # EDGE CASE 5: Constant Columns (No Variance)
        for col in df.columns:
            if df[col].nunique() <= 1:
                monitor.log_issue("constant_col", f"Dropped col '{col}' (Only 1 unique value)")
                df.drop(columns=[col], inplace=True)

        # EDGE CASE 8: Too Few Samples
        if len(df) < 50:
            monitor.log_issue("sample_size", f"Dataset has only {len(df)} rows. Model may be unstable.", "warning")
        
        # EDGE CASE 10: Missing Target Variable (Check only if training)
        if self.target_col and self.target_col not in df.columns:
             monitor.log_issue("missing_target", "Target column missing. Proceeding in INFERENCE mode.", "info")
        
        # Fill remaining missing values for safety
        # Numeric -> Median, Object -> Mode
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                df[col].fillna(df[col].median(), inplace=True)
            else:
                df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown", inplace=True)

        print("✅ Validation & Cleaning Complete.")
        return df

validator = DataValidator()
print("✅ Validator Initialized.")


# ==========================================
# CELL 4: DATA DRIFT DETECTION
# ==========================================
class DriftDetector:
    def __init__(self, reference_data_path=None):
        self.reference_data = None
        if reference_data_path and os.path.exists(reference_data_path):
            self.reference_data = pd.read_csv(reference_data_path)

    def update_reference(self, new_df):
        """Update baseline data after retraining"""
        self.reference_data = new_df.copy()

    def detect_drift(self, new_df, threshold=0.05):
        """
        Uses Kolmogorov-Smirnov test to detect drift in numerical columns.
        Returns: Boolean (True if drift detected)
        """
        if self.reference_data is None:
            return False # First run, no drift possible

        drifted_cols = []
        numerical_cols = new_df.select_dtypes(include=np.number).columns
        
        # Only check columns present in both
        common_cols = [c for c in numerical_cols if c in self.reference_data.columns]

        for col in common_cols:
            # KS Test
            stat, p_value = ks_2samp(self.reference_data[col], new_df[col])
            if p_value < threshold:
                drifted_cols.append(col)
        
        if drifted_cols:
            monitor.log_issue("data_drift", f"Drift detected in: {drifted_cols} (p < {threshold})", "warning")
            return True
        return False

print("✅ Drift Detector Initialized.")


# ==========================================
# CELL 5: MODEL MANAGER & RETRAINING LOGIC
# ==========================================
class ModelManager:
    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.current_model = None
        self.current_preprocessor = None
        self.current_metadata = {} # To store score, version, etc.
        self.load_latest_model()

    def get_latest_version_dir(self):
        """Finds the directory with the latest timestamp"""
        if not os.path.exists(self.models_dir):
            return None
        versions = sorted([d for d in os.listdir(self.models_dir) if d.startswith("model_v")])
        if not versions:
            return None
        return os.path.join(self.models_dir, versions[-1])

    def load_latest_model(self):
        """Loads model, preprocessor, and metadata from disk"""
        latest_dir = self.get_latest_version_dir()
        if latest_dir:
            try:
                self.current_model = joblib.load(os.path.join(latest_dir, "model.pkl"))
                self.current_preprocessor = joblib.load(os.path.join(latest_dir, "preprocessor.pkl"))
                
                # Load metadata if exists
                meta_path = os.path.join(latest_dir, "metadata.json")
                if os.path.exists(meta_path):
                     with open(meta_path, 'r') as f:
                        self.current_metadata = json.load(f)
                
                print(f"✅ Loaded model from: {latest_dir} (Score: {self.current_metadata.get('score', 'N/A')})")
                return True
            except Exception as e:
                print(f"❌ Error loading model: {e}")
                return False
        return False

    def load_external_model(self, filepath):
        """Loads an external custom model (e.g. uploaded .pkl)"""
        try:
            model = joblib.load(filepath)
            print(f"✅ Loaded external model from: {filepath}")
            return model
        except Exception as e:
            print(f"❌ Error loading external model: {e}")
            return None

    def compare_models(self, custom_model, X_test, y_test):
        """Compares current internal model with a provided custom model"""
        print("\\n⚖️  COMPARISON REPORT")
        print("="*30)
        
        models = {'Pipeline Model': self.current_model, 'Custom Model': custom_model}
        results = {}
        
        for name, model in models.items():
            if model is None:
                print(f"⚠️  {name} is missing.")
                continue
                
            try:
                preds = model.predict(X_test)
                # Auto-detect metric
                if len(np.unique(y_test)) < 20: # Classification
                    score = accuracy_score(y_test, preds)
                    metric = "Accuracy"
                else:
                    score = r2_score(y_test, preds)
                    metric = "R2 Score"
                
                print(f"🔹 {name} {metric}: {score:.4f}")
                results[name] = score
            except Exception as e:
                print(f"❌ {name} failed: {e}")

        if len(results) == 2:
            diff = results['Custom Model'] - results['Pipeline Model']
            winner = "Custom Model" if diff > 0 else "Pipeline Model"
            print("-" * 30)
            print(f"🏆 WINNER: {winner} (Diff: {diff:+.4f})")
            return results
        return None

    def save_model(self, model, preprocessor, metrics):
        """Saves new model in a timestamped folder"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        version_dir = os.path.join(self.models_dir, f"model_v{timestamp}")
        os.makedirs(version_dir, exist_ok=True)

        joblib.dump(model, os.path.join(version_dir, "model.pkl"))
        joblib.dump(preprocessor, os.path.join(version_dir, "preprocessor.pkl"))
        
        with open(os.path.join(version_dir, "metadata.json"), 'w') as f:
            json.dump(metrics, f)
            
        print(f"💾 Model saved: {version_dir}")
        self.current_model = model
        self.current_preprocessor = preprocessor
        self.current_metadata = metrics

    def train(self, df, target_col, drift_detector_obj):
        """Trains a new model pipeline"""
        print("⚙️ Training new model...")
        
        X = df.drop(columns=[target_col])
        y = df[target_col]

        # Preprocessing Pipeline
        numeric_features = X.select_dtypes(include=['int64', 'float64']).columns
        categorical_features = X.select_dtypes(include=['object', 'category']).columns

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                # handle_unknown='ignore' handles EDGE CASE 7 (New Categories)
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ])

        # Select Model based on target type
        if y.dtype in ['int64', 'float64'] and y.nunique() > 20:
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            is_classification = False
        else:
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            is_classification = True

        # Pipeline
        clf = Pipeline(steps=[('preprocessor', preprocessor),
                              ('classifier', model)])

        # Split & Train
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        clf.fit(X_train, y_train)
        
        # Evaluate
        preds = clf.predict(X_test)
        if is_classification:
            score = accuracy_score(y_test, preds)
            metric_name = "Accuracy"
        else:
            score = r2_score(y_test, preds)
            metric_name = "R2 Score"

        print(f"🚀 New Model {metric_name}: {score:.4f}")

        # Update reference for drift detection
        drift_detector_obj.update_reference(df)
        
        return clf, preprocessor, score

print("✅ Model Manager Initialized.")


# ==========================================
# CELL 6: GENERATE DUMMY DATA (FOR DEMO)
# ==========================================
def create_dummy_data(filename="dataset.csv", drift=False):
    np.random.seed(42 if not drift else 99)
    rows = 1000
    
    # Create base data
    data = {
        'age': np.random.normal(35, 10, rows) if not drift else np.random.normal(55, 15, rows), # DRIFT HERE
        'income': np.random.normal(50000, 15000, rows),
        'category': np.random.choice(['A', 'B', 'C'], rows),
        'target': np.random.choice([0, 1], rows)
    }
    
    df = pd.DataFrame(data)
    
    # Introduce Edge Cases artificially
    df.loc[0:5, 'age'] = np.nan # Missing values
    
    df.to_csv(filename, index=False)
    print(f"📄 Generated {filename} (Drift Mode: {drift})")
    return filename

# Create initial training data
create_dummy_data("initial_data.csv", drift=False)
print("✅ Dummy data created.")


# ==========================================
# CELL 7: RUN COMPLETE PIPELINE
# ==========================================

def run_pipeline(filepath, target_col):
    print("="*60)
    print(f"🚀 STARTING PIPELINE PROCESSING FOR: {filepath}")
    print("="*60)

    # 1. Load Data
    try:
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.endswith('.xlsx'):
            df = pd.read_excel(filepath)
        else:
            raise ValueError("Unsupported file format")
    except Exception as e:
        print(f"❌ Fatal Error loading file: {e}")
        return

    # 2. Validation
    validator.target_col = target_col
    try:
        df = validator.validate_and_clean(df, filepath)
    except ValueError as e:
        print(e)
        return # Stop pipeline on critical error

    # Initialize Managers
    drift_detector = DriftDetector(os.path.join(DATA_HISTORY_DIR, "reference.csv"))
    manager = ModelManager(MODELS_DIR)

    # 3. Check for Target Column (Inference vs Training)
    is_training_data = target_col in df.columns

    # 4. Retraining Logic
    should_retrain = False
    
    # Logic: If no model exists, we MUST train
    if not manager.current_model and is_training_data:
        print("🆕 No existing model found. Initial training required.")
        should_retrain = True
    
    # Logic: Check for Drift OR Performance Drop if model exists
    elif manager.current_model and is_training_data:
        # A) Check Drift
        drift_detected = drift_detector.detect_drift(df, threshold=PIPELINE_CONFIG["drift_threshold"])
        
        # B) Check Performance on New Data
        # We perform a quick evaluation on the new batch
        try:
            X_new = df.drop(columns=[target_col])
            y_new = df[target_col]
            preds_new = manager.current_model.predict(X_new)
            
            # Simple scoring based on prediction type (assuming classification for simplicity here)
            current_batch_score = accuracy_score(y_new, preds_new) 
            
            baseline_score = manager.current_metadata.get('score', 0)
            performance_drop = baseline_score - current_batch_score
            
            print(f"📊 Current Batch Score: {current_batch_score:.4f} (Baseline: {baseline_score:.4f})")
            
            if performance_drop > PIPELINE_CONFIG["max_accuracy_drop"]:
                print(f"📉 Performance drop detected ({performance_drop:.2%} > {PIPELINE_CONFIG['max_accuracy_drop']:.2%})")
                should_retrain = True
            elif drift_detected:
                print("⚠️ Significant drift detected. Triggering preventive retraining.")
                should_retrain = True
            else:
                print("✅ Model performing within acceptable limits. No retraining needed.")
                
        except Exception as e:
            print(f"⚠️ Could not evaluate performance on new batch (possibly different schema): {e}")
            should_retrain = True

    if should_retrain:
        print("🔄 Initiating Retraining Sequence...")
        new_model, new_prep, new_score = manager.train(df, target_col, drift_detector)
        
        manager.save_model(new_model, new_prep, {"score": new_score, "timestamp": datetime.datetime.now().isoformat()})
        monitor.log_retraining("performance_drop_or_drift", 0.0, new_score, "success")
    else:
        # Inference Mode
        if not is_training_data:
            print("🔮 Running Inference...")
            if manager.current_model:
                preds = manager.current_model.predict(df)
                monitor.log_prediction(df.head().to_dict(), preds[:5])
                print(f"✅ Generated {len(preds)} predictions.")
                df['prediction'] = preds
                df.to_csv(os.path.join(PROJECT_DIR, "results.csv"), index=False)
            else:
                print("❌ No model available for inference.")

# Example Usage
# run_pipeline("initial_data.csv", "target")
`;