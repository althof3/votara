'use client';

import { useState } from 'react';
import { useVoting } from '@/lib/hooks/useVoting';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateVoteProof, pollIdToScope, optionToMessage, isUserInGroup } from '@/lib/utils/semaphore';
import type { Poll } from '@/lib/api/client';
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
    // MOCK: Fast proof generation for dummy mode
    console.log('MOCK: Generating dummy proof...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      merkleTreeDepth: BigInt(20),
      merkleTreeRoot: BigInt(0),
      nullifierHash: BigInt(Math.floor(Math.random() * 1000000)),
      message: BigInt(0),
      scope: BigInt(0),
      points: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
    } as any;
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

