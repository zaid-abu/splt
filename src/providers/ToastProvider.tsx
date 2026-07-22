import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { randomUUID } from "@/utils/randomUUID";

type ToastOptions = {
  label?: string;
  description?: string;
  variant?: "default" | "success" | "danger" | "warning";
  placement?: "top" | "bottom";
  duration?: number;
  component?: (props: { id: string; hide: (id: string) => void }) => ReactNode;
};

type ToastState = {
  id: string;
  options: ToastOptions;
};

type ToastContextValue = {
  toast: {
    show: (options: ToastOptions | string) => string;
    hide: (id: string) => void;
  };
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions | string) => {
      const id = randomUUID();
      const config = typeof options === "string" ? { label: options } : options;
      
      setToasts((prev) => [...prev, { id, options: config }]);

      const duration = config.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => hide(id), duration);
      }

      return id;
    },
    [hide]
  );

  const value = useMemo(() => ({ toast: { show, hide } }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        <View style={{ flex: 1, pointerEvents: "box-none", justifyContent: "flex-start", paddingTop: 50 }}>
          {toasts
            .filter((t) => t.options.placement !== "bottom")
            .map((t) => (
              <React.Fragment key={t.id}>
                {t.options.component ? t.options.component({ id: t.id, hide }) : null}
              </React.Fragment>
            ))}
        </View>
        <View style={{ flex: 1, pointerEvents: "box-none", justifyContent: "flex-end", paddingBottom: 50 }}>
          {toasts
            .filter((t) => t.options.placement === "bottom")
            .map((t) => (
              <React.Fragment key={t.id}>
                {t.options.component ? t.options.component({ id: t.id, hide }) : null}
              </React.Fragment>
            ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}
