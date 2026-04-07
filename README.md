# Expa AI

Expa AI is a full Next.js business intelligence platform with multi-user authentication, personal workspaces, structured AI analysis, report export, and shareable public links.

## Core Features

- Database-backed authentication (register/login/logout/session)
- Multi-user personal workspaces
- Workspace-scoped analysis history
- AI-powered business analysis endpoint with rate limiting and caching
- Export reports as CSV or PDF
- Share reports through public tokenized links
- Automated API tests and CI workflow

## Tech Stack

- Next.js 14 App Router
- React 18
- PostgreSQL + Prisma ORM
- Groq SDK
- Vitest
- GitHub Actions CI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
copy .env.example .env
```

3. Create a Neon database and copy its connection strings:

- `DATABASE_URL`: use the pooled or primary connection string from Neon
- `DIRECT_URL`: use the direct connection string from Neon if you want Prisma migrations or schema sync to bypass pooling

4. Paste those values into `.env` along with `GROQ_API_KEY` and `JWT_SECRET`

5. Generate Prisma client and sync schema:

```bash
npm run db:generate
npm run db:push
```

6. Start development server:

```bash
npm run dev
```

7. Open http://localhost:3000

## Required Environment Variables

- `GROQ_API_KEY` for AI analysis
- `DATABASE_URL` for Neon PostgreSQL
- `DIRECT_URL` optional, but recommended for Prisma schema sync/migrations with Neon
- `JWT_SECRET` for secure auth tokens

## Neon Setup

1. Create a project in Neon.
2. Create a database branch if needed.
3. Copy the connection string(s) from Neon.
4. Set `DATABASE_URL` in `.env` to the Neon string.
5. If provided, also set `DIRECT_URL` to the direct connection string.
6. Run `npm run db:generate` and `npm run db:push`.
7. Restart the app.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Workspaces

- `GET /api/workspaces`
- `POST /api/workspaces`

### Analysis and History

- `POST /api/analyze`
- `GET /api/history?workspaceId=<id>`
- `DELETE /api/history?workspaceId=<id>`

### Reports

- `POST /api/reports/:id/share`
- `GET /api/reports/:id/export/csv`
- `GET /api/reports/:id/export/pdf`
- Public shared page: `/share/:token`

## Testing

```bash
npm run test
```

Current automated tests cover:

- `/api/analyze`
- `/api/history`

## CI

GitHub Actions workflow in `.github/workflows/ci.yml` runs:

- dependency install
- Prisma generate + db push
- tests
- production build

## Production Build

```bash
npm run build
npm run start
```
