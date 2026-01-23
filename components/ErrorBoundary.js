'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto var(--space-4)',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8V12M12 16H12.01"/>
            </svg>
          </div>
          <h3 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-2)',
            fontSize: 'var(--text-lg)',
          }}>
            Something went wrong
          </h3>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            {this.props.message || 'An error occurred while loading this section.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
