'use client';

import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { injected } from 'wagmi/connectors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_STORAGE_KEY = 'votara_auth_token';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      setAccessToken(token);
      // Verify token is still valid
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            setAuthenticated(true);
          } else {
            // Token invalid, clear it
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            setAccessToken(null);
            setAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAccessToken(null);
          setAuthenticated(false);
        });
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Connect wallet if not connected
      if (!isConnected) {
        connect({ connector: injected() });
        return;
      }

      if (!address) {
        throw new Error('No wallet address');
      }

      // 1. Get nonce from backend
      // const nonceRes = await fetch(`${API_BASE_URL}/auth/nonce`, {
      //   credentials: 'include',
      // });

      // if (!nonceRes.ok) {
      //   throw new Error('Failed to get nonce');
      // }

      // const { nonce } = await nonceRes.json();

      // // 2. Create SIWE message
      // const message = new SiweMessage({
      //   domain: window.location.host,
      //   address,
      //   statement: 'Sign in with Ethereum to Votara',
      //   uri: window.location.origin,
      //   version: '1',
      //   chainId: 8453, // Base mainnet
      //   nonce,
      // });

      // const preparedMessage = message.prepareMessage();

      // // 3. Sign message
      // const signature = await signMessageAsync({
      //   message: preparedMessage,
      // });

      // // 4. Verify with backend and get JWT token
      // const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: message.toMessage(),
      //     signature
      //   }),
      //   credentials: 'include',
      // });

      // if (!verifyRes.ok) {
      //   throw new Error('Failed to verify signature');
      // }

      // const { token } = await verifyRes.json();

      // Store JWT token in localStorage
      // localStorage.setItem(TOKEN_STORAGE_KEY, token);
      // setAccessToken(token);
      setAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      console.error('SIWE login error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, connect]);

  const logout = useCallback(async () => {
    try {
      // await fetch(`${API_BASE_URL}/auth/logout`, {
      //   method: 'POST',
      // });

      // Clear token from localStorage
      // localStorage.removeItem(TOKEN_STORAGE_KEY);
      // setAccessToken(null);
      disconnect();
      setAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [disconnect]);

  // Auto-login when wallet connects
  useEffect(() => {
    console.log([isConnected, address, authenticated, loading, login]);
    
    if (isConnected && address && !authenticated && !loading) {
      login();
    }
  }, [isConnected, address, authenticated, loading, login]);

  useEffect(() => {
    if (!isConnected) {
      setAuthenticated(false);
    }
  }, [isConnected]);

  return {
    ready: true,
    authenticated,
    loading,
    error,
    walletAddress: address || null,
    accessToken, // Return JWT token
    login,
    logout,
  };
}

