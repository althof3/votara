"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import styles from "./my-polls.module.css";

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  options: { id: string; text: string; votes: number }[];
}

export default function MyPollsPage() {
  const { walletAddress, authenticated } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated || !walletAddress) {
      setLoading(false);
      return;
    }

    const fetchMyPolls = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        const response = await fetch(`${API_BASE_URL}/polls?creator=${walletAddress}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include session cookie
        });

        if (!response.ok) {
          throw new Error("Failed to fetch polls");
        }

        const data = await response.json();
        setPolls(data.polls || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPolls();
  }, [walletAddress, authenticated]);

  if (!authenticated || !walletAddress) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Connect Your Wallet</h2>
            <p className={styles.emptyText}>
              Please connect your wallet to view your polls
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your polls...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.error}>
            <h3 className={styles.errorTitle}>Error</h3>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Polls</h1>
          <p className={styles.subtitle}>Manage your created polls</p>
        </div>

        {polls.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No Polls Yet</h2>
            <p className={styles.emptyText}>
              You haven't created any polls yet. Create your first poll to get started!
            </p>
            <Link href="/create" className={styles.createButton}>
              Create Poll
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {polls.map((poll) => (
              <Link
                key={poll.id}
                href={`/polls/${poll.id}`}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{poll.title}</h3>
                  <span
                    className={`${styles.badge} ${
                      poll.status === "ACTIVE"
                        ? styles.badgeActive
                        : poll.status === "PENDING"
                        ? styles.badgePending
                        : styles.badgeCompleted
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                <p className={styles.cardDescription}>{poll.description}</p>
                <div className={styles.cardFooter}>
                  <span>{poll.options.length} options</span>
                  <span>
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

