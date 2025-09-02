'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { toast } from 'react-hot-toast';

import { CONTRACTS, formatUSDC, parseUSDC } from '@/lib/contracts';
import { BettingProject, UserBets, ProjectResult } from '@/app/types/betting';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

interface ProjectBettingModalProps {
  project: BettingProject;
  isOpen: boolean;
  onClose: () => void;
  userBets: UserBets;
  projectResult: ProjectResult;
}

export const ProjectBettingModal: React.FC<ProjectBettingModalProps> = ({
  project,
  isOpen,
  onClose,
  userBets,
  projectResult
}) => {
  const { address } = useAccount();
  const [betAmount, setBetAmount] = useState('');
  const [betType, setBetType] = useState<'win' | 'lose'>('win');
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'approved' | 'betting' | 'complete' | 'claiming'>('idle');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);

  // Contract interaction hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check USDC balance and allowance
  const { data: usdcBalance } = useBalance({
    address,
    token: CONTRACTS.USDC.address,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...CONTRACTS.USDC,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.JUDGE_AI_BETS.address] : undefined,
    query: { enabled: !!address },
  });

  // Check if user has already claimed rewards
  const { data: rewardClaimed } = useReadContract({
    ...CONTRACTS.JUDGE_AI_BETS,
    functionName: 'rewardClaimed',
    args: address ? [address, project.id] : undefined,
    query: { enabled: !!address && projectResult.declared },
  });

  // Check if user won
  const { data: userWon } = useReadContract({
    ...CONTRACTS.JUDGE_AI_BETS,
    functionName: 'hasUserWonUSDC',
    args: address ? [address, project.id] : undefined,
    query: { enabled: !!address && projectResult.declared },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBetAmount('');
      setBetType('win');
      setCurrentStep('idle');
      setNeedsApproval(false);
      setApprovalHash(null);
    }
  }, [isOpen]);

  // Check if approval is needed
  useEffect(() => {
    if (betAmount && allowance !== undefined) {
      const amount = parseUSDC(betAmount);
      const allowanceBig = BigInt(allowance.toString());
      setNeedsApproval(allowanceBig < amount);
    }
  }, [betAmount, allowance]);

  // Handle transaction confirmations
  useEffect(() => {
    if (isConfirmed && hash) {
      if (currentStep === 'approving') {
        // Approval transaction confirmed
        toast.success('USDC approval successful!');
        setCurrentStep('approved');
        setApprovalHash(hash);
        refetchAllowance();
        
        // Auto-proceed to betting after 2 seconds
        setTimeout(() => {
          handleBet();
        }, 2000);
        
      } else if (currentStep === 'betting') {
        // Betting transaction confirmed
        setCurrentStep('complete');
        toast.success('Bet placed successfully! 🎉');
        
        // Close modal after showing success
        setTimeout(() => {
          onClose();
          setCurrentStep('idle');
        }, 2000);
        
      } else if (currentStep === 'claiming') {
        // Claiming transaction confirmed
        setCurrentStep('complete');
        toast.success('Rewards claimed successfully! 🎉');
        
        setTimeout(() => {
          onClose();
          setCurrentStep('idle');
        }, 2000);
      }
    }
  }, [isConfirmed, hash, currentStep]);

  // Handle the main action (approval + betting or direct betting)
  const handleMainAction = async () => {
    if (!betAmount || !address) return;

    try {
      if (needsApproval) {
        // Start with approval
        setCurrentStep('approving');
        const amount = parseUSDC(betAmount);
        
        writeContract({
          ...CONTRACTS.USDC,
          functionName: 'approve',
          args: [CONTRACTS.JUDGE_AI_BETS.address, amount],
        });
      } else {
        // Direct betting
        handleBet();
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setCurrentStep('idle');
      toast.error('Transaction failed');
    }
  };

  // Handle betting transaction
  const handleBet = async () => {
    if (!betAmount || !address) return;

    try {
      setCurrentStep('betting');
      const amount = parseUSDC(betAmount);
      
      writeContract({
        ...CONTRACTS.JUDGE_AI_BETS,
        functionName: 'betOnProjectWithUSDC',
        args: [project.id, amount, betType === 'win'],
      });
    } catch (error) {
      console.error('Betting error:', error);
      setCurrentStep('idle');
      toast.error('Failed to place bet');
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (!address) return;

    try {
      setCurrentStep('claiming');
      
      writeContract({
        ...CONTRACTS.JUDGE_AI_BETS,
        functionName: 'claimReward',
        args: [project.id],
      });
    } catch (error) {
      console.error('Claim error:', error);
      setCurrentStep('idle');
      toast.error('Failed to claim rewards');
    }
  };

  const canPlaceBet = () => {
    if (!betAmount || !usdcBalance) return false;
    const amount = parseUSDC(betAmount);
    const balanceBig = BigInt(usdcBalance.value.toString());
    return amount > BigInt(0) && amount <= balanceBig;
  };

  const getMaxBet = () => {
    if (!usdcBalance) return '0';
    return formatUSDC(usdcBalance.value.toString());
  };

  const isProcessing = currentStep !== 'idle' && currentStep !== 'complete';
  const canClose = currentStep === 'idle' || currentStep === 'complete';

  // Safe BigInt comparisons for user bets
  const hasUserBets = () => {
    const winBetBig = BigInt(userBets.winBet.toString());
    const loseBetBig = BigInt(userBets.loseBet.toString());
    return winBetBig > BigInt(0) || loseBetBig > BigInt(0);
  };

  const getButtonText = () => {
    if (currentStep === 'approving') return 'Approving USDC...';
    if (currentStep === 'approved') return 'Approval Complete - Preparing Bet...';
    if (currentStep === 'betting') return 'Placing Bet...';
    if (currentStep === 'claiming') return 'Claiming Rewards...';
    if (currentStep === 'complete') return 'Transaction Complete!';
    if (needsApproval && currentStep === 'idle') return `Approve & Bet ${betAmount} USDC`;
    return `Bet ${betAmount} USDC on ${betType === 'win' ? 'YES' : 'NO'}`;
  };

  const getStepMessage = () => {
    if (currentStep === 'approving') return 'Step 1/2: Approving USDC spending permission...';
    if (currentStep === 'approved') return 'Step 1/2: ✅ USDC approved! Preparing to place bet...';
    if (currentStep === 'betting') return 'Step 2/2: Placing your bet on the blockchain...';
    if (currentStep === 'claiming') return 'Processing reward claim...';
    return null;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={canClose ? onClose : () => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                    {projectResult.declared ? 'Claim Rewards' : 'Place Bet'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    disabled={!canClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Project Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{project.descripton}</p>
                </div>

                {/* Claim Rewards Section */}
                {projectResult.declared ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg text-center ${
                      projectResult.result 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className={`text-lg font-bold ${
                        projectResult.result ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {projectResult.result ? '✅ TOP PERFORMER' : '❌ NOT TOP PERFORMER'}
                      </div>
                    </div>

                    {userWon && !rewardClaimed ? (
                      <button
                        onClick={handleClaimRewards}
                        disabled={isProcessing}
                        className="w-full py-4 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <LoadingSpinner size="sm" />
                            {getButtonText()}
                          </>
                        ) : (
                          'Claim Your Rewards 🎉'
                        )}
                      </button>
                    ) : rewardClaimed ? (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                        <div className="text-blue-800 font-semibold">✅ Rewards Claimed</div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                        <div className="text-gray-700 font-semibold">No Rewards</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {hasUserBets() ? "Better luck next time!" : "You didn't bet on this project."}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Betting Section */
                  <div className="space-y-6">
                    {/* Process Steps Indicator */}
                    {getStepMessage() && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <LoadingSpinner size="sm" />
                          <div className="text-sm font-medium text-blue-800">
                            {getStepMessage()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bet Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Your Prediction
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setBetType('win')}
                          disabled={isProcessing}
                          className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                            betType === 'win'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-green-300'
                          }`}
                        >
                          <div className={`font-bold ${betType === 'win' ? 'text-green-700' : 'text-gray-700'}`}>
                            YES
                          </div>
                          <div className={`text-xs ${betType === 'win' ? 'text-green-600' : 'text-gray-500'}`}>
                            Will be top performer
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setBetType('lose')}
                          disabled={isProcessing}
                          className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                            betType === 'lose'
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-red-300'
                          }`}
                        >
                          <div className={`font-bold ${betType === 'lose' ? 'text-red-700' : 'text-gray-700'}`}>
                            NO
                          </div>
                          <div className={`text-xs ${betType === 'lose' ? 'text-red-600' : 'text-gray-500'}`}>
                            Won't be top performer
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Bet Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bet Amount (USDC)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={getMaxBet()}
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          disabled={isProcessing}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-50"
                          placeholder="Enter amount"
                        />
                        <div className="absolute right-3 top-3 text-gray-500 text-sm">
                          USDC
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-600">
                          Balance: {getMaxBet()} USDC
                        </div>
                        <div className="flex gap-1">
                          {['10', '25', '50'].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => setBetAmount(amount)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors disabled:opacity-50"
                            >
                              {amount}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={handleMainAction}
                      disabled={!canPlaceBet() || isProcessing}
                      className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <LoadingSpinner size="sm" />
                          {getButtonText()}
                        </>
                      ) : (
                        getButtonText()
                      )}
                    </button>

                    {/* Cancel Button - only show when not processing */}
                    {!isProcessing && (
                      <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};