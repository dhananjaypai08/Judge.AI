import React from 'react';
import Link from 'next/link';

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
    if (score >= 82.0) return 'text-green-600';
    if (score >= 72.0) return 'text-blue-600';
    if (score >= 58.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and branding */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Judge.AI</h1>
              </div>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Projects
              </Link>
              <Link 
                href="/bets" 
                className="relative text-gray-700 hover:text-blue-600 font-medium transition-colors group"
              >
                <span>Bet on AI</span>
                <span className="absolute -top-1 -right-10 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                  LIVE
                </span>
                <div className="absolute top-8 left-0 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  Bet on AI Predictions
                </div>
              </Link>
            </nav>
          </div>
          
          {/* Status indicators */}
          {stats.total > 0 && (
            <div className="flex items-center gap-6">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  {stats.scored}/{stats.total} Evaluated
                </span>
                
                {stats.flagged > 0 && (
                  <span className="text-red-600 font-medium">
                    {stats.flagged} flagged
                  </span>
                )}
                
                {stats.unflagged > 0 && (
                  <span className="text-green-600 font-medium">
                    {stats.unflagged} clean
                  </span>
                )}
                
                {stats.avgScore > 0 && (
                  <span className="text-gray-600">
                    Avg: <span className={`font-semibold ${getScoreColor(stats.avgScore)}`}>
                      {stats.avgScore}/100
                    </span>
                  </span>
                )}
                
                {stats.pending > 0 && (
                  <span className="text-orange-600 font-medium">
                    {stats.pending} pending
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};