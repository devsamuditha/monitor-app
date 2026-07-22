import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) return supabaseClient;

  // Check if credentials are in Vite environment or global env
  let url = ((import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) as string;
  let anonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

  if (!url || !anonKey) {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        url = config.supabaseUrl;
        anonKey = config.supabaseAnonKey;
      }
    } catch (e) {
      console.error('Could not load Supabase credentials dynamically', e);
    }
  }

  if (!url || !anonKey) {
    // Return a dummy client or throw a friendly message
    console.warn('Supabase URL or Anon Key is missing. Live operations (Auth, Storage, Realtime) will be inactive until configured.');
    // Create a mock or throw
    throw new Error('Supabase client is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}
