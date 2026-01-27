"use client";
import { useParams } from "next/navigation";
import { PollResults } from "@/components/PollResults";
import { Wallet } from "@coinbase/onchainkit/wallet";

export default function PollResultsPage() {
  const params = useParams();
  const pollId = params.id as string;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
      <header className="flex justify-between items-center py-4 mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Poll Results</h1>
        <Wallet />
      </header>

      <main className="max-w-6xl mx-auto">
        <PollResults pollId={pollId} autoRefresh={true} refreshInterval={5000} />
      </main>
    </div>
  );
}

