'use client';

import { useState } from 'react';
import { useVoting } from '@/lib/hooks/useVoting';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateVoteProof, pollIdToScope, optionToMessage, isUserInGroup } from '@/lib/utils/semaphore';
import type { Poll } from '@/lib/api/polls';
import type { SemaphoreProof } from '@/lib/contracts/votaraABI';
import type { Address } from 'viem';
import styles from './VoteForm.module.css';

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
      <div className={styles.info}>
        <p>This poll is not active yet.</p>
      </div>
    );
  }

  const getBadgeClass = () => {
    switch (poll.status) {
      case 'ACTIVE':
        return styles.badgeActive;
      case 'DRAFT':
        return styles.badgePending;
      case 'ENDED':
        return styles.badgeCompleted;
      default:
        return styles.badgePending;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${getBadgeClass()}`}>
          {poll.status}
        </span>
        <h2 className={styles.title}>{poll.title}</h2>
        {poll.description && (
          <p className={styles.description}>{poll.description}</p>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {txHash && (
        <div className={styles.success}>
          <p className={styles.successTitle}>
            Transaction submitted! Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        </div>
      )}

      {/* Options */}
      <div className={styles.options}>
        {poll.options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
            className={`${styles.optionButton} ${
              selectedOption === option.id ? styles.optionButtonSelected : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Submit Vote Button */}
      <button
        onClick={handleVoteWithProof}
        disabled={loading || isGeneratingProof || !walletAddress || selectedOption === null}
        className={styles.voteButton}
      >
        {isGeneratingProof
          ? '🔐 Generating Proof...'
          : loading
          ? '📤 Submitting Vote...'
          : '🗳️ Cast Vote'}
      </button>

      {!walletAddress && (
        <p className={styles.error}>Please login to vote</p>
      )}

      {selectedOption === null && walletAddress && (
        <p className={styles.info}>Please select an option</p>
      )}

      {/* Info */}
      <div className={styles.info}>
        <p>
          <strong>How it works:</strong> Your vote is submitted directly to the smart contract
          using a zero-knowledge proof. This ensures your vote is anonymous and cannot be traced
          back to you, while still preventing double voting.
        </p>
      </div>
    </div>
  );
}

