import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: number; // positive = up, negative = down
  className?: string;
}

export default function StatCard({ label, value, sub, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {(sub || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
            {trend !== undefined && (
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
