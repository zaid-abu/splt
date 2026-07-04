import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid URL"),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Anon key is required"),
});

// Attempt to validate environment variables
const parsedEnv = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  // Throwing an error will cause the app to crash in development, which is desired to catch missing config early.
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
