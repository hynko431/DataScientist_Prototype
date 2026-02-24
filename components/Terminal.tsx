import React, { useEffect, useRef, useState } from 'react';
import { LogMessage, AgentRole } from '../types';
import { 
  Terminal as TerminalIcon, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Code2, 
  ShieldCheck, 
  FileText, 
  BrainCircuit, 
  ListChecks,
  Clock,
  Filter,
  Copy,
  Check,
  ArrowDown,
  Pause,
  Download,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface TerminalProps {
  logs: LogMessage[];
  onFeedback: (id: string, feedback: 'positive' | 'negative' | null) => void;
}

const Terminal: React.FC<TerminalProps> = ({ logs, onFeedback }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<AgentRole | 'ALL'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, filter]);

  // Handle Syntax Highlighting updates
  useEffect(() => {
    if ((window as any).Prism) {
        setTimeout(() => {
            (window as any).Prism.highlightAll();
        }, 50);
    }
  }, [logs, filter]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `generated_code_${new Date().getTime()}.py`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const getRoleStyles = (role: AgentRole) => {
    switch (role) {
      case AgentRole.USER:
        return {
          icon: <User className="w-4 h-4" />,
          color: 'text-blue-400',
          gradient: 'from-blue-500/20 to-blue-600/5',
          borderColor: 'border-blue-500/30',
          accentBorder: 'border-blue-500',
          badgeBg: 'bg-blue-500/10',
          badgeBorder: 'border-blue-500/20',
          messageBg: 'bg-blue-500/5',
          label: 'USER'
        };
      case AgentRole.PLANNER:
        return {
          icon: <BrainCircuit className="w-4 h-4" />,
          color: 'text-purple-400',
          gradient: 'from-purple-500/20 to-purple-600/5',
          borderColor: 'border-purple-500/30',
          accentBorder: 'border-purple-500',
          badgeBg: 'bg-purple-500/10',
          badgeBorder: 'border-purple-500/20',
          messageBg: 'bg-purple-500/5',
          label: 'PLANNER'
        };
      case AgentRole.CODER:
        return {
          icon: <Code2 className="w-4 h-4" />,
          color: 'text-emerald-400',
          gradient: 'from-emerald-500/20 to-emerald-600/5',
          borderColor: 'border-emerald-500/30',
          accentBorder: 'border-emerald-500',
          badgeBg: 'bg-emerald-500/10',
          badgeBorder: 'border-emerald-500/20',
          messageBg: 'bg-emerald-500/5',
          label: 'CODER'
        };
      case AgentRole.REVIEWER:
        return {
          icon: <ShieldCheck className="w-4 h-4" />,
          color: 'text-amber-400',
          gradient: 'from-amber-500/20 to-amber-600/5',
          borderColor: 'border-amber-500/30',
          accentBorder: 'border-amber-500',
          badgeBg: 'bg-amber-500/10',
          badgeBorder: 'border-amber-500/20',
          messageBg: 'bg-amber-500/5',
          label: 'REVIEWER'
        };
      case AgentRole.SUMMARY:
        return {
          icon: <FileText className="w-4 h-4" />,
          color: 'text-pink-400',
          gradient: 'from-pink-500/20 to-pink-600/5',
          borderColor: 'border-pink-500/30',
          accentBorder: 'border-pink-500',
          badgeBg: 'bg-pink-500/10',
          badgeBorder: 'border-pink-500/20',
          messageBg: 'bg-pink-500/5',
          label: 'SUMMARY'
        };
      case AgentRole.SYSTEM:
      default:
        return {
          icon: <TerminalIcon className="w-4 h-4" />,
          color: 'text-slate-400',
          gradient: 'from-slate-700/20 to-slate-800/5',
          borderColor: 'border-slate-700/50',
          accentBorder: 'border-slate-600',
          badgeBg: 'bg-slate-800',
          badgeBorder: 'border-slate-700',
          messageBg: 'bg-slate-800/20',
          label: 'SYSTEM'
        };
    }
  };

  const formatContent = (content: string, type: LogMessage['type'], logId: string) => {
    if (type === 'code') {
      return (
        <div className="mt-3 relative group/code overflow-hidden rounded-md border border-slate-800/50 shadow-xl">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-slate-800">
             <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
               <Code2 className="w-3 h-3" /> Python
             </span>
             <div className="flex items-center gap-3">
                <button 
                    onClick={() => handleDownload(content)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors"
                    title="Download Code"
                >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                </button>
                <button 
                    onClick={() => handleCopy(content, logId)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors"
                >
                    {copiedId === logId ? (
                        <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
             </div>
          </div>
          <div className="p-4 bg-[#0d1117] font-mono text-xs overflow-x-auto">
            <pre className="language-python !p-0 !m-0 !bg-transparent"><code className="language-python">{content}</code></pre>
          </div>
        </div>
      );
    }
    if (type === 'plan') {
         return (
             <div className="mt-2 p-4 bg-purple-900/10 rounded-lg border border-purple-500/20 text-purple-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-3 text-purple-400 font-semibold text-xs uppercase tracking-wider border-b border-purple-500/10 pb-2">
                     <ListChecks className="w-4 h-4" /> Execution Plan
                 </div>
                 <div className="whitespace-pre-wrap leading-relaxed font-mono text-xs opacity-90">{content}</div>
             </div>
         )
    }
    return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
  };

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(log => log.role === filter);

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] rounded-xl border border-surfaceHighlight overflow-hidden font-sans text-sm shadow-2xl relative">
      {/* Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 bg-[#161b22]/95 backdrop-blur border-b border-surfaceHighlight z-10 gap-2">
        <div className="flex items-center gap-2 text-muted">
          <div className="p-1.5 rounded-md bg-slate-800/50 border border-slate-700/50">
             <TerminalIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-[10px] tracking-widest uppercase text-slate-400 hidden sm:inline">Agent Execution Log</span>
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1 ml-4 bg-black/20 p-1 rounded-lg border border-white/5">
             <Filter className="w-3 h-3 text-slate-500 ml-1 mr-2" />
             {(['ALL', AgentRole.PLANNER, AgentRole.CODER, AgentRole.REVIEWER] as const).map((role) => (
                 <button
                    key={role}
                    onClick={() => setFilter(role)}
                    className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-all ${
                        filter === role 
                        ? 'bg-primary/20 text-primary border border-primary/20 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                 >
                    {role === 'ALL' ? 'All' : role}
                 </button>
             ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
            <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] transition-colors ${
                    autoScroll 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
                title={autoScroll ? "Auto-scroll ON" : "Auto-scroll PAUSED"}
            >
                {autoScroll ? <ArrowDown className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span className="hidden sm:inline">{autoScroll ? 'Scrolling' : 'Paused'}</span>
            </button>
            <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Live</span>
            </div>
        </div>
      </div>
      
      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
        <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        
        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-6 animate-fadeIn">
             <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                <div className="w-20 h-20 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 flex items-center justify-center relative z-10 backdrop-blur-sm">
                    <TerminalIcon className="w-10 h-10 opacity-50" />
                </div>
             </div>
             <div className="text-center space-y-2">
                <p className="text-sm font-medium tracking-widest uppercase text-slate-500">
                    {filter === 'ALL' ? 'System Ready' : `No logs for ${filter}`}
                </p>
                {filter === 'ALL' && <p className="text-xs text-slate-600">Waiting for user query to initialize agents...</p>}
             </div>
          </div>
        )}

        {filteredLogs.map((log, index) => {
          const styles = getRoleStyles(log.role);
          const isSystem = log.role === AgentRole.SYSTEM;
          
          return (
            <div key={log.id} className={`flex gap-4 group animate-slideUp ${isSystem ? 'opacity-75 hover:opacity-100' : ''}`}>
               {/* Icon / Avatar Column */}
               <div className="flex flex-col items-center gap-2 pt-1">
                   <div className={`shrink-0 w-8 h-8 rounded-lg border ${styles.borderColor} bg-gradient-to-br ${styles.gradient} flex items-center justify-center ${styles.color} shadow-lg ring-1 ring-white/5 backdrop-blur-sm`}>
                     {styles.icon}
                   </div>
                   {index !== filteredLogs.length - 1 && (
                       <div className="w-px flex-1 bg-slate-800/50 group-hover:bg-slate-700 transition-colors my-1"></div>
                   )}
               </div>

               {/* Content Column */}
               <div className={`flex-1 min-w-0 border-l-2 ${styles.accentBorder} pl-4 bg-gradient-to-r from-white/[0.02] to-transparent rounded-r-xl pr-2 py-1`}>
                 <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
                   <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${styles.badgeBg} ${styles.color}`}>
                     {styles.label}
                   </span>
                   
                   <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                     <Clock className="w-3 h-3 opacity-50" />
                     {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                     <span className="opacity-30">.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}</span>
                   </span>
                   
                   {/* Status Indicators */}
                   {log.type === 'success' && (
                       <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                           <CheckCircle2 className="w-3 h-3"/> SUCCESS
                       </span>
                   )}
                   {log.type === 'error' && (
                       <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                           <AlertTriangle className="w-3 h-3"/> ERROR
                       </span>
                   )}
                 </div>
                 
                 {/* Styled Message Body */}
                 <div className={`text-sm ${log.type === 'error' ? 'text-red-200' : 'text-slate-300'} break-words leading-relaxed selection:bg-primary/30`}>
                    {formatContent(log.content, log.type, log.id)}
                 </div>

                 {/* Feedback Mechanism */}
                 {!isSystem && log.role !== AgentRole.USER && (
                    <div className={`flex items-center justify-end gap-2 mt-2 transition-opacity duration-200 ${log.feedback ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         <span className="text-[9px] text-slate-600 mr-2 select-none">Was this helpful?</span>
                         <button 
                            onClick={() => onFeedback(log.id, log.feedback === 'positive' ? null : 'positive')} 
                            className={`p-1 rounded transition-colors ${log.feedback === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-500 hover:text-emerald-400'}`}
                            title="Helpful"
                         >
                            <ThumbsUp className="w-3.5 h-3.5" />
                         </button>
                         <button 
                            onClick={() => onFeedback(log.id, log.feedback === 'negative' ? null : 'negative')} 
                            className={`p-1 rounded transition-colors ${log.feedback === 'negative' ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5 text-slate-500 hover:text-red-400'}`}
                            title="Not Helpful"
                         >
                            <ThumbsDown className="w-3.5 h-3.5" />
                         </button>
                    </div>
                 )}
               </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};

export default Terminal;