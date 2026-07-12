import { useCallback, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_EMAIL_KEY = "splt_biometric_email";
const BIOMETRIC_PASSWORD_KEY = "splt_biometric_password";
const BIOMETRIC_ENABLED_KEY = "splt_biometric_enabled";

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");

  const checkAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setIsAvailable(false);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setIsAvailable(false);
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasBiometrics = types.length > 0;
      setIsAvailable(hasBiometrics);

      if (hasBiometrics) {
        const typeLabel = types.includes(1)
          ? "Face ID"
          : types.includes(2)
            ? "Fingerprint"
            : "Biometrics";
        setBiometricType(typeLabel);
      }

      const stored = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setHasStoredCredentials(stored === "true");
    } catch {
      setIsAvailable(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAvailability();
  }, [checkAvailability]);

  const saveCredentials = async (email: string, password: string) => {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setHasStoredCredentials(true);
    } catch {
      // SecureStore not available (web, etc.)
    }
  };

  const clearCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      setHasStoredCredentials(false);
    } catch {
      // ignore
    }
  };

  const authenticate = useCallback(async (): Promise<{
    email: string;
    password: string;
  } | null> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Splt",
        fallbackLabel: "Enter password",
        disableDeviceFallback: false,
      });

      if (!result.success) return null;

      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);

      if (!email || !password) return null;

      return { email, password };
    } catch {
      return null;
    }
  }, []);

  return {
    isAvailable,
    hasStoredCredentials,
    biometricType,
    saveCredentials,
    clearCredentials,
    authenticate,
  };
}
