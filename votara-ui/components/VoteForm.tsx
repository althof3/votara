'use client';

import { useState } from 'react';
import { useVoting } from '@/lib/hooks/useVoting';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateVoteProof, pollIdToScope, optionToMessage, isUserInGroup } from '@/lib/utils/semaphore';
import type { Poll } from '@/lib/api/polls';
import type { SemaphoreProof } from '@/lib/contracts/votaraABI';
import type { Address } from 'viem';

interface VoteFormProps {
  poll: Poll;
  onSuccess?: () => void;
}

export function VoteForm({ poll, onSuccess }: VoteFormProps) {
  const { walletAddress } = useAuth();
  const { vote, loading, error, txHash } = useVoting();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);

  // Generate proof function using real Semaphore protocol
  const generateProof = async (): Promise<SemaphoreProof | null> => {
    if (selectedOption === null) {
      throw new Error('No option selected');
    }

    // Check if poll has required data
    if (!poll.groupId || poll.groupId === '0') {
      throw new Error('This poll has not been activated yet. The poll creator needs to activate it first.');
    }

    if (!poll.groupMembers || poll.groupMembers.length === 0) {
      throw new Error(
        'Poll group information is not available. This could mean:\n' +
        '1. The poll has not been fully activated yet\n' +
        '2. No voters have been registered\n' +
        '3. There was an error loading group data\n\n' +
        'Please contact the poll creator or try again later.'
      );
    }

    // Check if user is eligible to vote
    const members = poll.groupMembers.map((m: string) => BigInt(m));
    if (!isUserInGroup(members)) {
      throw new Error(
        'You are not eligible to vote in this poll.\n\n' +
        'Your identity commitment is not in the voter group. ' +
        'Please ensure you were added as an eligible voter when the poll was created.'
      );
    }

    // Generate the proof
    const message = optionToMessage(selectedOption);
    const scope = pollIdToScope(poll.id);

    const proof = await generateVoteProof(
      members,
      message,
      scope
    );

    return proof;
  };

  const handleVoteWithProof = async () => {
    if (!walletAddress || selectedOption === null) {
      alert('Please select an option');
      return;
    }

    try {
      setIsGeneratingProof(true);

      // Step 1: Generate proof
      const proof = await generateProof();

      if (!proof) {
        alert('Failed to generate proof');
        return;
      }

      setIsGeneratingProof(false);

      // Step 2: Submit vote with proof
      const success = await vote(
        poll.id as `0x${string}`,
        selectedOption,
        proof,
        walletAddress as Address
      );

      if (success) {
        alert('Vote cast successfully!');
        onSuccess?.();
      }
    } catch (err) {
      setIsGeneratingProof(false);
      console.error('Error voting:', err);
      alert('Failed to cast vote. Please try again.');
    }
  };

  if (poll.status !== 'ACTIVE') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">This poll is not active yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2">{poll.title}</h2>
      {poll.description && (
        <p className="text-gray-600 mb-6">{poll.description}</p>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {txHash && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            Transaction submitted! Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium mb-2">Select your choice:</label>
        {poll.options.map((option) => (
          <div
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedOption === option.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedOption === option.id
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400'
                }`}
              >
                {selectedOption === option.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Vote Button */}
      <button
        onClick={handleVoteWithProof}
        disabled={loading || isGeneratingProof || !walletAddress || selectedOption === null}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all"
      >
        {isGeneratingProof
          ? '🔐 Generating Proof...'
          : loading
          ? '📤 Submitting Vote...'
          : '🗳️ Cast Vote'}
      </button>

      {!walletAddress && (
        <p className="text-sm text-red-600 text-center mt-4">Please login to vote</p>
      )}

      {selectedOption === null && walletAddress && (
        <p className="text-sm text-gray-600 text-center mt-4">Please select an option</p>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>How it works:</strong> Your vote is submitted directly to the smart contract
          using a zero-knowledge proof. This ensures your vote is anonymous and cannot be traced
          back to you, while still preventing double voting.
        </p>
      </div>
    </div>
  );
}

