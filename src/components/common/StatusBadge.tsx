import React from 'react';
import { getStatusInfo } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  context?: 'QC' | 'MAINTENANCE' | 'OUTBOUND' | 'FINANCE';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', context }) => {
  const { label, bg } = getStatusInfo(status, context);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bg} ${sizeClasses} tracking-tight whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};
