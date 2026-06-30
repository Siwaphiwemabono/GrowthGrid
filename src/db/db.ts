// src/db/db.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getDb = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

export const db = getDb();
export const supabase = db;

// Admin client - ONLY WORKS ON SERVER
// This will NOT work on the client side
export const getAdminDb = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Check if we're on the server (not in the browser)
  const isServer = typeof window === 'undefined';
  
  // Only try to get the service key on the server
  const supabaseServiceKey = isServer 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : undefined;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  // If not on server or no service key, fall back to regular client
  if (!isServer || !supabaseServiceKey) {
    if (isServer && !supabaseServiceKey) {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found on server. Falling back to regular client.');
    }
    return getDb();
  }

  console.log('✅ Creating admin client with Service Role Key');
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }
  supabaseAdminInstance = getAdminDb();
  return supabaseAdminInstance;
};

// ✅ Export admin client - will only work on server
// On client, it will fall back to regular client
export const supabaseAdmin = getSupabaseAdmin();

export default db;