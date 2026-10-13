# Amp project guidance

Follow `CLAUDE.md` for project conventions, commands, and design context. Its Amp mapping explains which Claude Code plugin agents have matching Amp skills.

## Orb notes

- Setup prepares dependencies only. Run unit tests separately with `npm test`; run e2e tests with `npm run test:e2e`.
- Run `npm run dev` for the app. Register it as a service with `amp orb service start dev --command 'npm run dev' --portal`.
- Setup copies `.env.local.example` to `.env.local` only when `.env.local` is absent. Supabase keys must be supplied through project secrets.
- Keep project guidance in this repository. Setup must not write to `~/.config/amp/AGENTS.md`.

## Test before pushing

Run `npm test`, `npm run lint`, and `npm run test:e2e`. Install Chromium once with `npx playwright install --with-deps chromium` if needed.
If the installer hangs on Node 26, use `npm exec --yes --package=node@22 -- node node_modules/playwright/cli.js install chromium`; this worked in the orb.
E2E builds and serves the production app on port 3100 with a loopback Supabase URL and a fake anonymous key.
It overrides the public settings. Agents do not need to inspect or change `.env.local`; Next.js still loads environment files normally.
No Supabase service, Docker daemon, or real secrets are required.
Do not reuse or deploy this test build; a normal production build must use the deployment's own environment.

The browser suite covers the landing page, anonymous redirects from all five dashboard sections, the callback without a code, and unauthorized cron requests.
It does **not** cover Google OAuth, signed-in CRUD, database RLS, realtime, or email delivery. Unit tests use mocked Supabase calls.
No dev-only sign-in route or authentication bypass exists. The current E2E flows do not need one.
Before changing signed-in behavior, add an isolated Supabase test backend with a reproducible schema and test user, then exercise the affected flow.
Do not treat this anonymous suite as proof that signed-in changes work or as blanket permission to push untested changes.

## Check it's live

Vercel's GitHub integration deploys this repository: GitHub records `Production` deployments by `vercel[bot]`, with commit SHAs and deployment URLs.
`.github/workflows/ci.yml` tests code; it does not deploy. `vercel.json` configures four Vercel cron jobs. The app uses Supabase for authentication and data.

After pushing, subscribe to CI for the exact commit and require all three CI jobs to pass. Then inspect deployment records:

```bash
sha=$(git rev-parse HEAD)
gh api "repos/vayungodara/lockin/deployments?sha=$sha&environment=Production" \
  --jq '.[] | {id, sha, environment, statuses_url}'
# Use the matching deployment ID, not the latest deployment of another commit.
gh api repos/vayungodara/lockin/deployments/DEPLOYMENT_ID/statuses \
  --jq '.[0] | {state, environment_url, log_url}'
```

Require `state: success` for that SHA. Check the production alias and source commit in Vercel's `vayun-godaras-projects/lockin` deployment details.
A successful immutable deployment does not prove that the public domain points to it.
For a reachable deployment, run `E2E_BASE_URL="https://DEPLOYMENT_HOST" npm run test:e2e -- --workers=1 --retries=0`.
This runs the read-only anonymous smoke suite without starting a local server. Never supply a cron authorization header or trigger a deploy manually.

**Observed on 2026-10-13:** the repository homepage, `https://lockin.vayun.net`, returns HTTP 503 with a Cloudflare maintenance page ("Under development").
The successful Vercel production deployment URL redirects to Vercel SSO. The app itself cannot be smoke-tested remotely from this orb.
Vayun must provide approved access to the protected deployment and confirm the intended production alias before agents can claim the app is live.
Do not remove deployment protection, change DNS, or replace the maintenance page without approval.

Read CI failures with `gh run view RUN_ID --log-failed`. Read build and runtime errors in the Vercel project's deployment logs and Logs view.
Read authentication and database errors in the Supabase project's Logs Explorer. Vercel and Supabase log access is not verified in this orb.
The public domain's Cloudflare maintenance configuration is outside this repository; its owner must inspect it if the domain remains unavailable.

### Read-only production access

Vayun has approved production reads, not writes. Puck collects credentials through a masked prompt; do not create tokens, inspect credential stores, or save credentials in files.
Never request a Supabase service-role key, a database password, a legacy full-access PAT, or permissions to read API key secrets.

- **Supabase:** create a **scoped** PAT at <https://supabase.com/dashboard/account/tokens>, restricted to LockIn's production project.
  Grant only **Project Settings: Read**, **Logs: Read**, and **Database: Read** (`analytics_logs_read` and `database_read` are the logs and query permission IDs).
  Suggested Amp secret: `LOCKIN_SUPABASE_READ_TOKEN`. The public source mentions project ref `muhklpbzdecfscrrwhdr`; Vayun must confirm it is production.
  These permissions allow service health, API/Auth/Postgres/Realtime log queries, and read-only database diagnostics. No account-wide or write scopes are needed.
