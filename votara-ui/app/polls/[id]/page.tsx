"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VoteForm } from "@/components/VoteForm";
import { usePolls } from "@/lib/hooks/usePolls";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Poll } from "@/lib/api/client";
import styles from "./poll.module.css";

export default function PollPage() {
  const params = useParams();
  const pollId = params.id as string;
  const { getPollById, loading } = usePolls();
  const { walletAddress } = useAuth();
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

  const isCreator = walletAddress && poll.createdBy.toLowerCase() === walletAddress.toLowerCase();
  const canEdit = isCreator && poll.status === "DRAFT";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header with actions */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{poll.title}</h1>
            <div className={styles.meta}>
              <span className={`${styles.badge} ${styles[`badge${poll.status}`]}`}>
                {poll.status}
              </span>
              {poll._count && (
                <span className={styles.voteCount}>
                  {poll._count.votes} {poll._count.votes === 1 ? 'vote' : 'votes'}
                </span>
              )}
            </div>
          </div>

          {isCreator && (
            <div className={styles.actions}>
              {canEdit && (
                <Link href={`/polls/${pollId}/edit`} className={styles.editButton}>
                  ✏️ Edit
                </Link>
              )}
              {poll.status === "DRAFT" && (
                <Link href={`/polls/${pollId}/activate`} className={styles.activateButton}>
                  🚀 Activate
                </Link>
              )}
              {poll.status === "ACTIVE" && (
                <Link href={`/polls/${pollId}/results`} className={styles.resultsButton}>
                  📊 Results
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Poll info */}
        {poll.description && (
          <div className={styles.description}>
            <p>{poll.description}</p>
          </div>
        )}

        {/* Vote form or status message */}
        {poll.status === "ACTIVE" ? (
          <VoteForm poll={poll} />
        ) : poll.status === "DRAFT" ? (
          <div className={styles.draftMessage}>
            <h3>📝 Poll is in Draft</h3>
            <p>This poll has not been activated yet.</p>
            {isCreator ? (
              <div className={styles.draftActions}>
                <p>As the creator, you can:</p>
                <ul>
                  <li>Edit the poll details</li>
                  <li>Activate the poll to make it available for voting</li>
                </ul>
                <div className={styles.draftButtons}>
                  <Link href={`/polls/${pollId}/edit`} className={styles.button}>
                    Edit Poll
                  </Link>
                  <Link href={`/polls/${pollId}/activate`} className={styles.buttonPrimary}>
                    Activate Poll
                  </Link>
                </div>
              </div>
            ) : (
              <p>Please wait for the poll creator to activate it.</p>
            )}
          </div>
        ) : (
          <div className={styles.endedMessage}>
            <h3>🏁 Poll Ended</h3>
            <p>This poll has ended. View the results below.</p>
            <Link href={`/polls/${pollId}/results`} className={styles.button}>
              View Results
            </Link>
          </div>
        )}

        {/* Poll details */}
        <div className={styles.details}>
          <h3>Poll Details</h3>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Start Time:</span>
              <span className={styles.detailValue}>
                {new Date(poll.startTime).toLocaleString()}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>End Time:</span>
              <span className={styles.detailValue}>
                {new Date(poll.endTime).toLocaleString()}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Creator:</span>
              <span className={styles.detailValue}>
                {poll.createdBy.slice(0, 6)}...{poll.createdBy.slice(-4)}
              </span>
            </div>
            {poll.groupId && poll.groupId !== "0" && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Group ID:</span>
                <span className={styles.detailValue}>{poll.groupId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

