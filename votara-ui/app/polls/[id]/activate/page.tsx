"use client";
import { useParams } from "next/navigation";
import { ActivatePollForm } from "@/components/ActivatePollForm";
import styles from "./activate.module.css";

export default function ActivatePollPage() {
  const params = useParams();
  const pollId = params.id as string;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ActivatePollForm pollId={pollId} />
      </div>
    </div>
  );
}

