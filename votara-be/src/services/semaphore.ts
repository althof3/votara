import { createWalletClient, http, type Address, type Hash, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { logger } from '../utils/logger';
import { publicClient } from './blockchain';

// Get configuration from environment
const CHAIN = process.env.CHAIN === 'base' ? base : baseSepolia;
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const SEMAPHORE_ADDRESS = (process.env.SEMAPHORE_ADDRESS || '') as Address;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

if (!SEMAPHORE_ADDRESS) {
  logger.warn('⚠️  SEMAPHORE_ADDRESS not set in environment variables');
}

if (!PRIVATE_KEY) {
  logger.warn('⚠️  PRIVATE_KEY not set in environment variables');
}

// Semaphore ABI - only functions we need
const SEMAPHORE_ABI = [
  {
    type: 'function',
    name: 'createGroup',
    inputs: [],
    outputs: [{ name: 'groupId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addMember',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'identityCommitment', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addMembers',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'identityCommitments', type: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'GroupCreated',
    inputs: [
      { name: 'groupId', type: 'uint256', indexed: true },
      { name: 'merkleTreeDepth', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MemberAdded',
    inputs: [
      { name: 'groupId', type: 'uint256', indexed: true },
      { name: 'index', type: 'uint256', indexed: false },
      { name: 'identityCommitment', type: 'uint256', indexed: false },
      { name: 'merkleTreeRoot', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Wallet client for writing to blockchain
 */
let walletClient: ReturnType<typeof createWalletClient> | null = null;

function getWalletClient() {
  if (!walletClient && PRIVATE_KEY) {
    const account = privateKeyToAccount(PRIVATE_KEY);
    walletClient = createWalletClient({
      account,
      chain: CHAIN,
      transport: http(RPC_URL),
    });
  }
  return walletClient;
}

/**
 * Create a new Semaphore group
 * @returns Group ID
 */
export async function createSemaphoreGroup(): Promise<bigint> {
  try {
    const client = getWalletClient();
    if (!client) {
      throw new Error('Wallet client not initialized');
    }

    logger.info('🔐 Creating new Semaphore group...');

    // Call createGroup on Semaphore contract
    const hash = await client.writeContract({
      address: SEMAPHORE_ADDRESS,
      abi: SEMAPHORE_ABI,
      functionName: 'createGroup',
      args: [],
    });

    logger.info(`📝 Group creation tx: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parse GroupCreated event to get groupId
    const groupCreatedLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === SEMAPHORE_ADDRESS.toLowerCase()
    );

    if (!groupCreatedLog || !groupCreatedLog.topics[1]) {
      throw new Error('GroupCreated event not found in transaction receipt');
    }

    const groupId = BigInt(groupCreatedLog.topics[1]);
    logger.info(`✅ Semaphore group created: ${groupId}`);

    return groupId;
  } catch (error) {
    logger.error('Error creating Semaphore group:', error);
    throw error;
  }
}

/**
 * Add members to a Semaphore group
 * @param groupId - Semaphore group ID
 * @param identityCommitments - Array of identity commitments (hashed from addresses)
 * @returns Transaction hash
 */
export async function addMembersToGroup(
  groupId: bigint,
  identityCommitments: bigint[]
): Promise<Hash> {
  try {
    const client = getWalletClient();
    if (!client) {
      throw new Error('Wallet client not initialized');
    }

    logger.info(`👥 Adding ${identityCommitments.length} members to group ${groupId}...`);

    // Call addMembers on Semaphore contract
    const hash = await client.writeContract({
      address: SEMAPHORE_ADDRESS,
      abi: SEMAPHORE_ABI,
      functionName: 'addMembers',
      args: [groupId, identityCommitments],
    });

    logger.info(`📝 Add members tx: ${hash}`);

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    logger.info(`✅ Members added to group ${groupId}`);

    return hash;
  } catch (error) {
    logger.error('Error adding members to group:', error);
    throw error;
  }
}

/**
 * Convert address to identity commitment
 * For simplicity, we use keccak256(address) as identity commitment
 * In production, users should generate their own identity commitments using Semaphore SDK
 *
 * @param address - Ethereum address
 * @returns Identity commitment as bigint
 */
export function addressToIdentityCommitment(address: Address): bigint {
  const hash = keccak256(toBytes(address.toLowerCase()));
  return BigInt(hash);
}

/**
 * Convert multiple addresses to identity commitments
 * @param addresses - Array of Ethereum addresses
 * @returns Array of identity commitments
 */
export function addressesToIdentityCommitments(addresses: Address[]): bigint[] {
  return addresses.map(addressToIdentityCommitment);
}

/**
 * Create Semaphore group and add eligible voters
 * This is a convenience function that combines createGroup and addMembers
 *
 * @param eligibleAddresses - Array of addresses eligible to vote
 * @returns Object with groupId, transaction hash, and identity commitments
 */
export async function createGroupWithMembers(
  eligibleAddresses: Address[]
): Promise<{ groupId: bigint; addMembersTxHash: Hash; identityCommitments: bigint[] }> {
  try {
    logger.info(`🔐 Creating Semaphore group with ${eligibleAddresses.length} eligible voters...`);

    // Step 1: Create group
    const groupId = await createSemaphoreGroup();

    // Step 2: Convert addresses to identity commitments
    const identityCommitments = addressesToIdentityCommitments(eligibleAddresses);

    // Step 3: Add members to group
    const addMembersTxHash = await addMembersToGroup(groupId, identityCommitments);

    logger.info(`✅ Group ${groupId} created with ${eligibleAddresses.length} members`);

    return { groupId, addMembersTxHash, identityCommitments };
  } catch (error) {
    logger.error('Error creating group with members:', error);
    throw error;
  }
}

export { SEMAPHORE_ADDRESS };

