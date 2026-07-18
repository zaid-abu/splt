import { createContext, useCallback, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export type CommandDestination = "people" | "activity" | "recurring" | "currencies" | "add-expense";

export type CommandNavigationContextValue = {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (value: string) => void;
  navigate: (destination: CommandDestination) => void;
};

export const CommandNavigationContext = createContext<CommandNavigationContextValue | null>(null);

const DESTINATION_ROUTES: Record<CommandDestination, string> = {
  people: "/people",
  activity: "/activity",
  recurring: "/recurring",
  currencies: "/currencies",
  "add-expense": "/expense/new",
};

export function CommandNavigationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const open = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const push = router.push as (href: string) => void;

  const navigate = useCallback(
    (destination: CommandDestination) => {
      Haptics.selectionAsync();
      setIsOpen(false);
      setQuery("");
      push(DESTINATION_ROUTES[destination]);
    },
    [push]
  );

  const value = useMemo<CommandNavigationContextValue>(
    () => ({ isOpen, query, open, close, setQuery, navigate }),
    [isOpen, query, open, close, navigate]
  );

  return (
    <CommandNavigationContext.Provider value={value}>{children}</CommandNavigationContext.Provider>
  );
}
