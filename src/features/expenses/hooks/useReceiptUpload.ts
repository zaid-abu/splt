import { useState, useCallback } from "react"
import * as ImagePicker from "expo-image-picker"
import { uploadReceipt } from "@/services/storage"

export function useReceiptUpload(initialUrl?: string) {
  const [receiptUrl, setReceiptUrl] = useState(initialUrl ?? "")
  const [isUploading, setIsUploading] = useState(false)

  const pickPhoto = useCallback(async (expenseId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true)
      try {
        const url = await uploadReceipt(expenseId, result.assets[0].uri)
        setReceiptUrl(url)
      } finally {
        setIsUploading(false)
      }
    }
  }, [])

  const takePhoto = useCallback(async (expenseId: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true)
      try {
        const url = await uploadReceipt(expenseId, result.assets[0].uri)
        setReceiptUrl(url)
      } finally {
        setIsUploading(false)
      }
    }
  }, [])

  const clearReceipt = useCallback(() => {
    setReceiptUrl("")
  }, [])

  return { receiptUrl, isUploading, setReceiptUrl, pickPhoto, takePhoto, clearReceipt }
}
