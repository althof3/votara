'use client';

import { useState } from 'react';
import { usePollCreation } from '@/lib/hooks/usePollCreation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Address } from 'viem';
import styles from './ActivatePollForm.module.css';

interface ActivatePollFormProps {
  pollId: string;
  onSuccess?: () => void;
}

export function ActivatePollForm({ pollId, onSuccess }: ActivatePollFormProps) {
  const { walletAddress } = useAuth();
  const { createGroup, activatePollOnChain, loading, error, currentStep } = usePollCreation();

  const [eligibleAddresses, setEligibleAddresses] = useState<string>('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [step, setStep] = useState<'group' | 'activate'>('group');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      alert('Please login first');
      return;
    }

    // Parse addresses (one per line)
    const addresses = eligibleAddresses
      .split('\n')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      alert('Please enter at least one address');
      return;
    }

    // Validate addresses (basic check)
    const invalidAddresses = addresses.filter((addr) => !addr.startsWith('0x') || addr.length !== 42);
    if (invalidAddresses.length > 0) {
      alert(`Invalid addresses: ${invalidAddresses.join(', ')}`);
      return;
    }

    const response = await createGroup(pollId, addresses);
    if (response) {
      setGroupId(response.groupId);
      setStep('activate');
      alert(`Group created! Group ID: ${response.groupId}`);
    }
  };

  const handleActivate = async () => {
    if (!walletAddress || !groupId) {
      alert('Missing required data');
      return;
    }

    const success = await activatePollOnChain(
      pollId as `0x${string}`,
      BigInt(groupId),
      walletAddress as Address
    );

    if (success) {
      alert('Poll activated successfully!');
      onSuccess?.();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Activate Poll</h2>
        <p className={styles.description}>Poll ID: {pollId}</p>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Step 1: Create Semaphore Group */}
      {step === 'group' && (
        <form onSubmit={handleCreateGroup} className={styles.formGroup}>
          <div>
            <label className={styles.label}>
              Eligible Voter Addresses (one per line) *
            </label>
            <textarea
              value={eligibleAddresses}
              onChange={(e) => setEligibleAddresses(e.target.value)}
              className={styles.input}
              placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
              rows={10}
              required
            />
            <p className={styles.info}>
              Enter Ethereum addresses of eligible voters (one per line)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className={styles.activateButton}
          >
            {loading ? `Creating Group... (${currentStep})` : 'Create Semaphore Group'}
          </button>

          {!walletAddress && (
            <p className={styles.error}>Please login to create group</p>
          )}
        </form>
      )}

      {/* Step 2: Activate on Smart Contract */}
      {step === 'activate' && groupId && (
        <div className={styles.formGroup}>
          <div className={styles.success}>
            <p className={styles.successTitle}>
              ✅ Semaphore group created successfully!
            </p>
            <p className={styles.successMessage}>
              Group ID: {groupId}
            </p>
          </div>

          <div className={styles.info}>
            <p className={styles.successMessage}>
              Now activate the poll on the smart contract:
            </p>
            <ul>
              <li>This will call the smart contract&apos;s activatePoll function</li>
              <li>You&apos;ll need to confirm the transaction in your wallet</li>
              <li>The poll will become ACTIVE after confirmation</li>
            </ul>
          </div>

          <button
            onClick={handleActivate}
            disabled={loading || !walletAddress}
            className={styles.activateButton}
          >
            {loading ? `Activating... (${currentStep})` : 'Activate Poll on Smart Contract'}
          </button>

          {!walletAddress && (
            <p className={styles.error}>Please login to activate poll</p>
          )}
        </div>
      )}
    </div>
  );
}

