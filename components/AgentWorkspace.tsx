import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings, Activity, Download, FileCode, BookOpen, ChevronLeft, LayoutDashboard, BarChart3, X, Maximize2, FileText, ExternalLink, Save, Upload, LayoutList, Workflow, CheckCircle2, Circle, Loader2, ArrowDown } from 'lucide-react';
import Terminal from './Terminal';
import AgentStatusPanel from './AgentStatus';
import FilePanel from './FilePanel';
import SettingsModal from './SettingsModal';
import { LogMessage, AgentRole, AgentStatus, AnalysisPlanStep, FileData, Artifact, DashboardMetrics, PipelineConfig } from '../types';
import { generatePlan, generateCode, generateSummary, generateDashboardData } from '../services/geminiService';
import { ML_PIPELINE_GUIDE } from '../templates';

interface AgentWorkspaceProps {
  onBack: () => void;
  onUpdateDashboard: (data: DashboardMetrics) => void;
}

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({ onBack, onUpdateDashboard }) => {
  // State
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [files, setFiles] = useState<FileData[]>([]);
  const [plan, setPlan] = useState<AnalysisPlanStep[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [mode, setMode] = useState<'simple' | 'orchestrated'>('orchestrated');
  const [dashboardUpdated, setDashboardUpdated] = useState(false);
  const [viewArtifact, setViewArtifact] = useState<Artifact | null>(null);
  const [planViewMode, setPlanViewMode] = useState<'list' | 'flow'>('flow');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
      driftThreshold: 0.05,
      accuracyThreshold: 0.05,
      maxRetrainingAttempts: 3
  });
  
  const codeRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const planContainerRef = useRef<HTMLDivElement>(null);

  // Trigger Syntax Highlighting when viewing artifact
  useEffect(() => {
    if (viewArtifact && codeRef.current && (window as any).Prism) {
        // Use highlightElement on the specific ref for better React compatibility
        (window as any).Prism.highlightElement(codeRef.current);
    }
  }, [viewArtifact]);

  // Auto-scroll plan container when plan updates
  useEffect(() => {
    if (planContainerRef.current) {
      planContainerRef.current.scrollTop = planContainerRef.current.scrollHeight;
    }
  }, [plan]);

  // Helper to add logs
  const addLog = (role: AgentRole, content: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
      type,
      feedback: null
    }]);
  };

  const handleLogFeedback = (id: string, feedback: 'positive' | 'negative' | null) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, feedback } : log));
  };

  // Helper to download artifact
  const downloadArtifact = (artifact: Artifact) => {
    const element = document.createElement("a");
    const file = new Blob([artifact.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    
    let ext = 'txt';
    if (artifact.language === 'python') ext = 'py';
    if (artifact.type === 'markdown') ext = 'md';
    if (artifact.language === 'json') ext = 'json';
    
    element.download = `${artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  // Save Session State
  const saveSession = () => {
    const sessionData = {
      query,
      logs,
      files,
      plan,
      artifacts,
      mode,
      pipelineConfig,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_session_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog(AgentRole.SYSTEM, 'Session saved successfully.', 'success');
  };

  // Load Session State
  const loadSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Restore State
        if (data.query) setQuery(data.query);
        if (data.files) setFiles(data.files);
        if (data.plan) setPlan(data.plan);
        if (data.artifacts) setArtifacts(data.artifacts);
        if (data.mode) setMode(data.mode);
        if (data.pipelineConfig) setPipelineConfig(data.pipelineConfig);
        
        // Restore logs (need to convert timestamp strings back to Date objects)
        if (data.logs && Array.isArray(data.logs)) {
          const restoredLogs = data.logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          setLogs(restoredLogs);
        }

        // Try to restore dashboard metrics if they exist in artifacts
        const dashboardArtifact = data.artifacts?.find((a: any) => a.id === 'dashboard-metrics');
        if (dashboardArtifact) {
            try {
                const metrics = JSON.parse(dashboardArtifact.content);
                onUpdateDashboard(metrics);
                setDashboardUpdated(true);
            } catch (err) {
                console.error("Failed to restore dashboard metrics from artifact", err);
            }
        }

        addLog(AgentRole.SYSTEM, 'Session loaded successfully.', 'success');
      } catch (err) {
        console.error(err);
        addLog(AgentRole.SYSTEM, 'Failed to load session. Invalid file format.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Helper to download as Notebook
  const downloadNotebook = () => {
    const fullCodeArtifact = artifacts.find(a => a.id === 'full-code');
    if (!fullCodeArtifact) return;

    const code = fullCodeArtifact.content;
    const cells = [];
    
    // Add Title
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: ["# AI Analysis Pipeline\n", "Generated by Agentic Data Scientist"]
    });

    const lines = code.split('\n');
    let currentBlock: string[] = [];
    
    lines.forEach(line => {
      // Check for Step headers we generated: # Step X: Description
      if (line.trim().startsWith('# Step')) {
        // Push previous code block if exists
        if (currentBlock.length > 0) {
          cells.push({
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: currentBlock.map(l => l + '\n')
          });
          currentBlock = [];
        }
        // Push Step Header as Markdown
        cells.push({
           cell_type: "markdown",
           metadata: {},
           source: [`### ${line.replace('# ', '').trim()}`]
        });
      } else {
        currentBlock.push(line);
      }
    });
    
    // Push remaining code
    if (currentBlock.length > 0) {
        cells.push({
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: currentBlock.map(l => l + '\n')
        });
    }

    const notebook = {
      cells,
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
        language_info: { codemirror_mode: { name: "ipython", version: 3 }, file_extension: ".py", mimetype: "text/x-python", name: "python", nbconvert_exporter: "python", pygments_lexer: "ipython3", version: "3.8.5" }
      },
      nbformat: 4,
      nbformat_minor: 4
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(notebook, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = "analysis_pipeline.ipynb";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    
    addLog(AgentRole.SYSTEM, "Downloaded analysis pipeline as Jupyter Notebook (.ipynb)", 'success');
  };

  // Helper to download template directly
  const downloadTemplate = () => {
    const element = document.createElement("a");
    const file = new Blob([ML_PIPELINE_GUIDE], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "end_to_end_pipeline_template.py";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    addLog(AgentRole.SYSTEM, 'Downloaded End-to-End ML Pipeline Template.', 'success');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files);
      const newFiles: FileData[] = uploadedFiles.map((f: File) => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + ' KB',
        type: f.name.split('.').pop()?.toUpperCase() || 'FILE'
      }));
      setFiles(prev => [...prev, ...newFiles]);
      
      // Detect model files
      const modelFiles = newFiles.filter(f => ['PKL', 'JOBLIB', 'MODEL', 'H5', 'PTH', 'KERAS'].includes(f.type));
      
      if (modelFiles.length > 0) {
        addLog(AgentRole.SYSTEM, `Upload Complete: ${newFiles.length} file(s).`, 'info');
        modelFiles.forEach(m => {
             addLog(AgentRole.SYSTEM, `Custom Model Detected: ${m.name}. Ready for inference comparison.`, 'success');
        });
        
        // Suggest a relevant query if input is empty
        if (!query.trim()) {
            setQuery(`Load the custom model '${modelFiles[0].name}' and evaluate its performance against the pipeline baseline on the dataset.`);
        }
      } else {
        addLog(AgentRole.SYSTEM, `Loaded ${newFiles.length} file(s).`, 'info');
      }
    }
  };
  
  // Handle File Actions (e.g., Compare)
  const handleFileAction = (action: string, fileName: string) => {
    if (action === 'compare') {
        const compareQuery = `Load the custom model '${fileName}' and compare its performance against the current pipeline model on the available dataset using ModelManager.compare_models().`;
        setQuery(compareQuery);
        // Using a timeout to allow the state to update before running
        setTimeout(() => {
            if (!isProcessing) {
               addLog(AgentRole.SYSTEM, `Ready to compare ${fileName}. Click 'Start Analysis' to proceed.`, 'info');
            }
        }, 100);
    }
  };

  // Load Template Function
  const loadTemplate = () => {
    // Inject current settings into the template
    const configuredTemplate = ML_PIPELINE_GUIDE.replace(
        /PIPELINE_CONFIG = \{[\s\S]*?\}/, 
        `PIPELINE_CONFIG = {
    "drift_threshold": ${pipelineConfig.driftThreshold},
    "max_accuracy_drop": ${pipelineConfig.accuracyThreshold},
    "max_retries": ${pipelineConfig.maxRetrainingAttempts}
}`
    );

    setArtifacts(prev => [...prev, {
      id: 'template-pipeline',
      title: 'ML Pipeline Template',
      type: 'code',
      content: configuredTemplate,
      language: 'python'
    }]);
    addLog(AgentRole.SYSTEM, 'Loaded "End-to-End ML Pipeline" template with active settings.', 'success');
    setQuery("I have loaded the End-to-End ML Pipeline template. Please explain how I can adapt this for my specific dataset.");
  };

  // Main Orchestration Logic
  const runOrchestration = async () => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setDashboardUpdated(false); // Reset update flag
    setPlan([]); // Reset plan
    setArtifacts([]);
    addLog(AgentRole.USER, query, 'info');

    // 1. Planning Phase
    setActiveAgent(AgentRole.PLANNER);
    setAgentStatus(AgentStatus.THINKING);
    addLog(AgentRole.SYSTEM, 'Initializing Planning Phase...', 'info');
    
    const fileContext = files.map(f => f.name).join(', ');
    const rawPlan = await generatePlan(query, fileContext);
    
    const structuredPlan: AnalysisPlanStep[] = rawPlan.map((desc, idx) => ({
      id: idx + 1,
      description: desc,
      status: 'pending'
    }));
    
    setPlan(structuredPlan);
    addLog(AgentRole.PLANNER, rawPlan.map((s, i) => `${i + 1}. ${s}`).join('\n'), 'plan');

    // 2. Execution Phase
    setActiveAgent(AgentRole.CODER);
    setAgentStatus(AgentStatus.WORKING);

    let executionContext = `PIPELINE CONFIGURATION SETTINGS:\n- Drift Threshold (P-Value): ${pipelineConfig.driftThreshold}\n- Max Accuracy Drop Threshold: ${pipelineConfig.accuracyThreshold}\n- Max Retraining Attempts: ${pipelineConfig.maxRetrainingAttempts}\n\n`;
    let fullCode = "# Full Analysis Pipeline\n# Configuration applied from User Settings\n\n";

    for (let i = 0; i < structuredPlan.length; i++) {
      const step = structuredPlan[i];
      
      // Update plan UI to show active
      setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'active' } : p));
      addLog(AgentRole.SYSTEM, `Starting Step ${step.id}: ${step.description}`, 'info');

      // Call Coder Agent
      setActiveAgent(AgentRole.CODER);
      setAgentStatus(AgentStatus.WORKING);
      const { code, explanation } = await generateCode(step.description, executionContext);
      
      // "Simulate" execution time
      await new Promise(r => setTimeout(r, 800));
      
      addLog(AgentRole.CODER, explanation, 'info');
      addLog(AgentRole.CODER, code, 'code');
      
      // Simulated Review Step
      setActiveAgent(AgentRole.REVIEWER);
      setAgentStatus(AgentStatus.THINKING);
      await new Promise(r => setTimeout(r, 400));
      addLog(AgentRole.REVIEWER, `Code for Step ${step.id} validated. No syntax errors detected. Complexity within limits.`, 'success');
      
      // Update Context
      executionContext += `\nStep ${step.id} Code:\n${code}\n`;
      fullCode += `# Step ${step.id}: ${step.description}\n${code}\n\n`;

      // Store Artifacts
      setArtifacts(prev => {
        const filtered = prev.filter(a => a.id !== 'full-code');
        return [
          ...filtered, 
          {
            id: `step-${step.id}`,
            title: `Step ${step.id} Code`,
            type: 'code',
            content: code,
            language: 'python'
          },
          {
            id: 'full-code',
            title: 'Complete Pipeline Code',
            type: 'code',
            content: fullCode,
            language: 'python'
          }
        ];
      });

      // Update plan UI to completed
      setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'completed', code } : p));
    }

    // 3. Dashboard Data Generation
    addLog(AgentRole.SYSTEM, "Calculating pipeline metrics and drift analysis for Dashboard...", 'info');
    const dashboardData = await generateDashboardData(executionContext);
    
    onUpdateDashboard(dashboardData);
    setDashboardUpdated(true);
    
    const metricSummary = `Dashboard Metrics Updated:\n• Accuracy: ${dashboardData.accuracy}\n• F1 Score: ${dashboardData.f1Score}\n• Drift Score: ${dashboardData.driftScore} (${dashboardData.driftStatus})`;
    addLog(AgentRole.SYSTEM, metricSummary, 'success');

    // 4. Summary Phase
    setActiveAgent(AgentRole.SUMMARY);
    setAgentStatus(AgentStatus.THINKING);
    
    const metricsContext = `Accuracy: ${dashboardData.accuracy}, F1: ${dashboardData.f1Score}, Drift: ${dashboardData.driftScore}, Status: ${dashboardData.modelStatus}`;
    const summary = await generateSummary(executionContext, metricsContext);
    addLog(AgentRole.SUMMARY, summary, 'success');

    // Store Final Artifacts
    setArtifacts(prev => {
      const others = prev.filter(a => !['final-report', 'full-code', 'dashboard-metrics'].includes(a.id));
      return [
        ...others,
        {
          id: 'final-report',
          title: 'Final Report',
          type: 'markdown',
          content: summary
        },
        {
          id: 'full-code',
          title: 'Complete Pipeline Code',
          type: 'code',
          content: fullCode,
          language: 'python'
        },
        {
          id: 'dashboard-metrics',
          title: 'Pipeline Metrics (JSON)',
          type: 'code',
          content: JSON.stringify(dashboardData, null, 2),
          language: 'json'
        }
      ];
    });

    setActiveAgent(null);
    setAgentStatus(AgentStatus.COMPLETED);
    setIsProcessing(false);
    addLog(AgentRole.SYSTEM, 'Workflow Completed Successfully.', 'success');
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text overflow-hidden w-full relative">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={pipelineConfig} 
        onSave={(newConfig) => {
            setPipelineConfig(newConfig);
            addLog(AgentRole.SYSTEM, `Configuration updated: Drift Threshold=${newConfig.driftThreshold}, Acc Drop=${newConfig.accuracyThreshold}`, 'info');
        }}
      />
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={loadSession} 
        accept=".json" 
        className="hidden" 
      />

      {/* Code Preview Modal */}
      {viewArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1e1e1e] border border-surfaceHighlight rounded-lg w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
             {/* Modal Header */}
             <div className="flex items-center justify-between px-4 py-3 border-b border-surfaceHighlight bg-[#252526]">
                <div className="flex items-center gap-3">
                   <div className={`p-1.5 rounded ${viewArtifact.type === 'code' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                      {viewArtifact.type === 'code' ? <FileCode className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                   </div>
                   <div>
                       <h3 className="text-sm font-medium text-white">{viewArtifact.title}</h3>
                       <p className="text-[10px] text-muted font-mono">{viewArtifact.language || viewArtifact.type}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   {viewArtifact.id === 'full-code' && (
                       <button 
                         onClick={downloadNotebook}
                         className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white bg-secondary hover:bg-secondary/80 rounded transition-colors mr-2"
                         title="Download as Jupyter Notebook"
                       >
                         <BookOpen className="w-3 h-3" />
                         Export .ipynb
                       </button>
                   )}
                   <button 
                     onClick={() => downloadArtifact(viewArtifact)}
                     className="p-1.5 hover:bg-surfaceHighlight rounded text-muted hover:text-white transition-colors"
                     title="Download"
                   >
                     <Download className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => setViewArtifact(null)}
                     className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-muted transition-colors"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>
             </div>
             
             {/* Modal Body (Code) */}
             <div className="flex-1 overflow-auto bg-[#1e1e1e] custom-scrollbar relative">
                <pre className={`language-${viewArtifact.language || 'text'} h-full`}>
                   <code ref={codeRef} className={`language-${viewArtifact.language || 'text'}`}>
                     {viewArtifact.content}
                   </code>
                </pre>
             </div>
             
             {/* Modal Footer */}
             <div className="px-4 py-2 bg-[#252526] border-t border-surfaceHighlight text-[10px] text-muted flex justify-between items-center">
                 <span>{viewArtifact.content.length} characters</span>
                 <span className="flex items-center gap-1 opacity-50">
                    <ExternalLink className="w-3 h-3" />
                    Read-only view
                 </span>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-surfaceHighlight bg-surface/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded transition-colors text-muted hover:text-white mr-2" title="Back to Dashboard">
             <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-lg shadow-primary/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Agentic Data Scientist
            </h1>
            <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
              ADK Orchestrator • Gemini 2.5
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Save/Load Session */}
          <div className="flex items-center gap-1 border-r border-surfaceHighlight pr-4 mr-2">
             <button 
               onClick={saveSession}
               className="p-2 text-muted hover:text-white hover:bg-surfaceHighlight rounded-lg transition-colors flex items-center gap-2 text-xs"
               title="Save Session to JSON"
             >
               <Save className="w-4 h-4" />
               <span className="hidden lg:inline">Save</span>
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-2 text-muted hover:text-white hover:bg-surfaceHighlight rounded-lg transition-colors flex items-center gap-2 text-xs"
               title="Load Session from JSON"
             >
               <Upload className="w-4 h-4" />
               <span className="hidden lg:inline">Load</span>
             </button>
          </div>

          {/* Download Buttons */}
          {artifacts.find(a => a.id === 'full-code') && (
            <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const artifact = artifacts.find(a => a.id === 'full-code');
                    if (artifact) downloadArtifact(artifact);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-surfaceHighlight hover:bg-surfaceHighlight/80 border border-white/10 rounded-md transition-all shadow-lg animate-fadeIn"
                  title="Download as Python Script (.py)"
                >
                  <FileCode className="w-4 h-4 text-accent" />
                  .py
                </button>
                <button 
                  onClick={downloadNotebook}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-secondary hover:bg-secondary/80 rounded-md transition-all shadow-lg animate-fadeIn"
                  title="Download as Jupyter Notebook (.ipynb)"
                >
                  <BookOpen className="w-4 h-4" />
                  Download Notebook
                </button>
            </div>
          )}

          <button 
            onClick={onBack}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-secondary hover:bg-secondary/80 rounded-md transition-all shadow-lg relative ${dashboardUpdated ? 'ring-2 ring-white/50 animate-pulse' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            View Dashboard
            {dashboardUpdated && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                </span>
            )}
          </button>
          <div className="flex bg-surfaceHighlight p-1 rounded-lg">
             <button 
               onClick={() => setMode('simple')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'simple' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'}`}
             >
               Simple
             </button>
             <button 
               onClick={() => setMode('orchestrated')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'orchestrated' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'}`}
             >
               Orchestrated
             </button>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-muted hover:text-white transition-colors"
            title="Configure Pipeline Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Input & Files */}
        <div className="w-80 flex flex-col border-r border-surfaceHighlight bg-surface/20">
           <div className="p-4 shrink-0">
             <FilePanel 
               files={files} 
               onUpload={handleFileUpload} 
               onDelete={(name) => setFiles(prev => prev.filter(f => f.name !== name))}
               onAction={handleFileAction}
             />
           </div>
           
           <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-muted uppercase">Goal / Query</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={downloadTemplate}
                    className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/30 hover:bg-emerald-500/10 px-2 py-0.5 rounded"
                    title="Download ML Pipeline Template code"
                  >
                    <Download className="w-3 h-3" />
                    Template
                  </button>
                  <button 
                    onClick={loadTemplate} 
                    className="text-[10px] flex items-center gap-1 text-accent hover:text-white transition-colors border border-accent/30 hover:bg-accent/10 px-2 py-0.5 rounded"
                    title="Load full ML pipeline code template"
                  >
                    <BookOpen className="w-3 h-3" />
                    Load
                  </button>
                </div>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Analyze sales.csv and forecast next month's revenue..."
                className="w-full h-40 bg-black/40 border border-surfaceHighlight rounded-lg p-3 text-sm focus:outline-none focus:border-primary/50 resize-none placeholder-muted/30"
                disabled={isProcessing}
              />
              <button
                onClick={runOrchestration}
                disabled={isProcessing || !query.trim()}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg
                  ${isProcessing || !query.trim()
                    ? 'bg-surfaceHighlight text-muted cursor-not-allowed' 
                    : 'bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-primary/25'
                  }`}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Start Analysis
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Center: Terminal / Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/20 relative">
          
          {/* Top Panel: Agent Status */}
          <div className="p-6 pb-0">
            <AgentStatusPanel activeAgent={activeAgent} status={agentStatus} />
          </div>

          {/* Bottom Panel: Logs */}
          <div className="flex-1 p-6 pt-2 min-h-0">
            <Terminal logs={logs} onFeedback={handleLogFeedback} />
          </div>
        </div>

        {/* Right Sidebar: Plan & Artifacts */}
        <div className="w-96 flex flex-col border-l border-surfaceHighlight bg-surface/20">
          <div className="flex-1 flex flex-col min-h-0">
             
             {/* Plan View */}
             <div className="flex-1 p-4 border-b border-surfaceHighlight overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Analysis Plan</h3>
                  <div className="flex items-center gap-2">
                    {plan.length > 0 && (
                      <span className="text-[10px] text-primary mr-2">{plan.filter(p => p.status === 'completed').length}/{plan.length} Completed</span>
                    )}
                    <div className="flex bg-surfaceHighlight rounded p-0.5">
                        <button 
                            onClick={() => setPlanViewMode('list')}
                            className={`p-1 rounded transition-colors ${planViewMode === 'list' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'}`}
                            title="List View"
                        >
                            <LayoutList className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => setPlanViewMode('flow')}
                            className={`p-1 rounded transition-colors ${planViewMode === 'flow' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'}`}
                            title="Flow View"
                        >
                            <Workflow className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  </div>
                </div>
                
                <div ref={planContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-4 relative">
                   {plan.length === 0 ? (
                     <div className="text-center text-muted/30 py-10 text-xs border border-dashed border-surfaceHighlight rounded">
                       Plan will appear here...
                     </div>
                   ) : (
                     <>
                        {/* LIST MODE */}
                        {planViewMode === 'list' && plan.map((step, idx) => (
                           <div key={step.id} className={`relative pl-6 pb-2 ${idx !== plan.length - 1 ? 'border-l border-surfaceHighlight' : ''} animate-slideUp`}>
                              <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 
                                ${step.status === 'completed' ? 'bg-secondary border-secondary' 
                                : step.status === 'active' ? 'bg-background border-primary animate-pulse' 
                                : 'bg-background border-surfaceHighlight'}`} 
                              />
                              <h4 className={`text-sm font-medium ${step.status === 'completed' ? 'text-text' : step.status === 'active' ? 'text-primary' : 'text-muted'}`}>
                                {step.description}
                              </h4>
                              {step.status === 'active' && <span className="text-[10px] text-primary mt-1 inline-block">Executing...</span>}
                           </div>
                        ))}

                        {/* FLOW MODE */}
                        {planViewMode === 'flow' && (
                            <div className="space-y-6 px-1 py-2">
                                {plan.map((step, idx) => (
                                    <div key={step.id} className="relative group animate-slideUp">
                                        {/* Connector Line */}
                                        {idx !== plan.length - 1 && (
                                            <div className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 z-0 transition-colors duration-500
                                                ${step.status === 'completed' ? 'bg-secondary/30' : 'bg-surfaceHighlight'}`} 
                                            />
                                        )}
                                        
                                        <div className="relative z-10 flex gap-3">
                                            {/* Status Icon */}
                                            <div className={`
                                                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-xl
                                                ${step.status === 'completed' 
                                                    ? 'bg-secondary/10 border-secondary text-secondary shadow-secondary/10' 
                                                    : step.status === 'active' 
                                                        ? 'bg-primary/10 border-primary text-primary shadow-primary/20 scale-110' 
                                                        : 'bg-surfaceHighlight/50 border-surfaceHighlight text-muted'
                                                }
                                            `}>
                                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                                 step.status === 'active' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                 <Circle className="w-5 h-5" />}
                                            </div>

                                            {/* Card Content */}
                                            <div className={`
                                                flex-1 p-3 rounded-lg border transition-all duration-300
                                                ${step.status === 'completed' 
                                                    ? 'bg-surface/50 border-surfaceHighlight' 
                                                    : step.status === 'active' 
                                                        ? 'bg-surface border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] translate-x-1' 
                                                        : 'bg-transparent border-transparent opacity-60'
                                                }
                                            `}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider
                                                        ${step.status === 'active' ? 'text-primary' : 'text-muted/50'}
                                                    `}>Step {step.id}</span>
                                                    {step.status === 'active' && (
                                                        <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={`text-xs font-medium leading-relaxed
                                                    ${step.status === 'completed' ? 'text-text' : step.status === 'active' ? 'text-white' : 'text-muted'}
                                                `}>
                                                    {step.description}
                                                </h4>
                                                
                                                {/* Code Snippet Preview if completed */}
                                                {step.status === 'completed' && step.code && (
                                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-muted/60">
                                                        <FileCode className="w-3 h-3" />
                                                        <span>Code generated</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {plan[plan.length-1]?.status === 'completed' && (
                                    <div className="flex justify-center pt-2 animate-fadeIn">
                                        <div className="bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary text-xs px-3 py-1.5 rounded-full border border-secondary/20 flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Pipeline Complete
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                     </>
                   )}
                </div>
             </div>

             {/* Artifacts/Preview */}
             <div className="h-1/3 border-t border-surfaceHighlight bg-black/20 flex flex-col">
                <div className="p-3 border-b border-surfaceHighlight bg-surface/30 flex items-center justify-between">
                   <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Outputs</h3>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            const fullCode = artifacts.find(a => a.id === 'full-code');
                            if (fullCode) downloadArtifact(fullCode);
                        }}
                        className={`text-muted hover:text-white transition-colors ${!artifacts.find(a => a.id === 'full-code') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                        title="Download Complete Pipeline Code"
                        disabled={!artifacts.find(a => a.id === 'full-code')}
                      >
                         <Download className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                   {artifacts.length > 0 ? (
                     <div className="space-y-2">
                       {artifacts.map(art => (
                         <div 
                           key={art.id} 
                           onClick={() => setViewArtifact(art)}
                           className="bg-surface/50 border border-surfaceHighlight rounded p-3 hover:border-primary/30 transition-colors cursor-pointer group relative"
                          >
                           <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                               {art.id === 'dashboard-metrics' ? (
                                   <BarChart3 className="w-4 h-4 text-secondary" />
                               ) : (
                                   <FileCode className="w-4 h-4 text-accent" />
                               )}
                               <span className="text-xs font-medium text-text group-hover:text-primary transition-colors">{art.title}</span>
                             </div>
                             <div className="flex items-center">
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 bg-surfaceHighlight rounded p-0.5 text-muted">
                                    <Maximize2 className="w-3 h-3" />
                                 </div>
                                 <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        downloadArtifact(art);
                                    }}
                                    className="p-1 hover:bg-surfaceHighlight rounded text-muted hover:text-white transition-all"
                                    title="Download File"
                                 >
                                    <Download className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                           </div>
                           <p className="text-[10px] text-muted line-clamp-2 font-mono opacity-70">
                             {art.content.substring(0, 100).replace(/\n/g, ' ')}...
                           </p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center text-muted/30 text-xs mt-4">
                       No artifacts generated yet.
                     </div>
                   )}
                </div>
             </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default AgentWorkspace;