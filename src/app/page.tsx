'use client';

import React, { useState, useMemo } from 'react';
import { useProjects } from '@/app/hooks/useProjects';
import { ProjectCard } from '@/app/components/ProjectCard';
import { Navbar } from '@/app/components/Navbar';
import { LoadingSpinner, ProgressSpinner } from '@/app/components/LoadingSpinner';
import { ScoredProject } from '@/app/types';
import {
  Search, 
  Filter, 
  Download, 
  BarChart3, 
  Zap, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  Flag,
  CheckSquare,
  X,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

export default function HomePage() {
  const {
    projects,
    loading,
    error,
    judging,
    judgingProgress,
    fetchProjects,
    judgeAllProjects,
    judgeSingleProject,
    clearResults
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'views' | 'likes' | 'created'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'scored' | 'flagged' | 'unflagged' | 'no-github'>('all');
  const [showOnlyScored, setShowOnlyScored] = useState(false);

  // Enhanced Statistics
  const stats = useMemo(() => {
    const scored = projects.filter(p => p.aiScore).length;
    const flagged = projects.filter(p => !p.has_github_link || (p.aiScore?.flags && p.aiScore.flags.length > 0)).length;
    const unflagged = projects.filter(p => p.has_github_link && (!p.aiScore || !p.aiScore.flags || p.aiScore.flags.length === 0)).length;
    const avgScore = projects.filter(p => p.aiScore).reduce((sum, p) => sum + p.aiScore!.overallScore, 0) / scored || 0;
    
    return {
      total: projects.length,
      scored,
      flagged,
      unflagged,
      avgScore: Math.round(avgScore),
      pending: projects.filter(p => p.isLoading).length,
      errors: projects.filter(p => p.hasError).length
    };
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          project.name.toLowerCase().includes(query) ||
          project.tagline.toLowerCase().includes(query) ||
          project.hashtags.some(tag => tag.name.toLowerCase().includes(query)) ||
          project.members.some(member => 
            `${member.first_name} ${member.last_name}`.toLowerCase().includes(query)
          );
        
        if (!matchesSearch) return false;
      }

      // Category filter - PROPERLY IMPLEMENTED UNFLAGGED LOGIC
      switch (filterBy) {
        case 'scored':
          return project.aiScore !== undefined;
        case 'flagged':
          return !project.has_github_link || (project.aiScore?.flags && project.aiScore.flags.length > 0);
        case 'unflagged':
          // Clean projects: has GitHub AND (no AI score yet OR AI score with no flags)
          return project.has_github_link && (!project.aiScore || !project.aiScore.flags || project.aiScore.flags.length === 0);
        case 'no-github':
          return !project.has_github_link;
        default:
          return true;
      }
    });

    // Show only scored filter
    if (showOnlyScored) {
      filtered = filtered.filter(p => p.aiScore !== undefined);
    }

    // Sort projects
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          const scoreA = a.aiScore?.overallScore || 0;
          const scoreB = b.aiScore?.overallScore || 0;
          return scoreB - scoreA;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, sortBy, filterBy, showOnlyScored]);

  const exportResults = () => {
    const scoredProjects = projects.filter(p => p.aiScore);
    const getGrade = (score: number) => {
      if (score >= 97) return 'A+';
      if (score >= 93) return 'A';
      if (score >= 90) return 'A-';
      if (score >= 87) return 'B+';
      if (score >= 83) return 'B';
      if (score >= 80) return 'B-';
      if (score >= 77) return 'C+';
      if (score >= 73) return 'C';
      if (score >= 70) return 'C-';
      return 'F';
    };

    const csvContent = [
      ['Name', 'Score', 'Grade', 'Technical', 'Innovation', 'Value Prop', 'Completeness', 'Market', 'Code Quality', 'Flags', 'GitHub Link', 'Links'].join(','),
      ...scoredProjects.map(p => [
        `"${p.name}"`,
        p.aiScore!.overallScore,
        getGrade(p.aiScore!.overallScore),
        p.aiScore!.breakdown.technicalImplementation,
        p.aiScore!.breakdown.innovation,
        p.aiScore!.breakdown.valueProposition,
        p.aiScore!.breakdown.completeness,
        p.aiScore!.breakdown.marketPotential,
        p.aiScore!.breakdown.codeQuality,
        `"${p.aiScore!.flags ? p.aiScore!.flags.join('; ') : ''}"`,
        p.has_github_link ? 'Yes' : 'No',
        `"${p.links}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hackathon-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filterOptions = [
    { value: 'all', label: 'All Projects', icon: Users, count: stats.total },
    { value: 'scored', label: 'Scored Only', icon: Award, count: stats.scored },
    { value: 'flagged', label: 'Flagged Issues', icon: Flag, count: stats.flagged },
    { value: 'unflagged', label: 'Clean Projects', icon: CheckSquare, count: stats.unflagged },
    { value: 'no-github', label: 'No GitHub', icon: AlertCircle, count: projects.filter(p => !p.has_github_link).length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Navbar */}
      <Navbar stats={stats} />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Action Bar */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={fetchProjects}
                  disabled={loading || judging}
                  className="btn-primary flex items-center space-x-3 text-base px-8 py-4"
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                  <span>{projects.length > 0 ? 'Refresh Projects' : 'Fetch All Projects'}</span>
                </button>

                {projects.length > 0 && (
                  <button
                    onClick={judgeAllProjects}
                    disabled={judging || loading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={20} />
                    <span>Judge All Projects</span>
                  </button>
                )}

                {stats.scored > 0 && (
                  <button
                    onClick={exportResults}
                    className="btn-secondary flex items-center space-x-3 text-base px-8 py-4"
                  >
                    <Download size={20} />
                    <span>Export Results</span>
                  </button>
                )}
              </div>

              {stats.scored > 0 && (
                <button
                  onClick={clearResults}
                  className="text-gray-600 hover:text-red-600 font-semibold flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <X size={16} />
                  <span>Clear All Results</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Judging Progress */}
        {judging && (
          <div className="mb-12">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
              <div className="flex items-center justify-center space-x-12">
                <ProgressSpinner 
                  progress={judgingProgress.current} 
                  total={judgingProgress.total}
                  text="AI Processing..."
                  className="scale-125"
                />
                <div className="text-center max-w-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    AI Evaluation in Progress
                  </div>
                  <div className="text-gray-600 mb-4 text-lg">
                    Currently analyzing: <span className="font-semibold text-blue-600">{judgingProgress.projectName}</span>
                  </div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    Our advanced AI system is evaluating technical implementation, innovation potential, 
                    market viability, and overall project quality. This comprehensive analysis typically 
                    takes 2-3 minutes per project.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filters */}
        {projects.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-8">
                {/* Search Bar */}
                <div className="mb-8">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                    <input
                      type="text"
                      placeholder="Search projects, technologies, team members, or descriptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 text-lg font-medium"
                    />
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-3">
                      <SlidersHorizontal className="text-gray-600" size={20} />
                      <span className="text-base font-bold text-gray-800">Filter Projects:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {filterOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = filterBy === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setFilterBy(option.value as any)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 text-sm border ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon size={16} />
                            <span>{option.label}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {option.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Sort Dropdown */}
                    <div className="flex items-center space-x-2">
                      <ArrowUpDown className="text-gray-600" size={18} />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      >
                        <option value="score">Sort by Score</option>
                        <option value="name">Sort by Name</option>
                        <option value="views">Sort by Views</option>
                        <option value="likes">Sort by Likes</option>
                        <option value="created">Sort by Date</option>
                      </select>
                    </div>

                    {/* Scored Only Toggle */}
                    <label className="flex items-center space-x-3 cursor-pointer px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={showOnlyScored}
                        onChange={(e) => setShowOnlyScored(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">Scored only</span>
                    </label>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-base text-gray-700">
                    Showing <span className="font-bold text-blue-600">{filteredProjects.length}</span> of <span className="font-bold">{projects.length}</span> projects
                    {searchQuery && (
                      <span className="text-gray-500"> matching "{searchQuery}"</span>
                    )}
                  </div>
                  
                  {(searchQuery || filterBy !== 'all' || showOnlyScored) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterBy('all');
                        setShowOnlyScored(false);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-2 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X size={16} />
                      <span>Clear All Filters</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-12 bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <div className="font-bold text-red-900 text-lg">System Error</div>
                <div className="text-red-800 mt-2">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && projects.length === 0 && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <div className="mt-6 text-2xl font-bold text-gray-900">Fetching Projects</div>
              <div className="text-gray-600 text-lg mt-2">Loading hackathon submissions from Devfolio...</div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && !error && (
          <div className="text-center py-32">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
              <BarChart3 className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Judge Projects</h3>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
              Click "Fetch All Projects" to load hackathon submissions from Devfolio and start the 
              comprehensive AI-powered evaluation process.
            </p>
            <button onClick={fetchProjects} className="btn-primary text-lg px-12 py-5">
              <BarChart3 size={20} />
              Get Started
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length > 0 && (
          <div className="space-y-8">
            {filteredProjects.map((project, index) => (
              <div key={project.uuid} className="animate-slideIn" style={{ animationDelay: `${index * 50}ms` }}>
                <ProjectCard
                  project={project}
                  onJudgeClick={judgeSingleProject}
                />
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-8">
              <Filter className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              No projects match your current search and filter criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterBy('all');
                setShowOnlyScored(false);
              }}
              className="btn-secondary text-lg px-8 py-4"
            >
              <X size={18} />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Hackathon AI Judge
              </span>
            </div>
            <p className="text-gray-600 mb-8 max-w-3xl mx-auto text-lg leading-relaxed">
              Advanced AI-powered evaluation system for hackathon projects. Providing comprehensive 
              analysis across technical implementation, innovation, market potential, and code quality 
              using state-of-the-art machine learning models.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle size={18} className="text-green-500" />
                <span className="font-semibold">AI-Powered Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp size={18} className="text-blue-500" />
                <span className="font-semibold">Real-time Scoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award size={18} className="text-purple-500" />
                <span className="font-semibold">Professional Grade</span>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="mt-8 text-sm text-gray-400">
                Last updated: {new Date().toLocaleString()} • {stats.total} projects in database
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}