You are an autonomous Claude Code task running daily for the LockIn project (github.com/vayungodara/lockin). LockIn is a student accountability app built with Next.js 16 (App Router), JavaScript only (no TypeScript), Supabase, Framer Motion, and CSS Modules.

This task has THREE parts that run in parallel, then a merge/fix/report phase:
- **Part A**: Bug hunting + security + performance (subagent: `@code-bug-hunter`)
- **Part B**: Frontend/CSS audit (subagent: `@frontend-auditor`)
- **Part C**: DB health check (direct SQL from main session — subagents can't access Supabase MCP)
- **Part D**: Merge results, read Notion, apply fixes, write reports, open PR (orchestrator — you)

---

## NOTION DATABASE (shared data layer)

Database URL: https://www.notion.so/1f7fcfe28287422ea8af2bb7c2871a45
Data source ID: collection://a0d65c3f-084a-4454-b4a0-2800a12068b7

### MCP Tool Names (use these EXACT names)

- **Search:** `mcp__claude_ai_Notion__notion-search` with `data_source_url: "collection://a0d65c3f-084a-4454-b4a0-2800a12068b7"`
- **Create:** `mcp__claude_ai_Notion__notion-create-pages` with parent `data_source_id: "a0d65c3f-084a-4454-b4a0-2800a12068b7"`
- **Update:** `mcp__claude_ai_Notion__notion-update-page`

Read findings from the visual audit task (Source: "visual-audit", "competitor-intel", "design-trend").
Write your own findings (Source: "code-triage", "frontend-audit", "db-health").
Update Status on findings you fix.

---

## STEP 1: SETUP + CONTINUITY

```bash
# Shell init — worktree env doesn't load ~/.zshrc
source ~/.nvm/nvm.sh
export PATH="/opt/homebrew/bin:$PATH"

# Sync to latest main — works in both worktrees and normal checkouts
git fetch origin
# In a worktree, main is checked out elsewhere so we can't switch to it.
# Instead, create the triage branch directly from origin/main.
git checkout -B fix/morning-triage-$(date +%Y-%m-%d) origin/main

TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)

echo "=== YESTERDAY'S TRIAGE ==="
cat docs/reports/triage-$YESTERDAY.md 2>/dev/null || echo "No triage found"

echo "=== YESTERDAY'S DB HEALTH ==="
cat docs/reports/db-health-$YESTERDAY.md 2>/dev/null || echo "No DB health found"

echo "=== YESTERDAY'S FRONTEND AUDIT ==="
cat docs/reports/frontend-audit-$YESTERDAY.md 2>/dev/null || echo "No frontend audit found"

echo "=== COMMITS SINCE YESTERDAY ==="
git log --since="24 hours ago" --oneline --stat

echo "=== RECENT FRONTEND CHANGES ==="
git log --since="48 hours ago" --oneline -- '*.css' '*.module.css' 'components/' 'app/' 'lib/animations.js' 'globals.css'
```

---

## STEP 2: READ VISUAL AUDIT FINDINGS FROM NOTION

Query the Notion database for recent visual audit findings:
- Filter: Source IN ("visual-audit", "competitor-intel", "design-trend") AND Date Found >= yesterday
- These are visual observations from the live site and competitor intelligence
- Use these as CONTEXT when doing your code analysis — if visual audit flagged "dashboard sidebar looks heavy," look at the sidebar CSS specifically
- Do not duplicate these findings. Instead, enrich them with file paths and code-level detail.
- **Visual context:** The visual audit writes detailed text descriptions of what it sees on each page (colors, spacing, contrast, layout issues, animation behavior). Use these descriptions to guide where to look in the source code.

---

## STEP 3: SPAWN AGENTS + RUN DB HEALTH IN PARALLEL

Launch both subagents AND run DB health queries from the main session simultaneously. Subagents are READ-ONLY — do not let them edit files.

### Subagent 1: `@code-bug-hunter`
Pass it yesterday's triage report content for cross-referencing.
It returns: structured findings table with file paths, line numbers, severity (critical/high/medium/low), categories (JS bug, security, performance, code quality), fix suggestions, and an EASY_FIXES subset.
Tools: Read, Glob, Grep, Bash (read-only — cannot edit files).

### Subagent 2: `@frontend-auditor`
Pass it yesterday's frontend audit content and the visual audit finding descriptions from Notion (Step 2) as text context.
It returns: page-by-page scores (layout, typography, color, components, motion, dark mode, responsive), AI-generated tells, hardcoded values, missing dark mode overrides, animation violations, quick wins, and top 5 highest impact changes.
Tools: Read, Glob, Grep, Bash (read-only — cannot edit files).
This agent audits CSS/JS source code. It cannot view images — the visual audit's text descriptions in Notion provide rendered-page context.

### DB Health (run directly from main session, NOT as subagent)
Subagents cannot access Supabase MCP tools. Run DB health queries directly using `mcp__a0b728f8-f074-4beb-9ff3-ba3d16543f1e__execute_sql` with project_id `muhklpbzdecfscrrwhdr`. Launch these queries while the two subagents are in flight. SELECT only — NEVER mutate.

Any table missing RLS = **CRITICAL** severity.

**Column reference — do NOT guess, these are the actual column names:**
| Table | Correct column | Common wrong guesses |
|-------|---------------|---------------------|
| nudges | `from_user_id` | sender_id |
| notifications | `is_read` | read |
| profiles | `total_xp` | xp |
| profiles | `full_name` | display_name |
| xp_events | `xp_gained` | xp_amount |
| focus_sessions | (no `status` column) | use `ended_at IS NULL` for abandoned |
| activity_reactions | `reaction` | emoji |
| user_onboarding | (no `completed` column) | skip stale onboarding check |

**Use these exact queries — copy-paste, do not improvise:**

```sql
-- Q1: Table row counts
SELECT relname AS table_name, n_live_tup AS row_count
FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY relname;

-- Q2: RLS + policy counts
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policy_count
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname;

-- Q3: Orphaned rows (all 10 checks)
SELECT 'group_members→groups' AS chk, count(*) AS orphaned FROM public.group_members gm WHERE NOT EXISTS (SELECT 1 FROM public.groups g WHERE g.id = gm.group_id)
UNION ALL SELECT 'tasks→groups', count(*) FROM public.tasks t WHERE NOT EXISTS (SELECT 1 FROM public.groups g WHERE g.id = t.group_id)
UNION ALL SELECT 'activity_log→profiles', count(*) FROM public.activity_log a WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.user_id)
UNION ALL SELECT 'activity_reactions→activity_log', count(*) FROM public.activity_reactions ar WHERE NOT EXISTS (SELECT 1 FROM public.activity_log a WHERE a.id = ar.activity_id)
UNION ALL SELECT 'activity_comments→activity_log', count(*) FROM public.activity_comments ac WHERE NOT EXISTS (SELECT 1 FROM public.activity_log a WHERE a.id = ac.activity_id)
UNION ALL SELECT 'notifications→profiles', count(*) FROM public.notifications n WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = n.user_id)
UNION ALL SELECT 'nudges→profiles(from)', count(*) FROM public.nudges nd WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = nd.from_user_id)
UNION ALL SELECT 'xp_events→profiles', count(*) FROM public.xp_events xe WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = xe.user_id)
UNION ALL SELECT 'focus_sessions→profiles', count(*) FROM public.focus_sessions fs WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = fs.user_id)
UNION ALL SELECT 'reminder_logs→pacts', count(*) FROM public.reminder_logs rl WHERE NOT EXISTS (SELECT 1 FROM public.pacts pc WHERE pc.id = rl.pact_id);

-- Q4: Stale data (NO status column on focus_sessions, NO completed column on user_onboarding)
SELECT 'abandoned_focus_sessions_24h' AS chk, count(*) AS cnt FROM public.focus_sessions WHERE ended_at IS NULL AND created_at < now() - interval '24 hours'
UNION ALL SELECT 'old_unread_notifications_30d', count(*) FROM public.notifications WHERE is_read = false AND created_at < now() - interval '30 days'
UNION ALL SELECT 'old_reminder_logs_90d', count(*) FROM public.reminder_logs WHERE sent_at < now() - interval '90 days';

-- Q5: Anomalies (column is "reaction" NOT "emoji")
SELECT 'negative_xp' AS chk, count(*) AS cnt FROM public.profiles WHERE total_xp < 0
UNION ALL SELECT 'impossible_levels', count(*) FROM public.profiles WHERE level < 1
UNION ALL SELECT 'duplicate_group_members', count(*) FROM (SELECT user_id, group_id, count(*) c FROM public.group_members GROUP BY user_id, group_id HAVING count(*) > 1) x
UNION ALL SELECT 'future_dated_activity', count(*) FROM public.activity_log WHERE created_at > now() + interval '1 hour'
UNION ALL SELECT 'streaks_over_365', count(*) FROM public.profiles WHERE current_streak > 365
UNION ALL SELECT 'duplicate_reactions', count(*) FROM (SELECT user_id, activity_id, reaction, count(*) c FROM public.activity_reactions GROUP BY user_id, activity_id, reaction HAVING count(*) > 1) x
UNION ALL SELECT 'oversized_groups_50', count(*) FROM (SELECT group_id, count(*) c FROM public.group_members GROUP BY group_id HAVING count(*) > 50) x;

-- Q6: XP drift
SELECT p.id, p.full_name, p.total_xp AS profile_xp, COALESCE(SUM(xe.xp_gained), 0) AS events_xp, p.total_xp - COALESCE(SUM(xe.xp_gained), 0) AS drift
FROM public.profiles p LEFT JOIN public.xp_events xe ON xe.user_id = p.id
GROUP BY p.id, p.full_name, p.total_xp
HAVING p.total_xp != COALESCE(SUM(xe.xp_gained), 0);
```

---

## STEP 4: COLLECT + DEDUPLICATE RESULTS

Once all agents return:

1. **Merge** all findings into a single list
2. **Security priority**: Any RLS findings from db-health-checker (tables without RLS, missing policies) are automatically **CRITICAL** severity. Flag these first in the triage report.
3. **Deduplicate**: Two findings are the same if they reference the same file AND the same logical problem (even if line numbers differ by 1-2). Keep the richer description.
4. **Cross-reference with yesterday's triage**: Mark each finding as:
   - **NEW** — not in yesterday's triage
   - **CARRIED OVER** — was in yesterday's triage and still open
   - **FIXED** — was in yesterday's triage but code has changed to address it
5. **Enrich visual audit findings**: For any visual-audit finding from Notion, add the corresponding file path and specific CSS changes needed. Update the Notion row with the file path.

---

## STEP 5: CHECK VERCEL HEALTH

Verify production is up:
- `curl -s -o /dev/null -w "%{http_code}" https://www.lock-in.me` — should return 200
- `curl -s -o /dev/null -w "%{http_code}" https://www.lock-in.me/dashboard` — should return 200 or 302 (auth redirect)

If Vercel CLI is available: `vercel ls --limit 5` for recent deployments.
If checks fail, note "Vercel health check failed" in the triage report and continue.

---

## STEP 6: APPLY EASY FIXES

**Easy fix criteria — ALL must be true:**
1. Touches 30 lines or fewer across all files
2. Targeted, local correction:
   - Missing null/undefined check or optional chaining (`?.`)
   - Wrong variable name or typo
   - Missing `await` on async call
   - Missing `'use client'` directive
   - Incorrect import path
   - Hardcoded hex/pixel value → CSS variable from globals.css
   - Missing `key` prop on list item
   - Removing unused imports or dead code
   - Removing leftover `console.log` (keep in `/app/api/cron/`)
   - Adding missing `aria-label`, `alt` text, `role` attributes
   - Adding missing `rel="noopener noreferrer"` on external links
   - Straightforward N+1 query batching
3. No new dependencies, no schema changes, no cron route changes
4. No refactoring or restructuring
5. High confidence the fix is correct
6. Finding is STILL_OPEN (not CANNOT_VERIFY)

**NOT easy fixes (skip these):**
- Business logic or user intent decisions
- Auth or RLS policy changes
- New features
- API contract changes
- CSS structural changes (layout, z-index, responsive breakpoints)
- Anything in `/app/api/cron/` or `/lib/supabase/`

**Code conventions:**
- JavaScript only — never TypeScript
- `'use client';` first line of client components
- `import { createClient } from '@/lib/supabase/client';` (client-side)
- `import { createClient } from '@/lib/supabase/server';` with `await createClient()` (server-side)
- CSS class names: camelCase (`styles.headerTitle`)
- Don't set `background: var(--bg-primary)` on page containers
- Don't prefix non-hook utilities with `use`
- Animation presets from `@/lib/animations`, never inline Framer Motion variants
- Use CSS variables from `globals.css`, never hardcode hex values
- `overflow-x: clip` not `overflow-x: hidden` on html/body

---

## STEP 7: WRITE REPORTS

Create three report files:

### docs/reports/triage-{TODAY}.md
```markdown
# LockIn Morning Triage — {TODAY}

**Generated:** {TODAY} (automated)
**Findings:** {N from bug-hunter} + {N from frontend-auditor} = {N total}
**Cross-referenced:** {N still open}, {N already fixed}, {N cannot verify}
**Visual audit findings enriched:** {N}

---

## Progress Since Yesterday
- Items from yesterday: N total, N fixed, N still open, N new today
- Commits since yesterday: N
- Visual audit findings available: yes/no

## ⚠️ Security — RLS / Database Access
(This section appears FIRST if any issues found. Empty = all tables secured.)
| Table | Issue | Severity |
|-------|-------|----------|
(e.g., "some_table | RLS not enabled | CRITICAL")
(e.g., "some_table | RLS enabled but 0 policies | CRITICAL")

## Already Fixed
| File | Line | Description |
|------|------|-------------|

## Still Open — Carried Over
| Severity | File | Line | Description | Fix Suggestion |
|----------|------|------|-------------|----------------|

## Still Open — New
| Severity | File | Line | Description | Fix Suggestion |
|----------|------|------|-------------|----------------|

## Cannot Verify
| File | Issue | Reason |
|------|-------|--------|

## Automated Fixes Applied
| File | Change | Lines Modified |
|------|--------|----------------|

## Skipped — Needs Manual Review
- (file:line) — (reason skipped)
```

### docs/reports/frontend-audit-{TODAY}.md
```markdown
# LockIn Frontend Audit — {TODAY}

**Generated:** {TODAY} (automated)
**Pages scored:** N
**Visual audit context:** yes/no

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Overall |
|------|--------|------------|-------|------------|--------|-----------|---------|
| Landing | /10 | /10 | /10 | /10 | /10 | /10 | /10 |
| Dashboard | /10 | /10 | /10 | /10 | /10 | /10 | /10 |
(etc)

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|

## Top 5 Highest Impact Changes
1. ...
```

### docs/reports/db-health-{TODAY}.md
```markdown
# LockIn DB Health — {TODAY}

**Generated:** {TODAY} (automated)
**Status:** HEALTHY | WARNINGS | ISSUES FOUND

---

## RLS Security
| Table | RLS Enabled | Policies | Status |
|-------|-------------|----------|--------|
(Any table missing RLS or with 0 policies = CRITICAL)

## Table Sizes
| Table | Row Count | Delta vs Yesterday |
|-------|-----------|-------------------|

## Orphaned Rows
| Relationship | Count | Status |
|-------------|-------|--------|
| group_members → groups | 0 | OK |
(etc — all 10 checks)

## Stale Data
| Check | Count | Status |
|-------|-------|--------|
| Abandoned focus sessions (>24h) | 0 | OK |
(etc — all 5 checks)

## Anomalies
| Check | Count | Details |
|-------|-------|---------|
| Negative XP profiles | 0 | OK |
| XP drift | 0 | OK |
(etc — all 9 checks)

## Suggested Cleanup SQL
-- DO NOT RUN. For manual review only.
(cleanup queries here)

## Errors
(any queries that failed during the run)
```

---

## STEP 8: WRITE FINDINGS TO NOTION (WITH DEDUPLICATION)

**CRITICAL: Search before writing.** The #1 maintenance problem is duplicate findings — the same issue reported daily by different triage runs with slightly different counts (e.g., "30 of 37 dark mode files", "31 of 37 dark mode files", "32 of 38 dark mode files" all describing the same gap).

### Before creating ANY new Notion row:

1. **Search Notion** for existing findings with similar keywords or the same file path:
   ```
   mcp__claude_ai_Notion__notion-search with:
     query: "<key phrase from your finding>"
     data_source_url: "collection://a0d65c3f-084a-4454-b4a0-2800a12068b7"
   ```

2. **Check each result's Status and Description:**
   - **Match found, Status = "new" or "carried-over":** UPDATE the existing row — refresh the Details, update Date Found to today. Do NOT create a new row.
   - **Match found, Status = "fixed":** The issue may have regressed. Verify the fix is actually broken before creating a new row. If the code still has the fix, skip.
   - **Match found, Status = "dismissed":** Skip. The issue was intentionally dismissed.
   - **No match found:** Create a new row.

3. **What counts as a "match":** Same logical issue, even if the exact numbers or wording differ. Examples:
   - "20 files missing dark mode" and "30 files missing dark mode" → SAME issue, update don't duplicate
   - "LandingPageClient.js inline animations" at any count → SAME issue
   - "Dashboard card contrast" from visual-audit and "Dashboard.module.css missing dark overrides" from frontend-audit → SAME root cause

### Writing findings:
- Source: "code-triage" for bugs/security/perf
- Source: "frontend-audit" for CSS/design issues
- Source: "db-health" for database anomalies
- Include file paths and line numbers
- Set Date Found to today

For visual audit findings you enriched with file paths, update those existing Notion rows (don't create duplicates).

---

## STEP 9: GIT + PR

1. Branch `fix/morning-triage-{TODAY}` was already created in STEP 1. If not, run: `git checkout -B fix/morning-triage-{TODAY} origin/main`
2. Commit each fix separately: `fix: [description] (triage {TODAY})`
3. Commit all three reports together: `docs: add triage + frontend audit + db health reports {TODAY}`
4. Push and open PR:
   - Title: `daily: morning triage + frontend audit + db health {TODAY}`
   - Body: list fixes, triage summary, frontend audit top changes, DB health status
5. If no fixes applied, still commit reports and open a report-only PR.

---

## ERROR HANDLING

- If Notion is unavailable: skip Steps 2 and 8, proceed with code analysis only
- If a subagent fails: collect results from the others and continue
- If Supabase is unavailable: write minimal DB health report noting the error
- If Vercel is unavailable: note in triage report and continue
- If git push fails: try fallback branch name `fix/morning-triage-{TODAY}-retry`
- Always produce all three report files, even if some sections are empty
- Never retry a failed operation more than once

---

## CONSTRAINTS

- JavaScript only. Never write .ts or .tsx.
- All file paths relative to repo root.
- After applying easy fixes, run `npm run lint` to verify they don't introduce lint errors. If lint fails, revert that fix and log it under "Skipped."
- Do not run `npm run build` or full test suites (too slow for daily triage).
- Do not modify files outside confirmed easy fixes + report files.
- For DB health: SELECT only. NEVER run mutating SQL.
- When in doubt, skip the fix and log it under "Skipped."
