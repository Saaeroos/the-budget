import '@testing-library/react-native/extend-expect';

jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    MMKV: class {
      getString(key: string) { return store.get(key); }
      set(key: string, value: string) { store.set(key, value); }
      delete(key: string) { store.delete(key); }
      getAllKeys() { return [...store.keys()]; }
      clearAll() { store.clear(); }
    },
  };
});
