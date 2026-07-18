import { useContext } from "react";
import {
  CommandNavigationContext,
  type CommandNavigationContextValue,
} from "./CommandNavigationProvider";

export function useCommandNavigation(): CommandNavigationContextValue {
  const ctx = useContext(CommandNavigationContext);
  if (!ctx) {
    throw new Error("useCommandNavigation must be used within <CommandNavigationProvider>");
  }
  return ctx;
}
