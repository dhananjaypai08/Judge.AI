import React from 'react';
import { BarChart3, Settings, TrendingUp, Award, Flag, CheckSquare } from 'lucide-react';

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
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and branding */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Judge.AI
                </h1>
                <p className="text-sm text-gray-500 font-medium">Making fair judgment calls on innovation</p>
              </div>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center space-x-6">
            {stats.total > 0 && (
              <div className="hidden lg:flex items-center space-x-8">
                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      {stats.scored}/{stats.total} Evaluated
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Flag size={16} className="text-red-500" />
                    <span className="text-gray-600">{stats.flagged} flagged</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckSquare size={16} className="text-green-500" />
                    <span className="text-gray-600">{stats.unflagged} clean</span>
                  </div>
                  {stats.avgScore > 0 && (
                    <div className="flex items-center space-x-2">
                      <Award size={16} className="text-purple-500" />
                      <span className="text-gray-600">Avg: {stats.avgScore}/100</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};