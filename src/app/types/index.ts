export interface Project {
  uuid: string;
  name: string;
  tagline: string;
  description: ProjectDescription[];
  category?: string;
  slug: string;
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
    baseIntegration?: number;  // Optional for backward compatibility
    trackAlignment?: number;   // Optional for backward compatibility
  };
  reasoning: string;
  flags: string[]; // Always defined, empty array if no flags
  confidence: number;
  timestamp: string;
  githubData?: {
    totalCommits: number;
    recentActivity: boolean;
    commitQuality: number;
    healthScore: number;
  };
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

// NEW: Base-specific and GitHub analysis interfaces
export interface GitHubAnalysis {
  repository: {
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    size: number;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    default_branch: string;
    has_wiki: boolean;
    has_pages: boolean;
  };
  commits: {
    total_count: number;
    commits: {
      sha: string;
      message: string;
      author: {
        name: string;
        email: string;
        date: string;
      };
      date: string;
      additions: number;
      deletions: number;
    }[];
  };
  readme: {
    content: string;
    last_modified: string;
  } | null;
  contributors: {
    login: string;
    contributions: number;
    type: string;
  }[];
  languages: { [key: string]: number };
}

export interface BaseAnalysis {
  network_detected: 'none' | 'base_mainnet' | 'base_testnet' | 'unknown';
  base_integration_level: 'none' | 'low' | 'medium' | 'high';
  contract_indicators: boolean;
  mainnet_deployment: boolean;
  testnet_deployment: boolean;
  base_specific_features: string[];
}

export interface TrackAnalysis {
  alignment_score: number; // 0-100
  tracks_analysis: {
    track_name: string;
    relevance_score: number; // 0-1
    matched_keywords: string[];
  }[];
  analysis: string;
}

// Updated scoring criteria to include new categories
export interface ScoringCriteria {
  technicalImplementation: number;
  innovation: number;
  valueProposition: number;
  completeness: number;
  marketPotential: number;
  codeQuality: number;
  baseIntegration: number;  // New
  trackAlignment: number;   // New
}

// Enhanced project interface for analysis
export interface EnhancedProject extends Project {
  githubAnalysis?: GitHubAnalysis;
  baseAnalysis?: BaseAnalysis;
  trackAnalysis?: TrackAnalysis;
}

// GitHub commit interface for detailed analysis
export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }[];
}

// GitHub repository detailed information
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  clone_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  archived: boolean;
  disabled: boolean;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  };
  topics: string[];
}

// Enhanced scoring with Base-specific details
export interface BaseEnhancedScore extends AIScore {
  baseAnalysis?: {
    networkDetected: string;
    integrationLevel: string;
    mainnetDeployment: boolean;
    baseFeatures: string[];
  };
  githubAnalysis?: {
    totalCommits: number;
    recentActivity: boolean;
    repositoryHealth: string;
    documentationQuality: string;
  };
  trackAnalysis?: {
    alignmentScore: number;
    bestMatchingTrack: string;
    alignmentDetails: string;
  };
}

// Constants for Base network analysis
export interface BaseNetworkConfig {
  MAINNET_CHAIN_ID: number;
  TESTNET_CHAIN_ID: number;
  MAINNET_INDICATORS: string[];
  TESTNET_INDICATORS: string[];
  BASE_FEATURES: string[];
}

// Track keyword mapping for alignment analysis
export interface TrackKeywordMapping {
  [trackCategory: string]: {
    keywords: string[];
    weight: number;
    required?: string[];
  };
}

// Enhanced judging configuration
export interface JudgingConfig {
  scoringCriteria: ScoringCriteria;
  baseNetworkConfig: BaseNetworkConfig;
  trackKeywordMapping: TrackKeywordMapping;
  penaltyFactors: {
    noGithub: number;
    singleCommit: number;
    oldRepository: number;
    noBaseIntegration: number;
    poorTrackAlignment: number;
    noMainnetDeployment: number;
  };
  bonusFactors: {
    mainnetDeployment: number;
    activeCommits: number;
    baseFeatures: number;
    excellentDocumentation: number;
    perfectTrackAlignment: number;
  };
}

// Analysis result types for debugging and logging
export interface AnalysisResult {
  projectId: string;
  analysisType: 'github' | 'base' | 'track';
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  processingTime: number;
}

// Batch analysis results
export interface BatchAnalysisResult {
  totalProjects: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  results: AnalysisResult[];
  startTime: string;
  endTime: string;
  totalProcessingTime: number;
}