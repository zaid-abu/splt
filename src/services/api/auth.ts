import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/services/supabase/client";
import type { Inserts } from "@/services/supabase/database.types";
import type { User } from "@/types";
import { mapUser } from "./mappers";

WebBrowser.maybeCompleteAuthSession();

export type AuthCallbackFlow = "oauth" | "verification" | "recovery";

export interface AuthCallbackParams {
  code: string | null;
  flow: AuthCallbackFlow;
  error: string | null;
  errorDescription: string | null;
}

export interface AuthCallbackResult {
  kind: AuthCallbackFlow;
  email: string;
}

export interface SignUpData {
  email: string;
  password?: string;
  name: string;
  defaultCurrency?: string;
}

export interface SignUpResult {
  userId: string;
  email: string;
  requiresEmailVerification: boolean;
}

export function buildSignUpResult(
  data: { user: { id: string } | null; session: unknown | null },
  email: string
): SignUpResult {
  if (!data.user) throw new Error("Supabase did not return the new account.");
  return {
    userId: data.user.id,
    email,
    requiresEmailVerification: data.session === null,
  };
}

export interface SignInData {
  email: string;
  password?: string;
}

export interface ProfileSetupInput {
  name: string;
  defaultCurrency: string;
  avatarUri?: string;
}

type ExchangeCode = (code: string) => Promise<{
  data: {
    user: SupabaseUser | null;
    redirectType?: string | null;
  };
  error: { message: string } | null;
}>;

export class EmailVerificationRequiredError extends Error {
  constructor(readonly email: string) {
    super("Verify your email before signing in.");
    this.name = "EmailVerificationRequiredError";
  }
}

export class AuthCallbackError extends Error {
  constructor(
    message: string,
    readonly flow: AuthCallbackFlow
  ) {
    super(message);
    this.name = "AuthCallbackError";
  }
}

export function getAuthRedirectUri(flow: AuthCallbackFlow): string {
  return makeRedirectUri({
    scheme: "splt",
    path: "auth/callback",
    queryParams: { flow },
  });
}

export function parseAuthCallbackUrl(url: string): AuthCallbackParams {
  const parsed = new URL(url);
  const flowValue = parsed.searchParams.get("flow");
  const flow: AuthCallbackFlow =
    flowValue === "recovery" || flowValue === "verification" ? flowValue : "oauth";

  return {
    code: parsed.searchParams.get("code"),
    flow,
    error: parsed.searchParams.get("error") ?? parsed.searchParams.get("error_code"),
    errorDescription: parsed.searchParams.get("error_description"),
  };
}

export async function exchangeAuthCallback(
  exchangeCode: ExchangeCode,
  params: AuthCallbackParams
): Promise<AuthCallbackResult> {
  if (params.error) {
    throw new AuthCallbackError(
      params.errorDescription || "This authentication link is invalid or expired.",
      params.flow
    );
  }
  if (!params.code) {
    throw new AuthCallbackError("The sign-in link is missing its authorization code.", params.flow);
  }

  const { data, error } = await exchangeCode(params.code);
  if (error) throw new AuthCallbackError(error.message, params.flow);

  if (params.flow === "recovery" && data.redirectType !== "recovery") {
    throw new AuthCallbackError(
      "This link did not establish a password recovery session.",
      "recovery"
    );
  }

  const kind: AuthCallbackFlow =
    data.redirectType === "recovery"
      ? "recovery"
      : params.flow === "verification"
        ? "verification"
        : "oauth";
  return { kind, email: data.user?.email ?? "" };
}

export function buildProfileSeed(
  authUser: Pick<SupabaseUser, "id" | "email" | "user_metadata">
): Inserts<"users"> {
  const metadata = authUser.user_metadata ?? {};
  const email = authUser.email ?? "";
  const name =
    stringValue(metadata.name) ||
    stringValue(metadata.full_name) ||
    email.split("@")[0] ||
    "Splt user";

  return {
    id: authUser.id,
    name,
    email,
    avatar:
      stringValue(metadata.avatar) ||
      stringValue(metadata.avatar_url) ||
      stringValue(metadata.picture) ||
      null,
    initials: initialsFor(name),
    default_currency:
      stringValue(metadata.default_currency) || stringValue(metadata.defaultCurrency) || "USD",
    setup_state: "profile_pending",
  };
}

async function signInWithOAuthProvider(provider: "google" | "apple") {
  const redirectTo = getAuthRedirectUri("oauth");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("The authentication provider did not return a sign-in URL.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") throw new Error("Social sign-in was cancelled.");

  return exchangeAuthCallback(
    supabase.auth.exchangeCodeForSession.bind(supabase.auth),
    parseAuthCallbackUrl(result.url)
  );
}

async function getUserProfile(authUser: SupabaseUser): Promise<User> {
  for (const delay of [0, 100, 300]) {
    if (delay > 0) await wait(delay);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapUser(data);
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(buildProfileSeed(authUser), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return mapUser(data);
}

async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the selected profile photo.");
  const body = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const extension =
    contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/profile.${extension}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, body, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export const AuthService = {
  async signUp(input: SignUpData): Promise<SignUpResult> {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password ?? "",
      options: {
        emailRedirectTo: getAuthRedirectUri("verification"),
        data: {
          name: input.name.trim(),
          default_currency: input.defaultCurrency ?? "USD",
        },
      },
    });
    if (error) throw error;
    return buildSignUpResult(data, email);
  },

  async signIn(input: SignInData) {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password ?? "",
    });
    if (
      error?.code === "email_not_confirmed" ||
      error?.message.toLowerCase().includes("not confirmed")
    ) {
      throw new EmailVerificationRequiredError(email);
    }
    if (error) throw error;
    return data;
  },

  async resendSignUpOtp(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: getAuthRedirectUri("verification") },
    });
    if (error) throw error;
  },

  async verifySignUpOtp(email: string, token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "signup",
    });
    if (error) throw error;
  },

  completeAuthCallback(params: AuthCallbackParams): Promise<AuthCallbackResult> {
    return exchangeAuthCallback(supabase.auth.exchangeCodeForSession.bind(supabase.auth), params);
  },

  signInWithGoogle: () => signInWithOAuthProvider("google"),
  signInWithApple: () => signInWithOAuthProvider("apple"),

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  getUserProfile,

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session ? getUserProfile(session.user) : null;
  },

  async completeProfileSetup(userId: string, input: ProfileSetupInput): Promise<User> {
    const avatar = input.avatarUri ? await uploadAvatar(userId, input.avatarUri) : undefined;
    const name = input.name.trim();
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        initials: initialsFor(name),
        default_currency: input.defaultCurrency,
        setup_state: "activation_pending",
        ...(avatar ? { avatar } : {}),
      })
      .eq("id", userId)
      .in("setup_state", ["profile_pending", "activation_pending"])
      .select("*")
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async markActivationSeen(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({ setup_state: "complete" })
      .eq("id", userId)
      .in("setup_state", ["activation_pending", "complete"])
      .select("*")
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getAuthRedirectUri("recovery"),
    });
    if (error) throw error;
  },

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async completePasswordRecovery(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
    if (signOutError) {
      throw new Error("Password updated, but Splt could not close every session. Sign in again.");
    }
  },

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; defaultCurrency?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        ...(data.name ? { name: data.name, initials: initialsFor(data.name) } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.defaultCurrency ? { default_currency: data.defaultCurrency } : {}),
      })
      .eq("id", userId);
    if (error) throw error;
  },

  async deleteAccount(userId: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) throw error;
    await this.signOut();
  },
};

function initialsFor(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
