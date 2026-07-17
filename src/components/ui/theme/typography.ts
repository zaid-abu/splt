export const TYPO = {
  hero: (size = 32) => ({ fontFamily: "Sora_600SemiBold", fontSize: size, letterSpacing: -0.02 }) as const,
  title: (size = 24) => ({ fontFamily: "Sora_600SemiBold", fontSize: size, letterSpacing: -0.01 }) as const,
  body: (size = 17) => ({ fontFamily: "IBMPlexSans_400Regular", fontSize: size }) as const,
  medium: (size = 16) => ({ fontFamily: "IBMPlexSans_500Medium", fontSize: size }) as const,
  semi: (size = 16) => ({ fontFamily: "IBMPlexSans_600SemiBold", fontSize: size }) as const,
  label: () => ({ fontFamily: "IBMPlexSans_600SemiBold", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }) as const,
};
