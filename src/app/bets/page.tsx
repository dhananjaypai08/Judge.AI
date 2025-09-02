'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';

import { CONTRACTS, formatUSDC } from '@/lib/contracts';
import { BettingProject, ProjectBets, UserBets, ProjectResult } from '@/app/types/betting';
import { Navbar } from '@/app/components/Navbar';
import { BettingCard } from './components/BettingCard';
import { UserBetsDisplay } from './components/UserBetsDisplay';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

export default function BettingPage() {
  const { address, isConnected } = useAccount();
  const [projects, setProjects] = useState<BettingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<BettingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from contract
  const { data: contractProjects, isError: projectsError, isLoading: projectsLoading } = useReadContract({
    ...CONTRACTS.JUDGE_AI_BETS,
    functionName: 'getAllProjects',
  });

  // Fetch USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: CONTRACTS.USDC.address,
  });

  // Load projects data
  useEffect(() => {
    if (contractProjects) {
      try {
        const formattedProjects: BettingProject[] = contractProjects.map((project: any, index: number) => ({
          id: index,
          name: project.name || `Project ${index + 1}`,
          AIpoints: project.AIpoints || 0,
          uri: project.uri || '',
          descripton: project.descripton || 'No description available', // Note: keeping your typo
          devfolioLink: project.devfolioLink || '#',
          prizeTrack: project.prizeTrack || 'General',
          githubScore: project.githubScore || '0',
        }));
        setProjects(formattedProjects);
      } catch (err) {
        console.error('Error processing projects:', err);
        setError('Failed to load projects data');
      } finally {
        setLoading(false);
      }
    }
  }, [contractProjects]);

  // Handle errors
  useEffect(() => {
    if (projectsError) {
      setError('Failed to fetch projects from contract');
      setLoading(false);
    }
  }, [projectsError]);

  const mockStats = {
    total: projects.length,
    scored: projects.length,
    flagged: 0,
    unflagged: projects.length,
    avgScore: 75.5,
    pending: 0,
    errors: 0
  };

  if (loading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar stats={mockStats} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h3 className="mt-6 text-2xl font-bold text-gray-900">Loading Betting Markets</h3>
            <p className="text-gray-600 text-lg mt-2">Fetching project data from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar stats={mockStats} />
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-red-900 mb-4">Failed to Load Betting Markets</h3>
            <p className="text-red-800 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar stats={mockStats} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Prediction Betting
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Predict on the top 12 projects and win USDC rewards. 
              <span className="block mt-2 text-lg font-medium text-purple-600">
                "Making fair judgment calls on innovation"
              </span>
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex flex-col items-center gap-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                          >
                            Connect Wallet to Start Betting
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Wrong Network - Switch to Base
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="flex items-center gap-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {account.displayName?.[0] || '?'}
                              </span>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-gray-900">
                                {account.displayName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {chain.name}
                              </div>
                            </div>
                          </button>
                          
                          {usdcBalance && (
                            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="text-sm font-medium text-green-800">
                                Balance: {formatUSDC(usdcBalance.value)} USDC
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* User's Betting Summary */}
        {isConnected && address && (
          <div className="mb-8">
            <UserBetsDisplay 
              userAddress={address} 
              projects={projects}
            />
          </div>
        )}

        {/* Market Stats */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Market Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-blue-800 font-medium">Active Markets</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">LIVE</div>
              <div className="text-sm text-purple-800 font-medium">Betting Status</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">USDC</div>
              <div className="text-sm text-green-800 font-medium">Betting Token</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">1%</div>
              <div className="text-sm text-orange-800 font-medium">House Edge</div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Markets ({projects.length})
              </h2>
              <div className="text-sm text-gray-600">
                Bet on whether projects will be AI top performers
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <BettingCard
                  key={project.id}
                  project={project}
                  userAddress={address}
                  isConnected={isConnected}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Markets Available</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Markets will be available once projects are loaded from the contract.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Contract Address: <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {CONTRACTS.JUDGE_AI_BETS.address}
              </code>
            </p>
            <p className="text-sm text-gray-500">
              Betting on innovation •
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}