const LUCIDE_CJS = '<rootDir>/../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js';

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|@shopify/flash-list|@gorhom/bottom-sheet|react-native-reanimated|react-native-worklets|lucide-react-native|standard-navigation))',
  ],
  // jest-expo resolves the 'react-native' export condition first, which points at lucide's ESM
  // build and fails with ERR_REQUIRE_ESM. Prefer CJS under test.
  testEnvironmentOptions: { customExportConditions: ['require', 'default'] },
  moduleNameMapper: {
    '^lucide-react-native$': LUCIDE_CJS,
    '^lucide-react-native/(.*)$': LUCIDE_CJS,
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
