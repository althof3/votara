'use client';

import { SiweMessage } from 'siwe';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useCallback, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { authApi } from '@/lib/api/client';

const TOKEN_STORAGE_KEY = 'votara_auth_token';

export function useAuth() {
  // MOCK: Always return authenticated and connected state for testing
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const address = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;
  const isConnected = true;
  const chainId = 84532;

  useEffect(() => {
    setAuthenticated(true);
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setAuthenticated(true);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setAuthenticated(false);
  }, []);

  return {
    ready: true,
    authenticated,
    isConnected, // Added this
    chainId,     // Added this
    loading,
    error,
    walletAddress: address,
    login,
    logout,
  };
}

