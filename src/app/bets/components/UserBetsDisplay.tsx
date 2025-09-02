'use client';

import React, { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { Address } from 'viem';

import { CONTRACTS, formatUSDC } from '@/lib/contracts';
import { BettingProject } from '@/app/types/betting';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

interface UserBetsDisplayProps {
  userAddress: Address;
  projects: BettingProject[];
}

export const UserBetsDisplay: React.FC<UserBetsDisplayProps> = ({ userAddress, projects }) => {
  // Prepare contract calls for all projects
  const contracts = useMemo(() => {
    const calls: any[] = [];
    
    // Get user bets for each project
    projects.forEach((project) => {
      calls.push({
        ...CONTRACTS.JUDGE_AI_BETS,
        functionName: 'getUserBetsUSDC' as const,
        args: [userAddress, project.id] as const,
      });
    });
    
    // Get project results for each project
    projects.forEach((project) => {
      calls.push({
        ...CONTRACTS.JUDGE_AI_BETS,
        functionName: 'getProjectResult' as const,
        args: [project.id] as const,
      });
    });
    
    // Get reward claimed status for each project
    projects.forEach((project) => {
      calls.push({
        ...CONTRACTS.JUDGE_AI_BETS,
        functionName: 'rewardClaimed' as const,
        args: [userAddress, project.id] as const,
      });
    });

    return calls;
  }, [userAddress, projects]);

  const { data: contractData, isLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 }
  });

  const userBetsData = useMemo(() => {
    if (!contractData || contractData.length === 0) return null;

    const numProjects = projects.length;
    const userBets = contractData.slice(0, numProjects);
    const projectResults = contractData.slice(numProjects, numProjects * 2);
    const rewardsClaimed = contractData.slice(numProjects * 2, numProjects * 3);

    const bettingData = projects.map((project, index) => {
      // Safe access with proper type checking
      const betsData = userBets[index];
      const resultData = projectResults[index];
      const claimedData = rewardsClaimed[index];

      // Extract bet amounts with safe defaults
      let winBet = '0';
      let loseBet = '0';
      
      if (betsData && betsData.status === 'success' && betsData.result && Array.isArray(betsData.result)) {
        winBet = betsData.result[0] ? betsData.result[0].toString() : '0';
        loseBet = betsData.result[1] ? betsData.result[1].toString() : '0';
      }

      // Calculate total bet
      const winBetBig = BigInt(winBet);
      const loseBetBig = BigInt(loseBet);
      const totalBet = winBetBig + loseBetBig;

      // Extract project result with safe defaults
      let isDeclared = false;
      let projectWon = false;
      
      if (resultData && resultData.status === 'success' && resultData.result && Array.isArray(resultData.result)) {
        isDeclared = resultData.result[0] || false;
        projectWon = resultData.result[1] || false;
      }

      // Extract claimed status with safe default
      let rewardClaimed: any = false;
      if (claimedData && claimedData.status === 'success') {
        rewardClaimed = claimedData.result || false;
      }

      // Determine user's outcome
      let userOutcome: 'won' | 'lost' | 'pending' | 'none' = 'none';
      if (totalBet > BigInt(0)) {
        if (!isDeclared) {
          userOutcome = 'pending';
        } else {
          const userWon = (projectWon && winBetBig > BigInt(0)) || (!projectWon && loseBetBig > BigInt(0));
          userOutcome = userWon ? 'won' : 'lost';
        }
      }

      return {
        project,
        winBet: winBetBig.toString(),
        loseBet: loseBetBig.toString(),
        totalBet: totalBet.toString(),
        isDeclared,
        projectWon,
        rewardClaimed,
        userOutcome
      };
    }).filter(data => BigInt(data.totalBet) > BigInt(0)); // Only show projects with bets

    return bettingData;
  }, [contractData, projects]);

  const stats = useMemo(() => {
    if (!userBetsData) return null;

    const totalBetsAmount = userBetsData.reduce((sum, data) => BigInt(sum) + BigInt(data.totalBet), BigInt(0));
    const activeBets = userBetsData.filter(data => !data.isDeclared).length;
    const wonBets = userBetsData.filter(data => data.userOutcome === 'won').length;
    const lostBets = userBetsData.filter(data => data.userOutcome === 'lost').length;
    const claimableRewards = userBetsData.filter(data => 
      data.userOutcome === 'won' && !data.rewardClaimed
    ).length;

    return {
      totalBetsAmount: totalBetsAmount.toString(),
      activeBets,
      wonBets,
      lostBets,
      claimableRewards
    };
  }, [userBetsData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading your bets..." />
        </div>
      </div>
    );
  }

  if (!userBetsData || userBetsData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Your Betting Portfolio</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Bets Placed Yet</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            Start betting on projects to see your portfolio here. Choose wisely and earn USDC rewards!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header with Stats */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Your Betting Portfolio</h3>
          <div className="text-sm text-gray-600">
            {userBetsData.length} project{userBetsData.length !== 1 ? 's' : ''} with bets
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {formatUSDC(stats.totalBetsAmount)}
              </div>
              <div className="text-xs text-blue-800 font-medium">Total Bet</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{stats.activeBets}</div>
              <div className="text-xs text-orange-800 font-medium">Active</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.wonBets}</div>
              <div className="text-xs text-green-800 font-medium">Won</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">{stats.lostBets}</div>
              <div className="text-xs text-red-800 font-medium">Lost</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{stats.claimableRewards}</div>
              <div className="text-xs text-purple-800 font-medium">Claimable</div>
            </div>
          </div>
        )}
      </div>

      {/* Bets List */}
      <div className="divide-y divide-gray-100">
        {userBetsData.map((data) => (
          <div key={data.project.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate mb-1">
                  {data.project.name}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                  {data.project.descripton}
                </p>
                
                {/* Betting Details */}
                <div className="flex items-center gap-4 text-sm">
                  {BigInt(data.winBet) > BigInt(0) && (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 font-medium">YES:</span>
                      <span className="text-gray-700">{formatUSDC(data.winBet)} USDC</span>
                    </div>
                  )}
                  {BigInt(data.loseBet) > BigInt(0) && (
                    <div className="flex items-center gap-1">
                      <span className="text-red-600 font-medium">NO:</span>
                      <span className="text-gray-700">{formatUSDC(data.loseBet)} USDC</span>
                    </div>
                  )}
                  <div className="text-gray-500">
                    Total: {formatUSDC(data.totalBet)} USDC
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end gap-2">
                {data.userOutcome === 'pending' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                    Pending
                  </span>
                )}
                
                {data.userOutcome === 'won' && (
                  <div className="text-right">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Won! 🎉
                    </span>
                    {!data.rewardClaimed && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        Rewards claimable
                      </div>
                    )}
                    {data.rewardClaimed && (
                      <div className="text-xs text-gray-500 mt-1">
                        Rewards claimed
                      </div>
                    )}
                  </div>
                )}
                
                {data.userOutcome === 'lost' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    Lost
                  </span>
                )}

                {/* Result Info */}
                {data.isDeclared && (
                  <div className="text-xs text-gray-500 text-right">
                    Result: {data.projectWon ? 'Top Performer' : 'Not Top'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};