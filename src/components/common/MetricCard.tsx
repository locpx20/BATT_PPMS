import React from 'react';
import * as Icons from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  iconName: keyof typeof Icons;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtext,
  iconName,
  color = 'indigo',
  trend,
}) => {
  const IconComponent = (Icons[iconName] as React.ComponentType<{ className?: string }>) || Icons.Activity;

  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-700',
      border: 'hover:border-indigo-200',
      valueColor: 'text-slate-900',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-700',
      border: 'hover:border-emerald-200',
      valueColor: 'text-emerald-950',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-700',
      border: 'hover:border-amber-200',
      valueColor: 'text-amber-950',
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-700',
      border: 'hover:border-rose-200',
      valueColor: 'text-rose-950',
    },
    sky: {
      bg: 'bg-sky-50/70 text-sky-700',
      border: 'hover:border-sky-200',
      valueColor: 'text-sky-950',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-700',
      border: 'hover:border-slate-300',
      valueColor: 'text-slate-900',
    },
  }[color];

  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs transition-all duration-200 ${colorStyles.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${colorStyles.valueColor}`}>{value}</span>
            {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${colorStyles.bg}`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span
              className={`font-semibold shrink-0 ml-2 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
