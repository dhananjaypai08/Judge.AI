'use client';

import React, { useState } from 'react';
import { useReadContract } from 'wagmi';
import { Address } from 'viem';

import { CONTRACTS, formatUSDC } from '@/lib/contracts';
import { BettingProject, ProjectBets, UserBets, ProjectResult } from '@/app/types/betting';
import { ProjectBettingModal } from './ProjectBettingModal';

interface BettingCardProps {
  project: BettingProject;
  userAddress?: Address;
  isConnected: boolean;
}

export const BettingCard: React.FC<BettingCardProps> = ({ project, userAddress, isConnected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch project betting data
  const { data: projectBets } = useReadContract({
    ...CONTRACTS.JUDGE_AI_BETS,
    functionName: 'getUSDCBetsOnProject',
    args: [project.id],
  });

  // Fetch user's bets on this project
  const { data: userBets } = useReadContract({
    ...CONTRACTS.JUDGE_AI_BETS,
    functionName: 'getUserBetsUSDC',
    args: userAddress ? [userAddress, project.id] : undefined,
    query: { enabled: !!userAddress },
  });

  // Fetch project result
  const { data: projectResult } = useReadContract({
    ...CONTRACTS.JUDGE_AI_BETS,
    functionName: 'getProjectResult',
    args: [project.id],
  });

  // Safe parsing of contract data
  const bets: ProjectBets = projectBets ? {
    winTotal: projectBets[0]?.toString() || '0',
    loseTotal: projectBets[1]?.toString() || '0',
  } : { winTotal: '0', loseTotal: '0' };

  const userBetsData: UserBets = userBets ? {
    winBet: userBets[0]?.toString() || '0',
    loseBet: userBets[1]?.toString() || '0',
  } : { winBet: '0', loseBet: '0' };

  const result: ProjectResult = projectResult ? {
    declared: projectResult[0] || false,
    result: projectResult[1] || false,
  } : { declared: false, result: false };

  // Convert to BigInt for calculations
  const winTotalBig = BigInt(bets.winTotal);
  const loseTotalBig = BigInt(bets.loseTotal);
  const totalBets = winTotalBig + loseTotalBig;
  
  const winPercentage = totalBets > BigInt(0) ? Number((winTotalBig * BigInt(100)) / totalBets) : 50;
  const losePercentage = 100 - winPercentage;

  const hasUserBets = BigInt(userBetsData.winBet) > BigInt(0) || BigInt(userBetsData.loseBet) > BigInt(0);

  const getOutcome = () => {
    if (!result.declared) return null;
    return result.result ? 'WIN' : 'LOSE';
  };

  const getUserOutcome = () => {
    if (!result.declared || !hasUserBets) return null;
    const userWon = (result.result && BigInt(userBetsData.winBet) > BigInt(0)) || 
                   (!result.result && BigInt(userBetsData.loseBet) > BigInt(0));
    return userWon ? 'WON' : 'LOST';
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
        {/* Project Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate mb-2">
                {project.name}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {project.descripton}
              </p>
              
              <div className="flex items-center gap-3 mb-3 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  AI Score: {project.AIpoints}/100
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {project.prizeTrack}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  GitHub: {project.githubScore}
                </span>
              </div>
              
              {project.devfolioLink !== '#' && (
                <a
                  href={project.devfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Project →
                </a>
              )}
            </div>
            
            {/* Result Badge */}
            {result.declared && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                result.result 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {getOutcome()}
              </div>
            )}
          </div>
        </div>

        {/* Betting Info */}
        <div className="p-6">
          {/* Market Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Market Sentiment</span>
              <span className="text-sm text-gray-600">
                Total: {formatUSDC(totalBets.toString())} USDC
              </span>
            </div>
            
            {/* Sentiment Bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div 
                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${winPercentage}%` }}
              />
              <div 
                className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-500"
                style={{ width: `${losePercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-green-700 font-medium">
                YES {winPercentage.toFixed(1)}%
              </span>
              <span className="text-red-700 font-medium">
                NO {losePercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* User's Position */}
          {hasUserBets && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Your Position</div>
              <div className="grid grid-cols-2 gap-4">
                {BigInt(userBetsData.winBet) > BigInt(0) && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {formatUSDC(userBetsData.winBet)}
                    </div>
                    <div className="text-xs text-green-800">YES Bet</div>
                  </div>
                )}
                {BigInt(userBetsData.loseBet) > BigInt(0) && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {formatUSDC(userBetsData.loseBet)}
                    </div>
                    <div className="text-xs text-red-800">NO Bet</div>
                  </div>
                )}
              </div>
              
              {result.declared && (
                <div className={`mt-3 text-center p-2 rounded ${
                  getUserOutcome() === 'WON' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className="font-bold">
                    You {getUserOutcome()}!
                  </span>
                  {getUserOutcome() === 'WON' && (
                    <div className="text-xs mt-1">
                      Click to claim rewards
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!result.declared ? (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!isConnected}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isConnected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isConnected ? 'Place Bet' : 'Connect Wallet to Bet'}
              </button>
            ) : (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Market Closed</div>
                {hasUserBets && getUserOutcome() === 'WON' && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Claim Rewards
                  </button>
                )}
              </div>
            )}

            {/* Betting Options Preview */}
            {!result.declared && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">YES</div>
                  <div className="text-xs text-green-600">Will be top performer</div>
                </div>
                <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-800">NO</div>
                  <div className="text-xs text-red-600">Won't be top performer</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Betting Modal */}
      <ProjectBettingModal
        project={project}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userBets={userBetsData}
        projectResult={result}
      />
    </>
  );
};