import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.block} ${styles.wide}`} />
      <div className={styles.row}>
        <div className={`${styles.block} ${styles.half}`} />
        <div className={`${styles.block} ${styles.half}`} />
      </div>
      <div className={`${styles.block} ${styles.narrow}`} />
      <div className={`${styles.block} ${styles.wide}`} />
    </div>
  );
}
