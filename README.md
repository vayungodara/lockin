# LockIn

> The app that makes sure tomorrow actually comes.

Student accountability app that uses social pressure to combat procrastination. Create personal commitments, collaborate on group projects, and track focus sessions — all with visibility that keeps you honest.

## Features

- **Personal Pacts** — Set commitments with deadlines. Mark them done or face the shame of "missed"
- **Group Projects** — Kanban task boards with real-time visibility. No more hiding in group work
- **Focus Timer** — Pomodoro-style timer that logs your sessions. Your group sees when you're locked in
- **Activity Feed** — See what everyone's doing. React with emojis. Social pressure works
- **Streaks & Heatmap** — GitHub-style activity visualization. Don't break the chain
- **Dark Mode** — Easy on the eyes for late-night grinding

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Google OAuth |
| Styling | CSS Modules |
| Animations | Framer Motion |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/vayungodara/lockin.git
cd lockin

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API.

## Database Setup

Run the SQL files in `/supabase` folder in your Supabase SQL Editor:

1. `checkpoint8_complete.sql` — Core tables and RLS policies
2. `security_fixes_final.sql` — Security hardening

## Deployment

Deployed on Vercel. Push to `main` branch to auto-deploy.

```bash
git add .
git commit -m "your changes"
git push
```

## Author

**Vayun Godara** — [GitHub](https://github.com/vayungodara)

## License

MIT
