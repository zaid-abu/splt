import { supabase } from "@/services/supabase/client";
import type { User } from "@/types";
import { mapUser } from "./mappers";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";

WebBrowser.maybeCompleteAuthSession();

const getRedirectUri = () => makeRedirectUri({ scheme: "splt", path: "auth/callback" });

async function signInWithOAuthProvider(provider: "google" | "apple") {
  const redirectTo = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("No OAuth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    throw new Error("OAuth sign-in was cancelled or failed");
  }

  const { params } = QueryParams.getQueryParams(result.url);
  if (!params?.refresh_token) {
    throw new Error("No refresh token in OAuth callback");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    refresh_token: params.refresh_token,
    access_token: params.access_token ?? "",
  });

  if (sessionError) throw sessionError;
}

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

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "splt://auth/callback",
    });
    if (error) throw error;
  },

  async updateProfile(userId: string, data: { name?: string; email?: string }): Promise<void> {
    const { error } = await supabase.from("users").update(data).eq("id", userId);
    if (error) throw error;
  },

  async deleteAccount(userId: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) throw error;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.warn("Sign out after account deletion failed silently:", signOutError.message);
    }
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

  async signInWithGoogle(): Promise<void> {
    return signInWithOAuthProvider("google");
  },

  async signInWithApple(): Promise<void> {
    return signInWithOAuthProvider("apple");
  },
};