- **Vercel:** ordinary account/team/project tokens from <https://vercel.com/account/tokens> permit writes and are **not** read-only credentials.
  For build logs and deployment aliases, Vayun can use an OAuth integration in <https://vercel.com/dashboard/integrations/console>, installed only on `lockin`, with **deployment: Read** and **project: Read**, all other scopes **None**.
  Suggested secret for that installation token: `LOCKIN_VERCEL_READ_TOKEN`; also supply its non-secret team ID as `LOCKIN_VERCEL_TEAM_ID`.
  Runtime-log access is not listed in that integration's documented read endpoints, so it must be verified separately without widening permissions.
  Web Analytics, Speed Insights, and runtime Logs remain dashboard-only until approved read-only access is confirmed. Do not create a log drain or upgrade a plan.

Once Puck supplies the scoped secrets, run these reads without `set -x` or verbose HTTP logging. Keep raw logs private and report counts or redacted errors.
Replace `PROJECT_REF` with the confirmed production ref. Set `START` and `END` to UTC ISO timestamps, at most 24 hours apart.

```bash
curl --fail-with-body -sS "https://api.supabase.com/v1/projects/PROJECT_REF" \
  -H "Authorization: Bearer $LOCKIN_SUPABASE_READ_TOKEN" | jq '{id, name, status}'
curl --fail-with-body -sS --get "https://api.supabase.com/v1/projects/PROJECT_REF/analytics/endpoints/logs" \
  -H "Authorization: Bearer $LOCKIN_SUPABASE_READ_TOKEN" \
  --data-urlencode "iso_timestamp_start=$START" --data-urlencode "iso_timestamp_end=$END" \
  --data-urlencode "sql=select source, toInt32OrZero(log_attributes['response.status_code']) as status, count() as events from logs group by source, status order by events desc limit 100"
# POST here executes a SELECT as supabase_read_only_user; it is not a database write.
curl --fail-with-body -sS "https://api.supabase.com/v1/projects/PROJECT_REF/database/query/read-only" \
  -H "Authorization: Bearer $LOCKIN_SUPABASE_READ_TOKEN" -H 'Content-Type: application/json' \
  --data '{"query":"select state, count(*) as connections from pg_catalog.pg_stat_activity where datname = current_database() group by state"}'
curl --fail-with-body -sS "https://api.vercel.com/v13/deployments/VERCEL_DEPLOYMENT_ID?teamId=$LOCKIN_VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $LOCKIN_VERCEL_READ_TOKEN" | jq '{id, readyState, url, target, sha: .meta.githubCommitSha}'
curl --fail-with-body -sS "https://api.vercel.com/v2/deployments/VERCEL_DEPLOYMENT_ID/aliases?teamId=$LOCKIN_VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $LOCKIN_VERCEL_READ_TOKEN" | jq '[.aliases[] | {alias}]'
curl --fail-with-body -sS "https://api.vercel.com/v2/deployments/VERCEL_DEPLOYMENT_ID/events?teamId=$LOCKIN_VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $LOCKIN_VERCEL_READ_TOKEN"
```

These provider commands are documented, not credential-tested here. Treat 401/403, SQL errors, missing sources, or expired retention as missing evidence, not a healthy result.
The Supabase read-only query endpoint is beta. Database read access may reveal user data; use aggregate system views, not user rows or private query text.
See [Supabase PAT permissions](https://supabase.com/docs/guides/platform/personal-access-tokens), [log queries](https://supabase.com/docs/guides/observability/advanced-log-filtering), and [Vercel integration read scopes](https://vercel.com/docs/integrations/create-integration/vercel-api-integrations).

### Check again about an hour after deployment

Set a one-time follow-up on the same thread, unless it already hosts a schedule. Report only problems.
Repeat the exact-commit deployment and public smoke checks. Compare the first post-deploy hour with an equally long pre-deploy window.
Check Vercel runtime 5xx, exceptions, timeouts, and failed cron invocations in Logs/Observability when access is available.
Check Supabase API/Auth 5xx and unexpected 401/403 rates, Postgres errors, connection pressure, and Realtime disconnects.
Use request counts as the denominator; no traffic or missing logs cannot establish a healthy error rate.
Inspect Web Analytics traffic and Speed Insights regressions only if those views are enabled and readable. Do not change production settings to obtain them.
If access is still missing, report the gap to Puck rather than claiming the one-hour check passed.
