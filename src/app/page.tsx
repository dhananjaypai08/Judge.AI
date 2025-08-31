'use client';

import React, { useState, useMemo } from 'react';
import { useProjects } from '@/app/hooks/useProjects';
import { ProjectCard } from '@/app/components/ProjectCard';
import { Navbar } from '@/app/components/Navbar';
import { LoadingSpinner, ProgressSpinner } from '@/app/components/LoadingSpinner';
import { ScoredProject } from '@/app/types';

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
      avgScore: Math.round(avgScore * 10) / 10, // Keep one decimal
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
  }, [projects, searchQuery, sortBy, filterBy, selectedTrack]);

  // Fixed judge single project to update the view immediately
  const handleJudgeSingleProject = async (project: ScoredProject) => {
    await judgeSingleProject(project);
    // The useProjects hook will handle updating the project in the list
    // No need to change filters - the updated project will show in current view
  };

  const exportResults = () => {
    const scoredProjects = projects.filter(p => p.aiScore);
    const getGrade = (score: number) => {
      if (score >= 94.0) return 'A+';
      if (score >= 88.0) return 'A';
      if (score >= 82.0) return 'A-';
      if (score >= 72.0) return 'B+';
      if (score >= 58.0) return 'B';
      return 'C';
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
    { value: 'all', label: 'All Projects', count: stats.total },
    { value: 'scored', label: 'Scored', count: stats.scored },
    { value: 'flagged', label: 'Flagged', count: stats.flagged },
    { value: 'unflagged', label: 'Clean', count: stats.unflagged },
    { value: 'no-github', label: 'No GitHub', count: projects.filter(p => !p.has_github_link).length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar stats={stats} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Onchain Summer Awards
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive AI-powered evaluation system for hackathon projects, analyzing technical implementation, 
              innovation, market potential, and code quality.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Centered Action Bar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
          <div className="text-center">
            {projects.length === 0 ? (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Analyze Projects</h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Load hackathon submissions and start comprehensive AI-powered evaluation.
                </p>
                <button
                  onClick={fetchProjects}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fetching Projects...' : 'Fetch Projects'}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={fetchProjects}
                  disabled={loading || judging}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : 'Refresh Projects'}
                </button>

                <button
                  onClick={judgeAllProjects}
                  disabled={judging || loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {judging ? 'Judging...' : 'Judge All Projects'}
                </button>

                {stats.scored > 0 && (
                  <button
                    onClick={exportResults}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Export Results
                  </button>
                )}

                {stats.scored > 0 && (
                  <button
                    onClick={clearResults}
                    className="px-6 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold transition-colors"
                  >
                    Clear Results
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Judging Progress */}
        {judging && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 mb-8">
            <div className="flex items-center justify-center gap-12">
              <ProgressSpinner 
                progress={judgingProgress.current} 
                total={judgingProgress.total}
                text="Processing..."
              />
              <div className="text-center max-w-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  AI Evaluation in Progress
                </h3>
                <p className="text-gray-600 mb-4">
                  Currently analyzing: <span className="font-semibold text-blue-600">{judgingProgress.projectName}</span>
                </p>
                <div className="text-sm text-gray-500">
                  Progress: {judgingProgress.current} of {judgingProgress.total} projects
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {projects.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search projects, technologies, or team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="space-y-6">
              {/* Category Filters */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Filter by Category</div>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => {
                    const isActive = filterBy === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFilterBy(option.value as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label} ({option.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prize Track and Sort */}
              <div className="flex flex-wrap gap-4">
                {availableTracks.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Prize Track</label>
                    <select
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="score">Score (High to Low)</option>
                    <option value="name">Name (A to Z)</option>
                    <option value="views">Views (High to Low)</option>
                    <option value="likes">Likes (High to Low)</option>
                    <option value="created">Date (Newest First)</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-gray-700">
                  Showing <span className="font-semibold">{filteredProjects.length}</span> of <span className="font-semibold">{projects.length}</span> projects
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-red-900 text-lg mb-2">Error</h3>
            <p className="text-red-800">{error}</p>
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

        {/* Projects Grid */}
        {filteredProjects.length > 0 && (
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.uuid}
                project={project}
                onJudgeClick={handleJudgeSingleProject}
              />
            ))}
          </div>
        )}

        {/* No Results State */}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-center py-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No projects match your current search and filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterBy('all');
                setSelectedTrack('all');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Judge.AI</h3>
            <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
              Advanced AI-powered evaluation system for hackathon projects, providing comprehensive 
              analysis using state-of-the-art machine learning models.
            </p>
            {stats.total > 0 && (
              <div className="text-sm text-gray-400">
                {stats.total} projects analyzed • Last updated: {new Date().toLocaleString()}
              </div>
            )}
            <div className="mt-4">
              <a className="text-blue-600 hover:text-blue-700" href="https://x.com/dhananjaypai08" target='_blank'>
                Built by Dhananjay
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}