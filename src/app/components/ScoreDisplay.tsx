import React, { useState } from 'react';
import { AIScore } from '@/app/types';
import { getScoreColor, getScoreLabel, SCORING_CRITERIA } from '@/app/utils/aiJudge';

interface ScoreDisplayProps {
  score: AIScore;
  compact?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const criteriaLabels = {
    technicalImplementation: 'Technical Implementation',
    innovation: 'Innovation & Uniqueness',
    valueProposition: 'Value Proposition',
    completeness: 'Project Completeness',
    marketPotential: 'Market Potential',
    codeQuality: 'Code Quality & Docs',
    baseIntegration: 'Base Network Integration',
    trackAlignment: 'Prize Track Alignment'
  };

  const getGradeFromScore = (score: number): string => {
    if (score >= 94.0) return 'A+';
    if (score >= 88.0) return 'A';
    if (score >= 82.0) return 'A-';
    if (score >= 77.0) return 'B+';
    if (score >= 72.0) return 'B';
    if (score >= 67.0) return 'B-';
    if (score >= 62.0) return 'C+';
    if (score >= 58.0) return 'C';
    if (score >= 52.0) return 'C-';
    if (score >= 47.0) return 'D+';
    if (score >= 42.0) return 'D';
    return 'F';
  };

  const getScoreColorClass = (score: number): string => {
    if (score >= 82.0) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 72.0) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 58.0) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 82.0) return 'text-green-600';
    if (score >= 72.0) return 'text-blue-600';
    if (score >= 58.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryColor = (categoryKey: string, score: number): string => {
    // Special colors for Base-specific categories
    if (categoryKey === 'baseIntegration') {
      if (score >= 80) return 'text-blue-600';
      if (score >= 60) return 'text-blue-500';
      return 'text-red-500';
    }
    if (categoryKey === 'trackAlignment') {
      if (score >= 80) return 'text-purple-600';
      if (score >= 60) return 'text-purple-500';
      return 'text-red-500';
    }
    return getScoreTextColor(score);
  };

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-2 min-w-32">
        <div className={`px-4 py-2 rounded-lg border text-center ${getScoreColorClass(score.overallScore)}`}>
          <div className="text-xl font-bold">{score.overallScore}</div>
          <div className="text-xs opacity-75">/ 100</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold ${getScoreTextColor(score.overallScore)}`}>
            {getGradeFromScore(score.overallScore)}
          </div>
          <div className="text-xs text-gray-600">{getScoreLabel(score.overallScore)}</div>
        </div>
        {score.flags && score.flags.length > 0 && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
            {score.flags.length} issue{score.flags.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  const calculateWeightedBreakdown = () => {
    return Object.entries(score.breakdown).map(([key, value]) => ({
      key,
      label: criteriaLabels[key as keyof typeof criteriaLabels],
      score: value,
      weight: SCORING_CRITERIA[key as keyof typeof SCORING_CRITERIA] || 0,
      grade: getGradeFromScore(value)
    }));
  };

  const breakdown = calculateWeightedBreakdown();

  // Separate Base-specific categories for highlighting
  const baseCategories = breakdown.filter(item => 
    item.key === 'baseIntegration' || item.key === 'trackAlignment'
  );
  const standardCategories = breakdown.filter(item => 
    item.key !== 'baseIntegration' && item.key !== 'trackAlignment'
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header with overall score */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className={`px-6 py-4 rounded-lg border-2 text-center ${getScoreColorClass(score.overallScore)}`}>
            <div className="text-3xl font-bold">{score.overallScore}</div>
            <div className="text-xs opacity-75">out of 100</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              Grade: {getGradeFromScore(score.overallScore)}
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {getScoreLabel(score.overallScore)}
            </div>
            <div className="text-sm text-gray-600">
              AI Confidence: {Math.round(score.confidence * 100)}%
            </div>
            <div className="text-xs text-blue-600 font-medium">
              Base Network Focused Analysis
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Base-Specific Categories Highlight */}
      {baseCategories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-3">Base Network Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {baseCategories.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {item.weight}%
                  </span>
                  <span className={`font-bold ${getCategoryColor(item.key, item.score)}`}>
                    {item.score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 py-4 bg-gray-50 rounded-lg px-4">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {breakdown.filter(b => b.score >= 80).length}
          </div>
          <div className="text-xs text-gray-600">Strong Areas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-600">
            {breakdown.filter(b => b.score >= 60 && b.score < 80).length}
          </div>
          <div className="text-xs text-gray-600">Average Areas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">
            {breakdown.filter(b => b.score < 60).length}
          </div>
          <div className="text-xs text-gray-600">Weak Areas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">
            {score.flags ? score.flags.length : 0}
          </div>
          <div className="text-xs text-gray-600">Issues</div>
        </div>
      </div>

      {/* Flags with Base-specific styling */}
      {score.flags && score.flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="font-bold text-red-900 mb-2">
            Issues Found ({score.flags.length})
          </div>
          <ul className="text-red-800 space-y-1">
            {score.flags.map((flag, index) => (
              <li key={index} className="text-sm">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Score breakdown - Base categories first */}
          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-4">Detailed Score Breakdown</h4>
            
            {/* Base-specific categories */}
            {baseCategories.length > 0 && (
              <div className="mb-6">
                <h5 className="font-semibold text-blue-900 mb-3">Base Network Integration</h5>
                <div className="space-y-3">
                  {baseCategories.map((item) => (
                    <div key={item.key} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-800">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-blue-600 bg-blue-200 px-2 py-1 rounded">
                            {item.weight}% weight
                          </span>
                          <span className="font-bold text-blue-700">
                            {item.grade}
                          </span>
                          <span className={`font-bold px-3 py-1 rounded bg-white border border-blue-300 text-blue-800`}>
                            {item.score}/100
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center mb-2">
                        <div className="flex-1 bg-blue-200 rounded-full h-2 mr-4">
                          <div 
                            className="h-2 rounded-full transition-all duration-1000 bg-blue-600"
                            style={{ width: `${Math.min(item.score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard categories */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Standard Criteria</h5>
              <div className="space-y-3">
                {standardCategories.map((item) => (
                  <div key={item.key} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                          {item.weight}% weight
                        </span>
                        <span className="font-bold text-gray-700">
                          {item.grade}
                        </span>
                        <span className={`font-bold px-3 py-1 rounded ${getScoreColorClass(item.score)}`}>
                          {item.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            item.score >= 80 ? 'bg-green-500' : 
                            item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.score, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI reasoning */}
          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-3">AI Analysis</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line text-sm">
                {score.reasoning}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 text-center">
            Analyzed on {new Date(score.timestamp).toLocaleString()} • 
            Base Network Focused • Confidence: {Math.round(score.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};