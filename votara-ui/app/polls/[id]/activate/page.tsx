"use client";
import { useParams } from "next/navigation";
import { ActivatePollForm } from "@/components/ActivatePollForm";
import { Wallet } from "@coinbase/onchainkit/wallet";

export default function ActivatePollPage() {
  const params = useParams();
  const pollId = params.id as string;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
      <header className="flex justify-between items-center py-4 mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Activate Poll</h1>
        <Wallet />
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-white/80">
            Activating a poll will deploy it to the blockchain and make it available for voting.
            This action cannot be undone.
          </p>
        </div>

        <ActivatePollForm pollId={pollId} />
      </main>
    </div>
  );
}

