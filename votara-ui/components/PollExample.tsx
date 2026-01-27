'use client';

import { useState, useEffect } from 'react';
import { usePolls } from '../lib/hooks/usePolls';
import { createPollId } from '../lib/utils/pollUtils';
import type { Poll } from '../lib/api/polls';

/**
 * Example component demonstrating poll creation and voting
 * This shows how to integrate with both the backend API and smart contract
 */
export function PollExample() {
  const { loading, error, createPoll, castVote, getPollResults, getAllPolls } = usePolls();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  // Load all polls on mount
  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    const allPolls = await getAllPolls();
    setPolls(allPolls);
  };

  /**
   * Example: Create a new poll
   * Steps:
   * 1. Generate poll ID (bytes32 hash)
   * 2. Call smart contract createVote(pollId, groupId)
   * 3. Call backend API to save metadata
   */
  const handleCreatePoll = async () => {
    // Generate unique poll ID
    const pollId = createPollId();
    
    // TODO: Call smart contract first
    // await votaraContract.createVote(pollId, groupId);
    
    // Then save metadata to backend
    const poll = await createPoll({
      id: pollId,
      groupId: '1', // Semaphore group ID
      title: 'Example Poll',
      description: 'This is an example poll',
      options: ['Option A', 'Option B', 'Option C'],
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdBy: 'user-address',
    });

    if (poll) {
      console.log('Poll created:', poll);
      loadPolls();
    }
  };

  /**
   * Example: Cast a vote
   * Steps:
   * 1. Generate Semaphore proof
   * 2. Call smart contract castVote(pollId, optionIndex, proof)
   * 3. Call backend API to record vote
   */
  const handleCastVote = async (pollId: string, optionIndex: number) => {
    // TODO: Generate Semaphore proof
    // const proof = await generateSemaphoreProof(...);
    
    // TODO: Call smart contract first
    // await votaraContract.castVote(pollId, optionIndex, proof);
    
    // Then record in backend
    const success = await castVote(pollId, {
      optionIndex,
      nullifierHash: '0x' + Math.random().toString(16).substring(2), // Mock nullifier
      voterAddress: 'user-address',
    });

    if (success) {
      console.log('Vote cast successfully');
      loadResults(pollId);
    }
  };

  /**
   * Example: Get poll results
   * Combines on-chain vote counts with off-chain metadata
   */
  const loadResults = async (pollId: string) => {
    const pollResults = await getPollResults(pollId);
    if (pollResults) {
      setResults(pollResults);
      setSelectedPoll(pollId);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Votara Poll Example</h1>
      
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleCreatePoll} disabled={loading}>
          {loading ? 'Creating...' : 'Create Example Poll'}
        </button>
      </div>

      <h2>All Polls</h2>
      <div>
        {polls.map((poll) => (
          <div key={poll.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>{poll.title}</h3>
            <p>{poll.description}</p>
            <p>Options: {poll.options.join(', ')}</p>
            <button onClick={() => loadResults(poll.id)}>View Results</button>
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleCastVote(poll.id, index)}
                style={{ marginLeft: '5px' }}
              >
                Vote for {option}
              </button>
            ))}
          </div>
        ))}
      </div>

      {selectedPoll && results && (
        <div style={{ marginTop: '20px', border: '2px solid #333', padding: '15px' }}>
          <h2>Results for: {results.poll.title}</h2>
          <p>Total Votes: {results.totalVotes}</p>
          {results.results.map((result: any) => (
            <div key={result.index}>
              <strong>{result.option}:</strong> {result.votes} votes
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

