import React from 'react';
import { FileData } from '../types';
import { FileSpreadsheet, Upload, FolderOpen, Trash2, Box, FileText, File, GitCompare } from 'lucide-react';

interface FilePanelProps {
  files: FileData[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (fileName: string) => void;
  onAction?: (action: string, fileName: string) => void;
}

const FilePanel: React.FC<FilePanelProps> = ({ files, onUpload, onDelete, onAction }) => {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4" />;
    if (['json', 'txt', 'log'].includes(ext || '')) return <FileText className="w-4 h-4" />;
    if (['pkl', 'joblib', 'model', 'h5', 'pth', 'keras'].includes(ext || '')) return <Box className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getIconColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pkl', 'joblib', 'model', 'h5', 'pth', 'keras'].includes(ext || '')) return 'bg-purple-900/30 text-purple-400';
    return 'bg-green-900/30 text-green-400';
  };
  
  const isModelFile = (fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      return ['pkl', 'joblib', 'model', 'h5', 'pth', 'keras'].includes(ext || '');
  }

  return (
    <div className="bg-surface rounded-lg border border-surfaceHighlight h-full flex flex-col">
      <div className="p-3 border-b border-surfaceHighlight flex items-center justify-between">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Workspace
        </h2>
        <span className="text-[10px] bg-surfaceHighlight px-2 py-0.5 rounded-full text-muted">
          {files.length} files
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted/40 p-4 text-center">
             <div className="flex gap-2 mb-2 opacity-50">
               <FileSpreadsheet className="w-8 h-8" />
               <Box className="w-8 h-8" />
             </div>
             <p className="text-xs">No files loaded.</p>
             <p className="text-[10px] mt-1 max-w-[150px]">Upload datasets (.csv) or models (.pkl) to begin analysis.</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.name} className="group flex items-center justify-between p-2 rounded hover:bg-surfaceHighlight/50 transition-colors cursor-pointer border border-transparent hover:border-surfaceHighlight">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-1.5 rounded ${getIconColor(file.name)}`}>
                  {getFileIcon(file.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-text truncate font-medium">{file.name}</span>
                  <span className="text-[10px] text-muted">{file.size} • {file.type}</span>
                </div>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isModelFile(file.name) && onAction && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction('compare', file.name); }}
                        className="p-1.5 hover:bg-purple-500/20 text-purple-400 rounded transition-all mr-1"
                        title="Compare against pipeline"
                    >
                        <GitCompare className="w-3.5 h-3.5" />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(file.name); }}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all"
                    title="Delete file"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-surfaceHighlight grid grid-cols-2 gap-2">
        <label className="flex flex-col items-center justify-center gap-1.5 py-3 bg-surfaceHighlight/50 hover:bg-surfaceHighlight text-muted hover:text-white text-[10px] font-medium rounded-lg border border-transparent hover:border-white/10 cursor-pointer transition-all group">
          <Upload className="w-4 h-4 mb-0.5 text-slate-500 group-hover:text-white transition-colors" />
          <span>Upload Dataset</span>
          <span className="text-[9px] opacity-50">.csv, .json</span>
          <input type="file" className="hidden" onChange={onUpload} accept=".csv,.xlsx,.json,.txt" multiple />
        </label>
        
        <label className="flex flex-col items-center justify-center gap-1.5 py-3 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-hover text-[10px] font-semibold rounded-lg border border-primary/20 border-dashed hover:border-primary/40 cursor-pointer transition-all group">
          <Box className="w-4 h-4 mb-0.5 text-primary/70 group-hover:text-primary transition-colors" />
          <span>Upload Model</span>
          <span className="text-[9px] opacity-70">.pkl, .joblib</span>
          <input type="file" className="hidden" onChange={onUpload} accept=".pkl,.joblib,.model,.h5,.pth,.keras" multiple />
        </label>
      </div>
    </div>
  );
};

export default FilePanel;