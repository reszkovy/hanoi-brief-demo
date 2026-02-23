# Briefer — Project Briefing System

Multi-tenant, bilingual (PL/EN) briefing SaaS with white-label branding.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres + Auth + RLS)
- **Styling:** Tailwind CSS (Apple-like design)
- **Language:** TypeScript
- **Deploy:** Vercel-ready

## Roles

| Role | Access |
|------|--------|
| **Master** | All briefs, all agents, all brands, full admin |
| **Agent** | Own briefs only, own brands, generate client links |
| **Client** | Public token link, no account needed |

## Quick Start

```bash
# 1. Install
npm install

# 2. Create .env.local from template
cp .env.local.example .env.local
# Fill in your Supabase credentials

# 3. Run Supabase schema
# Go to Supabase Dashboard → SQL Editor → paste supabase/schema.sql → Run

# 4. Create your master account
# In Supabase Dashboard → Authentication → Users → Create User
# Then in SQL Editor:
# UPDATE profiles SET role = 'master' WHERE email = 'your@email.com';

# 5. Start dev server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Root redirect
│   ├── login/page.tsx        # Auth page
│   ├── dashboard/
│   │   ├── layout.tsx        # Sidebar + nav shell
│   │   ├── page.tsx          # Hub (H0)
│   │   ├── briefs/           # Brief management
│   │   ├── agents/           # Agent management (master)
│   │   └── brands/           # Brand profiles
│   ├── brief/[token]/        # Public client wizard
│   └── api/                  # REST endpoints
├── components/               # Reusable UI components
└── lib/
    ├── types.ts              # TypeScript definitions
    ├── i18n.ts               # Bilingual translations
    ├── wizard-steps.ts       # 8-step wizard config
    ├── api-helpers.ts        # Auth + validation helpers
    └── supabase/             # DB client configs
```

## API Endpoints

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/briefs` | GET, POST | Yes | List/create briefs |
| `/api/briefs/[id]` | GET, PATCH, DELETE | Yes | Manage brief |
| `/api/brands` | GET, POST | Yes | List/create brands |
| `/api/brands/[id]` | GET, PATCH, DELETE | Yes | Manage brand |
| `/api/agents` | GET, POST | Master | List/create agents |
| `/api/agents/[id]` | GET, PATCH | Master | Manage agent |
| `/api/public/brief/[token]` | GET, PATCH | No | Client brief access |

## Deploy to Vercel

```bash
# Push to GitHub, then:
# 1. Go to vercel.com → New Project → Import repo
# 2. Add environment variables
# 3. Deploy
```
