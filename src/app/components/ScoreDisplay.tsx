import React, { useState } from 'react';
import { AIScore } from '@/app/types';
import { getScoreColor, getScoreLabel, SCORING_CRITERIA } from '@/app/utils/aiJudge';
import { ChevronDown, ChevronUp, AlertTriangle, Info, Target, TrendingUp, Award, Star, BarChart } from 'lucide-react';

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
    codeQuality: 'Code Quality & Docs'
  };

  const getGradeFromScore = (score: number): string => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  };

  const getPercentile = (score: number): string => {
    if (score >= 95) return '95th+ percentile';
    if (score >= 90) return '90th+ percentile';
    if (score >= 85) return '85th+ percentile';
    if (score >= 80) return '80th+ percentile';
    if (score >= 75) return '75th+ percentile';
    if (score >= 70) return '70th+ percentile';
    if (score >= 60) return '60th+ percentile';
    if (score >= 50) return '50th+ percentile';
    return 'Below 50th percentile';
  };

  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 70) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-3 min-w-36">
        <div className={`px-5 py-3 rounded-xl border-2 text-center shadow-sm ${getScoreColorClass(score.overallScore)}`}>
          <div className="text-2xl font-bold">{score.overallScore}</div>
          <div className="text-xs font-medium opacity-75">out of 100</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${getScoreTextColor(score.overallScore)}`}>
            {getGradeFromScore(score.overallScore)}
          </div>
          <div className="text-sm text-gray-600 font-medium">{getScoreLabel(score.overallScore)}</div>
          <div className="text-xs text-gray-500 mt-1">{getPercentile(score.overallScore)}</div>
        </div>
        {score.flags && score.flags.length > 0 && (
          <div className="flex items-center text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <AlertTriangle size={12} />
            <span className="text-xs ml-2 font-medium">{score.flags.length} issue{score.flags.length !== 1 ? 's' : ''}</span>
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
      weight: SCORING_CRITERIA[key as keyof typeof SCORING_CRITERIA],
      weightedScore: (value * SCORING_CRITERIA[key as keyof typeof SCORING_CRITERIA]) / 100,
      grade: getGradeFromScore(value)
    }));
  };

  const breakdown = calculateWeightedBreakdown();
  const totalWeightedScore = breakdown.reduce((sum, item) => sum + item.weightedScore, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header with overall score */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className={`px-6 py-4 rounded-xl border-2 text-center shadow-sm ${getScoreColorClass(score.overallScore)}`}>
            <div className="text-3xl font-bold">{score.overallScore}</div>
            <div className="text-xs font-medium opacity-75">out of 100</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Award className="text-blue-600" size={20} />
              <span className="text-2xl font-bold text-gray-900">
                Grade: {getGradeFromScore(score.overallScore)}
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {getScoreLabel(score.overallScore)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp size={14} />
              <span className="font-medium">{getPercentile(score.overallScore)}</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Star size={12} />
              <span>AI Confidence: {Math.round(score.confidence * 100)}%</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 font-medium text-sm"
        >
          <span>{isExpanded ? 'Hide' : 'Show'} Breakdown</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100 bg-gray-50 rounded-lg px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{Math.round(totalWeightedScore)}</div>
          <div className="text-xs text-gray-600 font-medium">Weighted Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {breakdown.filter(b => b.score >= 80).length}
          </div>
          <div className="text-xs text-gray-600 font-medium">Excellent Areas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {breakdown.filter(b => b.score < 70).length}
          </div>
          <div className="text-xs text-gray-600 font-medium">Needs Work</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {score.flags ? score.flags.length : 0}
          </div>
          <div className="text-xs text-gray-600 font-medium">Issues</div>
        </div>
      </div>

      {/* Flags */}
      {score.flags && score.flags.length > 0 && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <span>Issues Found</span>
                <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                  {score.flags.length}
                </span>
              </div>
              <ul className="text-red-800 space-y-1">
                {score.flags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-1 font-bold">•</span>
                    <span className="font-medium">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Score breakdown */}
          <div>
            <h4 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
              <BarChart size={20} className="mr-2 text-blue-600" />
              Detailed Score Breakdown
            </h4>
            <div className="grid gap-4">
              {breakdown.map((item) => (
                <div key={item.key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.score >= 80 ? 'bg-green-500' : 
                        item.score >= 70 ? 'bg-blue-500' : 
                        item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-semibold text-gray-800">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full font-medium">
                        {item.weight}% weight
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-700">
                        {item.grade}
                      </span>
                      <span className={`text-lg font-bold px-3 py-1 rounded-lg ${getScoreColorClass(item.score)}`}>
                        {item.score}/100
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          item.score >= 80 ? 'bg-green-500' : 
                          item.score >= 70 ? 'bg-blue-500' : 
                          item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(item.score, 100)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-700 font-medium">
                      Contributes: <span className="text-blue-600">{item.weightedScore.toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI reasoning */}
          <div>
            <h4 className="font-bold text-xl text-gray-900 mb-3 flex items-center">
              <Info size={20} className="mr-2 text-blue-600" />
              AI Analysis
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line font-medium text-sm">
                {score.reasoning}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-bold text-blue-900 mb-3">Improvement Recommendations:</h5>
            <ul className="text-blue-800 space-y-2">
              {breakdown
                .filter(item => item.score < 80)
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map(item => (
                  <li key={item.key} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="font-medium">
                      Focus on improving <strong>{item.label.toLowerCase()}</strong> 
                      (currently grade {item.grade}, worth {item.weight}% of total score)
                    </span>
                  </li>
                ))
              }
            </ul>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 text-center">
            Analyzed on {new Date(score.timestamp).toLocaleString()} • 
            Powered by AI Judge • Confidence: {Math.round(score.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};