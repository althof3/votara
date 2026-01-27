"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VoteForm } from "@/components/VoteForm";
import { usePolls } from "@/lib/hooks/usePolls";
import { Wallet } from "@coinbase/onchainkit/wallet";
import type { Poll } from "@/lib/api/polls";

export default function PollPage() {
  const params = useParams();
  const pollId = params.id as string;
  const { getPollById, loading } = usePolls();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await getPollById(pollId);
        if (data) {
          setPoll(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch poll");
      }
    };

    if (pollId) {
      fetchPoll();
    }
  }, [pollId, getPollById]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/60">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-white/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-2xl mx-auto mt-20 p-8 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-2xl font-bold text-white">Poll not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
      <header className="flex justify-between items-center py-4 mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Vote on Poll</h1>
        <Wallet />
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-2">{poll.title}</h2>
          {poll.description && <p className="text-white/70">{poll.description}</p>}
        </div>

        <VoteForm poll={poll} />
      </main>
    </div>
  );
}

