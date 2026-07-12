import { useState, useCallback } from "react"

export function useReceiptUpload(initialUrl?: string) {
  const [receiptUrl, setReceiptUrl] = useState(initialUrl ?? "")
  const [isUploading, setIsUploading] = useState(false)

  const pickPhoto = useCallback(async () => {
    // TODO: Integrate expo-image-picker
    console.warn("pickPhoto not yet implemented - requires expo-image-picker integration")
  }, [])

  const takePhoto = useCallback(async () => {
    // TODO: Integrate expo-image-picker
    console.warn("takePhoto not yet implemented - requires expo-image-picker integration")
  }, [])

  const clearReceipt = useCallback(() => {
    setReceiptUrl("")
  }, [])

  return { receiptUrl, isUploading, setReceiptUrl, pickPhoto, takePhoto, clearReceipt }
}
