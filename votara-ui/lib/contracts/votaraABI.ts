/**
 * Votara Voting Smart Contract ABI
 */

export const VOTARA_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_semaphoreAddress', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'activatePoll',
    inputs: [
      { name: '_pollId', type: 'bytes32', internalType: 'bytes32' },
      { name: '_groupId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'castVote',
    inputs: [
      { name: '_pollId', type: 'bytes32', internalType: 'bytes32' },
      { name: '_optionIndex', type: 'uint8', internalType: 'uint8' },
      {
        name: '_proof',
        type: 'tuple',
        internalType: 'struct ISemaphore.SemaphoreProof',
        components: [
          { name: 'merkleTreeDepth', type: 'uint256', internalType: 'uint256' },
          { name: 'merkleTreeRoot', type: 'uint256', internalType: 'uint256' },
          { name: 'nullifier', type: 'uint256', internalType: 'uint256' },
          { name: 'message', type: 'uint256', internalType: 'uint256' },
          { name: 'scope', type: 'uint256', internalType: 'uint256' },
          { name: 'points', type: 'uint256[8]', internalType: 'uint256[8]' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPollVotes',
    inputs: [
      { name: '_pollId', type: 'bytes32', internalType: 'bytes32' },
      { name: '_optionIndex', type: 'uint8', internalType: 'uint8' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'polls',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'pollId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'groupId', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'semaphore',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract ISemaphore' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PollActivated',
    inputs: [
      { name: 'pollId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'groupId', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'pollId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'optionIndex', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'nullifierHash', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
  },
] as const;

export type SemaphoreProof = {
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
};

