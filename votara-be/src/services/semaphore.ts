/**
 * Semaphore Service
 *
 * This service handles on-chain Semaphore group operations using the Semaphore protocol.
 * It provides functions to create groups and manage members on the blockchain.
 *
 * For off-chain operations (identity generation, proof generation), use @semaphore-protocol/identity
 * and @semaphore-protocol/proof packages in the frontend.
 */

import { createWalletClient, http, type Address, type Hash, decodeErrorResult } from 'viem';
import { Account, privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { poseidon1 } from 'poseidon-lite';
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

/**
 * Semaphore Contract ABI
 *
 * Based on Semaphore V4 contract interface
 * Full contract: https://github.com/semaphore-protocol/semaphore/blob/main/packages/contracts/contracts/Semaphore.sol
 */
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
    name: 'createGroup',
    inputs: [{ name: 'merkleTreeDuration', type: 'uint256' }],
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
    type: 'function',
    name: 'getMerkleTreeRoot',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMerkleTreeDepth',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getNumberOfMerkleTreeLeaves',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMerkleTreeSize',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
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
    name: 'GroupAdminUpdated',
    inputs: [
      { name: 'groupId', type: 'uint256', indexed: true },
      { name: 'oldAdmin', type: 'address', indexed: true },
      { name: 'newAdmin', type: 'address', indexed: true },
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
  {
    type: 'error',
    name: 'Semaphore__GroupDoesNotExist',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Semaphore__CallerIsNotTheGroupAdmin',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Semaphore__MemberAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Semaphore__MerkleTreeDepthIsNotSupported',
    inputs: [],
  },
] as const;

/**
 * Wallet client for writing to blockchain
 * Singleton pattern to reuse the same client instance
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

    logger.info(`🔑 Wallet client initialized with address: ${account.address}`);
  }
  return walletClient;
}

/**
 * Helper function to parse contract errors
 */
function parseContractError(error: any): string {
  // Check for common Semaphore errors
  if (error.message?.includes('Semaphore__GroupDoesNotExist')) {
    return 'Group does not exist. Please create the group first.';
  }
  if (error.message?.includes('Semaphore__CallerIsNotTheGroupAdmin')) {
    return 'Only the group admin can perform this action.';
  }
  if (error.message?.includes('Semaphore__MemberAlreadyExists')) {
    return 'One or more members already exist in the group.';
  }
  if (error.message?.includes('Semaphore__MerkleTreeDepthIsNotSupported')) {
    return 'Merkle tree depth is not supported.';
  }

  // Check for gas/balance errors
  if (error.message?.includes('insufficient funds') || error.message?.includes('exceeds the balance')) {
    return 'Insufficient ETH balance for gas fees. Please fund your wallet with Base Sepolia ETH.';
  }

  // Return original error message
  return error.message || 'Unknown error occurred';
}

/**
 * Create a new Semaphore group on-chain
 *
 * @param merkleTreeDuration - Optional duration (in seconds) for which old Merkle tree roots are valid (default: 3600 = 1 hour)
 * @returns Group ID
 * @throws Error if wallet is not initialized or transaction fails
 */
export async function createSemaphoreGroup(merkleTreeDuration?: number): Promise<bigint> {
  try {
    const client = getWalletClient();
    if (!client) {
      throw new Error('Wallet client not initialized. Please set PRIVATE_KEY in environment variables.');
    }

    logger.info('🔐 Creating new Semaphore group...');
    logger.info(`   Admin address: ${client.account?.address}`);
    if (merkleTreeDuration) {
      logger.info(`   Merkle tree duration: ${merkleTreeDuration}s`);
    }

    // Call createGroup on Semaphore contract
    const hash = await client.writeContract({
      address: SEMAPHORE_ADDRESS,
      abi: SEMAPHORE_ABI,
      functionName: 'createGroup',
      args: merkleTreeDuration ? [BigInt(merkleTreeDuration)] : [],
      chain: CHAIN,
      account: client.account as Account,
    });

    logger.info(`📝 Group creation tx submitted: ${hash}`);
    logger.info(`   View on explorer: https://sepolia.basescan.org/tx/${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted. Group creation failed.');
    }

    // Parse GroupCreated event to get groupId
    const groupCreatedLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === SEMAPHORE_ADDRESS.toLowerCase()
    );

    if (!groupCreatedLog || !groupCreatedLog.topics[1]) {
      throw new Error('GroupCreated event not found in transaction receipt');
    }

    const groupId = BigInt(groupCreatedLog.topics[1]);
    logger.info(`✅ Semaphore group created successfully!`);
    logger.info(`   Group ID: ${groupId}`);
    logger.info(`   Admin: ${client.account?.address}`);

    return groupId;
  } catch (error: any) {
    const errorMessage = parseContractError(error);
    logger.error('❌ Error creating Semaphore group:', errorMessage);
    logger.error('   Full error:', error);
    throw new Error(`Failed to create Semaphore group: ${errorMessage}`);
  }
}

/**
 * Add members to a Semaphore group on-chain
 *
 * IMPORTANT: Only the group admin (wallet that created the group) can add members.
 * Make sure you're using the same wallet that created the group.
 *
 * @param groupId - Semaphore group ID
 * @param identityCommitments - Array of identity commitments
 * @returns Transaction hash
 * @throws Error if wallet is not the group admin or transaction fails
 */
export async function addMembersToGroup(
  groupId: bigint,
  identityCommitments: bigint[]
): Promise<Hash> {
  try {
    const client = getWalletClient();
    if (!client) {
      throw new Error('Wallet client not initialized. Please set PRIVATE_KEY in environment variables.');
    }

    if (identityCommitments.length === 0) {
      throw new Error('No identity commitments provided. At least one member is required.');
    }

    logger.info(`👥 Adding ${identityCommitments.length} members to group ${groupId}...`);
    logger.info(`   Caller address: ${client.account?.address}`);
    logger.info(`   Identity commitments: ${identityCommitments.slice(0, 3).map(c => c.toString()).join(', ')}${identityCommitments.length > 3 ? '...' : ''}`);

    // Verify group exists by checking its Merkle tree root
    try {
      const merkleTreeRoot = await publicClient.readContract({
        address: SEMAPHORE_ADDRESS,
        abi: SEMAPHORE_ABI,
        functionName: 'getMerkleTreeRoot',
        args: [groupId],
      });
      logger.info(`   Group ${groupId} exists with Merkle root: ${merkleTreeRoot}`);
    } catch (error: any) {
      logger.error(`   Group ${groupId} does not exist or cannot be read`);
      throw new Error(`Group ${groupId} does not exist. Please create the group first.`);
    }

    // Call addMembers on Semaphore contract
    const hash = await client.writeContract({
      address: SEMAPHORE_ADDRESS,
      abi: SEMAPHORE_ABI,
      functionName: 'addMembers',
      args: [groupId, identityCommitments],
      chain: CHAIN,
      account: client.account as Account,
    });

    logger.info(`📝 Add members tx submitted: ${hash}`);
    logger.info(`   View on explorer: https://sepolia.basescan.org/tx/${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted. Failed to add members. You may not be the group admin.');
    }

    // Get updated member count
    const memberCount = await publicClient.readContract({
      address: SEMAPHORE_ADDRESS,
      abi: SEMAPHORE_ABI,
      functionName: 'getMerkleTreeSize',
      args: [groupId],
    });

    logger.info(`✅ Members added successfully!`);
    logger.info(`   Group ID: ${groupId}`);
    logger.info(`   Members added: ${identityCommitments.length}`);
    logger.info(`   Total members in group: ${memberCount}`);

    return hash;
  } catch (error: any) {
    const client = getWalletClient();
    const errorMessage = parseContractError(error);
    logger.error(`❌ Error adding members to group ${groupId}:`, errorMessage);
    logger.error('   Full error:', error);

    // Provide helpful error messages
    if (errorMessage.includes('CallerIsNotTheGroupAdmin')) {
      throw new Error(
        `Failed to add members: You are not the admin of group ${groupId}. ` +
        `Only the wallet that created the group can add members. ` +
        `Current wallet: ${client?.account?.address}`
      );
    }

    throw new Error(`Failed to add members to group ${groupId}: ${errorMessage}`);
  }
}

/**
 * SNARK Scalar Field for BN254 curve used by Semaphore
 * All identity commitments must be less than this value
 */
const SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Convert address to identity commitment using Poseidon hash
 *
 * IMPORTANT: This is a simplified approach for demo purposes.
 * In production, users should generate their own Semaphore identities using:
 * - @semaphore-protocol/identity package (frontend)
 * - Identity.commitment property
 *
 * This function uses Poseidon hash which is:
 * - SNARK-friendly (designed for zero-knowledge circuits)
 * - Always produces values < SNARK_SCALAR_FIELD
 * - Deterministic (same address = same commitment)
 *
 * @param address - Ethereum address
 * @returns Identity commitment as bigint (always < SNARK_SCALAR_FIELD)
 */
export function addressToIdentityCommitment(address: Address): bigint {
  // Convert address to bigint (remove 0x prefix)
  const addressBigInt = BigInt(address.toLowerCase());

  // Use Poseidon hash (SNARK-friendly)
  // poseidon1 takes array of bigints and returns bigint
  const commitment = poseidon1([addressBigInt]);

  // Validate commitment is within SNARK scalar field
  if (commitment >= SNARK_SCALAR_FIELD) {
    // This should never happen with Poseidon, but check anyway
    logger.warn(`⚠️  Commitment ${commitment} >= SNARK_SCALAR_FIELD, applying modulo`);
    return commitment % SNARK_SCALAR_FIELD;
  }

  logger.debug(`Address ${address} → Commitment ${commitment}`);

  return commitment;
}

/**
 * Convert multiple addresses to identity commitments
 *
 * @param addresses - Array of Ethereum addresses
 * @returns Array of identity commitments
 */
export function addressesToIdentityCommitments(addresses: Address[]): bigint[] {
  if (addresses.length === 0) {
    return [];
  }

  const commitments = addresses.map(addressToIdentityCommitment);
  logger.info(`📋 Generated ${commitments.length} identity commitments from addresses`);

  return commitments;
}

/**
 * Create Semaphore group and add eligible voters
 *
 * This is a convenience function that combines:
 * 1. Creating a new Semaphore group on-chain
 * 2. Converting addresses to identity commitments
 * 3. Adding all members to the group in one transaction
 *
 * IMPORTANT: This function uses the wallet from PRIVATE_KEY environment variable.
 * The same wallet will be the admin of the group and must be used for future operations.
 *
 * @param eligibleAddresses - Array of Ethereum addresses eligible to vote
 * @param merkleTreeDuration - Optional duration for Merkle tree root validity (default: 3600s = 1 hour)
 * @returns Object with groupId, transaction hash, and identity commitments
 * @throws Error if any step fails
 */
export async function createGroupWithMembers(
  eligibleAddresses: Address[],
  merkleTreeDuration?: number
): Promise<{ groupId: bigint; addMembersTxHash: Hash; identityCommitments: bigint[] }> {
  try {
    if (eligibleAddresses.length === 0) {
      throw new Error('No eligible addresses provided. At least one address is required.');
    }

    logger.info(`🔐 Creating Semaphore group with ${eligibleAddresses.length} eligible voters...`);
    logger.info(`   Eligible addresses: ${eligibleAddresses.slice(0, 3).join(', ')}${eligibleAddresses.length > 3 ? '...' : ''}`);

    // Step 1: Create group on-chain
    logger.info('📝 Step 1/3: Creating Semaphore group...');
    const groupId = await createSemaphoreGroup(merkleTreeDuration);

    // Step 2: Convert addresses to identity commitments
    logger.info('📝 Step 2/3: Converting addresses to identity commitments...');
    const identityCommitments = addressesToIdentityCommitments(eligibleAddresses);

    // Step 3: Add members to group
    logger.info('📝 Step 3/3: Adding members to group...');
    const addMembersTxHash = await addMembersToGroup(groupId, identityCommitments);

    logger.info(`✅ SUCCESS! Group ${groupId} created with ${eligibleAddresses.length} members`);
    logger.info(`   Group ID: ${groupId}`);
    logger.info(`   Create group tx: https://sepolia.basescan.org/tx/${addMembersTxHash}`);
    logger.info(`   Total members: ${eligibleAddresses.length}`);

    return { groupId, addMembersTxHash, identityCommitments };
  } catch (error: any) {
    logger.error('❌ FAILED to create group with members');
    logger.error('   Error:', error.message || error);

    // Re-throw with more context
    throw new Error(`Failed to create Semaphore group with members: ${error.message || error}`);
  }
}

/**
 * Get group information from the blockchain
 *
 * @param groupId - Semaphore group ID
 * @returns Group information (merkle root, depth, member count)
 */
export async function getGroupInfo(groupId: bigint): Promise<{
  merkleTreeRoot: bigint;
  merkleTreeDepth: bigint;
  numberOfMembers: bigint;
}> {
  try {
    const [merkleTreeRoot, merkleTreeDepth, numberOfMembers] = await Promise.all([
      publicClient.readContract({
        address: SEMAPHORE_ADDRESS,
        abi: SEMAPHORE_ABI,
        functionName: 'getMerkleTreeRoot',
        args: [groupId],
      }),
      publicClient.readContract({
        address: SEMAPHORE_ADDRESS,
        abi: SEMAPHORE_ABI,
        functionName: 'getMerkleTreeDepth',
        args: [groupId],
      }),
      publicClient.readContract({
        address: SEMAPHORE_ADDRESS,
        abi: SEMAPHORE_ABI,
        functionName: 'getMerkleTreeSize',
        args: [groupId],
      }),
    ]);

    return {
      merkleTreeRoot: merkleTreeRoot as bigint,
      merkleTreeDepth: merkleTreeDepth as bigint,
      numberOfMembers: numberOfMembers as bigint,
    };
  } catch (error: any) {
    logger.error(`Error getting group info for group ${groupId}:`, error);
    throw new Error(`Failed to get group info: ${error.message || error}`);
  }
}

export { SEMAPHORE_ADDRESS };

