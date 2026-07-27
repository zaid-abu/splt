const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: [
      "dist/*",
      ".expo/*",
      "node_modules/*",
      ".agents/*",
      "coverage/*",
      "playwright-report/*",
      "test-results/*",
      "blob-report/*",
      "playwright/.cache/*",
      "supabase/functions/*",
      "expo-env.d.ts",
      "uniwind-types.d.ts",
    ],
  },
];
