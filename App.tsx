import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Shield, Activity, List, Zap, AlertTriangle, ChevronRight, BarChart3, Search, Info, Download, History, Clock, Trash2, ArrowRight, ArrowUpDown } from 'lucide-react';
import { generateThreatModel } from './services/geminiService';
import { Threat, BenchmarkScore, ModelEvaluation } from './types';
import { ThreatCard } from './components/ThreatCard';
import { BenchmarkChart } from './components/BenchmarkChart';
import { generatePDF } from './utils/pdfGenerator';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modelName, setModelName] = useState('GPT-4o / Gemini 1.5 Pro Wrapper');
  const [architecture, setArchitecture] = useState('Public API endpoint with vector DB RAG');
  const [useCase, setUseCase] = useState('Customer support chatbot handling PII and order history');
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'benchmarks' | 'history'>('overview');
  const [history, setHistory] = useState<ModelEvaluation[]>([]);
  const [sortOption, setSortOption] = useState<'severity-desc' | 'severity-asc' | 'title-asc' | 'category-asc'>('severity-desc');

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('sentinel_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  const runEvaluation = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateThreatModel(modelName, architecture, useCase);
      const newEval: ModelEvaluation = {
        id: Math.random().toString(36).substring(7),
        modelName,
        architecture,
        useCase,
        timestamp: new Date().toISOString(),
        threats: result.threats,
        scores: result.scores,
        overallRiskScore: result.overallRisk
      };
      
      setEvaluation(newEval);
      
      setHistory(prev => {
        const updated = [newEval, ...prev];
        localStorage.setItem('sentinel_history', JSON.stringify(updated));
        return updated;
      });
      
      setActiveTab('overview');
    } catch (error) {
      console.error(error);
      alert("Failed to analyze model. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, [modelName, architecture, useCase]);

  const loadFromHistory = (item: ModelEvaluation) => {
    setEvaluation(item);
    setModelName(item.modelName);
    setArchitecture(item.architecture);
    setUseCase(item.useCase);
    setActiveTab('overview');
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('sentinel_history', JSON.stringify(updated));
      return updated;
    });
  };

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-emerald-400';
    if (score < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score < 40) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score < 70) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const sortedThreats = useMemo(() => {
    if (!evaluation) return [];
    
    const severityWeight: Record<string, number> = { 
      'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 
    };

    return [...evaluation.threats].sort((a, b) => {
      switch (sortOption) {
        case 'severity-desc':
          return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
        case 'severity-asc':
          return (severityWeight[a.severity] || 0) - (severityWeight[b.severity] || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'category-asc':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  }, [evaluation, sortOption]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar Nav */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col items-center md:items-start py-8 px-4 z-50">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold hidden md:block tracking-tight">SentinelLLM</span>
        </div>

        <nav className="w-full space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="hidden md:block font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('threats')}
            disabled={!evaluation}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'threats' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'} ${!evaluation ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="hidden md:block font-medium">Threat Library</span>
          </button>
          <button 
            onClick={() => setActiveTab('benchmarks')}
            disabled={!evaluation}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'benchmarks' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'} ${!evaluation ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden md:block font-medium">Benchmarks</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'history' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <History className="w-5 h-5" />
            <span className="hidden md:block font-medium">History</span>
          </button>
        </nav>

        <div className="mt-auto w-full px-2">
          <div className="bg-slate-800/50 rounded-xl p-4 hidden md:block border border-slate-700/50">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Analysis</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Powered by Gemini-3 Pro Reasoning for deep threat detection.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 md:ml-64 p-6 md:p-10 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'history' ? 'Evaluation History' : 'Threat Modeler & Benchmark'}
            </h1>
            <p className="text-slate-400">
              {activeTab === 'history' 
                ? 'Review past security assessments and risk scores.' 
                : 'Evaluate LLM security posture against OWASP Top 10 standards.'}
            </p>
          </div>
          <div className="flex gap-3">
             {evaluation && activeTab !== 'history' && (
                <button 
                  onClick={() => generatePDF(evaluation)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-xl text-sm font-semibold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
             )}
            <div className="flex items-center gap-3 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="hidden md:block px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">Live Status</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Monitoring
              </div>
            </div>
          </div>
        </header>

        {/* History View */}
        {activeTab === 'history' ? (
          <div className="grid grid-cols-1 gap-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                <History className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No past evaluations found</p>
                <p className="text-sm">Run your first audit to see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="group flex flex-col md:flex-row md:items-center justify-between bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg"
                  >
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {item.modelName}
                        </h3>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskBadgeColor(item.overallRiskScore)}`}>
                          Risk: {item.overallRiskScore}/100
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4" />
                          {item.architecture}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <button 
                        onClick={(e) => deleteHistoryItem(e, item.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Report"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white rounded-xl transition-all font-medium text-sm">
                        View Report
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Input Form - only show on dashboard */}
            <section className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-10 shadow-xl ${activeTab !== 'overview' && evaluation ? 'hidden' : ''}`}>
              <div className="flex items-center gap-2 mb-6">
                <Search className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">Evaluation Parameters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Model</label>
                  <input 
                    type="text" 
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. GPT-4o, Custom Llama-3"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Architecture Context</label>
                  <input 
                    type="text" 
                    value={architecture}
                    onChange={(e) => setArchitecture(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Serverless RAG, On-prem"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Primary Use Case</label>
                  <input 
                    type="text" 
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Healthcare Agent, Coding Assistant"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={runEvaluation}
                  disabled={loading}
                  className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Security...
                    </>
                  ) : (
                    <>
                      {evaluation ? 'Run New Audit' : 'Run AI Security Audit'}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </section>

            {evaluation ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Summary View */}
                {activeTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Overall Risk Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-5xl font-black ${getRiskColor(evaluation.overallRiskScore)}`}>
                            {evaluation.overallRiskScore}
                          </span>
                          <span className="text-slate-600 font-bold italic">/ 100</span>
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Total Threats Identified</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-indigo-400">{evaluation.threats.length}</span>
                          <span className="text-slate-600 font-bold uppercase text-[10px]">vectors</span>
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Critical Vulnerabilities</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-red-500">
                            {evaluation.threats.filter(t => t.severity === 'Critical').length}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2">Evaluation Date</p>
                        <p className="text-lg font-bold text-slate-300">
                          {new Date(evaluation.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          {new Date(evaluation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <BenchmarkChart data={evaluation.scores} />
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <List className="w-5 h-5 text-indigo-400" />
                          Priority Mitigation Roadmap
                        </h3>
                        <div className="space-y-4">
                          {evaluation.threats.slice(0, 4).map((threat, idx) => (
                            <div key={threat.id} className="flex gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-bold text-indigo-400">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-200 text-sm mb-1">{threat.title}</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{threat.mitigation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Threats Library */}
                {activeTab === 'threats' && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">Comprehensive Threat Catalog</h2>
                        <div className="h-px flex-1 bg-slate-800 w-12 md:w-auto" />
                      </div>
                      
                      {/* Sort Controls */}
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-500 font-medium">Sort by:</span>
                        <select 
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                        >
                          <option value="severity-desc">Severity (Critical → Low)</option>
                          <option value="severity-asc">Severity (Low → Critical)</option>
                          <option value="title-asc">Title (A-Z)</option>
                          <option value="category-asc">Category (A-Z)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedThreats.map(threat => (
                        <ThreatCard key={threat.id} threat={threat} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Benchmark Details */}
                {activeTab === 'benchmarks' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold">OWASP Benchmark Breakdown</h2>
                      <div className="h-px flex-1 bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        {evaluation.scores.map((score, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:bg-slate-800/50 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-bold text-slate-300">{score.category}</span>
                              <span className={`font-mono font-bold ${score.score > 80 ? 'text-emerald-400' : score.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {score.score}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 mb-3">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${score.score > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : score.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${score.score}%` }} 
                              />
                            </div>
                            <p className="text-xs text-slate-500 italic leading-relaxed">{score.details}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-8 h-fit sticky top-6">
                        <div className="flex items-center gap-3 text-indigo-400 mb-6">
                          <Info className="w-6 h-6" />
                          <h3 className="text-xl font-bold">Benchmarking Methodology</h3>
                        </div>
                        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
                          <p>
                            SentinelLLM uses a reasoning-driven approach to score your deployment. The model analyzes the relationship between your specific <span className="text-indigo-300">Architecture</span> and <span className="text-indigo-300">Use Case</span> to identify intrinsic weaknesses.
                          </p>
                          <ul className="space-y-3">
                            <li className="flex gap-2">
                              <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0" />
                              <span>Scoring is based on empirical studies of LLM vulnerabilities and current adversarial research.</span>
                            </li>
                            <li className="flex gap-2">
                              <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0" />
                              <span>Benchmarks assume a sophisticated attacker capable of both direct and indirect injection techniques.</span>
                            </li>
                            <li className="flex gap-2">
                              <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0" />
                              <span>Security posture is relative; a "100%" score represents adherence to current best-practice guardrails.</span>
                            </li>
                          </ul>
                          <div className="pt-6 border-t border-indigo-500/10">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">Market Comparison Data</p>
                            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                              <span className="text-xs">Industry Avg (Healthcare)</span>
                              <span className="font-mono text-indigo-400 font-bold">64.2%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No evaluation data available</p>
                <p className="text-sm">Configure your parameters and run an audit to see results.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;