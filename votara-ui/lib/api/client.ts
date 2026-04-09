import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_STORAGE_KEY = 'votara_auth_token';

/**
 * Axios instance for API calls
 * Automatically attaches JWT token to requests
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - attach JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    // Attach token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      // You can dispatch a logout action here if using Redux/Zustand
      console.warn('Unauthorized - token may be expired');
    }
    
    return Promise.reject(error);
  }
);

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Poll types
 */
export interface Poll {
  id: string; // bytes32 hash
  groupId: string;
  title: string;
  description?: string;
  options: Array<{ id: number; label: string }>;
  startTime: string;
  endTime: string;
  status: 'DRAFT' | 'ACTIVE' | 'ENDED';
  contractTxHash?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  groupMembers?: string[]; // Array of identity commitments (as strings)
  _count?: {
    votes: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedPollsResponse {
  polls: Poll[];
  pagination: PaginationMeta;
}

export interface PollVote {
  id: string;
  pollId: string;
  optionIndex: number;
  nullifierHash: string;
  voterAddress?: string;
  createdAt: string;
}

export interface PollResult {
  optionId: number;
  optionLabel: string;
  votes: number;
}

export interface PollResultsResponse {
  poll: Poll;
  results: PollResult[];
  totalVotes: number;
}

export interface CreatePollRequest {
  pollId: string; // bytes32 hex string (generated on frontend)
  title: string;
  description?: string;
  options: Array<{ id: number; label: string }>;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
}

export interface UpdatePollRequest {
  title?: string;
  description?: string;
  active?: boolean;
}

export interface CreateGroupRequest {
  eligibleAddresses: string[];
}

export interface CreateGroupResponse {
  pollId: string;
  groupId: string;
  semaphoreGroupTxHash: string;
  eligibleVotersCount: number;
}

import { MOCK_POLLS, MOCK_RESULTS, MOCK_USER_ADDRESS } from './mockData';

/**
 * Auth API endpoints - MOCKED
 */
export const authApi = {
  getNonce: async () => ({
    data: { success: true, nonce: 'mock-nonce-' + Math.random(), signedNonce: 'mock-signed-nonce' }
  }),
  
  verify: async (data: { message: string; signature: string; signedNonce: string }) => ({
    data: { success: true, address: MOCK_USER_ADDRESS, token: 'mock-jwt-token' }
  }),
  
  me: async () => ({
    data: { success: true, address: MOCK_USER_ADDRESS, chainId: 84532 }
  }),
  
  logout: async () => ({
    data: { success: true, message: 'Logged out successfully' }
  }),
};

/**
 * Polls API - MOCKED
 */
export const pollsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'ENDED';
    creator?: string;
  }): Promise<PaginatedPollsResponse> => {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredPolls = [...MOCK_POLLS];
    
    if (params?.status) {
      filteredPolls = filteredPolls.filter(p => p.status === params.status);
    }
    
    if (params?.creator) {
      filteredPolls = filteredPolls.filter(p => p.createdBy === params.creator);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    
    return {
      polls: filteredPolls.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        totalCount: filteredPolls.length,
        totalPages: Math.ceil(filteredPolls.length / limit),
        hasMore: page * limit < filteredPolls.length,
      },
    };
  },

  getById: async (pollId: string): Promise<Poll> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const poll = MOCK_POLLS.find(p => p.id === pollId);
    if (!poll) throw new Error('Poll not found');
    return poll;
  },

  create: async (data: CreatePollRequest): Promise<Poll> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPoll: Poll = {
      ...data,
      id: data.pollId || `0x${Math.random().toString(16).slice(2)}`,
      groupId: 'mock-group-id',
      status: 'DRAFT',
      createdBy: MOCK_USER_ADDRESS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { votes: 0 }
    };
    MOCK_POLLS.unshift(newPoll);
    return newPoll;
  },

  update: async (pollId: string, data: UpdatePollRequest): Promise<Poll> => {
    const pollIndex = MOCK_POLLS.findIndex(p => p.id === pollId);
    if (pollIndex === -1) throw new Error('Poll not found');
    
    MOCK_POLLS[pollIndex] = {
      ...MOCK_POLLS[pollIndex],
      ...data,
      updatedAt: new Date().toISOString(),
      status: data.active ? 'ACTIVE' : MOCK_POLLS[pollIndex].status
    };
    
    return MOCK_POLLS[pollIndex];
  },

  delete: async (pollId: string): Promise<void> => {
    const pollIndex = MOCK_POLLS.findIndex(p => p.id === pollId);
    if (pollIndex !== -1) {
      MOCK_POLLS.splice(pollIndex, 1);
    }
  },

  createGroup: async (pollId: string, data: CreateGroupRequest): Promise<CreateGroupResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      pollId,
      groupId: Math.floor(Math.random() * 1000).toString(),
      semaphoreGroupTxHash: '0xmocktxhash' + Math.random().toString(16).slice(2),
      eligibleVotersCount: data.eligibleAddresses.length
    };
  },

  register: async (pollId: string, identityCommitment: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getResults: async (pollId: string): Promise<PollResultsResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const results = MOCK_RESULTS[pollId];
    if (results) return results;
    
    // Default mock results for newly created polls
    const poll = MOCK_POLLS.find(p => p.id === pollId);
    if (!poll) throw new Error('Poll not found');
    
    return {
      poll,
      totalVotes: 0,
      results: poll.options.map(opt => ({
        optionId: opt.id,
        optionLabel: opt.label,
        votes: 0
      }))
    };
  },

  getGroupMembers: async (pollId: string): Promise<string[]> => {
    return [];
  },
};

export default apiClient;

