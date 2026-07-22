import { useToastContext } from "@/providers/ToastProvider";
import { CustomToast } from "@/components/ui/Toast";

export function useAppToast() {
  const { toast } = useToastContext();

  const show = (options: string | any) => {
    let config: any;
    if (typeof options === "string") {
      config = { label: options };
    } else {
      config = options;
    }

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
