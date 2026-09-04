// Jest setup. `@testing-library/react-native` v13+ ships its matchers automatically, so the old
// `extend-expect` side-effect import is gone — importing it now fails to resolve.
import '@testing-library/react-native';

/* ── Text ─────────────────────────────────────────────── */
// (none — test infrastructure only)

/* ── Mocks ────────────────────────────────────────────── */

// MMKV is a Nitro native module: unavailable under jest, so back it with an in-memory map.
jest.mock('react-native-mmkv', () => {
  const stores = new Map<string, Map<string, string>>();
  const storeFor = (id: string) => {
    const existing = stores.get(id);
    if (existing) return existing;
    const created = new Map<string, string>();
    stores.set(id, created);
    return created;
  };
  const make = (id: string) => {
    const store = storeFor(id);
    return {
      getString: (key: string) => store.get(key),
      set: (key: string, value: string) => void store.set(key, value),
      remove: (key: string) => store.delete(key),
      delete: (key: string) => store.delete(key),
      getAllKeys: () => [...store.keys()],
      clearAll: () => store.clear(),
    };
  };
  return {
    createMMKV: ({ id }: { id: string }) => make(id),
    MMKV: class {
      private readonly impl: ReturnType<typeof make>;
      constructor({ id }: { id?: string } = {}) {
        this.impl = make(id ?? 'default');
      }
      getString(key: string) { return this.impl.getString(key); }
      set(key: string, value: string) { this.impl.set(key, value); }
      remove(key: string) { return this.impl.remove(key); }
      delete(key: string) { return this.impl.delete(key); }
      getAllKeys() { return this.impl.getAllKeys(); }
      clearAll() { this.impl.clearAll(); }
    },
  };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'nl-NL', languageCode: 'nl', regionCode: 'NL' }],
}));
