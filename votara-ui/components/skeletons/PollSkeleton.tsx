'use client';

import styles from './PollSkeleton.module.css';

export function PollSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.badgeSkeleton}></div>
        <div className={styles.votesSkeleton}></div>
      </div>
      <div className={styles.titleSkeleton}></div>
      <div className={styles.descriptionSkeleton}></div>
      <div className={styles.footerSkeleton}></div>
    </div>
  );
}

export function PollsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <PollSkeleton key={i} />
      ))}
    </div>
  );
}
