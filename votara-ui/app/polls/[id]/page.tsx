"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VoteForm } from "@/components/VoteForm";
import { usePolls } from "@/lib/hooks/usePolls";
import type { Poll } from "@/lib/api/client";
import styles from "./poll.module.css";

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
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.loading}>Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.error}>Poll not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <VoteForm poll={poll} />
      </div>
    </div>
  );
}

