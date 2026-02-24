import React, { useEffect, useRef } from 'react';
import { DashboardMetrics } from '../types';

interface DashboardProps {
  onNavigate: (page: string) => void;
  metrics: DashboardMetrics;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, metrics }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && (window as any).Chart) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if any
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const Chart = (window as any).Chart;
        const isDarkMode = true; // Hardcoded to match dark mode preference
        const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
        const textColor = isDarkMode ? '#94a3b8' : '#64748b';

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: metrics.driftChartLabels.length ? metrics.driftChartLabels : ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45'],
                datasets: [{
                    label: 'Drift Value (P-Value)',
                    data: metrics.driftChartValues.length ? metrics.driftChartValues : [0.02, 0.03, 0.025, 0.04, 0.12, 0.18, 0.24, 0.22],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: function(context: any) {
                        var index = context.dataIndex;
                        var value = context.dataset.data[index];
                        return value > 0.15 ? '#ef4444' : '#3b82f6';
                    },
                    pointBorderColor: '#ffffff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Threshold',
                    data: new Array(metrics.driftChartLabels.length || 8).fill(0.15),
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
                        bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor
                        },
                        suggestedMax: 0.3
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
      }
    }
    
    return () => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
    }
  }, [metrics]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-200 h-screen overflow-hidden flex font-sans w-full">
        <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-700 flex flex-col h-full flex-shrink-0 z-20">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                            ML
                        </div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">PipeMonitor</h1>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <a className="flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-lg font-medium transition-colors cursor-pointer">
            <span className="material-icons-round text-xl">dashboard</span>
                            Dashboard
                        </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg font-medium transition-colors group cursor-pointer">
            <span className="material-icons-round text-xl group-hover:text-primary transition-colors">model_training</span>
                            Models Registry
                        </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg font-medium transition-colors group cursor-pointer">
            <span className="material-icons-round text-xl group-hover:text-primary transition-colors">analytics</span>
                            Data Drift
                            <span className="ml-auto bg-danger/10 text-danger text-xs font-bold px-2 py-0.5 rounded-full">2</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg font-medium transition-colors group cursor-pointer">
            <span className="material-icons-round text-xl group-hover:text-primary transition-colors">schema</span>
                            Pipelines
                        </a>
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg font-medium transition-colors group cursor-pointer">
            <span className="material-icons-round text-xl group-hover:text-primary transition-colors">receipt_long</span>
                            Logs
                        </a>
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg font-medium transition-colors group cursor-pointer">
            <span className="material-icons-round text-xl group-hover:text-primary transition-colors">settings</span>
                            Settings
                        </a>
            <div className="mt-4 flex items-center gap-3 px-3 py-2">
            <img alt="User Avatar" className="h-8 w-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcJ9KYm0sDzz-C_53jI8uZD2zgtiS0cf3oJUXek5Kl1Hj8rAkvxeqLRfJJcwzs3-jF7NWj0CSPdc8prhio9gQwukUquguxSsIy58IIycJ-OiomUy64vftqQAW-Pm7f0iKzc_c2Zy0RIU_QVmfpUY6UcQzEY3rJ-rWuFJzLn9gosfRNcRuVEi21vBzN053Y6wcj8MCiJOfiVvfW2ZM3zfExKS3W1VBGaal1CBOjpwfV4DWhR5pdmZtNDcWw8_K3IC5z75xQ--h3YTSH"/>
            <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 dark:text-white">Alex M.</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">ML Engineer</span>
            </div>
            </div>
            </div>
        </aside>
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
            <header className="bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Production Overview</h2>
            <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-2 py-1 rounded text-xs font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                                {metrics.modelStatus || "System Operational"}
                            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Last updated: <span className="font-mono">
                {new Date().toLocaleTimeString()}
                </span></div>
            </div>
            <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative">
            <span className="material-icons-round">notifications</span>
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-danger rounded-full border-2 border-white dark:border-slate-800"></span>
            </button>
            <div className="h-8 border-l border-slate-200 dark:border-slate-700 mx-2"></div>
            <button onClick={() => onNavigate('workspace')} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
            <span className="material-icons-round text-sm">play_arrow</span>
                                Trigger Pipeline
                            </button>
            </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
            <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Model Accuracy</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.accuracy}</h3>
            </div>
            <div className="p-2 bg-success/10 rounded-lg text-success">
            <span className="material-icons-round text-lg">trending_up</span>
            </div>
            </div>
            <div className="flex items-center text-xs">
            <span className="text-success font-medium flex items-center mr-2">
                                        {metrics.accuracyChange} <span className="material-icons-round text-xs ml-0.5">arrow_upward</span>
            </span>
            <span className="text-slate-400">vs last retraining</span>
            </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
            <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">F1 Score</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.f1Score}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <span className="material-icons-round text-lg">assessment</span>
            </div>
            </div>
            <div className="flex items-center text-xs">
            <span className="text-slate-400 font-medium">Stable</span>
            <span className="text-slate-400 ml-2">across all folds</span>
            </div>
            </div>
            <div className={`bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${metrics.driftStatus === 'Critical' ? 'ring-1 ring-danger/30' : ''}`}>
            <div className="flex justify-between items-start mb-4">
            <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Drift Score (PSI)</p>
            <h3 className={`text-2xl font-bold mt-1 ${metrics.driftStatus === 'Critical' ? 'text-danger' : 'text-slate-900 dark:text-white'}`}>{metrics.driftScore}</h3>
            </div>
            <div className={`p-2 rounded-lg ${metrics.driftStatus === 'Critical' ? 'bg-danger/10 text-danger animate-pulse' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500'}`}>
            <span className="material-icons-round text-lg">warning</span>
            </div>
            </div>
            <div className="flex items-center text-xs">
            <span className={`${metrics.driftStatus === 'Critical' ? 'text-danger' : 'text-slate-500'} font-bold mr-2`}>{metrics.driftStatus} Drift</span>
            <span className="text-slate-400">Threshold: 0.20</span>
            </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
            <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Latency</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.avgLatency}</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <span className="material-icons-round text-lg">speed</span>
            </div>
            </div>
            <div className="flex items-center text-xs">
            <span className="text-success font-medium flex items-center mr-2">
                                        -4ms <span className="material-icons-round text-xs ml-0.5">arrow_downward</span>
            </span>
            <span className="text-slate-400">vs 24h avg</span>
            </div>
            </div>
            </div>
            <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
            <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Feature Drift Analysis</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">KS-Test P-values over time (Target Feature: "TransactionAmount")</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>TransactionAmount</option>
            <option>UserRegion</option>
            <option>DeviceType</option>
            </select>
            </div>
            <div className="h-72 w-full relative">
            <canvas ref={chartRef} id="driftChart"></canvas>
            </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
            <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Model Version Comparison</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Production (v2.4) vs Candidate (v2.5)</p>
            </div>
            <div className="flex gap-2">
            <span className="flex items-center text-xs gap-1 text-slate-500"><span className="w-3 h-3 rounded-full bg-primary"></span> Prod</span>
            <span className="flex items-center text-xs gap-1 text-slate-500"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Cand</span>
            </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="text-xs font-medium text-slate-500 mb-2">Recall</div>
            <div className="space-y-3">
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300"><span>Prod v2.4</span><span>88%</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{width: '88%'}}></div>
            </div>
            </div>
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300"><span>Cand v2.5</span><span>91%</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '91%'}}></div>
            </div>
            </div>
            </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="text-xs font-medium text-slate-500 mb-2">Precision</div>
            <div className="space-y-3">
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300"><span>Prod v2.4</span><span>92%</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{width: '92%'}}></div>
            </div>
            </div>
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300"><span>Cand v2.5</span><span>90%</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '90%'}}></div>
            </div>
            </div>
            </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="text-xs font-medium text-slate-500 mb-2">AUC-ROC</div>
            <div className="space-y-3">
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300"><span>Prod v2.4</span><span>0.89</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{width: '89%'}}></div>
            </div>
            </div>
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300"><span>Cand v2.5</span><span>0.94</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '94%'}}></div>
            </div>
            </div>
            </div>
            </div>
            </div>
            </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-auto">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">{metrics.recentBatches?.length || 0} New</span>
            </div>
            <div className="p-2 space-y-1">
                {metrics.recentBatches && metrics.recentBatches.length > 0 ? (
                    metrics.recentBatches.map((batch, idx) => (
                        <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg flex gap-3 transition-colors cursor-pointer group">
                            <div className="mt-1 flex-shrink-0">
                                {batch.driftLevel === 'High' ? (
                                    <span className="material-icons-round text-danger text-sm">error</span>
                                ) : (
                                    <span className="material-icons-round text-success text-sm">check_circle</span>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-primary transition-colors">
                                    Batch {batch.id} Processed
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Quality: {batch.quality}, Drift: {batch.drift}
                                </div>
                                <div className="text-xs text-slate-400 mt-2 font-mono">{batch.timestamp}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-slate-500">No recent activity</div>
                )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 rounded-b-xl">
            <button className="w-full text-xs font-medium text-primary hover:text-primary-dark transition-colors">View All Logs</button>
            </div>
            </div>
            
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Cluster Health</h3>
            <div className="space-y-4">
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-500">
            <span>GPU Utilization</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">42%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-success h-1.5 rounded-full" style={{width: '42%'}}></div>
            </div>
            </div>
            <div>
            <div className="flex justify-between text-xs mb-1 text-slate-500">
            <span>Memory (RAM)</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">78%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-warning h-1.5 rounded-full" style={{width: '78%'}}></div>
            </div>
            </div>
            </div>
            </div>
            </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Recent Inference Batches</h3>
            <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                                Filter
                            </button>
            <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                                Export CSV
                            </button>
            </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
            <th className="px-6 py-3 font-medium" scope="col">Batch ID</th>
            <th className="px-6 py-3 font-medium" scope="col">Timestamp</th>
            <th className="px-6 py-3 font-medium" scope="col">Model Version</th>
            <th className="px-6 py-3 font-medium" scope="col">Data Quality</th>
            <th className="px-6 py-3 font-medium" scope="col">Drift Status</th>
            <th className="px-6 py-3 font-medium" scope="col">Action</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {metrics.recentBatches && metrics.recentBatches.map((batch, i) => (
                    <tr key={i} className="bg-surface-light dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-900 dark:text-slate-300">{batch.id}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{batch.timestamp}</td>
                        <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">{batch.version}</span></td>
                        <td className={`px-6 py-4 ${batch.quality === '100% Valid' ? 'text-success' : 'text-warning'} font-medium`}>{batch.quality}</td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className={`${batch.driftLevel === 'High' ? 'bg-danger' : 'bg-success'} h-1.5 rounded-full`} style={{width: batch.driftLevel === 'High' ? '85%' : '15%'}}></div>
                        </div>
                        <span className={`text-xs ${batch.driftLevel === 'High' ? 'text-danger font-bold' : 'text-slate-500'}`}>{batch.drift}</span>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <a className="font-medium text-primary hover:underline cursor-pointer">Inspect</a>
                        </td>
                    </tr>
                ))}
                {(!metrics.recentBatches || metrics.recentBatches.length === 0) && (
                    <tr className="bg-surface-light dark:bg-surface-dark">
                        <td colSpan={6} className="px-6 py-4 text-center text-slate-500">No data available</td>
                    </tr>
                )}
            </tbody>
            </table>
            </div>
            </div>
            </div>
        </main>
    </div>
  );
};

export default Dashboard;
