import Link from 'next/link';
import styles from './not-found.module.css';

export const metadata = { title: '404 | LockIn' };

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.heading}>404</h1>
        <p className={styles.message}>This page could not be found.</p>
        <Link href="/" className={styles.link}>
          Go home
        </Link>
      </div>
    </div>
  );
}
