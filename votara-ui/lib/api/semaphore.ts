/**
 * API functions for Semaphore group management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Get group members for a poll
 * This fetches the identity commitments of all eligible voters
 */
export async function getPollGroupMembers(pollId: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/group-members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch group members');
    }

    const result = await response.json();
    return result.data.members || [];
  } catch (error) {
    console.error('Error fetching group members:', error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Register user's identity commitment to a poll group
 * This should be called before voting to ensure user is in the group
 */
export async function registerToVote(
  pollId: string,
  identityCommitment: string,
  token?: string | null
): Promise<boolean> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ identityCommitment }),
    });

    if (!response.ok) {
      throw new Error('Failed to register to vote');
    }

    return true;
  } catch (error) {
    console.error('Error registering to vote:', error);
    return false;
  }
}

