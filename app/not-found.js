import Link from 'next/link';

export const metadata = { title: '404 | LockIn' };

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'var(--text-6xl)',
          fontWeight: 'var(--font-extrabold)',
          marginBottom: '16px',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </h1>
        <p style={{
          fontSize: 'var(--text-xl)',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
        }}>
          This page could not be found.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'var(--gradient-primary)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-base)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 200ms, box-shadow 200ms',
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
