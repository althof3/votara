"use client";
import { CreatePollForm } from "@/components/CreatePollForm";
import styles from "./create.module.css";

export default function CreatePollPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Poll</h1>
          <p className={styles.subtitle}>Set up a new decentralized poll</p>
        </div>

        <CreatePollForm />
      </div>
    </div>
  );
}

