import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import { VAL_CARD, VAL_CHROME, VAL_CHROME_TITLE } from './validationTheme';

interface AnalyticsOverview {
  total_validations: number;
  completed_validations: number;
  success_rate: number;
  avg_score: number;
}

const QuickStats: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/analytics/', { params: { days: 1 } })
      .then(res => setOverview(res.data?.overview ?? null))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: 'Today',
      value: loading ? '—' : (overview?.total_validations ?? 0).toLocaleString(),
      sub: 'Validations',
      icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0]" />,
      color: 'text-emerald-600 dark:text-[#6effc0]',
    },
    {
      label: 'Completed',
      value: loading ? '—' : (overview?.completed_validations ?? 0).toLocaleString(),
      sub: 'Processed',
      icon: <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-[#60a5fa]" />,
      color: 'text-blue-600 dark:text-[#60a5fa]',
    },
    {
      label: 'Success Rate',
      value: loading ? '—' : `${(overview?.success_rate ?? 0).toFixed(1)}%`,
      sub: 'Completion',
      icon: <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-[#f59e0b]" />,
      color: 'text-amber-600 dark:text-[#f59e0b]',
    },
    {
      label: 'Avg Score',
      value: loading ? '—' : Math.round(overview?.avg_score ?? 0).toString(),
      sub: 'Quality',
      icon: <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-[#bacbbf]/60" />,
      color: 'text-gray-900 dark:text-[#e0e3e8]',
    },
  ];

  return (
    <div className={VAL_CARD}>
      <div className={VAL_CHROME}>
        <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
        <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
        <span className="w-2 h-2 rounded-full bg-emerald-500/60 dark:bg-[#6effc0]/60" />
        <span className={VAL_CHROME_TITLE}>quick_stats — last 24h</span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-[#3b4a41]/20">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/95 p-4 flex flex-col gap-1 dark:bg-[#1c2024]">
            <div className="flex items-center justify-between">
              {stat.icon}
              <span className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[8px] text-gray-400 dark:text-[#bacbbf]/40">
                {stat.label}
              </span>
            </div>
            <div
              className={`font-['JetBrains_Mono',monospace] font-bold text-xl ${
                loading ? 'animate-pulse text-gray-300 dark:text-[#3b4a41]' : stat.color
              }`}
            >
              {stat.value}
            </div>
            <div className="font-mono text-[9px] text-gray-400 dark:text-[#3b4a41] uppercase tracking-[0.1em]">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats;
