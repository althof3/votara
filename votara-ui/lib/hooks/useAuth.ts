'use client';

import { SiweMessage } from 'siwe';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { authApi } from '@/lib/api/client';

const TOKEN_STORAGE_KEY = 'votara_auth_token';

export function useAuth() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if token exists and verify on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      // Verify token is still valid
      authApi.me()
        .then(() => {
          setAuthenticated(true);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAuthenticated(false);
        });
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // OnchainKit handles wallet connection, so we just need wallet to be connected
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      // 1. Get nonce from backend (with signed nonce for stateless auth)
      const nonceRes = await authApi.getNonce();
      const { nonce, signedNonce } = nonceRes.data;

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to Votara',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 8453, // Use wallet's chainId or default to Base mainnet
        nonce,
      });

      const preparedMessage = message.prepareMessage();

      // 3. Sign message with wallet
      const signature = await signMessageAsync({
        message: preparedMessage,
      });

      // 4. Verify with backend and get JWT token (send signedNonce for stateless verification)
      const verifyRes = await authApi.verify({
        message: message.toMessage(),
        signature: signature,
        signedNonce, // Required for stateless nonce verification
      });

      const { token } = verifyRes.data;

      // Store JWT token in localStorage (axios interceptor will auto-attach it)
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setAuthenticated(true);
    } catch (err) {
      // Handle axios errors
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || err.message || 'Authentication failed';
        setError(errorMessage);
        console.error('SIWE login error:', err.response?.data || err.message);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        console.error('SIWE login error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, chainId, signMessageAsync]);

  const logout = useCallback(async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthenticated(false);

      // Disconnect wallet
      disconnect();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [disconnect]);

  return {
    ready: true,
    authenticated,
    loading,
    error,
    walletAddress: address || null,
    login,
    logout,
  };
}

