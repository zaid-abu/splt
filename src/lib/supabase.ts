import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// TODO: Replace with your actual Supabase project URL and anon key
// Add these to a .env file:
//   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
