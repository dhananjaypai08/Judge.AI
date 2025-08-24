import React, { useState } from 'react';
import { AIScore } from '@/app/types';
import { getScoreColor, getScoreLabel, SCORING_CRITERIA } from '@/app/utils/aiJudge';
import { ChevronDown, ChevronUp, AlertTriangle, Info, Target, TrendingUp, Award, Star } from 'lucide-react';

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

  if (compact) {
    return (
      <div className="flex flex-col items-end space-y-3 min-w-40">
        <div className={`px-6 py-3 rounded-2xl border-2 text-center shadow-lg ${getScoreColor(score.overallScore)}`}>
          <div className="text-2xl font-bold">{score.overallScore}</div>
          <div className="text-xs font-semibold opacity-75">out of 100</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${getScoreColor(score.overallScore).replace('bg-', 'text-').replace('-50', '-600')}`}>
            Grade: {getGradeFromScore(score.overallScore)}
          </div>
          <div className="text-sm text-gray-600 font-semibold">{getScoreLabel(score.overallScore)}</div>
          <div className="text-xs text-gray-500 mt-1">{getPercentile(score.overallScore)}</div>
        </div>
        {score.flags && score.flags.length > 0 && (
          <div className="flex items-center text-red-700 bg-red-100 px-3 py-2 rounded-xl border border-red-200 shadow-sm">
            <AlertTriangle size={14} />
            <span className="text-sm ml-2 font-semibold">{score.flags.length} issue{score.flags.length !== 1 ? 's' : ''}</span>
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-8">
      {/* Header with overall score */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-6">
          <div className={`px-8 py-6 rounded-2xl border-2 text-center shadow-xl ${getScoreColor(score.overallScore)}`}>
            <div className="text-4xl font-bold">{score.overallScore}</div>
            <div className="text-sm font-semibold opacity-75">out of 100</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Award className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                Grade: {getGradeFromScore(score.overallScore)}
              </span>
            </div>
            <div className="text-xl font-semibold text-gray-700">
              {getScoreLabel(score.overallScore)}
            </div>
            <div className="flex items-center space-x-2 text-base text-gray-600">
              <TrendingUp size={16} />
              <span className="font-semibold">{getPercentile(score.overallScore)}</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <Star size={14} />
              <span>AI Confidence: {Math.round(score.confidence * 100)}%</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors px-6 py-3 rounded-xl hover:bg-blue-50 font-semibold"
        >
          <span className="text-base">
            {isExpanded ? 'Hide' : 'Show'} Breakdown
          </span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-6 py-6 border-y border-gray-200 bg-gray-50 rounded-2xl px-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{Math.round(totalWeightedScore)}</div>
          <div className="text-sm text-gray-600 font-semibold">Weighted Score</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-600">
            {breakdown.filter(b => b.score >= 80).length}
          </div>
          <div className="text-sm text-gray-600 font-semibold">Excellent Areas</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-600">
            {breakdown.filter(b => b.score < 70).length}
          </div>
          <div className="text-sm text-gray-600 font-semibold">Weak Areas</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">
            {score.flags ? score.flags.length : 0}
          </div>
          <div className="text-sm text-gray-600 font-semibold">Red Flags</div>
        </div>
      </div>

      {/* Flags */}
      {score.flags && score.flags.length > 0 && (
        <div className="border-l-4 border-red-500 bg-red-50 p-6 rounded-r-2xl shadow-sm">
          <div className="flex items-start space-x-4">
            <AlertTriangle size={24} className="text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-red-900 text-lg mb-3 flex items-center space-x-2">
                <span>Critical Issues Found</span>
                <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                  {score.flags.length}
                </span>
              </div>
              <ul className="text-red-800 space-y-2">
                {score.flags.map((flag, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-red-500 mt-1 font-bold">•</span>
                    <span className="font-semibold">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="space-y-8 pt-6 border-t border-gray-200">
          {/* Score breakdown */}
          <div>
            <h4 className="font-bold text-2xl text-gray-900 mb-6 flex items-center">
              <Target size={24} className="mr-3 text-blue-600" />
              Detailed Score Breakdown
            </h4>
            <div className="grid gap-6">
              {breakdown.map((item) => (
                <div key={item.key} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        item.score >= 80 ? 'bg-emerald-500' : 
                        item.score >= 70 ? 'bg-blue-500' : 
                        item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="font-bold text-gray-800 text-lg">
                        {item.label}
                      </span>
                      <span className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full font-semibold">
                        {item.weight}% weight
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-gray-700">
                        Grade: {item.grade}
                      </span>
                      <span className={`text-xl font-bold px-4 py-2 rounded-xl ${getScoreColor(item.score)} shadow-sm`}>
                        {item.score}/100
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mr-6">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          item.score >= 80 ? 'bg-emerald-500' : 
                          item.score >= 70 ? 'bg-blue-500' : 
                          item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(item.score, 100)}%` }}
                      />
                    </div>
                    <div className="text-base text-gray-700 font-semibold">
                      Contributes: <span className="text-blue-600">{item.weightedScore.toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI reasoning */}
          <div>
            <h4 className="font-bold text-2xl text-gray-900 mb-4 flex items-center">
              <Info size={24} className="mr-3 text-blue-600" />
              AI Judge Analysis
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                {score.reasoning}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <h5 className="font-bold text-blue-900 mb-4 text-lg">Improvement Recommendations:</h5>
            <ul className="text-blue-800 space-y-3">
              {breakdown
                .filter(item => item.score < 80)
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map(item => (
                  <li key={item.key} className="flex items-start space-x-3">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="font-semibold">
                      Focus on improving <strong>{item.label.toLowerCase()}</strong> 
                      (currently grade {item.grade}, worth {item.weight}% of total score)
                    </span>
                  </li>
                ))
              }
            </ul>
          </div>

          {/* Timestamp */}
          <div className="text-sm text-gray-500 pt-6 border-t border-gray-200 text-center">
            Analyzed on {new Date(score.timestamp).toLocaleString()} • 
            Powered by AI Judge v2.0 • Confidence: {Math.round(score.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};