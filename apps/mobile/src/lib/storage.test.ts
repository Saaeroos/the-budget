import { prefsStorage, queryCacheStorage, readJSON, writeJSON, toPersistStorage, toAsyncKeyValueStore } from './storage';

describe('storage', () => {
  it('reads and writes to prefsStorage', () => {
    prefsStorage.set('test-key', 'test-val');
    expect(prefsStorage.getString('test-key')).toBe('test-val');
    prefsStorage.remove('test-key');
    expect(prefsStorage.getString('test-key')).toBeUndefined();
  });

  it('reads and writes to queryCacheStorage', () => {
    queryCacheStorage.set('cache-key', 'cache-val');
    expect(queryCacheStorage.getString('cache-key')).toBe('cache-val');
    queryCacheStorage.remove('cache-key');
    expect(queryCacheStorage.getString('cache-key')).toBeUndefined();
  });

  it('handles JSON read and write with fallback', () => {
    const fallback = { count: 0 };
    expect(readJSON(prefsStorage, 'missing-json', fallback)).toEqual(fallback);

    writeJSON(prefsStorage, 'valid-json', { count: 42 });
    expect(readJSON(prefsStorage, 'valid-json', fallback)).toEqual({ count: 42 });
    prefsStorage.remove('valid-json');
  });

  it('supports zustand persist and react-query async adapters', async () => {
    const persistStore = toPersistStorage(prefsStorage);
    persistStore.setItem('persist-key', 'persist-val');
    expect(persistStore.getItem('persist-key')).toBe('persist-val');
    persistStore.removeItem('persist-key');
    expect(persistStore.getItem('persist-key')).toBeNull();

    const asyncStore = toAsyncKeyValueStore(queryCacheStorage);
    await asyncStore.setItem('async-key', 'async-val');
    expect(await asyncStore.getItem('async-key')).toBe('async-val');
    await asyncStore.removeItem('async-key');
    expect(await asyncStore.getItem('async-key')).toBeNull();
  });
});
