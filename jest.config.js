module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/react-native/dist/matchers/extend-expect"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|lucide-react-native|heroui-native|uniwind|tailwind-merge|tailwind-variants)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "/android/", "/ios/"],
};
