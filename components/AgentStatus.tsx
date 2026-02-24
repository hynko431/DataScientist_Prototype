import React from 'react';
import { AgentStatus, AgentRole } from '../types';
import { Bot, BrainCircuit, Code2, FileText, Loader2 } from 'lucide-react';

interface AgentStatusProps {
  activeAgent: AgentRole | null;
  status: AgentStatus;
}

const AgentCard: React.FC<{
  role: string;
  icon: React.ReactNode;
  isActive: boolean;
  status: AgentStatus;
  description: string;
}> = ({ role, icon, isActive, status, description }) => {
  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-500
      ${isActive 
        ? 'bg-surfaceHighlight border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]' 
        : 'bg-surface/50 border-transparent opacity-60 grayscale'}
    `}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-surfaceHighlight text-muted'}`}>
          {isActive && status === AgentStatus.WORKING ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            icon
          )}
        </div>
        <div>
          <h3 className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-muted'}`}>{role}</h3>
          <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      
      {isActive && (
        <div className="absolute top-3 right-3">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      )}
    </div>
  );
};

const AgentStatusPanel: React.FC<AgentStatusProps> = ({ activeAgent, status }) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <AgentCard
        role="Planner"
        icon={<BrainCircuit className="w-5 h-5" />}
        isActive={activeAgent === AgentRole.PLANNER}
        status={status}
        description="Analyzes request & builds execution plan"
      />
      <AgentCard
        role="Coder"
        icon={<Code2 className="w-5 h-5" />}
        isActive={activeAgent === AgentRole.CODER}
        status={status}
        description="Implements Python code for each step"
      />
      <AgentCard
        role="Reviewer"
        icon={<Bot className="w-5 h-5" />}
        isActive={activeAgent === AgentRole.REVIEWER}
        status={status}
        description="Validates code & checks output quality"
      />
      <AgentCard
        role="Summary"
        icon={<FileText className="w-5 h-5" />}
        isActive={activeAgent === AgentRole.SUMMARY}
        status={status}
        description="Compiles final report & insights"
      />
    </div>
  );
};

export default AgentStatusPanel;
