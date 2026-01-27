'use client';

import { useAuth } from '../lib/hooks/useAuth';

export function AuthButton() {
  const { ready, authenticated, login, logout, walletAddress, farcasterFid } = useAuth();

  if (!ready) {
    return <button disabled>Loading...</button>;
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        style={{
          padding: '10px 20px',
          backgroundColor: '#676FFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ fontSize: '14px' }}>
        <div>
          <strong>Wallet:</strong> {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
        </div>
        {farcasterFid && (
          <div>
            <strong>Farcaster FID:</strong> {farcasterFid}
          </div>
        )}
      </div>
      <button
        onClick={logout}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Disconnect
      </button>
    </div>
  );
}

