'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NavbarLanding from '@/components/NavbarLanding';
import Stamp from '@/components/Stamp';
import UserAvatar from '@/components/UserAvatar';
import Ticker from '@/components/Ticker';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import styles from '../app/page.module.css';
import {
  buttonHover,
  buttonTap,
  easeOutQuint,
  prefersReducedMotion,
  stampSlamClean,
} from '@/lib/animations';

// ------------------------------------------------------------------
// Demo data — mock witnesses + feed items used across the landing.
// No backend, no persistence. Names match the Ticker seed for
// internal consistency across the mosaic.
// ------------------------------------------------------------------

const WITNESSES = [
  { id: 'u-maya',  name: 'Maya Patel' },
  { id: 'u-theo',  name: 'Theo Ng' },
  { id: 'u-rin',   name: 'Rin Okafor' },
  { id: 'u-sam',   name: 'Sam Hughes' },
  { id: 'u-lia',   name: 'Lia Weaver' },
  { id: 'u-devin', name: 'Devin Choi' },
];

const SAMPLE_PACTS = [
  { index: '0047', title: 'Finish p-set 4 (complex analysis)', kind: 'pending' },
  { index: '0046', title: 'Draft intro + 2 body paragraphs — history essay', kind: 'kept' },
  { index: '0044', title: 'Record Spanish oral memos', kind: 'missed' },
];

const KANBAN_COLUMNS = [
  {
    title: 'To Do',
    dotColor: 'var(--ink-500)',
    items: [
      { task: 'Demo video cut', owner: { id: 'u-theo', name: 'Theo Ng' } },
      { task: 'Slide deck',     owner: { id: 'u-devin', name: 'Devin Choi' } },
    ],
  },
  {
    title: 'Doing',
    dotColor: 'var(--stamp-yellow)',
    items: [
      { task: 'Intro + motivation', owner: { id: 'u-me',  name: 'You' } },
      { task: 'Benchmark charts',   owner: { id: 'u-maya', name: 'Maya Patel' } },
    ],
  },
  {
    title: 'Done',
    dotColor: 'var(--stamp-green)',
    items: [
      { task: 'Abstract',          owner: { id: 'u-me',  name: 'You' } },
      { task: 'Dataset → S3',      owner: { id: 'u-maya', name: 'Maya Patel' } },
    ],
  },
];

const FEED_ITEMS = [
  { user: { id: 'u-maya',  name: 'Maya' },  body: 'kept pact #88 — p-set 4',           time: '2m' },
  { user: { id: 'u-theo',  name: 'Theo' },  body: 'locked in for 50m on slide deck',   time: '8m' },
  { user: { id: 'u-amr',   name: 'Amr' },   body: 'missed pact #12 — gym',             time: '14m' },
  { user: { id: 'u-rin',   name: 'Rin' },   body: 'moved Benchmark charts → Doing',    time: '21m' },
];

const OBJECTIONS = [
  {
    q: "isn't this just another habit tracker?",
    a: "habit trackers lie to you. they let you skip a day and backfill it when nobody's looking. this one doesn't. your friends are the chain.",
  },
  {
    q: 'what if I have a real reason I missed?',
    a: "add a note. they'll see that too. life happens — but now you explain out loud instead of ghosting yourself.",
  },
  {
    q: "is this public? I don't want strangers seeing me fail.",
    a: 'no leaderboards. no discoverability. only witnesses you explicitly add see anything. 2–8 close friends, max.',
  },
  {
    q: 'I already use notion / trello / a calendar / a notebook.',
    a: "cool. those are for what you want to do. this is for what you said you'd do.",
  },
];

const NUMBERS = [
  ['214,881',  'PACTS MADE'],
  ['82.4%',    'KEPT RATE'],
  ['17,299',   'MISSED (YOU SEE THESE TOO)'],
  ['44 MIN',   'MEDIAN FOCUS SESSION'],
];

