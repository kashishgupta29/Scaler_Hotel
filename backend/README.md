# Scalar Backend

Node.js Express server with Supabase connection.

## Setup

1. Copy environment file

```bash
cp .env.example .env
```

2. Fill in `.env` with your Supabase project values
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` for server-side only)

3. Install dependencies

```bash
npm install
```

4. Run in development

```bash
npm run dev
```

Server starts at `http://localhost:5000` by default.

## Routes
- `GET /` root status
- `GET /api/health` health check
- `GET /api/supabase/version` connectivity check to Supabase
