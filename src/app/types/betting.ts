export interface BettingProject {
  id: number;
  name: string;
  AIpoints: number;
  uri: string;
  descripton: string; // Note: keeping your typo for compatibility
  devfolioLink: string;
  prizeTrack: string;
  githubScore: string;
}

export interface ProjectBets {
  winTotal: string | number;
  loseTotal: string | number;
}

export interface UserBets {
  winBet: string | number;
  loseBet: string | number;
}

export interface ProjectResult {
  declared: boolean;
  result: boolean;
}

export interface BettingStats {
  totalProjects: number;
  totalBetsAmount: string;
  userTotalBets: string;
  declaredResults: number;
}

export interface BetTransaction {
  projectId: number;
  amount: string;
  onWin: boolean;
  timestamp: number;
}

export interface RewardInfo {
  canClaim: boolean;
  rewardAmount: string;
  alreadyClaimed: boolean;
}

// Contract interaction states
export type TransactionState = 'idle' | 'pending' | 'success' | 'error';

export interface BettingModalProps {
  project: BettingProject;
  isOpen: boolean;
  onClose: () => void;
}

export interface UserBettingData {
  bets: { [projectId: number]: UserBets };
  totalBetAmount: string;
  winningProjects: number[];
  claimableRewards: { [projectId: number]: RewardInfo };
}