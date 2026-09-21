import { createClient, SupabaseClient } from '@supabase/supabase-js';

function isValidHttpUrl(str?: unknown): boolean {
  if (typeof str !== 'string' || !str.trim()) return false;
  const s = str.trim();
  if (!s.startsWith('http://') && !s.startsWith('https://')) return false;
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const getSupabaseUrl = (): string => {
  const candidates = [
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
    'https://akdwmpejybmplmmdwwwj.supabase.co',
  ];
  for (const candidate of candidates) {
    if (isValidHttpUrl(candidate) && !candidate?.includes('TU_PROYECTO')) {
      return candidate!.trim();
    }
  }
  return 'https://akdwmpejybmplmmdwwwj.supabase.co';
};

export const getSupabaseAnonKey = (): string => {
  const candidates = [
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'sb_publishable_J7cpWYILasYWTBFxFXptOw_WjAl9eoY',
  ];
  for (const c of candidates) {
    if (
      typeof c === 'string' &&
      c.trim() &&
      !isValidHttpUrl(c) &&
      !c.startsWith('sb_secret_') &&
      !c.includes('tu_supabase') &&
      !c.includes('placeholder')
    ) {
      return c.trim();
    }
  }
  return 'sb_publishable_J7cpWYILasYWTBFxFXptOw_WjAl9eoY';
};

export const getSupabaseSecretKey = (): string => {
  const candidates = [
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && !c.includes('tu_supabase')) return c.trim();
  }
  return '';
};

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    isValidHttpUrl(url) &&
    !url.includes('TU_PROYECTO') &&
    !key.includes('tu_supabase')
  );
};

export function assertSupabaseConfiguration(): void {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    console.warn('WARNING: Supabase credentials are missing or default. Server will operate with local resilient store fallback.');
    return;
  }
  console.log(`Supabase initialized successfully (${url})`);
}

export function getSupabase(userToken?: string): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    throw new Error('CRITICAL: Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are missing or invalid.');
  }

  if (userToken) {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    });
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl();
  const secret = getSupabaseSecretKey() || getSupabaseAnonKey();

  if (!url || !secret) {
    throw new Error('CRITICAL: Supabase credentials missing for admin client.');
  }

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminInstance;
}

