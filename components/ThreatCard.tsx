
import React from 'react';
import { Threat } from '../types';

interface ThreatCardProps {
  threat: Threat;
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, string> = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[severity] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {severity}
    </span>
  );
};

export const ThreatCard: React.FC<ThreatCardProps> = ({ threat }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all duration-300 shadow-lg group">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-slate-100 text-lg leading-tight group-hover:text-indigo-300 transition-colors">
          {threat.title}
        </h3>
        <SeverityBadge severity={threat.severity} />
      </div>
      <p className="text-sm text-slate-400 mb-4 line-clamp-3 italic">
        {threat.category}
      </p>
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Impact</h4>
          <p className="text-sm text-slate-300">{threat.impact}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Mitigation Strategy</h4>
          <p className="text-sm text-emerald-400/90">{threat.mitigation}</p>
        </div>
      </div>
    </div>
  );
};
