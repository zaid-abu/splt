import { useCallback, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import type { ReceiptDraft } from "@/features/expenses/hooks/useExpenseComposer";
import { expensesApi } from "@/features/expenses/services/api";
import type { ReceiptMimeType } from "@/features/money/types";

const MAX_RECEIPT_SIZE_BYTES = 10_485_760;
const SUPPORTED_IMAGE_MIME_TYPES: ReceiptMimeType[] = ["image/jpeg", "image/png", "image/heic"];

type Toast = {
  show: (options: {
    label: string;
    description?: string;
    variant: "danger" | "success";
    placement: "top";
  }) => void;
};

type UseReceiptUploadOptions = {
  operationId: string;
  currentReceipt?: ReceiptDraft;
  setReceipt: (receipt?: ReceiptDraft) => void;
  toast: Toast;
};

export function useReceiptUpload({
  operationId,
  currentReceipt,
  setReceipt,
  toast,
}: UseReceiptUploadOptions) {
  const [isReceiptSheetVisible, setReceiptSheetVisible] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isRemovingReceipt, setIsRemovingReceipt] = useState(false);

  const uploadReceipt = useCallback(
    async ({
      uri,
      mimeType,
      sizeBytes,
    }: {
      uri: string;
      mimeType: ReceiptMimeType;
      sizeBytes: number;
    }) => {
      setIsUploadingReceipt(true);
      try {
        const key = await expensesApi.uploadStagedReceipt({ operationId, uri, mimeType });
        setReceipt({ key, mimeType, sizeBytes });
        toast.show({ label: "Receipt attached", variant: "success", placement: "top" });
      } catch (error: any) {
        toast.show({
          label: "Upload failed",
          description: error.message || "Could not upload receipt.",
          variant: "danger",
          placement: "top",
        });
      } finally {
        setIsUploadingReceipt(false);
      }
    },
    [operationId, setReceipt, toast]
  );

  const validateReceipt = useCallback(
    (mimeType: string, sizeBytes: number, allowedMimeTypes: ReceiptMimeType[]) => {
      if (!allowedMimeTypes.includes(mimeType as ReceiptMimeType)) {
        toast.show({
          label: "Unsupported file type",
          description: "Please select a JPEG, PNG, HEIC, or PDF file.",
          variant: "danger",
          placement: "top",
        });
        return false;
      }

      if (sizeBytes > MAX_RECEIPT_SIZE_BYTES) {
        toast.show({
          label: "File too large",
          description: "Maximum file size is 10 MB.",
          variant: "danger",
          placement: "top",
        });
        return false;
      }

      return true;
    },
    [toast]
  );

  const pickImage = useCallback(
    async (useCamera: boolean) => {
      setReceiptSheetVisible(false);
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        toast.show({
          label: useCamera ? "Camera permission needed" : "Gallery permission needed",
          variant: "danger",
          placement: "top",
        });
        return;
      }

      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const sizeBytes = asset.fileSize ?? 0;
      if (!validateReceipt(mimeType, sizeBytes, SUPPORTED_IMAGE_MIME_TYPES)) return;

      await uploadReceipt({ uri: asset.uri, mimeType: mimeType as ReceiptMimeType, sizeBytes });
    },
    [toast, uploadReceipt, validateReceipt]
  );

  const pickPdf = useCallback(async () => {
    setReceiptSheetVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType || "application/pdf";
      const sizeBytes = asset.size ?? 0;
      if (!validateReceipt(mimeType, sizeBytes, ["application/pdf"])) return;

      await uploadReceipt({ uri: asset.uri, mimeType: mimeType as ReceiptMimeType, sizeBytes });
    } catch {
      toast.show({
        label: "Could not open document picker",
        variant: "danger",
        placement: "top",
      });
    }
  }, [toast, uploadReceipt, validateReceipt]);

  return {
    isReceiptSheetVisible,
    isUploadingReceipt,
    openReceiptSheet: () => setReceiptSheetVisible(true),
    closeReceiptSheet: () => setReceiptSheetVisible(false),
    pickImage,
    pickPdf,
    isRemovingReceipt,
    removeReceipt: async () => {
      if (!currentReceipt || isRemovingReceipt) return;
      setIsRemovingReceipt(true);
      try {
        await expensesApi.removeStagedReceipt(currentReceipt.key);
        setReceipt(undefined);
      } catch (error: any) {
        toast.show({
          label: "Could not remove receipt",
          description: error.message || "Please try again.",
          variant: "danger",
          placement: "top",
        });
      } finally {
        setIsRemovingReceipt(false);
      }
    },
  };
}
