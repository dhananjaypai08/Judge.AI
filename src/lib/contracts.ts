import { Address } from 'viem';

// Contract addresses
export const JUDGE_AI_BETS_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS! as Address;
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS! as Address;

// Judge AI Bets Contract ABI - Updated to match your actual struct
export const JUDGE_AI_BETS_ABI = [
  {
    "inputs": [{"internalType": "uint8", "name": "projectId", "type": "uint8"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "bool", "name": "onWin", "type": "bool"}],
    "name": "betOnProjectWithUSDC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProjects",
    "outputs": [{"components": [
      {"internalType": "string", "name": "name", "type": "string"}, 
      {"internalType": "uint8", "name": "AIpoints", "type": "uint8"}, 
      {"internalType": "string", "name": "uri", "type": "string"}, 
      {"internalType": "string", "name": "descripton", "type": "string"}, 
      {"internalType": "string", "name": "devfolioLink", "type": "string"}, 
      {"internalType": "string", "name": "prizeTrack", "type": "string"}, 
      {"internalType": "string", "name": "githubScore", "type": "string"}
    ], "internalType": "struct Project[12]", "name": "", "type": "tuple[12]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "uint8", "name": "projectId", "type": "uint8"}],
    "name": "getUserBetsUSDC",
    "outputs": [{"internalType": "uint256", "name": "winBet", "type": "uint256"}, {"internalType": "uint256", "name": "loseBet", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "projectId", "type": "uint8"}],
    "name": "getUSDCBetsOnProject",
    "outputs": [{"internalType": "uint256", "name": "winTotal", "type": "uint256"}, {"internalType": "uint256", "name": "loseTotal", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "projectId", "type": "uint8"}],
    "name": "getProjectResult",
    "outputs": [{"internalType": "bool", "name": "declared", "type": "bool"}, {"internalType": "bool", "name": "result", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "projectId", "type": "uint8"}],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "uint8", "name": "projectId", "type": "uint8"}],
    "name": "hasUserWonUSDC",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "uint8", "name": "", "type": "uint8"}],
    "name": "rewardClaimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// USDC Token ABI (ERC20 functions we need)
export const USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Helper functions - Fixed BigInt issues
export const formatUSDC = (amount: bigint | string | number): string => {
  const bigIntAmount = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
  return (Number(bigIntAmount) / 1000000).toFixed(2);
};

export const parseUSDC = (amount: string): bigint => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return BigInt(0);
  return BigInt(Math.floor(numAmount * 1000000));
};

// Contract configuration object
export const CONTRACTS = {
  JUDGE_AI_BETS: {
    address: JUDGE_AI_BETS_ADDRESS,
    abi: JUDGE_AI_BETS_ABI,
  },
  USDC: {
    address: USDC_ADDRESS,
    abi: USDC_ABI,
  },
} as const;