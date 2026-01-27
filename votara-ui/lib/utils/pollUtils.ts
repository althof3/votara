import { keccak256, toBytes } from 'viem';

/**
 * Generate a unique poll ID as bytes32 hash
 * @param uniqueString - A unique string identifier (e.g., timestamp + random)
 * @returns bytes32 hash
 */
export function generatePollId(uniqueString: string): `0x${string}` {
  return keccak256(toBytes(uniqueString));
}

/**
 * Generate a unique string for poll ID creation
 * @returns Unique string based on timestamp and random value
 */
export function generateUniquePollString(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `poll-${timestamp}-${random}`;
}

/**
 * Create a poll ID
 * @returns bytes32 poll ID
 */
export function createPollId(): `0x${string}` {
  const uniqueString = generateUniquePollString();
  return generatePollId(uniqueString);
}