// 91 cells for the mini heatmap. Seed determines cell intensity (0-4).
const HEATMAP_SEED = [
  2,1,0,3,2,1,2, 3,2,1,0,2,3,1, 2,3,2,1,0,1,2,
  3,3,2,1,2,3,2, 1,0,2,3,2,1,2, 3,2,1,0,1,2,3,
  2,1,2,3,3,2,1, 0,2,3,2,1,2,3, 2,1,0,2,3,2,1,
  2,3,2,1,0,2,3, 2,1,2,3,3,2,1, 2,3,2,1,0,2,3,
  2,3,1,2,3,2,1,
];

/**
 * Landing demo Pomodoro — counts down from 27:00 to 0, then loops at 50:00.
 * Client-only effect so it's safe to run during hydration.
 */
function useDemoCountdown() {
  const [seconds, setSeconds] = useState(27 * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 50 * 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return { mm, ss };
}

export default function LandingPageClient({ isAuthenticated = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const toast = useToast();
  const reducedMotion = prefersReducedMotion();
  const { mm, ss } = useDemoCountdown();

  const handleCta = async () => {
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    const supabase = createClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      callbackUrl.searchParams.set('next', returnTo);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error) {
      toast.error('Sign in failed. Please try again.');
    }
  };

  return (
    // data-theme="light" on the root scopes the landing to light mode even when
    // the global <html> carries data-theme="dark". Dashboard still respects
    // the global theme attribute — this only affects the landing tree.
    <div data-theme="light" className={styles.landingRoot}>
      <NavbarLanding isAuthenticated={isAuthenticated} />

      <main id="main-content" className={styles.main}>
        {/* ═════════════════════════════════════════════════════════
            HERO — "Stop / lying to / yourself."
            Opaque highlighter under "yourself." sits BEHIND the text
            via isolation + z-index: -1.
            ═════════════════════════════════════════════════════════ */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <motion.h1
                className={styles.heroTitle}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOutQuint }}
              >
                Stop<br />
                lying to<br />
                <span className={styles.highlightWord}>yourself.</span>
              </motion.h1>

              <motion.p
                className={styles.heroDescription}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: easeOutQuint }}
              >
                LockIn is an accountability system for students. Make a pact. Your friends sign it.{' '}
                <em className={styles.emphasis}>If you miss, they see.</em>{' '}
                No silent failures. No &ldquo;I&apos;ll start tomorrow.&rdquo;
              </motion.p>

              <motion.div
                className={styles.heroCtas}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: easeOutQuint }}
              >
                <motion.button
                  onClick={handleCta}
                  className={styles.ctaPrimary}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Lock in with Google
                  <span aria-hidden="true">→</span>
                </motion.button>
                <Link href="#how-it-works" className={styles.ctaOutline}>
                  See how it works
                </Link>
              </motion.div>

              <motion.div
                className={styles.socialProof}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: easeOutQuint }}
              >
                <span className={styles.socialDot} aria-hidden="true" />
                <p>4,318 students locked in this week</p>
              </motion.div>
            </div>

            {/* Right: a stamped MISSED pact card — shows the resolution mechanic */}
            <div className={styles.heroVisual}>
              <motion.article
                className={styles.heroPact}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: easeOutQuint }}
              >
                <div className={styles.heroPactHeader}>
                  <span className={styles.caption}>PACT · #0044 · 2026-04-13</span>
                  <span className={`${styles.caption} ${styles.captionRed}`}>MISSED</span>
                </div>
                <div className={styles.ruleDotted} />

                <h2 className={styles.heroPactTitle}>
                  &ldquo;Finish recording Spanish oral memos. By 10pm.&rdquo;
                </h2>

                <div className={styles.heroPactMeta}>
                  <span>Deadline</span>
                  <span className={styles.monoInk}>Mon · 10:00 PM</span>
                  <span className={styles.metaDot}>·</span>
                  <span>Stake</span>
                  <span className={styles.stake}>worst clip → group chat</span>
                </div>

                <div className={styles.ruleDotted} />

                <div className={styles.heroPactWitnesses}>
                  <span className={styles.caption}>WITNESSES</span>
                  <div className={styles.avatarStack}>
                    {WITNESSES.slice(0, 3).map((u) => (
                      <UserAvatar key={u.id} user={u} size="sm" />
                    ))}
                  </div>
                </div>

                {/* The stamp slams onto the pact. Only the stamp animates —
                    the card itself stays put. */}
                <motion.span
                  className={styles.heroStamp}
                  variants={reducedMotion ? undefined : stampSlamClean}
                  initial={reducedMotion ? undefined : 'initial'}
                  animate={reducedMotion ? undefined : 'animate'}
                >
                  <Stamp kind="missed" size="xl" rotate={null} />
                </motion.span>
              </motion.article>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            TICKER — replaces the retired orange marquee
            ═════════════════════════════════════════════════════════ */}
        <Ticker />

        {/* ═════════════════════════════════════════════════════════
            § 01 — HOW IT WORKS — three moves, divider-y list
            ═════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className={styles.howItWorks}>
          <div className={styles.howGrid}>
            <div className={styles.howLeft}>
              <div className={styles.sectionLabel}>&sect; 01 &mdash; HOW IT WORKS</div>
              <h2 className={styles.displayH2}>
                Three moves.<br />No loopholes.
              </h2>
              <p className={styles.howLede}>
                The whole app is built around one idea: if other people can see whether you
                followed through, you probably will.
              </p>
            </div>

            <ol className={styles.steps}>
              {[
                {
                  num: '01',
                  title: 'Make a pact.',
                  body: 'Write the commitment. Pick a deadline. Pick witnesses. Name a stake if you want to sweat.',
                  sub: 'e.g. "p-set 4 by 11pm Thursday. Witnesses: Maya, Theo, Rin."',
                },
                {
                  num: '02',
                  title: 'Your friends sign.',
                  body: "They see the pact on their feed. When you start a focus session, they see you're locked in. When a deadline passes and you haven't marked it done — they see that too.",
                  sub: 'no manual "oh it doesn\'t count" revisions.',
                },
                {
                  num: '03',
                  title: 'It lands in the system.',
                  body: "Every pact gets stamped: kept or missed. Stats don't lie — but your friends chirping in the group chat work faster.",
                  sub: "tuesday's version of you cannot negotiate with friday's.",
                },
              ].map((step) => (
                <li key={step.num} className={styles.stepItem}>
                  <div className={styles.stepNumeral}>{step.num}</div>
                  <div className={styles.stepBody}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.body}</p>
                    <p className={styles.stepSub}>{step.sub}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            § 02 — THE SYSTEM — feature mosaic on cream slab
            ═════════════════════════════════════════════════════════ */}
        <section id="features" className={styles.systemSlab}>
          <div className={styles.systemInner}>
            <div className={styles.systemHeader}>
              <div>
                <div className={styles.sectionLabel}>&sect; 02 &mdash; THE SYSTEM</div>
                <h2 className={styles.displayH2}>
                  Everything<br />on paper.
                </h2>
              </div>
              <p className={styles.systemLede}>
                Pacts. Kanban boards. Focus sessions. Heatmaps. Feeds. All wired together,
                all visible to people who know you.
              </p>
            </div>

            <div className={styles.mosaic}>
              {/* Pacts card — col-span 5 */}
              <div className={`${styles.paperCard} ${styles.cardPacts}`}>
                <div className={`${styles.sectionLabel} ${styles.labelRed}`}>&sect; PERSONAL PACTS</div>
                <h3 className={styles.cardTitle}>
                  You either<br />kept it, or you didn&apos;t.
                </h3>
                <p className={styles.cardLede}>
                  Commitments with a deadline and an audience. No silent failures —
                  the system stamps the result the moment the clock runs out.
                </p>

                <div className={styles.pactList}>
                  {SAMPLE_PACTS.map((p) => (
                    <div key={p.index} className={styles.pactRow}>
                      <div className={styles.pactRowLeft}>
                        <span className={styles.pactIndex}>#{p.index}</span>
                        <span className={styles.pactTitle}>{p.title}</span>
                      </div>
                      <Stamp kind={p.kind} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban preview card — col-span 7 */}
              <div className={`${styles.paperCard} ${styles.cardKanban}`}>
                <div className={`${styles.sectionLabel} ${styles.labelBlue}`}>&sect; GROUP PROJECTS</div>
                <h3 className={styles.cardTitle}>
                  Who&apos;s moving.<br />Who&apos;s dead weight.
                </h3>
                <p className={styles.cardLede}>
                  Shared kanban boards with teeth. Every card shows who owns it and when they
                  last touched it.
                </p>

                <div className={styles.kanbanGrid}>
                  {KANBAN_COLUMNS.map((col) => (
                    <div key={col.title} className={styles.kanbanCol}>
                      <div className={styles.kanbanColHeader}>
                        <span
                          className={styles.kanbanDot}
                          style={{ background: col.dotColor }}
                          aria-hidden="true"
                        />
                        <span className={styles.caption}>{col.title}</span>
                      </div>
                      <div className={styles.kanbanList}>
                        {col.items.map((item) => (
                          <div key={item.task} className={styles.kanbanCard}>
                            <div className={styles.kanbanCardTask}>{item.task}</div>
                            <UserAvatar user={item.owner} size="xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus card — col-span 4 */}
              <div className={`${styles.paperCard} ${styles.cardFocus}`}>
                <div className={`${styles.sectionLabel} ${styles.labelBlue}`}>&sect; FOCUS SESSIONS</div>
                <h3 className={styles.cardTitle}>
                  When you lock in,<br />they know.
                </h3>
                <div className={styles.focusTimer}>
                  <span className={styles.focusMM}>{mm}</span>
                  <span className={styles.focusColon}>:</span>
                  <span className={styles.focusSS}>{ss}</span>
                </div>
                <div className={`${styles.caption} ${styles.lockedInLabel}`}>
                  <span className={styles.pulseDotBlue} aria-hidden="true" />
                  MAYA IS LOCKED IN
                </div>
                <p className={styles.cardFooterText}>
                  50-minute session on <span className={styles.strongInk}>Benchmark charts</span>. 3 friends watching live.
                </p>
              </div>

              {/* Feed card — col-span 4 */}
              <div className={`${styles.paperCard} ${styles.cardFeed}`}>
                <div className={`${styles.sectionLabel} ${styles.labelRed}`}>&sect; ACTIVITY FEED</div>
                <h3 className={styles.cardTitle}>
                  Ticker tape<br />for your study group.
                </h3>
                <ul className={styles.feedList}>
                  {FEED_ITEMS.map((item, i) => (
                    <li key={i} className={styles.feedItem}>
                      <UserAvatar user={item.user} size="sm" />
                      <div className={styles.feedContent}>
                        <div className={styles.feedLine}>
                          <span className={styles.feedUser}>{item.user.name}</span>{' '}
                          <span className={styles.feedBody}>{item.body}</span>
                        </div>
                        <div className={styles.feedTime}>{item.time}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Heatmap card — col-span 4 */}
              <div className={`${styles.paperCard} ${styles.cardHeatmap}`}>
                <div className={`${styles.sectionLabel} ${styles.labelGreen}`}>&sect; STREAKS &amp; HEATMAP</div>
                <h3 className={styles.cardTitle}>
                  Don&apos;t break<br />the chain.
                </h3>
                <div className={styles.streakRow}>
                  <div className={styles.streakNumber}>12</div>
                  <div className={styles.streakMeta}>
                    <div className={styles.caption}>DAY STREAK</div>
                    <div className={styles.streakBest}>personal best 17</div>
                  </div>
                </div>

                <div className={styles.heatmap} aria-hidden="true">
                  {HEATMAP_SEED.map((level, i) => (
                    <div
                      key={i}
                      className={styles.heatmapCell}
                      data-level={level}
                    />
                  ))}
                </div>

                <p className={styles.heatmapFoot}>
                  Today is day twelve. Don&apos;t make it day zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            § 03 — WITNESSES, NOT FOLLOWERS
            ═════════════════════════════════════════════════════════ */}
        <section className={styles.witnesses}>
          <div className={styles.witnessesGrid}>
            <div>
              <div className={styles.sectionLabel}>&sect; 03 &mdash; WITNESSES, NOT FOLLOWERS</div>
              <h2 className={styles.displayH2}>
                Small circles.<br />Big weight.
              </h2>
              <p className={styles.witnessesLede}>
                No public leaderboards. No strangers. LockIn only works with 2–8 friends who
                actually know you, because social pressure only bites when it&apos;s people you&apos;ll
                see in lecture tomorrow.
              </p>

              <div className={styles.witnessRow}>
                <div className={styles.avatarStack}>
                  {WITNESSES.slice(0, 6).map((u) => (
                    <UserAvatar key={u.id} user={u} size="md" />
                  ))}
                </div>
                <div className={styles.witnessCount}>
                  <span className={styles.strongInk}>6 witnesses</span> on your circle
                </div>
              </div>
            </div>

            <blockquote className={styles.quote}>
              <span className={styles.quoteStamp}>
                <Stamp kind="locked-in" size="lg" />
              </span>
              <p className={styles.quoteBody}>
                &ldquo;I started <span className={styles.quoteUnderline}>four</span> problem sets the
                night before they were due last semester. Since LockIn, zero. Turns out I&apos;m not
                built different, I&apos;m just allergic to Rin watching me fail.&rdquo;
              </p>
              <footer className={styles.quoteFooter}>
                <UserAvatar user={{ id: 'u-lia', name: 'Lia Weaver' }} size="sm" />
                <div>
                  <div className={styles.quoteFooterName}>Lia Weaver</div>
                  <div className={styles.quoteFooterMeta}>Engineering sophomore · 42 kept pacts</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            § 04 — THE NUMBERS, ALL OF THEM — dark inverted slab
            ═════════════════════════════════════════════════════════ */}
        <section className={styles.numbersSlab}>
          <div className={styles.numbersInner}>
            <div className={`${styles.sectionLabel} ${styles.labelOnDark}`}>
              &sect; 04 &mdash; THE NUMBERS, ALL OF THEM
            </div>
            <div className={styles.numbersGrid}>
              {NUMBERS.map(([n, l]) => (
                <div key={l} className={styles.numberItem}>
                  <div className={styles.bigNumber}>{n}</div>
                  <div className={styles.numberLabel}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            § 05 — OBJECTIONS — "Yeah, but…" accordion
            ═════════════════════════════════════════════════════════ */}
        <section id="faq" className={styles.objections}>
          <div className={styles.objectionsGrid}>
            <div>
              <div className={styles.sectionLabel}>&sect; 05 &mdash; OBJECTIONS</div>
              <h2 className={styles.displayH2}>Yeah, but&hellip;</h2>
            </div>

            <div className={styles.faqList}>
              {OBJECTIONS.map((item, i) => (
                <details key={i} className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    <div className={styles.faqQuestion}>
                      <span className={styles.faqIndex}>Q&middot;{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.faqQ}>{item.q}</span>
                    </div>
                    <span className={styles.faqPlus} aria-hidden="true">+</span>
                  </summary>
                  <p className={styles.faqA}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            CLOSING CTA — "Lock in. / Or don't."
            ═════════════════════════════════════════════════════════ */}
        <section className={styles.closing}>
          <div className={styles.sectionLabel}>END OF PAGE</div>
          <h2 className={styles.closingHeadline}>
            Lock in.<br />
            <span className={styles.closingOrDont}>Or don&apos;t.</span>
          </h2>
          <p className={styles.closingLede}>
            It&apos;s 11:47 PM. You were going to start tomorrow. You say that every night.
          </p>
          <div className={styles.closingCtas}>
            <motion.button
              onClick={handleCta}
              className={styles.ctaPrimary}
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              Lock in with Google
              <span aria-hidden="true">→</span>
            </motion.button>
            <Link href="/dashboard" className={styles.ctaOutline}>
              Preview the demo dashboard
            </Link>
          </div>
        </section>
      </main>

      {/* ═════════════════════════════════════════════════════════
          FOOTER — thin editorial footer, not a sitemap wall
          ═════════════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogoMark} aria-hidden="true" />
            <span className={styles.footerWordmark}>LockIn.</span>
          </div>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#features">The system</a>
            <a href="#faq">Objections</a>
            <a href="https://github.com/vayungodara/lockin" target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
          <span className={styles.footerCredit}>Built by Vayun Godara</span>
        </div>
      </footer>
    </div>
  );
}
