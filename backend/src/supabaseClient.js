import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure env vars are loaded BEFORE creating the client, since this file is imported by route modules
dotenv.config();

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !(SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY)) {
  console.warn('[supabase] Missing SUPABASE_URL or keys in environment. API routes depending on Supabase may fail.');
}

// Prefer service role if provided (server-side only), else anon key
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const supabase = SUPABASE_KEY && SUPABASE_URL
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;