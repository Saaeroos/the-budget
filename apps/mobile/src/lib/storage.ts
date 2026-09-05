import Constants, { ExecutionEnvironment } from 'expo-constants';
import { TurboModuleRegistry } from 'react-native';

/* ── Text ─────────────────────────────────────────────── */
// (none — this file has no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

/** The minimal synchronous key-value contract every wrapper below is built on
 * (matches `react-native-mmkv`'s Nitro-based `MMKV` instance shape). */
export interface KeyValueStore {
  readonly getString: (key: string) => string | undefined;
  readonly set: (key: string, value: string) => void;
  readonly remove: (key: string) => boolean;
}

/**
 * The `StateStorage` shape zustand's `persist` middleware expects
 * (`createJSONStorage` accepts sync or async implementations).
 */
export interface PersistStateStorage {
  readonly getItem: (name: string) => string | null;
  readonly setItem: (name: string, value: string) => void;
  readonly removeItem: (name: string) => void;
}

/**
 * The `AsyncStorage`-shaped contract `@tanstack/query-async-storage-persister`
 * expects. MMKV is synchronous under the hood; the methods are wrapped in
 * `Promise.resolve` purely to satisfy that interface.
 */
export interface AsyncKeyValueStore {
  readonly getItem: (key: string) => Promise<string | null>;
  readonly setItem: (key: string, value: string) => Promise<void>;
  readonly removeItem: (key: string) => Promise<void>;
}

const ID = {
  prefs: 'kwartje.prefs',
  query: 'kwartje.query-cache',
} as const;

/* ── Implementation ──────────────────────────────────────── */

function createStore(id: string): KeyValueStore {
  // Expo Go (StoreClient) does not include custom native modules like react-native-mmkv.
  // Fall back to an in-memory key-value store to allow running under Expo Go seamlessly.
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';

  if (!isExpoGo) {
    try {
      const hasNitro = TurboModuleRegistry.get('NitroModules') != null;
      if (hasNitro || process.env.NODE_ENV === 'test') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMMKV } = require('react-native-mmkv') as {
          createMMKV: (options: { id: string }) => KeyValueStore;
        };
        return createMMKV({ id });
      }
    } catch {
      // Native MMKV module unavailable in this runtime environment
    }
  }

  const memory = new Map<string, string>();
  return {
    getString: (key: string) => memory.get(key),
    set: (key: string, value: string) => {
      memory.set(key, value);
    },
    remove: (key: string) => memory.delete(key),
  };
}

/** User preferences and zustand-persisted UI state (theme, filters). */
export const prefsStorage: KeyValueStore = createStore(ID.prefs);

/** Dedicated instance for the react-query persister, kept separate so a
 * cache wipe (`dev:reset`) never touches user preferences. */
export const queryCacheStorage: KeyValueStore = createStore(ID.query);

export function toPersistStorage(store: KeyValueStore): PersistStateStorage {
  return {
    getItem: (name) => store.getString(name) ?? null,
    setItem: (name, value) => store.set(name, value),
    removeItem: (name) => {
      store.remove(name);
    },
  };
}

export function toAsyncKeyValueStore(store: KeyValueStore): AsyncKeyValueStore {
  return {
    getItem: async (key) => store.getString(key) ?? null,
    setItem: async (key, value) => store.set(key, value),
    removeItem: async (key) => {
      store.remove(key);
    },
  };
}

export function readJSON<T>(store: KeyValueStore, key: string, fallback: T): T {
  const raw = store.getString(key);
  if (raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(store: KeyValueStore, key: string, value: T): void {
  store.set(key, JSON.stringify(value));
}
