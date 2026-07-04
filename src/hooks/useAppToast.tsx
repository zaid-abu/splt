import { useToast as useHeroToast } from "heroui-native";
import { CustomToast } from "@/components/ui/Toast";

export function useAppToast() {
  const { toast } = useHeroToast();

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
