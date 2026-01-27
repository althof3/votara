"use client";
import { useParams } from "next/navigation";
import { PollResults } from "@/components/PollResults";
import styles from "./results.module.css";

export default function PollResultsPage() {
  const params = useParams();
  const pollId = params.id as string;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <PollResults pollId={pollId} autoRefresh={true} refreshInterval={5000} />
      </div>
    </div>
  );
}

