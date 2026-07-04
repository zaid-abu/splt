import { supabase } from "@/services/supabase/client";
import type { User } from "@/types";
import { mapUser } from "./mappers";

export interface SignUpData {
  email: string;
  password?: string;
  name: string;
  defaultCurrency?: string;
}

export interface SignInData {
  email: string;
  password?: string;
}

export const AuthService = {
  async signUp(data: SignUpData) {
    const { email, password, name, defaultCurrency = "USD" } = data;
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: password ?? "",
      options: {
        data: {
          name,
          default_currency: defaultCurrency,
        },
      },
    });

    if (error) throw error;
    return authData;
  },

  async signIn(data: SignInData) {
    const { email, password } = data;
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: password ?? "",
    });

    if (error) throw error;
    return authData;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return null;

    const userId = sessionData.session.user.id;
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) return null;
    return mapUser(userData);
  },
};
