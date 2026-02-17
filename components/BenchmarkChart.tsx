
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BenchmarkScore } from '../types';

interface BenchmarkChartProps {
  data: BenchmarkScore[];
}

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    subject: item.category.split(':')[0], // Simplify labels
    fullSubject: item.category,
    value: item.score,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[400px] bg-slate-900/30 rounded-2xl p-4 border border-slate-800/50">
      <h3 className="text-center text-slate-400 text-sm font-medium mb-4 uppercase tracking-widest">
        Security Posture Radar
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#818cf8' }}
          />
          <Radar
            name="Security Score"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
