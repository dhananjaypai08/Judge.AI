import React from 'react';
import { ScoredProject } from '@/app/types';
import { ScoreDisplay } from './ScoreDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { ExternalLink, Github, Users, Calendar, Eye, Heart, AlertTriangle } from 'lucide-react';

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

  const formatDescription = (content: string, maxLength = 200) => {
    if (!content) return '';
    if (content.length <= maxLength || showFullDescription) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="card p-6 space-y-4 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {project.favicon && (
            <img 
              src={project.favicon} 
              alt={`${project.name} favicon`}
              className="w-8 h-8 rounded flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {project.name}
              </h3>
              {!project.has_github_link && (
                <div className="flag-error px-2 py-1 rounded-full border text-xs font-medium flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>No GitHub</span>
                </div>
              )}
            </div>
            <p className="text-slate-600 font-medium">{project.tagline}</p>
          </div>
        </div>

        {/* Score or loading state */}
        <div className="flex-shrink-0 ml-4">
          {project.isLoading ? (
            <LoadingSpinner size="sm" text="Judging..." />
          ) : project.aiScore ? (
            <ScoreDisplay score={project.aiScore} compact />
          ) : project.hasError ? (
            <div className="text-red-600 text-sm font-medium flex items-center space-x-1">
              <AlertTriangle size={16} />
              <span>Error</span>
            </div>
          ) : onJudgeClick ? (
            <button
              onClick={() => onJudgeClick(project)}
              className="btn-primary text-sm"
            >
              Judge
            </button>
          ) : null}
        </div>
      </div>

      {/* Project description */}
      <div className="space-y-2">
        <div className="text-sm text-slate-700 leading-relaxed">
          {formatDescription(getProblemDescription())}
        </div>
        
        {project.description && project.description.length > 1 && !showFullDescription && (
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Read more
          </button>
        )}
      </div>

      {/* Prize tracks */}
      {project.prize_tracks && project.prize_tracks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Prize Tracks:</div>
          <div className="flex flex-wrap gap-2">
            {project.prize_tracks.slice(0, 2).map((track) => (
              <span
                key={track.uuid}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                title={track.description}
              >
                {track.name}
              </span>
            ))}
            {project.prize_tracks.length > 2 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                +{project.prize_tracks.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tech stack */}
      {project.hashtags && project.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.hashtags.slice(0, 4).map((tag) => (
            <span
              key={tag.uuid}
              className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium"
            >
              #{tag.name}
            </span>
          ))}
          {project.hashtags.length > 4 && (
            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">
              +{project.hashtags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center space-x-1">
            <Users size={14} />
            <span>{project.members?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye size={14} />
            <span>{project.views || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart size={14} />
            <span>{project.likes || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {project.links && project.links.trim() && (
              <div className="flex flex-wrap gap-2">
                {project.links
                  .split(',')
                  .map(link => link.trim())
                  .filter(link => link.length > 0)
                  .map((link, idx) => {
                    const cleanLink = link.startsWith('http') ? link : `https://${link}`;
                    const hostname = (() => {
                      try {
                        return new URL(cleanLink).hostname.replace('www.', '');
                      } catch {
                        return cleanLink;
                      }
                    })();

                    return (
                      <a
                        key={idx}
                        href={cleanLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                        title={cleanLink}
                      >
                        {hostname}
                      </a>
                    );
                  })}
              </div>
            )}

          {project.has_github_link && (
            <button
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title="GitHub repository"
            >
              <Github size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Detailed score display */}
      {project.aiScore && !project.isLoading && (
        <div className="pt-3 border-t border-slate-100">
          <ScoreDisplay score={project.aiScore} />
        </div>
      )}
    </div>
  );
};