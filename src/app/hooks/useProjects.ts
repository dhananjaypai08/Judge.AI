import { useState, useCallback } from 'react';
import { ScoredProject, Project, AIScore } from '@/app/types';

interface UseProjectsResult {
  projects: ScoredProject[];
  loading: boolean;
  error: string | null;
  judging: boolean;
  judgingProgress: {
    current: number;
    total: number;
    projectName: string;
  };
  fetchProjects: () => Promise<void>;
  judgeAllProjects: () => Promise<void>;
  judgeSingleProject: (project: ScoredProject) => Promise<void>;
  clearResults: () => void;
}

export const useProjects = (): UseProjectsResult => {
  const [projects, setProjects] = useState<ScoredProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [judging, setJudging] = useState(false);
  const [judgingProgress, setJudgingProgress] = useState({
    current: 0,
    total: 0,
    projectName: ''
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allProjects: Project[] = [];
      let from = 0;
      const size = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/projects?from=${from}&size=${size}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch projects');
        }

        allProjects.push(...data.projects);
        hasMore = data.projects.length === size && allProjects.length < data.total;
        from += size;

        // Safety break
        if (allProjects.length >= 500) {
          console.warn('Reached maximum project limit (500)');
          break;
        }
      }

      // Convert to ScoredProject format with proper slug handling
      const scoredProjects: ScoredProject[] = allProjects.map(project => ({
        ...project,
        // Ensure slug exists - generate from name if missing
        slug: project.slug || project.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `project-${project.uuid}`,
        aiScore: undefined,
        isLoading: false,
        hasError: false
      }));

      setProjects(scoredProjects);
      console.log(`Fetched ${scoredProjects.length} projects`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const judgeSingleProject = useCallback(async (project: ScoredProject) => {
    // Update project loading state immediately
    setProjects(prev => prev.map(p => 
      p.uuid === project.uuid 
        ? { ...p, isLoading: true, hasError: false, aiScore: undefined }
        : p
    ));

    try {
      const response = await fetch('/api/judge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project }),
      });

      if (!response.ok) {
        throw new Error(`Failed to judge project: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to judge project');
      }

      // Update project with score
      setProjects(prev => prev.map(p => 
        p.uuid === project.uuid 
          ? { ...p, aiScore: data.score, isLoading: false, hasError: false }
          : p
      ));

      console.log(`Successfully judged project: ${project.name}`);

    } catch (err) {
      console.error('Error judging project:', err);
      
      // Update project error state
      setProjects(prev => prev.map(p => 
        p.uuid === project.uuid 
          ? { ...p, isLoading: false, hasError: true, aiScore: undefined }
          : p
      ));
    }
  }, []);

  const judgeAllProjects = useCallback(async () => {
    if (projects.length === 0) {
      setError('No projects to judge. Please fetch projects first.');
      return;
    }

    setJudging(true);
    setError(null);
    setJudgingProgress({ current: 0, total: projects.length, projectName: '' });

    try {
      const batchSize = 3;
      let processed = 0;

      for (let i = 0; i < projects.length; i += batchSize) {
        const batch = projects.slice(i, i + batchSize);
        
        const promises = batch.map(async (project, index) => {
          const globalIndex = i + index;
          
          setJudgingProgress({
            current: globalIndex + 1,
            total: projects.length,
            projectName: project.name
          });

          // Update project loading state
          setProjects(prev => prev.map(p => 
            p.uuid === project.uuid 
              ? { ...p, isLoading: true, hasError: false, aiScore: undefined }
              : p
          ));

          try {
            const response = await fetch('/api/judge', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ project }),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || 'Failed to judge project');
            }

            // Update project with score
            setProjects(prev => prev.map(p => 
              p.uuid === project.uuid 
                ? { ...p, aiScore: data.score, isLoading: false, hasError: false }
                : p
            ));

            return { success: true, projectId: project.uuid };

          } catch (err) {
            console.error(`Error judging project ${project.name}:`, err);
            
            setProjects(prev => prev.map(p => 
              p.uuid === project.uuid 
                ? { ...p, isLoading: false, hasError: true, aiScore: undefined }
                : p
            ));

            return { success: false, projectId: project.uuid, error: err };
          }
        });

        await Promise.allSettled(promises);
        processed += batch.length;

        // Rate limiting between batches
        if (i + batchSize < projects.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Completed judging ${processed} projects`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Batch judging failed: ${errorMessage}`);
      console.error('Error in batch judging:', err);
    } finally {
      setJudging(false);
      setJudgingProgress({ current: 0, total: 0, projectName: '' });
    }
  }, [projects]);

  const clearResults = useCallback(() => {
    setProjects(prev => prev.map(p => ({
      ...p,
      aiScore: undefined,
      isLoading: false,
      hasError: false
    })));
    console.log('Cleared all AI scoring results');
  }, []);

  return {
    projects,
    loading,
    error,
    judging,
    judgingProgress,
    fetchProjects,
    judgeAllProjects,
    judgeSingleProject,
    clearResults
  };
};