import * as SecureStore from 'expo-secure-store';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
/* ── Text ─────────────────────────────────────────────── */
// (none — this file has no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */
// (no exported types beyond the `supabase` client itself)

const LIMITS = {
  /** expo-secure-store caps a single value around 2048 bytes on Android;
   * a Supabase session (access + refresh token + metadata) can exceed that,
   * so the adapter below chunks it. Kept well under the ceiling. */
  secureStoreChunkChars: 1800,
} as const;

/* ── Implementation ───────────────────────────────────── */

function indexKey(key: string): string {
  return `${key}.chunks`;
}

function chunkKey(key: string, index: number): string {
  return `${key}.${index}`;
}

function chunkString(value: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += size) chunks.push(value.slice(i, i + size));
  return chunks.length > 0 ? chunks : [''];
}

/**
 * `SupportedStorage` backed by `expo-secure-store`, chunked to stay under the
 * platform's per-value size limit. Keeps the Supabase session out of MMKV/AsyncStorage
 * (`.claude/rules` §05: session lives in secure-store, never plain storage).
 */
const secureStoreAdapter: SupportedStorage = {
  getItem: async (key) => {
    const countRaw = await SecureStore.getItemAsync(indexKey(key));
    if (countRaw === null) return null;
    const count = Number(countRaw);
    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
    );
    return parts.some((part) => part === null) ? null : parts.join('');
  },
  setItem: async (key, value) => {
    const chunks = chunkString(value, LIMITS.secureStoreChunkChars);
    await SecureStore.setItemAsync(indexKey(key), String(chunks.length));
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)));
  },
  removeItem: async (key) => {
    const countRaw = await SecureStore.getItemAsync(indexKey(key));
    const count = countRaw === null ? 0 : Number(countRaw);
    await Promise.all([
      SecureStore.deleteItemAsync(indexKey(key)),
      ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
    ]);
  },
};

function readEnv(): { url: string; anonKey: string } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-local';
  return { url, anonKey };
}

const { url, anonKey } = readEnv();

/** The single Supabase client for the app. Only `queries/` repositories may import this. */
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
