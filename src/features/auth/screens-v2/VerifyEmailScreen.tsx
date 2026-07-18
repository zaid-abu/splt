import { useRouter, useLocalSearchParams } from "expo-router";
import type { JSX } from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralButton } from "@/components/coral/CoralButton";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { useAppToast } from "@/hooks/useAppToast";
import { useAuth } from "@/context/AppContext";
import { AuthService } from "@/services/api/auth";

const CODE_LENGTH = 6;

export default function VerifyEmailScreen(): JSX.Element {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email: string }>();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { refreshAuth } = useAuth();
  const email = emailParam || "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isResendingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    if (!email || isResendingRef.current) return;
    isResendingRef.current = true;
    setIsResending(true);
    try {
      await AuthService.resendSignUpOtp(email);
      setCooldown(30);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({
        label: "Code Sent",
        description: "A new code was sent to your email.",
        variant: "success",
        placement: "top",
      });
    } catch (err: any) {
      toast.show({
        label: "Send Failed",
        description: err.message || "Could not send code.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      isResendingRef.current = false;
      setIsResending(false);
    }
  }, [email, toast]);

  const handleInputChange = (text: string, index: number) => {
    const newCode = [...code];

    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").split("").slice(0, CODE_LENGTH);
      for (let i = 0; i < CODE_LENGTH; i++) {
        newCode[i] = digits[i] || "";
      }
      setCode(newCode);
      if (digits.length === CODE_LENGTH) {
        inputRefs.current[CODE_LENGTH - 1]?.blur();
      }
    } else {
      const digit = text.replace(/\D/g, "");
      newCode[index] = digit;
      setCode(newCode);

      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== CODE_LENGTH) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Incomplete Code",
        description: "Please enter the full 6-digit code.",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVerifying(true);
    try {
      await AuthService.verifySignUpOtp(email, fullCode);
      await refreshAuth();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Verification Failed",
        description: err.message || "Could not verify the code.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const hasCode = code.some((d) => !!d);

  return (
    <CoralScreen>
      <CoralTopBar title="Verify email" onBack={() => router.back()} />

      <LargeTitle style={{ textAlign: "center", marginTop: 0 }}>Check your inbox.</LargeTitle>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          letterSpacing: -0.003 * 17,
          color: coral.muted,
          textAlign: "center",
          marginTop: 12,
          marginBottom: 32,
          paddingHorizontal: 8,
        }}
      >
        Enter the six-digit code sent to{" "}
        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", color: coral.foreground }}>
          {email}
        </Text>
        .
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          marginBottom: 32,
        }}
      >
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            inputMode="numeric"
            selectTextOnFocus
            accessibilityLabel={`Verification code digit ${index + 1}`}
            style={{
              flex: 1,
              maxWidth: 48,
              minWidth: 0,
              height: 60,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: digit ? coral.accent : coral.border,
              backgroundColor: coral.surface,
              textAlign: "center",
              fontFamily: "IBMPlexMono_600SemiBold",
              fontSize: 24,
              color: coral.foreground,
            }}
          />
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <CoralButton
          label="Verify and continue"
          variant="primary"
          onPress={handleVerify}
          loading={isVerifying}
          disabled={!hasCode}
        />

        <CoralButton
          label={cooldown > 0 ? `Send a new code (${cooldown}s)` : "Send a new code"}
          variant="text"
          onPress={sendOtp}
          loading={isResending}
          disabled={cooldown > 0}
        />
      </View>
    </CoralScreen>
  );
}
