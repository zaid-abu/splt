import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { AuthService } from "@/services/api/auth";
import { passwordFormSchema, type PasswordFormData } from "@/validation/schemas";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { authPhase, clearRecovery } = useAuth();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = watch("password");

  const onSubmit = async ({ password: nextPassword }: PasswordFormData) => {
    if (authPhase.status !== "recovery") {
      router.replace({
        pathname: "/(auth)/forgot-password",
        params: { authError: "Request a new recovery link before changing your password." },
      });
      return;
    }
    try {
      await AuthService.completePasswordRecovery(nextPassword);
      clearRecovery();
      router.replace({
        pathname: "/(auth)/login",
        params: { email: email || authPhase.email, passwordReset: "success" },
      });
    } catch (error) {
      toast.show({
        label: "Password not updated",
        description: error instanceof Error ? error.message : "Request a new recovery link.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="New password" />
      <LargeTitle>Choose a new password.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 24,
        }}
      >
        This recovery link was verified for{" "}
        {email || (authPhase.status === "recovery" ? authPhase.email : "your account")}.
      </Text>
      <View style={{ gap: 16 }}>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <CoralField
              label="New password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="new-password"
              error={errors.password?.message}
            />
          )}
        />
        <PasswordStrengthMeter password={password} />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <CoralField
              label="Confirm password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
            />
          )}
        />
        <CoralButton
          label="Update password and sign in"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            lineHeight: 20,
            color: coral.muted,
            textAlign: "center",
          }}
        >
          Updating your password signs out every active Splt session. Sign in again with the new
          password.
        </Text>
      </View>
    </CoralScreen>
  );
}
