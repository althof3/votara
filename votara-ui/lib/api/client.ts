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

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Get nonce for SIWE authentication
   */
  getNonce: () => 
    apiClient.get<{ success: boolean; nonce: string; signedNonce: string }>('/auth/nonce'),
  
  /**
   * Verify SIWE signature and get JWT token
   */
  verify: (data: { message: string; signature: string; signedNonce: string }) =>
    apiClient.post<{ success: boolean; address: string; token: string }>('/auth/verify', data),
  
  /**
   * Get current user info (verify token)
   */
  me: () =>
    apiClient.get<{ success: boolean; address: string; chainId: number }>('/auth/me'),
  
  /**
   * Logout (client-side only, JWT is stateless)
   */
  logout: () =>
    apiClient.post<{ success: boolean; message: string }>('/auth/logout'),
};

/**
 * Polls API - No try-catch, error handling at component level
 */
export const pollsApi = {
  /**
   * Get all polls with pagination
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'ENDED';
    creator?: string;
  }): Promise<PaginatedPollsResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Poll[];
      pagination: PaginationMeta;
    }>('/polls', { params });

    return {
      polls: response.data.data,
      pagination: response.data.pagination,
    };
  },

  /**
   * Get single poll by ID
   */
  getById: async (pollId: string): Promise<Poll> => {
    const response = await apiClient.get<{ success: boolean; data: Poll }>(`/polls/${pollId}`);
    return response.data.data;
  },

  /**
   * Create new poll
   */
  create: async (data: CreatePollRequest): Promise<Poll> => {
    const response = await apiClient.post<{ success: boolean; data: Poll }>('/polls', data);
    return response.data.data;
  },

  /**
   * Update poll (only DRAFT polls)
   */
  update: async (pollId: string, data: UpdatePollRequest): Promise<Poll> => {
    const response = await apiClient.put<{ success: boolean; data: Poll }>(`/polls/${pollId}`, data);
    return response.data.data;
  },

  /**
   * Delete poll
   */
  delete: async (pollId: string): Promise<void> => {
    await apiClient.delete(`/polls/${pollId}`);
  },

  /**
   * Create Semaphore group for poll
   */
  createGroup: async (pollId: string, data: CreateGroupRequest): Promise<CreateGroupResponse> => {
    const response = await apiClient.post<{ success: boolean; data: CreateGroupResponse }>(
      `/polls/${pollId}/create-group`,
      data
    );
    return response.data.data;
  },

  /**
   * Register to vote in a poll (add identity commitment to group)
   */
  register: async (pollId: string, identityCommitment: string): Promise<void> => {
    await apiClient.post(`/polls/${pollId}/register`, { identityCommitment });
  },

  /**
   * Get poll results
   */
  getResults: async (pollId: string): Promise<PollResultsResponse> => {
    const response = await apiClient.get<{ success: boolean; data: PollResultsResponse }>(
      `/polls/${pollId}/results`
    );
    return response.data.data;
  },

  /**
   * Get group members for a poll (Semaphore identity commitments)
   */
  getGroupMembers: async (pollId: string): Promise<string[]> => {
    const response = await apiClient.get<{ success: boolean; data: { members: string[] } }>(
      `/polls/${pollId}/group-members`
    );
    return response.data.data.members || [];
  },
};

export default apiClient;

