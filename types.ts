export enum AgentRole {
  PLANNER = 'Planner',
  CODER = 'Coder',
  REVIEWER = 'Reviewer',
  SUMMARY = 'Summary',
  USER = 'User',
  SYSTEM = 'System'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface LogMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: Date;
  type: 'info' | 'code' | 'success' | 'error' | 'plan';
  feedback?: 'positive' | 'negative' | null;
}

export interface AnalysisPlanStep {
  id: number;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  code?: string;
  output?: string;
}

export interface FileData {
  name: string;
  size: string;
  type: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: 'code' | 'markdown' | 'image';
  content: string;
  language?: string;
}

export interface DashboardMetrics {
  accuracy: string;
  accuracyChange: string;
  f1Score: string;
  driftScore: string;
  driftStatus: 'Normal' | 'Critical' | 'Warning';
  avgLatency: string;
  modelStatus: string;
  driftChartLabels: string[];
  driftChartValues: number[];
  recentBatches: Array<{
    id: string;
    timestamp: string;
    version: string;
    quality: string;
    drift: string;
    driftLevel: 'Low' | 'High' | 'Medium';
  }>;
}

export interface PipelineConfig {
  driftThreshold: number;
  accuracyThreshold: number;
  maxRetrainingAttempts: number;
}