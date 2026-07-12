import { useToast as useHeroToast } from "heroui-native";
import { CustomToast } from "@/components/ui/Toast";

interface ToastOptions {
  label: string;
  description?: string;
  type?: "info" | "success" | "danger";
  variant?: "info" | "success" | "danger" | "warning";
  duration?: number;
  [key: string]: unknown;
}

export function useAppToast() {
  const { toast } = useHeroToast();

  const show = (options: string | ToastOptions) => {
    const config: ToastOptions =
      typeof options === "string" ? { label: options } : options;

    return toast.show({
      ...config,
      component: (props) => <CustomToast props={props} options={config} />,
    });
  };

  return {
    toast: {
      ...toast,
      show,
    },
  };
}
