import React from 'react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-midnight text-slate-300 font-sans min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white overflow-x-hidden w-full">
      <div className="fixed inset-0 z-0 pointer-events-none bg-hero-glow"></div>
      
      <header className="w-full bg-midnight/80 backdrop-blur-md border-b border-slate-800 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <span className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-3xl relative z-10">model_training</span>
          </div>
          <span className="text-xl font-medium tracking-tight text-white group-hover:text-cyan-400 transition-colors">PipelineAI</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
          <a className="hover:text-cyan-400 transition-colors duration-300 cursor-pointer">Overview</a>
          <a className="hover:text-cyan-400 transition-colors duration-300 cursor-pointer">Features</a>
          <a className="hover:text-cyan-400 transition-colors duration-300 cursor-pointer">Documentation</a>
          <a className="hover:text-cyan-400 transition-colors duration-300 cursor-pointer">Pricing</a>
        </nav>
        <div className="flex items-center space-x-6">
          <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">Sign in</a>
          <button onClick={() => onNavigate('dashboard')} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative bg-midnight-light border border-slate-700 hover:border-slate-500 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors">
              Get Started
            </div>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-start pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="w-full text-center max-w-4xl mx-auto mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="inline-flex items-center justify-center p-[1px] mb-8 rounded-full bg-gradient-to-r from-cyan-500/50 to-blue-600/50">
            <div className="bg-midnight rounded-full px-4 py-1.5 flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-3"></span>
              <span className="text-xs font-semibold tracking-wide uppercase text-cyan-400 mr-2">New</span>
              <span className="text-sm text-slate-300">Automated Drift Detection 2.0 is live</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-white mb-8 leading-tight">
            Automate your ML lifecycle <br className="hidden sm:block"/>
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400 text-glow">from validation to retraining.</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Stop manually monitoring model performance. Detect data drift, trigger automated pipelines, and ensure production accuracy with enterprise-grade reliability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button onClick={() => onNavigate('dashboard')} className="relative group px-8 py-4 bg-transparent overflow-hidden rounded-lg">
              <div className="absolute inset-0 w-full h-full bg-cyber-gradient opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
              <span className="relative text-white text-base font-semibold tracking-wide">Start Free Trial</span>
            </button>
            <button onClick={() => onNavigate('dashboard')} className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all duration-300 text-base font-medium backdrop-blur-sm">
              View Live Demo
            </button>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-white mb-4">Production-Ready Pipeline</h2>
            <p className="text-slate-400">Engineered for the modern data stack.</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="space-y-12"> 
              <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                <div className="md:w-[45%] mb-4 md:mb-0 md:text-right order-2 md:order-1 px-4">
                  <h3 className="text-xl font-medium text-white group-hover:text-cyan-400 transition-colors">Statistical Drift Detection</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-light">
                    Calculate KL-divergence and Wasserstein distance between training and inference data distributions to catch feature drift early.
                  </p>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-midnight border border-cyan-500/50 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] order-1 md:order-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                </div>
                <div className="md:w-[45%] order-3 px-4 pl-16 md:pl-4">
                  <div className="bg-card-gradient border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm group-hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-cyan-400 icon-glow">trending_up</span>
                      <span className="text-xs font-mono text-cyan-200">metric_drift &gt; threshold</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                <div className="md:w-[45%] order-3 md:order-1 px-4 pl-16 md:pl-4 md:text-right hidden md:block">
                  <div className="bg-card-gradient border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm group-hover:border-purple-500/30 transition-colors inline-block w-full">
                    <div className="flex items-center justify-end space-x-3">
                      <span className="text-xs font-mono text-purple-200">retrain_model(v2.1)</span>
                      <span className="material-symbols-outlined text-purple-400 icon-glow">autorenew</span>
                    </div>
                  </div>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-midnight border border-purple-500/50 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] order-1 md:order-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                <div className="md:w-[45%] mb-4 md:mb-0 order-2 md:order-3 px-4 pl-16 md:pl-4">
                  <h3 className="text-xl font-medium text-white group-hover:text-purple-400 transition-colors">Automated Retraining</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-light">
                    Trigger retraining workflows seamlessly when performance metrics drop below your defined thresholds. No manual intervention required.
                  </p>
                  <div className="md:hidden mt-4 bg-card-gradient border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-purple-400 icon-glow">autorenew</span>
                      <span className="text-xs font-mono text-purple-200">retrain_model(v2.1)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                <div className="md:w-[45%] mb-4 md:mb-0 md:text-right order-2 md:order-1 px-4">
                  <h3 className="text-xl font-medium text-white group-hover:text-blue-400 transition-colors">Model Versioning & Rollback</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-light">
                    Every model iteration is immutable and versioned. Instantly rollback to a previous stable version if a new deployment underperforms.
                  </p>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-midnight border border-blue-500/50 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] order-1 md:order-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>
                <div className="md:w-[45%] order-3 px-4 pl-16 md:pl-4">
                  <div className="bg-card-gradient border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm group-hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-blue-400 icon-glow">history</span>
                      <span className="text-xs font-mono text-blue-200">rollback --to v1.4.2</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                <div className="md:w-[45%] order-3 md:order-1 px-4 pl-16 md:pl-4 md:text-right hidden md:block">
                  <div className="bg-card-gradient border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm group-hover:border-emerald-500/30 transition-colors inline-block w-full">
                    <div className="flex items-center justify-end space-x-3">
                      <span className="text-xs font-mono text-emerald-200">logger.info("Drift detected")</span>
                      <span className="material-symbols-outlined text-emerald-400 icon-glow">terminal</span>
                    </div>
                  </div>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-midnight border border-emerald-500/50 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] order-1 md:order-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
                <div className="md:w-[45%] mb-4 md:mb-0 order-2 md:order-3 px-4 pl-16 md:pl-4">
                  <h3 className="text-xl font-medium text-white group-hover:text-emerald-400 transition-colors">Comprehensive Logging</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-light">
                    Centralized logs for training jobs, inference requests, and system health. Fully searchable and integrated with popular observability tools.
                  </p>
                  <div className="md:hidden mt-4 bg-card-gradient border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-emerald-400 icon-glow">terminal</span>
                      <span className="text-xs font-mono text-emerald-200">logger.info("Drift detected")</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 text-center border-t border-slate-800 pt-8">
            <a className="text-cyan-400 hover:text-cyan-300 font-medium text-sm inline-flex items-center group transition-all cursor-pointer">
              Explore all technical specifications
              <span className="material-symbols-outlined text-base ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-white">Seamless Integration Flow</h2>
          </div>
          <div className="rounded-xl border border-slate-700/50 p-1 shadow-2xl bg-midnight-light overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="bg-card-gradient rounded-lg p-10 flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 relative z-10">
              <div className="flex flex-col items-center text-center p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 shadow-lg w-full md:w-1/5 hover:border-slate-500 transition-colors group">
                <span className="material-symbols-outlined text-slate-400 mb-3 text-3xl group-hover:text-white transition-colors">storage</span>
                <span className="font-medium text-sm text-slate-200">Data Ingestion</span>
              </div>
              <div className="hidden md:flex flex-1 h-px bg-slate-700 mx-2 relative">
                <div className="absolute inset-0 bg-cyan-500/50 blur-[1px]"></div>
                <div className="absolute right-0 -top-1.5 w-3 h-3 border-t border-r border-cyan-500 rotate-45"></div>
              </div>
              <span className="material-symbols-outlined text-slate-600 rotate-90 md:hidden">arrow_downward</span>
              <div className="flex flex-col items-center text-center p-6 bg-midnight/80 rounded-lg border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] w-full md:w-1/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/5"></div>
                <span className="material-symbols-outlined text-cyan-400 mb-3 text-3xl icon-glow">analytics</span>
                <span className="font-medium text-sm text-white relative z-10">Drift Check</span>
                <span className="text-[10px] uppercase tracking-wider text-cyan-400 mt-2 font-bold bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-500/20">Active</span>
              </div>
              <div className="hidden md:flex flex-1 h-px bg-slate-700 mx-2 relative">
                <div className="absolute right-0 -top-1.5 w-3 h-3 border-t border-r border-slate-600 rotate-45"></div>
              </div>
              <span className="material-symbols-outlined text-slate-600 rotate-90 md:hidden">arrow_downward</span>
              <div className="flex flex-col items-center text-center p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 shadow-lg w-full md:w-1/5 hover:border-slate-500 transition-colors group">
                <span className="material-symbols-outlined text-slate-400 mb-3 text-3xl group-hover:text-white transition-colors">psychology</span>
                <span className="font-medium text-sm text-slate-200">Retraining</span>
              </div>
              <div className="hidden md:flex flex-1 h-px bg-slate-700 mx-2 relative">
                <div className="absolute right-0 -top-1.5 w-3 h-3 border-t border-r border-slate-600 rotate-45"></div>
              </div>
              <span className="material-symbols-outlined text-slate-600 rotate-90 md:hidden">arrow_downward</span>
              <div className="flex flex-col items-center text-center p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 shadow-lg w-full md:w-1/5 hover:border-slate-500 transition-colors group">
                <span className="material-symbols-outlined text-slate-400 mb-3 text-3xl group-hover:text-white transition-colors">rocket_launch</span>
                <span className="font-medium text-sm text-slate-200">Deploy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full text-center mb-16">
          <p className="text-xs font-semibold tracking-widest text-slate-500 mb-8 uppercase">Trusted by data teams at</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-40">
            <div className="text-2xl font-bold tracking-widest text-white hover:text-cyan-400 transition-colors cursor-default">ACME<span className="font-light">CORP</span></div>
            <div className="text-2xl font-bold tracking-widest text-white hover:text-cyan-400 transition-colors cursor-default">GLOBEX</div>
            <div className="text-2xl font-bold tracking-widest text-white hover:text-cyan-400 transition-colors cursor-default">SOYLENT</div>
            <div className="text-2xl font-bold tracking-widest text-white hover:text-cyan-400 transition-colors cursor-default">MASSIVE<span className="text-xs align-top">INC</span></div>
          </div>
        </div>
      </main>

      <footer className="bg-midnight-light border-t border-slate-800 py-12 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start text-sm relative z-10">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-2 mb-4 group cursor-pointer">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 transition-colors text-2xl">model_training</span>
              <span className="text-lg font-medium text-slate-300 group-hover:text-white transition-colors">PipelineAI</span>
            </div>
            <div className="flex space-x-4">
              <select className="bg-transparent text-slate-500 border-none text-xs focus:ring-0 cursor-pointer pl-0 hover:text-slate-300 transition-colors outline-none">
                <option className="bg-midnight">English (United States)</option>
                <option className="bg-midnight">Français</option>
                <option className="bg-midnight">Español</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-8 text-slate-500">
            <a className="hover:text-cyan-400 transition-colors cursor-pointer">Help</a>
            <a className="hover:text-cyan-400 transition-colors cursor-pointer">Privacy</a>
            <a className="hover:text-cyan-400 transition-colors cursor-pointer">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
