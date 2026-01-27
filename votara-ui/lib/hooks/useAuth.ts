'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';

export function useAuth() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken,
  } = usePrivy();

  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get access token when authenticated
  useEffect(() => {
    if (authenticated) {
      getAccessToken().then((token) => {
        setAccessToken(token);
      });
    } else {
      setAccessToken(null);
    }
  }, [authenticated, getAccessToken]);

  // Get wallet address
  const getWalletAddress = useCallback(() => {
    if (!user) return null;
    
    // Get first linked wallet
    const wallet = user.wallet || user.linkedAccounts?.find(
      (account) => account.type === 'wallet'
    );
    
    return wallet?.address || null;
  }, [user]);

  // Get Farcaster FID
  const getFarcasterFid = useCallback(() => {
    if (!user) return null;
    
    const farcaster = user.farcaster || user.linkedAccounts?.find(
      (account) => account.type === 'farcaster'
    );
    
    return farcaster?.fid || null;
  }, [user]);

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    accessToken,
    getAccessToken,
    walletAddress: getWalletAddress(),
    farcasterFid: getFarcasterFid(),
  };
}

