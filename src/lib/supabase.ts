/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default environment variables
const defaultUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://oznjnabbtntkudblobyy.supabase.co';
const defaultKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bmpuYWJidG50a3VkYmxvYnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzODgzMDksImV4cCI6MjEwODk2NDMwOX0.034jmpPLYazLGz5NlgEVjVZttHHQpQ6RLRBoNJRmQUI';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || localStorage.getItem('carbondrop_supabase_url') || defaultUrl;
  const key = customKey || localStorage.getItem('carbondrop_supabase_key') || defaultKey;

  if (!url || !key || url.includes('your-supabase-project')) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }

  return supabaseInstance;
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('carbondrop_supabase_url', url);
  localStorage.setItem('carbondrop_supabase_key', key);
  supabaseInstance = createClient(url, key);
}

// SQL Script to create tables in Supabase SQL Editor
export const SUPABASE_SQL_INIT_SCRIPT = `-- CarbonDrop Supabase Database Initialization Script
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  balance DOUBLE PRECISION DEFAULT 1250 NOT NULL,
  hashrate DOUBLE PRECISION DEFAULT 3.5 NOT NULL,
  energy INT DEFAULT 1000 NOT NULL,
  max_energy INT DEFAULT 1000 NOT NULL,
  squad_count INT DEFAULT 0 NOT NULL,
  squad_earned DOUBLE PRECISION DEFAULT 0 NOT NULL,
  wallet_address TEXT,
  wallet_name TEXT,
  active_plan_id TEXT,
  active_plan_expires_at BIGINT,
  last_daily_claim_timestamp BIGINT,
  last_saved_timestamp BIGINT,
  status TEXT DEFAULT 'active' NOT NULL,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_config (
  id SERIAL PRIMARY KEY,
  daily_base_drop_rate INT DEFAULT 1000 NOT NULL,
  global_hash_multiplier DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
  tap_power_base INT DEFAULT 2 NOT NULL,
  maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
  maintenance_message TEXT DEFAULT 'CarbonDrop network undergoing scheduled quantum core upgrade.' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default admin economy configuration
INSERT INTO public.admin_config (id, daily_base_drop_rate, global_hash_multiplier, tap_power_base)
VALUES (1, 1000, 1.0, 2)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read admin_config" ON public.admin_config FOR SELECT USING (true);
CREATE POLICY "Allow public update admin_config" ON public.admin_config FOR UPDATE USING (true);
`;
