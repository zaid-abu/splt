export const TYPO = {
  hero: (size = 32) =>
    ({ fontFamily: "InstrumentSans_600SemiBold", fontSize: size, letterSpacing: -0.025 }) as const,
  title: (size = 24) =>
    ({ fontFamily: "InstrumentSans_600SemiBold", fontSize: size, letterSpacing: -0.01 }) as const,
  body: (size = 17) => ({ fontFamily: "InstrumentSans_400Regular", fontSize: size }) as const,
  medium: (size = 16) => ({ fontFamily: "InstrumentSans_500Medium", fontSize: size }) as const,
  semi: (size = 16) => ({ fontFamily: "InstrumentSans_600SemiBold", fontSize: size }) as const,
  label: () =>
    ({
      fontFamily: "InstrumentSans_600SemiBold",
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    }) as const,
};
