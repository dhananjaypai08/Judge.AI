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
  ArrowUpDown,
  Target,
  Activity
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
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [showOnlyScored, setShowOnlyScored] = useState(false);

  // Get all unique prize tracks
  const availableTracks = useMemo(() => {
    const tracks = new Map();
    projects.forEach(project => {
      project.prize_tracks?.forEach(track => {
        if (!tracks.has(track.uuid)) {
          tracks.set(track.uuid, track);
        }
      });
    });
    return Array.from(tracks.values());
  }, [projects]);

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

      // Prize track filter
      if (selectedTrack !== 'all') {
        const hasTrack = project.prize_tracks?.some(track => track.uuid === selectedTrack);
        if (!hasTrack) return false;
      }

      // Category filter
      switch (filterBy) {
        case 'scored':
          return project.aiScore !== undefined;
        case 'flagged':
          return !project.has_github_link || (project.aiScore?.flags && project.aiScore.flags.length > 0);
        case 'unflagged':
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
  }, [projects, searchQuery, sortBy, filterBy, selectedTrack, showOnlyScored]);

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
      ['Name', 'Score', 'Grade', 'Technical', 'Innovation', 'Value Prop', 'Completeness', 'Market', 'Code Quality', 'Flags', 'GitHub Link', 'Links', 'Devfolio URL'].join(','),
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
        `"${p.links}"`,
        `"https://devfolio.co/projects/${p.slug}"`
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
    { value: 'scored', label: 'Scored', icon: Award, count: stats.scored },
    { value: 'flagged', label: 'Flagged', icon: Flag, count: stats.flagged },
    { value: 'unflagged', label: 'Clean', icon: CheckSquare, count: stats.unflagged },
    { value: 'no-github', label: 'No GitHub', icon: AlertCircle, count: projects.filter(p => !p.has_github_link).length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar stats={stats} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Onchain Summer Awards
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Comprehensive evaluation system that analyzes technical implementation, on-chain presence, innovation, 
              market potential, and code quality.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={fetchProjects}
                disabled={loading || judging}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                <span>{projects.length > 0 ? 'Refresh Projects' : 'Fetch Projects'}</span>
              </button>

              {projects.length > 0 && (
                <button
                  onClick={judgeAllProjects}
                  disabled={judging || loading}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={20} />
                  <span>Judge All Projects</span>
                </button>
              )}

              {stats.scored > 0 && (
                <button
                  onClick={exportResults}
                  className="flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
                >
                  <Download size={20} />
                  <span>Export Results</span>
                </button>
              )}
            </div>

            {stats.scored > 0 && (
              <button
                onClick={clearResults}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <X size={16} />
                <span>Clear Results</span>
              </button>
            )}
          </div>
        </div>

        {/* Judging Progress */}
        {judging && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 mb-8">
            <div className="flex items-center justify-center gap-12">
              <ProgressSpinner 
                progress={judgingProgress.current} 
                total={judgingProgress.total}
                text="AI Processing..."
                className="scale-125"
              />
              <div className="text-center max-w-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  AI Evaluation in Progress
                </h3>
                <p className="text-gray-600 mb-4 text-lg">
                  Analyzing: <span className="font-semibold text-blue-600">{judgingProgress.projectName}</span>
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Comprehensive analysis of technical implementation, innovation potential, 
                  market viability, and overall project quality.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {projects.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
            <div className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects, technologies, or team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Filters */}
              <div className="space-y-6">
                {/* Category Filters */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <SlidersHorizontal className="text-gray-600" size={18} />
                    <span className="font-semibold text-gray-800">Category Filter</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {filterOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = filterBy === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFilterBy(option.value as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm border ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{option.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
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

                {/* Prize Track Filter */}
                {availableTracks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="text-gray-600" size={18} />
                      <span className="font-semibold text-gray-800">Prize Track Filter</span>
                    </div>
                    <select
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium max-w-md"
                    >
                      <option value="all">All Prize Tracks</option>
                      {availableTracks.map((track) => (
                        <option key={track.uuid} value={track.uuid}>
                          {track.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sort and Additional Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="text-gray-600" size={16} />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium text-sm"
                      >
                        <option value="score">Sort by Score</option>
                        <option value="name">Sort by Name</option>
                        <option value="views">Sort by Views</option>
                        <option value="likes">Sort by Likes</option>
                        <option value="created">Sort by Date</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyScored}
                        onChange={(e) => setShowOnlyScored(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Scored only</span>
                    </label>
                  </div>

                  {(searchQuery || filterBy !== 'all' || selectedTrack !== 'all' || showOnlyScored) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterBy('all');
                        setSelectedTrack('all');
                        setShowOnlyScored(false);
                      }}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X size={16} />
                      <span>Clear Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-gray-700">
                  Showing <span className="font-semibold text-blue-600">{filteredProjects.length}</span> of <span className="font-semibold">{projects.length}</span> projects
                  {searchQuery && (
                    <span className="text-gray-500"> matching "{searchQuery}"</span>
                  )}
                  {selectedTrack !== 'all' && (
                    <span className="text-gray-500"> in selected track</span>
                  )}
                </div>
                
                {filteredProjects.length > 0 && stats.scored > 0 && (
                  <div className="text-sm text-gray-500">
                    Average Score: <span className="font-semibold text-blue-600">{stats.avgScore}/100</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-900 text-lg">System Error</h3>
                <p className="text-red-800 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && projects.length === 0 && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <h3 className="mt-6 text-2xl font-bold text-gray-900">Fetching Projects</h3>
              <p className="text-gray-600 text-lg mt-2">Loading hackathon submissions...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && !error && (
          <div className="text-center py-32">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
              <Activity className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Analyze Projects</h3>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
              Load hackathon submissions and start comprehensive AI-powered evaluation across 
              technical implementation, innovation, market potential, and code quality.
            </p>
            <button onClick={fetchProjects} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors mx-auto">
              <BarChart3 size={20} />
              <span>Get Started</span>
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length > 0 && (
          <div className="space-y-6">
            {filteredProjects.map((project, index) => (
              <div key={project.uuid} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
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
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No projects match your current search and filter criteria. Try adjusting your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterBy('all');
                setSelectedTrack('all');
                setShowOnlyScored(false);
              }}
              className="flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors mx-auto"
            >
              <X size={18} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900">Judge.AI</span>
            </div>
            <p className="text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Advanced AI-powered evaluation system for hackathon projects. Providing comprehensive 
              analysis using state-of-the-art machine learning models.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                <span className="font-medium">AI Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                <span className="font-medium">Real-time Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={18} className="text-purple-500" />
                <span className="font-medium">Professional Grade</span>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="mt-8 text-sm text-gray-400">
                Last updated: {new Date().toLocaleString()} • {stats.total} projects analyzed
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}