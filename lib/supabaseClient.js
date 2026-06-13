import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const runtimeConfig = window.CATER_VEGAS_SUPABASE || {};

export const SUPABASE_URL =
  runtimeConfig.url ||
  window.CATER_VEGAS_SUPABASE_URL ||
  "https://nnsznkxevilixxykoipa.supabase.co";

export const SUPABASE_ANON_KEY =
  runtimeConfig.anonKey ||
  window.CATER_VEGAS_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uc3pua3hldmlsaXh4eWtvaXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjA1MTUsImV4cCI6MjA5NjAzNjUxNX0.6-_h0xoKQBNordz6WwPZWy14KON3SKISVkx-TI67tyw";

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 8,
        },
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set window.CATER_VEGAS_SUPABASE or replace the placeholders in lib/supabaseClient.js."
    );
  }

  return supabase;
}

export async function getSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentProfile() {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await client
    .from("cater_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return { user, profile };
}

export function subscribeToEvents(onChange, options = {}) {
  const client = requireSupabase();
  const eventFilter = options.filter || {};

  return client
    .channel(options.channelName || "cater-vegas-events")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cater_events",
        ...eventFilter,
      },
      onChange
    )
    .subscribe();
}
