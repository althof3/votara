"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { PollsList } from "@/components/PollsList";

export default function Home() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
      <header className="flex justify-between items-center py-4 mb-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
            Votara
          </h1>
          <p className="text-white/60">Decentralized Voting Platform</p>
        </div>
        <Wallet />
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-8">
          <Link
            href="/create"
            className="inline-block px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40"
          >
            Create New Poll
          </Link>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Active Polls</h2>
          <PollsList status="ACTIVE" limit={10} />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">All Polls</h2>
          <PollsList limit={20} />
        </div>
      </div>
    </div>
  );
}
