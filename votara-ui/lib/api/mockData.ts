import { Poll, PollResultsResponse } from './client';

export const MOCK_USER_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

export const MOCK_POLLS: Poll[] = [
  {
    id: '0x1111111111111111111111111111111111111111111111111111111111111111',
    groupId: '1',
    title: 'Favorite Programming Language?',
    description: 'Tell us which language you prefer for web development in 2024.',
    options: [
      { id: 0, label: 'TypeScript' },
      { id: 1, label: 'Rust' },
      { id: 2, label: 'Go' },
      { id: 3, label: 'Python' }
    ],
    startTime: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
    endTime: new Date(Date.now() + 86400000 * 7).toISOString(), // Ends in 7 days
    status: 'ACTIVE',
    createdBy: MOCK_USER_ADDRESS,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    _count: { votes: 156 }
  },
  {
    id: '0x2222222222222222222222222222222222222222222222222222222222222222',
    groupId: '2',
    title: 'Next Hackathon Location',
    description: 'Where should we host the next global hackathon?',
    options: [
      { id: 0, label: 'Bali, Indonesia' },
      { id: 1, label: 'Tokyo, Japan' },
      { id: 2, label: 'Berlin, Germany' },
      { id: 3, label: 'New York, USA' }
    ],
    startTime: new Date(Date.now() + 86400000).toISOString(), // Starts tomorrow
    endTime: new Date(Date.now() + 86400000 * 8).toISOString(),
    status: 'DRAFT',
    createdBy: MOCK_USER_ADDRESS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { votes: 0 }
  },
  {
    id: '0x3333333333333333333333333333333333333333333333333333333333333333',
    groupId: '3',
    title: 'Community Governance Proposal #1',
    description: 'Should we implement a treasury fee for all transactions?',
    options: [
      { id: 0, label: 'Yes, 1% fee' },
      { id: 1, label: 'Yes, 0.5% fee' },
      { id: 2, label: 'No fee' }
    ],
    startTime: new Date(Date.now() - 86400000 * 10).toISOString(),
    endTime: new Date(Date.now() - 86400000).toISOString(), // Ended yesterday
    status: 'ENDED',
    createdBy: '0xabc123...',
    createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    _count: { votes: 1240 }
  }
];

export const MOCK_RESULTS: Record<string, PollResultsResponse> = {
  '0x1111111111111111111111111111111111111111111111111111111111111111': {
    poll: MOCK_POLLS[0],
    totalVotes: 156,
    results: [
      { optionId: 0, optionLabel: 'TypeScript', votes: 85 },
      { optionId: 1, optionLabel: 'Rust', votes: 32 },
      { optionId: 2, optionLabel: 'Go', votes: 24 },
      { optionId: 3, optionLabel: 'Python', votes: 15 }
    ]
  },
  '0x3333333333333333333333333333333333333333333333333333333333333333': {
    poll: MOCK_POLLS[2],
    totalVotes: 1240,
    results: [
      { optionId: 0, optionLabel: 'Yes, 1% fee', votes: 450 },
      { optionId: 1, optionLabel: 'Yes, 0.5% fee', votes: 120 },
      { optionId: 2, optionLabel: 'No fee', votes: 670 }
    ]
  }
};
