"use client";
import { CreatePollForm } from "@/components/CreatePollForm";
import { Wallet } from "@coinbase/onchainkit/wallet";

export default function CreatePollPage() {
  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
      <header className="flex justify-between items-center py-4 mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Create New Poll</h1>
        <Wallet />
      </header>

      <main className="max-w-4xl mx-auto">
        <CreatePollForm />
      </main>
    </div>
  );
}

