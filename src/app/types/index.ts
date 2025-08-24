export interface Project {
  uuid: string;
  name: string;
  tagline: string;
  description: ProjectDescription[];
  category?: string;
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
  status: string;
  cover_img?: string;
  favicon?: string;
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
  sponsor?: string;
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
  profile_image?: string;
  track?: string;
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