'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Plus, CaretDown } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { staggerContainer, staggerItem } from '@/lib/animations';
import styles from './PactsPage.module.css';
import PactCard from '@/components/PactCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';

/**
 * Editorial sectional layout for /dashboard/pacts.
 *
 * The spine: § 01 Today's pacts → § 02 Upcoming → § 03 Recurring → § 04 Resolved.
 * Sections replace the older All/Active/Completed/Missed filter tabs — the
 * structure IS the filter. Resolved history is collapsed by default to keep
 * the active surface scannable; "Show all" reveals it.
 *
 * Data flow preserved verbatim from the previous client:
 *   - mark_overdue_pacts RPC (once per calendar day)
 *   - Supabase fetch with user_id scope + descending created_at
 *   - pact-created event listener (for layout-level CreatePactModal)
 *   - optimistic update + DB-scoped delete with explicit user_id filter
 *
 * The "New pact" button still dispatches `open-create-pact` so the layout
 * modal opens; PactCard's stamp-slam + confetti are inherited unchanged.
 */
export default function PactsPageClient({ user }) {
  const [pacts, setPacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllResolved, setShowAllResolved] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchPacts = useCallback(async () => {
    try {
      // Only call mark_overdue_pacts once per calendar day
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem('lastOverdueCheck');
      if (lastCheck !== today) {
        const { error: overdueError } = await supabase.rpc('mark_overdue_pacts');
        if (overdueError) {
          console.error('Error marking overdue pacts:', overdueError);
        } else {
          localStorage.setItem('lastOverdueCheck', today);
        }
      }

      const { data, error } = await supabase
        .from('pacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setPacts(data || []);
    } catch (err) {
      console.error('Error fetching pacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    fetchPacts();
  }, [fetchPacts]);

  // Listen for pact-created events from the layout-level CreatePactModal
  useEffect(() => {
    const handlePactCreated = (e) => {
      if (e.detail) {
        setPacts((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener('pact-created', handlePactCreated);
    return () => window.removeEventListener('pact-created', handlePactCreated);
  }, []);

  const handlePactUpdate = (updatedPact) => {
    setPacts((prev) => prev.map((p) => (p.id === updatedPact.id ? updatedPact : p)));
  };

  const handleDeletePact = async (pactId) => {
    try {
      // Defense-in-depth: RLS already scopes this to the caller, but adding
      // the explicit user_id filter ensures a hostile/misconfigured policy
      // can't expand the delete's blast radius beyond the caller's pacts.
      const { error } = await supabase
        .from('pacts')
        .delete()
        .eq('id', pactId)
        .eq('user_id', user.id);

      if (error) throw error;
      setPacts((prev) => prev.filter((p) => p.id !== pactId));
    } catch (err) {
      console.error('Error deleting pact:', err);
    }
  };

  // ── Section partitioning ────────────────────────────────────────────────
  // § 01 Today        — active + deadline within today's calendar day
  // § 02 Upcoming     — active + deadline > today, ≤ 7 days out
  // § 03 Recurring    — active + is_recurring (regardless of deadline window)
  //                     surfaced separately so daily/weekly habits don't
  //                     visually crowd one-shot today/upcoming sections.
  // § 04 Resolved     — completed + missed history, descending by completed_at
  //                     / created_at. Collapsed to first 6 by default.
  const sections = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const today = [];
    const upcoming = [];
    const recurring = [];
    const resolved = [];

    for (const pact of pacts) {
      if (pact.status === 'completed' || pact.status === 'missed') {
        resolved.push(pact);
        continue;
      }

      // Active. Recurring habits get their own section so they don't drown
      // out the one-shot Today/Upcoming reading.
      if (pact.is_recurring) {
        recurring.push(pact);
        continue;
      }

      const deadline = pact.deadline ? new Date(pact.deadline) : null;
      if (!deadline) {
        // No deadline ⇒ treat as upcoming for triage
        upcoming.push(pact);
        continue;
      }

      if (deadline < endOfToday) {
        // Includes overdue (deadline in past) — overdue still belongs in
        // Today's surface so it gets resolved.
        today.push(pact);
      } else if (deadline < endOfWeek) {
        upcoming.push(pact);
      } else {
        upcoming.push(pact);
      }
    }

    // Sort by deadline ascending within each active section so the most
    // urgent pact reads first.
    const byDeadlineAsc = (a, b) => {
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    };
    today.sort(byDeadlineAsc);
    upcoming.sort(byDeadlineAsc);
    recurring.sort(byDeadlineAsc);

    // Resolved: most recent first (completed_at if set, fallback created_at)
    resolved.sort((a, b) => {
      const at = a.completed_at || a.created_at;
      const bt = b.completed_at || b.created_at;
      return new Date(bt) - new Date(at);
    });

    return { today, upcoming, recurring, resolved };
  }, [pacts]);

  // Resolved is collapsed to 6 by default; "Show all" reveals the rest.
  const RESOLVED_PREVIEW = 6;
  const visibleResolved = showAllResolved
    ? sections.resolved
    : sections.resolved.slice(0, RESOLVED_PREVIEW);
  const hiddenResolvedCount = Math.max(0, sections.resolved.length - RESOLVED_PREVIEW);

  // ── Render ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader totalCount={0} />
        <div className={styles.loadingGrid}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  // First-time empty state — no pacts at all. Skip the sectional spine and
  // show the encouraging onboarding card instead.
  if (pacts.length === 0) {
    return (
      <div className={styles.container}>
        <PageHeader totalCount={0} />
        <EmptyState
          icon={<EmptyIcon />}
          title="No pacts yet."
          description="Add your first pact to start building a streak."
          action={{
            label: '+ New pact',
            onClick: () => window.dispatchEvent(new CustomEvent('open-create-pact')),
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader totalCount={pacts.length} />

      <LayoutGroup>
        {/* § 01 — Today's pacts */}
        <Section
          number={1}
          title="Today's pacts"
          caption={`${sections.today.length} due today`}
          empty={sections.today.length === 0}
          emptyMessage="No pacts due today. Make one."
        >
          {sections.today.map((pact) => (
            <PactGridItem
              key={pact.id}
              pact={pact}
              onUpdate={handlePactUpdate}
              onDelete={handleDeletePact}
            />
          ))}
        </Section>

        {/* § 02 — Upcoming */}
        <Section
          number={2}
          title="Upcoming"
          caption={`${sections.upcoming.length} this week`}
          empty={sections.upcoming.length === 0}
          emptyMessage="No upcoming pacts."
        >
          {sections.upcoming.map((pact) => (
            <PactGridItem
              key={pact.id}
              pact={pact}
              onUpdate={handlePactUpdate}
              onDelete={handleDeletePact}
            />
          ))}
        </Section>

        {/* § 03 — Recurring */}
        <Section
          number={3}
          title="Recurring"
          caption={`${sections.recurring.length} active habits`}
          empty={sections.recurring.length === 0}
          emptyMessage="No recurring pacts."
        >
          {sections.recurring.map((pact) => (
            <PactGridItem
              key={pact.id}
              pact={pact}
              onUpdate={handlePactUpdate}
              onDelete={handleDeletePact}
            />
          ))}
        </Section>

        {/* § 04 — Resolved */}
        <Section
          number={4}
          title="Resolved"
          caption={`${sections.resolved.length} kept · missed`}
          empty={sections.resolved.length === 0}
          emptyMessage="No resolved pacts yet."
        >
          {visibleResolved.map((pact) => (
            <PactGridItem
              key={pact.id}
              pact={pact}
              onUpdate={handlePactUpdate}
              onDelete={handleDeletePact}
            />
          ))}
        </Section>

        {hiddenResolvedCount > 0 && !showAllResolved && (
          <button
            type="button"
            className={styles.showMoreBtn}
            onClick={() => setShowAllResolved(true)}
          >
            <CaretDown size={14} weight="bold" />
            <span>Show {hiddenResolvedCount} more</span>
          </button>
        )}
      </LayoutGroup>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/**
 * Page header — Redaction display title, mono index caption, "+ New pact"
 * editorial CTA.
 */
function PageHeader({ totalCount }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.eyebrow}>§ The pacts ledger</div>
        <h1 className={styles.title}>Pacts.</h1>
        <p className={styles.subtitle}>
          {totalCount === 0
            ? 'Every pact you commit to. Kept or missed, it stays.'
            : `${totalCount} total. Every pact you commit to. Kept or missed, it stays.`}
        </p>
      </div>
      <button
        type="button"
        className={styles.newPactBtn}
        onClick={() => window.dispatchEvent(new CustomEvent('open-create-pact'))}
      >
        <Plus size={16} weight="bold" />
        <span>New pact</span>
      </button>
    </header>
  );
}

/**
 * Section wrapper — SectionHeader + grid of PactCards. Empty sections render
 * an editorial empty row instead of the grid.
 */
function Section({ number, title, caption, empty, emptyMessage, children }) {
  return (
    <section className={styles.section}>
      <SectionHeader number={number} title={title} caption={caption} />
      {empty ? (
        <p className={styles.emptyRow}>{emptyMessage}</p>
      ) : (
        <motion.div
          className={styles.pactsGrid}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">{children}</AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}

/**
 * Grid-item wrapper around PactCard — forwards layout/animation props that
 * feed AnimatePresence + LayoutGroup transitions on resolution.
 */
function PactGridItem({ pact, onUpdate, onDelete }) {
  return (
    <motion.div
      key={pact.id}
      layout
      variants={staggerItem}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <PactCard pact={pact} onUpdate={onUpdate} onDelete={onDelete} />
    </motion.div>
  );
}

/**
 * Empty-state illustration — flat rotated stamp glyph in highlighter yellow.
 * Cascade-aware: the "PENDING" rectangle uses var(--stamp-yellow) so it picks
 * up the user's current ink. No gradients, no purple → magenta.
 */
function EmptyIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect
        x="20"
        y="34"
        width="80"
        height="52"
        rx="4"
        fill="var(--stamp-yellow)"
        opacity="0.18"
        transform="rotate(-3 60 60)"
      />
      <rect
        x="20"
        y="34"
        width="80"
        height="52"
        rx="4"
        stroke="var(--stamp-yellow)"
        strokeWidth="2"
        fill="none"
        opacity="0.55"
        transform="rotate(-3 60 60)"
      />
      <text
        x="60"
        y="64"
        textAnchor="middle"
        fontFamily="ui-monospace, 'JetBrains Mono', 'SF Mono', monospace"
        fontSize="14"
        fontWeight="700"
        letterSpacing="2"
        fill="var(--stamp-yellow-ink)"
        opacity="0.7"
        transform="rotate(-3 60 60)"
      >
        PENDING
      </text>
    </svg>
  );
}
