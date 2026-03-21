'use client';

import styles from './Skeleton.module.css';

export function SkeletonCard({ height = '120px', className = '' }) {
  return <div className={`${styles.skeleton} ${className}`} style={{ height }} />;
}

export function SkeletonText({ width = '100%', height = '16px', className = '' }) {
  return <div className={`${styles.skeletonText} ${className}`} style={{ width, height }} />;
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`${styles.skeletonRow} ${className}`}>
      <SkeletonText width="40px" height="40px" className={styles.skeletonCircle} />
      <div className={styles.skeletonRowContent}>
        <SkeletonText width="60%" />
        <SkeletonText width="40%" height="12px" />
      </div>
    </div>
  );
}
