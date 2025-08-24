import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {text && (
        <span className="text-slate-600 text-sm font-medium">{text}</span>
      )}
    </div>
  );
};

interface ProgressSpinnerProps {
  progress: number;
  total: number;
  text?: string;
  className?: string;
}

export const ProgressSpinner: React.FC<ProgressSpinnerProps> = ({
  progress,
  total,
  text,
  className = ''
}) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <div className="relative w-12 h-12">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="stroke-slate-200"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="stroke-blue-600 transition-all duration-300 ease-in-out"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-blue-600">{percentage}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-slate-700">
          {progress} / {total}
        </div>
        {text && (
          <div className="text-xs text-slate-500 mt-1">{text}</div>
        )}
      </div>
    </div>
  );
};