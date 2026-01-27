'use client';

import { useState } from 'react';
import { usePollCreation } from '@/lib/hooks/usePollCreation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Address } from 'viem';

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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Activate Poll</h2>
      <p className="text-sm text-gray-600 mb-4">Poll ID: {pollId}</p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Step 1: Create Semaphore Group */}
      {step === 'group' && (
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Eligible Voter Addresses (one per line) *
            </label>
            <textarea
              value={eligibleAddresses}
              onChange={(e) => setEligibleAddresses(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
              rows={10}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter Ethereum addresses of eligible voters (one per line)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? `Creating Group... (${currentStep})` : 'Create Semaphore Group'}
          </button>

          {!walletAddress && (
            <p className="text-sm text-red-600 text-center">Please login to create group</p>
          )}
        </form>
      )}

      {/* Step 2: Activate on Smart Contract */}
      {step === 'activate' && groupId && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Semaphore group created successfully!
            </p>
            <p className="text-sm text-green-800 font-mono mt-2">
              Group ID: {groupId}
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Now activate the poll on the smart contract:
            </p>
            <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
              <li>This will call the smart contract&apos;s activatePoll function</li>
              <li>You&apos;ll need to confirm the transaction in your wallet</li>
              <li>The poll will become ACTIVE after confirmation</li>
            </ul>
          </div>

          <button
            onClick={handleActivate}
            disabled={loading || !walletAddress}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? `Activating... (${currentStep})` : 'Activate Poll on Smart Contract'}
          </button>

          {!walletAddress && (
            <p className="text-sm text-red-600 text-center">Please login to activate poll</p>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6 flex items-center justify-center space-x-4">
        <div className={`flex items-center ${step === 'group' ? 'text-blue-600' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'group' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {step === 'activate' ? '✓' : '1'}
          </div>
          <span className="ml-2 text-sm font-medium">Create Group</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center ${step === 'activate' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'activate' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Activate</span>
        </div>
      </div>
    </div>
  );
}

