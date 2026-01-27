/**
 * API client for Votara backend polls endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper to get auth headers
function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

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
 * Create a new poll
 */
export async function createPoll(data: CreatePollRequest, token?: string | null): Promise<Poll> {
  const response = await fetch(`${API_BASE_URL}/polls`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create poll');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update a poll (only DRAFT polls)
 */
export async function updatePoll(
  pollId: string,
  data: UpdatePollRequest,
  token?: string | null
): Promise<Poll> {
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update poll');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create Semaphore group for poll
 */
export async function createPollGroup(
  pollId: string,
  data: CreateGroupRequest,
  token?: string | null
): Promise<CreateGroupResponse> {
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}/create-group`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create group');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get poll results
 */
export async function getPollResults(pollId: string): Promise<PollResultsResponse> {
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}/results`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get poll results');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all polls with pagination
 */
export async function getAllPolls(params?: {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'ENDED';
}): Promise<PaginatedPollsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const url = `${API_BASE_URL}/polls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get polls');
  }

  const result = await response.json();
  return {
    polls: result.data,
    pagination: result.pagination,
  };
}

/**
 * Get single poll by ID
 */
export async function getPollById(pollId: string): Promise<Poll> {
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get poll');
  }

  const result = await response.json();
  return result.data;
}

