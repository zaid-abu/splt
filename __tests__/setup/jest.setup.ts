/**
 * Jest global setup — runs before every test file.
 *
 * Sets environment variables needed by src/config/env.ts so that
 * tests importing @/services/supabase/client don't throw
 * "Invalid environment variables" during module evaluation.
 */
process.env.EXPO_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
