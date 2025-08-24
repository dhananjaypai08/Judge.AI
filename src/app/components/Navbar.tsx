import React from 'react';
import { BarChart3, TrendingUp, Award, Flag, CheckSquare, Activity } from 'lucide-react';

interface NavbarProps {
  stats: {
    total: number;
    scored: number;
    flagged: number;
    unflagged: number;
    avgScore: number;
    pending: number;
    errors: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ stats }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and branding */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Judge.AI</h1>
              <p className="text-xs text-gray-500 font-medium">AI-Powered Judging</p>
            </div>
          </div>
          
          {/* Status indicators */}
          {stats.total > 0 && (
            <div className="flex items-center gap-6">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-700">
                    {stats.scored}/{stats.total} Evaluated
                  </span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="hidden lg:flex items-center gap-6 text-sm">
                {stats.flagged > 0 && (
                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-red-500" />
                    <span className="text-gray-600 font-medium">{stats.flagged} flagged</span>
                  </div>
                )}
                
                {stats.unflagged > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-green-500" />
                    <span className="text-gray-600 font-medium">{stats.unflagged} clean</span>
                  </div>
                )}
                
                {stats.avgScore > 0 && (
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-purple-500" />
                    <span className="text-gray-600 font-medium">
                      Avg: <span className={`font-semibold ${getScoreColor(stats.avgScore)}`}>
                        {stats.avgScore}/100
                      </span>
                    </span>
                  </div>
                )}
                
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-orange-500 animate-pulse" />
                    <span className="text-gray-600 font-medium">{stats.pending} pending</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};