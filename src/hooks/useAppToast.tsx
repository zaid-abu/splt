import Toast from "react-native-toast-message";

export function useAppToast() {
  const show = (options: string | any) => {
    let config: any;
    if (typeof options === "string") {
      config = { text1: options };
    } else {
      config = {
        type: options.variant === 'danger' ? 'error' : options.variant === 'success' ? 'success' : 'info',
        text1: options.title || options.label,
        text2: options.message || options.description,
        position: options.placement === 'bottom' ? 'bottom' : 'top',
      };
    }

    return Toast.show(config);
  };

  return {
    toast: {
      show,
      hide: Toast.hide,
    },
  };
}
