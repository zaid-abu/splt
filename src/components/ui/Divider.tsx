import type { JSX } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

interface DividerProps {
  className?: string;
  inset?: boolean;
}

export function Divider({ className, inset }: DividerProps): JSX.Element {
  return (
    <View
      className={twMerge(
        "h-px w-full bg-divider",
        inset && "ml-4",
        className,
      )}
    />
  );
}
