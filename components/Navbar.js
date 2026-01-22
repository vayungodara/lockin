'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.logoText}>LockIn</span>
        </Link>
        
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how-it-works" className={styles.navLink}>How it Works</a>
        </div>
        
        <div className={styles.navActions}>
          <ThemeToggle />
          <button onClick={handleGetStarted} className="btn btn-primary">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
