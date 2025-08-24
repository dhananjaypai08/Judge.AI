export interface Project {
  uuid: string;
  name: string;
  tagline: string;
  description: ProjectDescription[];
  category?: string;
  slug: string; // Added missing slug property
  has_github_link: boolean;
  links: string;
  prize_tracks: PrizeTrack[];
  hashtags: Hashtag[];
  members: Member[];
  hackathon: Hackathon;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  status: string;
  cover_img?: string;
  favicon?: string;
  // Additional properties that might be present in the API response
  contribution_count?: number;
  hidden?: boolean;
  flagged?: boolean;
  banned?: boolean;
  accepting_funding?: boolean;
  amount_eth?: number;
  total_funding?: number;
  has_funding?: boolean;
  judging_submission_type?: string | null;
  judgments_count?: number;
  pictures?: string[] | null;
  quadratic_voting_votes?: number | null;
  quadratic_voting_quadratic_votes?: number | null;
  quadratic_voting_prize_pool_distribution?: any | null;
  platforms?: string[];
  video_url?: string | null;
  community_expo_location?: string | null;
  discover?: boolean;
  team?: any | null;
  tracks?: any[];
  prizes?: any[];
  desc?: string | null;
  user_project_meta?: any | null;
}

export interface ProjectDescription {
  title: string;
  subtitle: string;
  content: string;
  hint: string;
}

export interface PrizeTrack {
  uuid: string;
  name: string;
  description: string;
  sponsor?: string | null;
}

export interface Hashtag {
  uuid: string;
  name: string;
  verified: boolean;
}

export interface Member {
  uuid: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image?: string | null;
  track?: string | null;
}

export interface Hackathon {
  uuid: string;
  name: string;
  slug: string;
  subdomain: string;
  logo: string;
  cover_img: string;
  primary_color: string;
}

export interface AIScore {
  projectId: string;
  overallScore: number;
  breakdown: {
    technicalImplementation: number;
    innovation: number;
    valueProposition: number;
    completeness: number;
    marketPotential: number;
    codeQuality: number;
  };
  reasoning: string;
  flags: string[]; // Always defined, empty array if no flags
  confidence: number;
  timestamp: string;
}

export interface JudgeResponse {
  success: boolean;
  score?: AIScore;
  error?: string;
}

export interface ProjectsResponse {
  hits: {
    hits: Array<{
      _source: Project;
    }>;
    total: {
      value: number;
    };
  };
}

export interface ScoredProject extends Project {
  aiScore?: AIScore;
  isLoading?: boolean;
  hasError?: boolean;
}

// API Response types
export interface ProjectsAPIResponse {
  success: boolean;
  projects: Project[];
  total: number;
  from: number;
  size: number;
  error?: string;
}

export interface BatchJudgeResponse {
  success: boolean;
  results: Array<{
    projectId: string;
    score?: AIScore;
    success: boolean;
    error?: string;
  }>;
  errors: Array<{
    projectId: string;
    error: string;
    success: false;
  }>;
  total: number;
  successful: number;
  failed: number;
}

// Filter and Sort types
export type FilterType = 'all' | 'scored' | 'flagged' | 'unflagged' | 'no-github';
export type SortType = 'score' | 'name' | 'views' | 'likes' | 'created';

// Statistics type
export interface ProjectStats {
  total: number;
  scored: number;
  flagged: number;
  unflagged: number;
  avgScore: number;
  pending: number;
  errors: number;
}

// Judging Progress type
export interface JudgingProgress {
  current: number;
  total: number;
  projectName: string;
}

// Component Props types
export interface ProjectCardProps {
  project: ScoredProject;
  onJudgeClick?: (project: ScoredProject) => void;
  showFullDescription?: boolean;
}

export interface ScoreDisplayProps {
  score: AIScore;
  compact?: boolean;
}

export interface NavbarProps {
  stats: ProjectStats;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export interface ProgressSpinnerProps {
  progress: number;
  total: number;
  text?: string;
  className?: string;
}

// Utility types
export interface ScoreBreakdownItem {
  key: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  grade: string;
}

// Error types
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// Hook return types
export interface UseProjectsResult {
  projects: ScoredProject[];
  loading: boolean;
  error: string | null;
  judging: boolean;
  judgingProgress: JudgingProgress;
  fetchProjects: () => Promise<void>;
  judgeAllProjects: () => Promise<void>;
  judgeSingleProject: (project: ScoredProject) => Promise<void>;
  clearResults: () => void;
}