import React from 'react';
import { ScoredProject } from '@/app/types';
import { ScoreDisplay } from './ScoreDisplay';
import { LoadingSpinner } from './LoadingSpinner';

interface ProjectCardProps {
  project: ScoredProject;
  onJudgeClick?: (project: ScoredProject) => void;
  showFullDescription?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onJudgeClick,
  showFullDescription = false 
}) => {
  
  const getDevfolioUrl = () => {
    return `https://devfolio.co/projects/${project.slug}`;
  };

  const getProblemDescription = () => {
    const problemDesc = project.description?.find(
      desc => desc.title.toLowerCase().includes('problem') || 
               desc.title.toLowerCase().includes('solves')
    );
    return problemDesc?.content || project.tagline || '';
  };

  const formatDescription = (content: string, maxLength = 200) => {
    if (!content) return '';
    if (content.length <= maxLength || showFullDescription) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  const getStatusInfo = () => {
    if (project.isLoading) {
      return { status: 'loading', label: 'Judging...', color: 'text-blue-600' };
    }
    if (project.hasError) {
      return { status: 'error', label: 'Error', color: 'text-red-600' };
    }
    if (project.aiScore) {
      return { status: 'scored', label: 'Scored', color: 'text-green-600' };
    }
    return { status: 'pending', label: 'Pending', color: 'text-gray-500' };
  };

  const getCommitDisplay = () => {
    if (!project.aiScore?.githubData) return null;

    const { totalCommits, recentActivity, commitQuality } = project.aiScore.githubData;
    
    let commitColor = 'text-gray-600';
    let commitStatus = '';

    if (totalCommits <= 2) {
      commitColor = 'text-red-600';
      commitStatus = '⚠️ Very Low';
    } else if (totalCommits <= 5) {
      commitColor = 'text-orange-600';
      commitStatus = '⚠️ Low';
    } else if (totalCommits >= 20) {
      commitColor = 'text-green-600';
      commitStatus = '✓ Active';
    } else {
      commitColor = 'text-blue-600';
      commitStatus = '✓ Good';
    }

    return (
      <div className="flex items-center gap-3 text-sm">
        <div className={`font-medium ${commitColor}`}>
          {totalCommits} commit{totalCommits !== 1 ? 's' : ''} {commitStatus}
        </div>
        {!recentActivity && (
          <div className="text-orange-600 text-xs">
            ⚠️ No recent activity
          </div>
        )}
      </div>
    );
  };

  const getGitHubHealthDisplay = () => {
    if (!project.aiScore?.githubData) return null;

    const { commitQuality, healthScore } = project.aiScore.githubData;
    
    return (
      <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
        <span>Code Quality: {commitQuality}/100</span>
        <span>Repo Health: {healthScore}/100</span>
      </div>
    );
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {project.favicon && (
                <img 
                  src={project.favicon} 
                  alt=""
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              )}
              <h3 className="text-xl font-semibold text-gray-900 truncate">
                {project.name}
              </h3>
              {!project.has_github_link && (
                <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200">
                  No GitHub
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              {project.tagline}
            </p>

            {/* GitHub Analysis Display */}
            {getCommitDisplay() && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-1">GitHub Analysis</div>
                {getCommitDisplay()}
                {getGitHubHealthDisplay()}
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{project.views || 0} views</span>
              <span>•</span>
              <span>{project.likes || 0} likes</span>
              <span>•</span>
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              <a
                href={getDevfolioUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
              >
                View on Devfolio
              </a>
              
              {project.links && project.links.trim() && (
                project.links
                  .split(',')
                  .map(link => link.trim())
                  .filter(link => link.length > 0)
                  .slice(0, 2)
                  .map((link, idx) => {
                    const cleanLink = link.startsWith('http') ? link : `https://${link}`;
                    const hostname = (() => {
                      try {
                        return new URL(cleanLink).hostname.replace('www.', '');
                      } catch {
                        return 'Demo';
                      }
                    })();

                    const isGitHub = hostname.includes('github.com');
                    
                    return (
                      <a
                        key={idx}
                        href={cleanLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          isGitHub 
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {isGitHub ? '⚡ GitHub' : hostname}
                      </a>
                    );
                  })
              )}
            </div>
          </div>

          {/* Status/Score Section */}
          <div className="flex flex-col items-end gap-3">
            <div className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </div>
            
            {project.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : project.aiScore ? (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {project.aiScore.overallScore}
                </div>
                <div className="text-sm text-gray-500">
                  out of 100
                </div>
                {/* Show critical flags immediately */}
                {project.aiScore.flags.some(flag => 
                  flag.includes('CRITICAL') || 
                  flag.includes('Only') ||
                  flag.includes('commit')
                ) && (
                  <div className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Issues Found
                  </div>
                )}
              </div>
            ) : project.hasError ? (
              <div className="text-sm text-red-600 font-medium">
                Failed to judge
              </div>
            ) : onJudgeClick ? (
              <button
                onClick={() => onJudgeClick(project)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Judge Project
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-6">
        <div className="text-gray-700 leading-relaxed mb-4">
          {formatDescription(getProblemDescription())}
        </div>

        {/* Prize Tracks */}
        {project.prize_tracks && project.prize_tracks.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Prize Tracks</div>
            <div className="flex flex-wrap gap-2">
              {project.prize_tracks.slice(0, 3).map((track) => (
                <span
                  key={track.uuid}
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-sm rounded border border-purple-200"
                  title={track.description}
                >
                  {track.name}
                </span>
              ))}
              {project.prize_tracks.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                  +{project.prize_tracks.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {project.hashtags && project.hashtags.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Technologies</div>
            <div className="flex flex-wrap gap-1">
              {project.hashtags.slice(0, 6).map((tag) => (
                <span
                  key={tag.uuid}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag.name}
                </span>
              ))}
              {project.hashtags.length > 6 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                  +{project.hashtags.length - 6}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Critical Flags Display */}
        {project.aiScore?.flags && project.aiScore.flags.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-2">
              Issues Found ({project.aiScore.flags.length})
            </div>
            <div className="space-y-1">
              {project.aiScore.flags.slice(0, 3).map((flag, index) => (
                <div key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>{flag}</span>
                </div>
              ))}
              {project.aiScore.flags.length > 3 && (
                <div className="text-xs text-red-600">
                  +{project.aiScore.flags.length - 3} more issues...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Score Display */}
      {project.aiScore && !project.isLoading && (
        <div className="border-t border-gray-100">
          <ScoreDisplay score={project.aiScore} />
        </div>
      )}
    </div>
  );
};