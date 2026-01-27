import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof as semaphoreGenerateProof } from '@semaphore-protocol/proof';
import type { SemaphoreProof } from '@/lib/contracts/votaraABI';

/**
 * Storage key for user's Semaphore identity
 */
const IDENTITY_STORAGE_KEY = 'votara_semaphore_identity';

/**
 * Get or create user's Semaphore identity
 * Identity is stored in localStorage for persistence
 */
export function getOrCreateIdentity(): Identity {
  if (typeof window === 'undefined') {
    throw new Error('Identity can only be created in browser environment');
  }

  // Try to load existing identity from localStorage
  const storedIdentity = localStorage.getItem(IDENTITY_STORAGE_KEY);
  
  if (storedIdentity) {
    try {
      // Restore identity from stored string
      return new Identity(storedIdentity);
    } catch (error) {
      console.warn('Failed to restore identity, creating new one:', error);
    }
  }

  // Create new identity
  const identity = new Identity();
  
  // Store identity for future use
  localStorage.setItem(IDENTITY_STORAGE_KEY, identity.toString());
  
  return identity;
}

/**
 * Get user's identity commitment
 * This is what gets added to the Semaphore group
 */
export function getIdentityCommitment(): bigint {
  const identity = getOrCreateIdentity();
  return identity.commitment;
}

/**
 * Clear stored identity (for testing or logout)
 */
export function clearIdentity(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
  }
}

/**
 * Generate Semaphore proof for voting
 *
 * @param members - Array of identity commitments in the group
 * @param message - The vote option (as bigint)
 * @param scope - The poll ID (as bigint)
 * @returns Semaphore proof
 */
export async function generateVoteProof(
  members: bigint[],
  message: bigint,
  scope: bigint
): Promise<SemaphoreProof> {
  try {
    // Get user's identity
    const identity = getOrCreateIdentity();

    // Create group with members
    const group = new Group(members);

    // Check if user is in the group
    const userCommitment = identity.commitment;
    if (!members.some(m => m === userCommitment)) {
      throw new Error('You are not eligible to vote in this poll. Your identity is not in the voter group.');
    }

    // Generate proof
    const proof = await semaphoreGenerateProof(
      identity,
      group,
      message,
      scope
    );

    // Convert proof to contract format
    // Semaphore library returns strings, need to convert to bigint
    return {
      merkleTreeDepth: BigInt(proof.merkleTreeDepth),
      merkleTreeRoot: BigInt(proof.merkleTreeRoot),
      nullifier: BigInt(proof.nullifier),
      message: BigInt(proof.message),
      scope: BigInt(proof.scope),
      points: proof.points.map(p => BigInt(p)) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    };
  } catch (error) {
    console.error('Error generating Semaphore proof:', error);
    throw error;
  }
}

/**
 * Convert poll ID string to bigint for use as scope
 */
export function pollIdToScope(pollId: string): bigint {
  // Remove '0x' prefix if present
  const cleanId = pollId.startsWith('0x') ? pollId.slice(2) : pollId;
  return BigInt('0x' + cleanId);
}

/**
 * Convert option index to message bigint
 */
export function optionToMessage(optionIndex: number): bigint {
  return BigInt(optionIndex);
}

/**
 * Check if user's identity is in a group
 */
export function isUserInGroup(members: bigint[]): boolean {
  try {
    const identity = getOrCreateIdentity();
    return members.some(m => m === identity.commitment);
  } catch {
    return false;
  }
}

/**
 * Get user's identity info for debugging
 */
export function getIdentityInfo() {
  try {
    const identity = getOrCreateIdentity();
    return {
      commitment: identity.commitment.toString(),
      hasIdentity: true
    };
  } catch {
    return {
      commitment: null,
      hasIdentity: false
    };
  }
}

