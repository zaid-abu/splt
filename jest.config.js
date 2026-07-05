module.exports = {
  preset: "jest-expo",
  // Runs before any test file is imported — sets env vars before env.ts evaluates
  setupFiles: ["<rootDir>/__tests__/setup/jest.setup.ts"],
  setupFilesAfterEnv: [],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|lucide-react-native|heroui-native|uniwind|tailwind-merge|tailwind-variants)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock AsyncStorage native module so service tests can import supabase/client
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js",
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.expo/",
    "/android/",
    "/ios/",
    // Exclude shared helpers — they export fixtures, not tests
    "__tests__/setup",
  ],
};
