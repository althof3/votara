'use client';

import { base, baseSepolia } from 'viem/chains';
import { http } from 'viem';
import { createConfig } from 'wagmi';


// Wagmi config for Privy
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
