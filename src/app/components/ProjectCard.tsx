import React from 'react';
import { ScoredProject } from '@/app/types';
import { ScoreDisplay } from './ScoreDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  ExternalLink, 
  Github, 
  Users, 
  Calendar, 
  Eye, 
  Heart, 
  AlertTriangle, 
  Clock,
  Award,
  Link as LinkIcon
} from 'lucide-react';

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

  const handleLinkClick = (url: string) => {
    if (url && !url.startsWith('http')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getProblemDescription = () => {
    const problemDesc = project.description?.find(
      desc => desc.title.toLowerCase().includes('problem') || 
               desc.title.toLowerCase().includes('solves')
    );
    return problemDesc?.content || project.tagline || '';
  };

  const formatDescription = (content: string, maxLength = 180) => {
    if (!content) return '';
    if (content.length <= maxLength || showFullDescription) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  const getStatusBadge = () => {
    if (project.isLoading) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Judging</span>
        </div>
      );
    }
    
    if (project.hasError) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <AlertTriangle size={14} />
          <span className="text-sm font-medium">Error</span>
        </div>
      );
    }
    
    if (project.aiScore) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <Award size={14} />
          <span className="text-sm font-medium">Scored</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg border border-gray-200">
        <Clock size={14} />
        <span className="text-sm font-medium">Pending</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {project.favicon && (
              <div className="flex-shrink-0">
                <img 
                  src={project.favicon} 
                  alt={`${project.name} logo`}
                  className="w-12 h-12 rounded-lg border border-gray-200 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {project.name}
                </h3>
                {!project.has_github_link && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                    <AlertTriangle size={12} />
                    <span className="text-xs font-medium">No GitHub</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                {project.tagline}
              </p>
              
              {/* Project Links */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={getDevfolioUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
                >
                  <ExternalLink size={14} />
                  <span>Devfolio</span>
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

                      return (
                        <a
                          key={idx}
                          href={cleanLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                        >
                          <LinkIcon size={14} />
                          <span>{hostname}</span>
                        </a>
                      );
                    })
                )}
                
                {project.has_github_link && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
                    <Github size={14} />
                    <span>GitHub</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score/Status Section */}
          <div className="flex-shrink-0">
            {project.isLoading ? (
              <LoadingSpinner size="sm" text="Judging..." />
            ) : project.aiScore ? (
              <ScoreDisplay score={project.aiScore} compact />
            ) : project.hasError ? (
              <div className="text-red-600 text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Error</span>
              </div>
            ) : onJudgeClick ? (
              <button
                onClick={() => onJudgeClick(project)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Judge Project
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 pb-4">
        <div className="text-sm text-gray-700 leading-relaxed mb-4">
          {formatDescription(getProblemDescription())}
        </div>

        {/* Prize Tracks */}
        {project.prize_tracks && project.prize_tracks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Prize Tracks</div>
            <div className="flex flex-wrap gap-2">
              {project.prize_tracks.slice(0, 2).map((track) => (
                <span
                  key={track.uuid}
                  className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200"
                  title={track.description}
                >
                  {track.name}
                </span>
              ))}
              {project.prize_tracks.length > 2 && (
                <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                  +{project.prize_tracks.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {project.hashtags && project.hashtags.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Technologies</div>
            <div className="flex flex-wrap gap-2">
              {project.hashtags.slice(0, 5).map((tag) => (
                <span
                  key={tag.uuid}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium"
                >
                  {tag.name}
                </span>
              ))}
              {project.hashtags.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                  +{project.hashtags.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye size={14} />
              <span>{project.views || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={14} />
              <span>{project.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {getStatusBadge()}
        </div>
      </div>

      {/* Detailed Score Display */}
      {project.aiScore && !project.isLoading && (
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <ScoreDisplay score={project.aiScore} />
        </div>
      )}
    </div>
  );
};