import type { JSX } from "react"
import { useCallback, useMemo, useRef, useState } from "react"
import { randomUUID } from "@/utils/randomUUID"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import * as icons from "lucide-react-native"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"

import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { CoralScreen } from "@/components/coral/CoralScreen"
import { CoralTopBar } from "@/components/coral/CoralTopBar"
import { CoralSelect } from "@/components/coral/CoralSelect"
import { CoralButton } from "@/components/coral/CoralButton"
import { CoralSheet } from "@/components/coral/CoralSheet"
import { useCoralColors } from "@/components/coral/useCoral"
import { useAuth } from "@/context/AppContext"
import { useCreateExpense } from "@/features/expenses/queries/useExpenses"
import { useFriends } from "@/features/friends/queries/useFriends"
import { useGroups } from "@/features/groups/queries/useGroups"
import { useAppToast } from "@/hooks/useAppToast"
import { useUIStore } from "@/store/useUIStore"
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/types"
import type { ExpenseNewRouteParams } from "@/types/navigation"
import { useExpenseComposer } from "@/features/expenses/hooks/useExpenseComposer"
import type { ComposerParticipant } from "@/features/expenses/hooks/useExpenseComposer"
import { ExpenseSplitEditor } from "@/features/expenses/components/ExpenseSplitEditor"
import { parseMinorInput, minorToMajor } from "@/features/money/splits"
import { formatAmount, getCurrencySymbol } from "@/components/ui/AmountDisplay"
import type { MoneyContext, ReceiptMimeType } from "@/features/money/types"
import { expensesApi } from "@/features/expenses/services/api"
import { ExpenseCreateSuccess } from "@/features/expenses/components/ExpenseCreateSuccess"

export default function NewExpenseScreenV2(): JSX.Element {
  const rawParams = useLocalSearchParams<ExpenseNewRouteParams>()
  const initialGroupId = rawParams.groupId
  const initialFriendId = rawParams.friendId
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { currentUser } = useAuth()
  const coral = useCoralColors()
  const { data: groups = [] } = useGroups(currentUser?.id)
  const { data: friends = [] } = useFriends(currentUser?.id)
  const preferredCurrency = useUIStore((state) => state.preferredCurrency)
  const setCurrency = useUIStore((state) => state.setCurrency)
  const { mutateAsync: createExpense } = useCreateExpense()
  const { toast } = useAppToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPayerSheet, setShowPayerSheet] = useState(false)
  const [showDateSheet, setShowDateSheet] = useState(false)
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [selectionTab, setSelectionTab] = useState<"friends" | "groups">("friends")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || "")
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(
    initialFriendId ? [initialFriendId] : []
  )
  const [showReceiptSheet, setShowReceiptSheet] = useState(false)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null)
  const [operationId] = useState(() => randomUUID())
  const submitCounterRef = useRef(0)

  const {
    state: composer,
    setAmount,
    setDescription,
    setPaidBy,
    setSplitMethod,
    setSource,
    setDate,
    setCategory,
    setContext,
    setReceipt,
    confirmCurrency,
    submitStart,
    submitSuccess,
    submitError,
    calculateResult,
  } = useExpenseComposer()

  const receiptMimeLabel =
    composer.receipt?.mimeType === "application/pdf"
      ? "PDF"
      : composer.receipt?.mimeType?.startsWith("image/")
        ? "Receipt image"
        : null

  const uniqueFriends = useMemo(
    () => friends.filter((user: any) => user.id !== currentUser.id),
    [friends, currentUser.id]
  )

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    const lowerQuery = searchQuery.toLowerCase()
    return groups.filter((g: any) => g.name.toLowerCase().includes(lowerQuery))
  }, [groups, searchQuery])

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return uniqueFriends
    const lowerQuery = searchQuery.toLowerCase()
    return uniqueFriends.filter((f: any) => f.name.toLowerCase().includes(lowerQuery))
  }, [uniqueFriends, searchQuery])

  const selectedGroup = selectedGroupId
    ? groups.find((g: any) => g.id === selectedGroupId)
    : undefined

  const selectedFriends = useMemo(() => {
    return selectedFriendIds
      .map((friendId) => uniqueFriends.find((f: any) => f.id === friendId))
      .filter(Boolean)
  }, [uniqueFriends, selectedFriendIds])

  const participants = useMemo((): ComposerParticipant[] => {
    if (selectedGroup) {
      return [
        { userId: currentUser.id, name: "You" },
        ...selectedGroup.members
          .filter((m: any) => m.userId !== currentUser.id)
          .map((m: any) => ({
            userId: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
          })),
      ]
    }
    if (selectedFriends.length > 0) {
      return [
        { userId: currentUser.id, name: "You" },
        ...selectedFriends.map((f: any) => ({
          userId: f.id,
          name: f.name,
          avatar: f.avatar,
        })),
      ]
    }
    return []
  }, [selectedGroup, selectedFriends, currentUser.id])

  const hasSelection = !!selectedGroup || selectedFriendIds.length > 0
  const hasContext = hasSelection && !!composer.context
  const canChangeContext = !initialGroupId && !initialFriendId

  const handleConfirmContext = useCallback(() => {
    if (!hasSelection) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const context: MoneyContext = selectedGroup
      ? { type: "group", groupId: selectedGroup.id }
      : { type: "direct", friendshipId: selectedFriendIds[0] }

    const currency = selectedGroup
      ? selectedGroup.currency
      : preferredCurrency.code

    setContext(context, participants, currency)
  }, [hasSelection, selectedGroup, selectedFriendIds, participants, preferredCurrency.code, setContext])

  const handleChangeContext = useCallback(() => {
    setContext(undefined as any, [], "USD")
    setSelectedGroupId("")
    setSelectedFriendIds([])
  }, [setContext])

  const handleSourceChange = useCallback(
    (userId: string, value: string) => {
      const method = composer.splitMethod
      if (method === "custom") {
        try {
          const amountMinor = parseMinorInput(value, composer.currency)
          setSource(userId, { amountMinor })
        } catch {
          setSource(userId, { amountMinor: 0 })
        }
      } else if (method === "percentage") {
        const pct = parseFloat(value) || 0
        const percentageUnits = Math.round(pct * 10000)
        setSource(userId, { percentageUnits })
      } else if (method === "shares") {
        const shares = parseFloat(value) || 0
        const shareUnits = Math.round(shares * 1000000)
        setSource(userId, { shareUnits })
      }
    },
    [composer.splitMethod, composer.currency, setSource]
  )

  const handleApplySplit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const handlePickImage = useCallback(
    async (useCamera: boolean) => {
      setShowReceiptSheet(false)

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.8,
      }

      let result: ImagePicker.ImagePickerResult
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync()
        if (!perm.granted) {
          toast.show({
            label: "Camera permission needed",
            variant: "danger",
            placement: "top",
          })
          return
        }
        result = await ImagePicker.launchCameraAsync(options)
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!perm.granted) {
          toast.show({
            label: "Gallery permission needed",
            variant: "danger",
            placement: "top",
          })
          return
        }
        result = await ImagePicker.launchImageLibraryAsync(options)
      }

      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      const mimeType = asset.mimeType || "image/jpeg"

      const allowedMime: ReceiptMimeType[] = [
        "image/jpeg",
        "image/png",
        "image/heic",
        "application/pdf",
      ]
      if (!allowedMime.includes(mimeType as ReceiptMimeType)) {
        toast.show({
          label: "Unsupported file type",
          description: "Please select a JPEG, PNG, HEIC, or PDF file.",
          variant: "danger",
          placement: "top",
        })
        return
      }

      if (asset.fileSize && asset.fileSize > 10_485_760) {
        toast.show({
          label: "File too large",
          description: "Maximum file size is 10 MB.",
          variant: "danger",
          placement: "top",
        })
        return
      }

      setIsUploadingReceipt(true)
      try {
        const key = await expensesApi.uploadStagedReceipt({
          operationId: operationId,
          uri: asset.uri,
          mimeType: mimeType as ReceiptMimeType,
        })
        setReceipt({ key, mimeType, sizeBytes: asset.fileSize ?? 0 })
        toast.show({
          label: "Receipt attached",
          variant: "success",
          placement: "top",
        })
      } catch (e: any) {
        toast.show({
          label: "Upload failed",
          description: e.message || "Could not upload receipt.",
          variant: "danger",
          placement: "top",
        })
      } finally {
        setIsUploadingReceipt(false)
      }
    },
    [toast, setReceipt, operationId]
  )

  const handlePickPdf = useCallback(async () => {
    setShowReceiptSheet(false)

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      const mimeType = asset.mimeType || "application/pdf"

      if (mimeType !== "application/pdf") {
        toast.show({
          label: "Unsupported file type",
          description: "Please select a PDF file.",
          variant: "danger",
          placement: "top",
        })
        return
      }

      if (asset.size && asset.size > 10_485_760) {
        toast.show({
          label: "File too large",
          description: "Maximum file size is 10 MB.",
          variant: "danger",
          placement: "top",
        })
        return
      }

      setIsUploadingReceipt(true)
      try {
        const key = await expensesApi.uploadStagedReceipt({
          operationId: operationId,
          uri: asset.uri,
          mimeType: "application/pdf",
        })
        setReceipt({ key, mimeType, sizeBytes: asset.size ?? 0 })
        toast.show({
          label: "Receipt attached",
          variant: "success",
          placement: "top",
        })
      } catch (e: any) {
        toast.show({
          label: "Upload failed",
          description: e.message || "Could not upload receipt.",
          variant: "danger",
          placement: "top",
        })
      } finally {
        setIsUploadingReceipt(false)
      }
    } catch {
      toast.show({
        label: "Could not open document picker",
        variant: "danger",
        placement: "top",
      })
    }
  }, [toast, setReceipt, operationId])

  const handleRemoveReceipt = useCallback(() => {
    setReceipt(undefined)
  }, [setReceipt])

  const handleSubmit = useCallback(async () => {
    if (!composer.context || !composer.amountInput) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      return
    }

    submitCounterRef.current += 1
    const attemptId = submitCounterRef.current

    const result = calculateResult()
    if (!result) {
      toast.show({
        label: "Invalid split",
        description: "Please fix the split before submitting.",
        variant: "danger",
        placement: "top",
      })
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsSubmitting(true)
    submitStart()

    try {
      const totalMinor = result.totalMinor
      const splits = result.splits.map((s) => ({
        userId: s.userId,
        amountMinor: s.amountMinor,
        percentageUnits:
          composer.splitMethod === "percentage"
            ? Math.round((composer.splitSources[s.userId]?.percentageUnits ?? 0) * 10000)
            : undefined,
        shareUnits:
          composer.splitMethod === "shares"
            ? Math.round((composer.splitSources[s.userId]?.shareUnits ?? 0) * 1000000)
            : undefined,
        position: s.position,
      }))

      const clientOperationId = `${operationId}-${Date.now()}`

      const expenseData = {
        clientOperationId,
        context: composer.context,
        title: composer.description.trim() || "Expense",
        amountMinor: totalMinor,
        currency: composer.currency,
        category: composer.category,
        paidBy: composer.paidBy,
        splitMethod: composer.splitMethod,
        date: composer.date,
        notes: composer.notes || undefined,
        receiptKey: composer.receipt?.key || undefined,
        splits,
      }

      const newExpense = await createExpense(expenseData)

      if (attemptId !== submitCounterRef.current) return

      submitSuccess()
      setCreatedExpenseId(newExpense.id)
    } catch (e: any) {
      if (attemptId !== submitCounterRef.current) return
      submitError({ message: e.message || "Failed to add expense" })
      toast.show({
        label: "Error",
        description: e.message || "Something went wrong.",
        variant: "danger",
        placement: "top",
      })
    } finally {
      if (attemptId === submitCounterRef.current) {
        setIsSubmitting(false)
      }
    }
  }, [composer, calculateResult, submitStart, submitSuccess, submitError, toast, createExpense, setCreatedExpenseId, operationId])

  const closeScreen = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/home")
    }
  }, [router])

  const handleUndoSuccess = useCallback(() => {
    toast.show({
      label: "Expense undone",
      variant: "success",
      placement: "top",
    })
    closeScreen()
  }, [toast, closeScreen])

  const handleReturn = useCallback(() => {
    closeScreen()
  }, [closeScreen])

  const handleViewExpense = useCallback(() => {
    if (createdExpenseId) {
      router.push(`/expense/${createdExpenseId}`)
    }
  }, [createdExpenseId, router])

  const handleBackToGroup = useCallback(() => {
    if (composer.context?.type === "group") {
      router.push(`/group/${composer.context.groupId}`)
    } else {
      closeScreen()
    }
  }, [composer.context, closeScreen, router])

  const currencyOptions = CURRENCIES.map((c) => ({
    label: `${c.symbol} ${c.code}`,
    value: c.code,
  }))

  if (!currentUser) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={coral.foreground} />
      </View>
    )
  }

  const dateString = composer.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const todayDateString = new Date().toDateString() === composer.date.toDateString() ? "Today" : dateString

  const contextName = selectedGroup?.name || selectedFriends.map((f: any) => f.name.split(" ")[0]).join(", ")
  const categoryLabel = EXPENSE_CATEGORIES.find((c) => c.key === composer.category)?.label || composer.category
  const formattedContext = composer.category
    ? `${contextName} · ${categoryLabel} · ${dateString}`
    : `${contextName} · ${dateString}`

  const splitResult = calculateResult()
  const totalMajor = splitResult ? minorToMajor(splitResult.totalMinor, composer.currency) : 0
  const totalDisplay = totalMajor > 0
    ? formatAmount(totalMajor, composer.currency)
    : getCurrencySymbol(composer.currency) + "0.00"

  const symbol = getCurrencySymbol(composer.currency)

  const payerName =
    composer.paidBy === currentUser.id
      ? "You"
      : participants.find((p) => p.userId === composer.paidBy)?.name || "Select payer"
  const paidByMeta = totalMajor > 0 ? `Covered ${totalDisplay}` : ""

  const SPLIT_METHOD_LABELS: Record<string, string> = {
    equal: "Equally",
    custom: "Exact amounts",
    percentage: "By percentage",
    shares: "By shares",
  }
  const splitMethodLabel = SPLIT_METHOD_LABELS[composer.splitMethod] || composer.splitMethod
  const splitCountLabel = `${participants.length} included`

  const nonPayerParticipants = participants.filter((p) => p.userId !== composer.paidBy)
  const noteText =
    nonPayerParticipants.length > 0 && splitResult
      ? nonPayerParticipants
          .map((p) => {
            const s = splitResult.splits.find((sp) => sp.userId === p.userId)
            const amt = s
              ? formatAmount(minorToMajor(s.amountMinor, composer.currency), composer.currency)
              : "$0"
            return p.userId === currentUser.id ? `you owe ${amt}` : `${p.name} owes you ${amt}`
          })
          .join(" · ")
      : ""

  const receiptLabel = composer.receipt
    ? receiptMimeLabel || "Receipt attached"
    : isUploadingReceipt
      ? "Uploading..."
      : "Add a receipt"

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar
        title="Add expense"
        onBack={closeScreen}
      />

      {composer.status === "success" && createdExpenseId ? (
        <ExpenseCreateSuccess
          totalMinor={(() => {
            const r = calculateResult()
            return r?.totalMinor ?? 0
          })()}
          currency={composer.currency}
          paidByUserId={composer.paidBy}
          paidByUserName={payerName}
          currentUserId={currentUser.id}
          splits={(() => {
            const r = calculateResult()
            return r?.splits.map((s) => ({ userId: s.userId, amountMinor: s.amountMinor })) ?? []
          })()}
          expenseId={createdExpenseId}
          groupId={composer.context?.type === "group" ? composer.context.groupId : undefined}
          groupName={contextName}
          onReturn={handleReturn}
          onViewExpense={handleViewExpense}
          onBackToGroup={handleBackToGroup}
          onUndoSuccess={handleUndoSuccess}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 120 }}
          >
            {!hasContext ? (
              <View style={{ paddingTop: 24, gap: 20 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: coral.border,
                    overflow: "hidden",
                  }}
                >
                  <View style={{ flexDirection: "row" }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelectionTab("friends")}
                      style={({ pressed }) => ({
                        flex: 1,
                        height: 44,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          selectionTab === "friends" ? coral.foreground : "transparent",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: "InstrumentSans_600SemiBold",
                          fontSize: 14,
                          color: selectionTab === "friends" ? coral.surface : coral.foreground,
                        }}
                      >
                        Friends
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelectionTab("groups")}
                      style={({ pressed }) => ({
                        flex: 1,
                        height: 44,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          selectionTab === "groups" ? coral.foreground : "transparent",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: "InstrumentSans_600SemiBold",
                          fontSize: 14,
                          color: selectionTab === "groups" ? coral.surface : coral.foreground,
                        }}
                      >
                        Groups
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <TextInput
                placeholder={
                  selectionTab === "friends" ? "Search friends..." : "Search groups..."
                }
                placeholderTextColor={coral.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  borderWidth: 1,
                  borderColor: coral.border,
                  paddingHorizontal: 15,
                  minHeight: 54,
                  borderRadius: 14,
                  fontSize: 16,
                  fontFamily: "InstrumentSans_400Regular",
                  color: coral.foreground,
                  backgroundColor: coral.surface,
                }}
              />

              <View style={{ gap: 4 }}>
                {selectionTab === "friends"
                  ? filteredFriends.map((friend: any) => {
                      const isSelected = selectedFriendIds.includes(friend.id)
                      return (
                        <Pressable
                          key={friend.id}
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.selectionAsync()
                            setSelectedFriendIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== friend.id)
                                : [...prev, friend.id]
                            )
                            setSelectedGroupId("")
                          }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            gap: 12,
                            borderRadius: 16,
                            backgroundColor: isSelected ? coral.accentSoft : "transparent",
                            borderWidth: 1,
                            borderColor: isSelected ? coral.accent : "transparent",
                            opacity: pressed ? 0.7 : 1,
                            minHeight: 68,
                          })}
                        >
                          <AppUserAvatar user={friend} size="md" />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_600SemiBold",
                                fontSize: 15,
                                color: coral.foreground,
                              }}
                            >
                              {friend.name}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_400Regular",
                                fontSize: 13,
                                color: coral.muted,
                                marginTop: 2,
                              }}
                            >
                              {friend.email}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isSelected ? coral.accent : coral.border,
                              backgroundColor: isSelected ? coral.accent : coral.surface,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && <icons.Check size={14} color={coral.inkOnAccent} />}
                          </View>
                        </Pressable>
                      )
                    })
                  : filteredGroups.map((group: any) => {
                      const isSelected = selectedGroupId === group.id
                      return (
                        <Pressable
                          key={group.id}
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.selectionAsync()
                            setSelectedGroupId(isSelected ? "" : group.id)
                            setSelectedFriendIds([])
                          }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            gap: 12,
                            borderRadius: 16,
                            backgroundColor: isSelected ? coral.accentSoft : "transparent",
                            borderWidth: 1,
                            borderColor: isSelected ? coral.accent : "transparent",
                            opacity: pressed ? 0.7 : 1,
                            minHeight: 68,
                          })}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: coral.border,
                              backgroundColor: coral.surface,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_600SemiBold",
                                fontSize: 18,
                                color: coral.foreground,
                              }}
                            >
                              {group.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_600SemiBold",
                                fontSize: 15,
                                color: coral.foreground,
                              }}
                            >
                              {group.name}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_400Regular",
                                fontSize: 13,
                                color: coral.muted,
                                marginTop: 2,
                              }}
                            >
                              {group.members.length} people
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isSelected ? coral.accent : coral.border,
                              backgroundColor: isSelected ? coral.accent : coral.surface,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && <icons.Check size={14} color={coral.inkOnAccent} />}
                          </View>
                        </Pressable>
                      )
                    })}
              </View>
            </View>
          ) : (
            <View style={{ gap: 16, paddingTop: 22 }}>
              <View style={{ alignItems: "center", paddingTop: 4, paddingBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: "IBMPlexMono_600SemiBold",
                      fontSize: 40,
                      color: coral.foreground,
                      letterSpacing: -0.04 * 40,
                    }}
                  >
                    {symbol}
                  </Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={coral.muted}
                    value={composer.amountInput}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    style={{
                      fontFamily: "IBMPlexMono_600SemiBold",
                      fontSize: 43,
                      color: coral.foreground,
                      letterSpacing: -0.04 * 43,
                      minWidth: 120,
                      textAlign: "left",
                      padding: 0,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 13,
                    color: coral.muted,
                    marginTop: 8,
                  }}
                >
                  {formattedContext}
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 13,
                    color: coral.muted,
                  }}
                >
                  Description
                </Text>
                <TextInput
                  placeholder="e.g. Dinner at Farzi"
                  placeholderTextColor={coral.muted}
                  value={composer.description}
                  onChangeText={setDescription}
                  style={{
                    borderWidth: 1,
                    borderColor: coral.border,
                    paddingHorizontal: 15,
                    minHeight: 54,
                    borderRadius: 14,
                    fontSize: 16,
                    fontFamily: "InstrumentSans_400Regular",
                    color: coral.foreground,
                    backgroundColor: coral.surface,
                  }}
                />
              </View>

              {canChangeContext && (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleChangeContext}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: coral.border,
                    backgroundColor: coral.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  {selectedGroup ? (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: coral.border,
                        backgroundColor: coral.bg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <icons.Globe size={18} color={coral.muted} strokeWidth={1.5} />
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row" }}>
                      {selectedFriends.slice(0, 3).map((friend: any, idx: number) => (
                        <View
                          key={friend.id}
                          style={{
                            marginLeft: idx === 0 ? 0 : -8,
                            zIndex: selectedFriends.length - idx,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: coral.bg,
                          }}
                        >
                          <AppUserAvatar user={friend} size="sm" />
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_500Medium",
                        fontSize: 11,
                        color: coral.muted,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {selectedGroup ? "Group" : "Friend"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 16,
                        color: coral.foreground,
                        marginTop: 1,
                      }}
                    >
                      {contextName}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 13,
                      color: coral.accent,
                    }}
                  >
                    Change
                  </Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPayerSheet(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 15,
                  minHeight: 54,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: coral.border,
                  backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 11,
                      color: coral.muted,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 2,
                    }}
                  >
                    Paid by
                  </Text>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_600SemiBold",
                      fontSize: 16,
                      color: coral.foreground,
                    }}
                  >
                    {payerName}
                  </Text>
                </View>
                {paidByMeta ? (
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 13,
                      color: coral.muted,
                      marginRight: 8,
                    }}
                  >
                    {paidByMeta}
                  </Text>
                ) : null}
                <icons.ChevronDown size={16} color={coral.muted} />
              </Pressable>

              <ExpenseSplitEditor
                state={composer}
                currentUserId={currentUser.id}
                onSplitMethodChange={setSplitMethod}
                onSourceChange={handleSourceChange}
                onApply={handleApplySplit}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDateSheet(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 15,
                  minHeight: 54,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: coral.border,
                  backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 11,
                      color: coral.muted,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 2,
                    }}
                  >
                    Date
                  </Text>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_600SemiBold",
                      fontSize: 16,
                      color: coral.foreground,
                    }}
                  >
                    {todayDateString}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 13,
                    color: coral.muted,
                    marginRight: 8,
                  }}
                >
                  {dateString}
                </Text>
                <icons.ChevronDown size={16} color={coral.muted} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowCategorySheet(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 15,
                  minHeight: 54,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: coral.border,
                  backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 11,
                      color: coral.muted,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 2,
                    }}
                  >
                    Category
                  </Text>
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_600SemiBold",
                      fontSize: 16,
                      color: coral.foreground,
                    }}
                  >
                    {categoryLabel}
                  </Text>
                </View>
                <icons.ChevronDown size={16} color={coral.muted} />
              </Pressable>

              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 13,
                    color: coral.muted,
                  }}
                >
                  Receipt
                </Text>
                {composer.receipt ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 15,
                      minHeight: 54,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: coral.accent,
                      backgroundColor: coral.accentSoft,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <icons.Receipt size={18} color={coral.accent} />
                      <Text
                        style={{
                          fontFamily: "InstrumentSans_500Medium",
                          fontSize: 14,
                          color: coral.accentInk,
                        }}
                      >
                        {receiptLabel}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleRemoveReceipt}
                      hitSlop={8}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <icons.X size={18} color={coral.accentInk} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowReceiptSheet(true)}
                    disabled={isUploadingReceipt}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingHorizontal: 15,
                      minHeight: 54,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: coral.border,
                      backgroundColor: coral.surface,
                      borderStyle: "dashed",
                      opacity: isUploadingReceipt ? 0.45 : pressed ? 0.7 : 1,
                    })}
                  >
                    {isUploadingReceipt ? (
                      <ActivityIndicator size="small" color={coral.muted} />
                    ) : (
                      <icons.Paperclip size={18} color={coral.muted} />
                    )}
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_500Medium",
                        fontSize: 14,
                        color: coral.muted,
                      }}
                    >
                      {receiptLabel}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={{ marginTop: 4 }}>
                <CoralButton
                  label={`Add expense — ${totalDisplay}`}
                  onPress={handleSubmit}
                  variant="primary"
                  disabled={isSubmitting || composer.status === "submitting"}
                  loading={isSubmitting || composer.status === "submitting"}
                />
              </View>

              {noteText ? (
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 13,
                    color: coral.muted,
                    textAlign: "center",
                  }}
                >
                  {noteText}
                </Text>
              ) : null}
            </View>
          )}
        </ScrollView>

          {!hasContext && hasSelection && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 16),
                borderTopWidth: 1,
                borderTopColor: coral.border,
                backgroundColor: coral.bg,
              }}
            >
              <CoralButton
                label="Continue"
                onPress={handleConfirmContext}
                variant="primary"
              />
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      <CoralSheet visible={showPayerSheet} onClose={() => setShowPayerSheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 4 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 17,
              color: coral.foreground,
              marginBottom: 12,
            }}
          >
            Paid by
          </Text>
          {participants.map((p) => {
            const isSelected = composer.paidBy === p.userId
            const isMe = p.userId === currentUser.id
            return (
              <Pressable
                key={p.userId}
                accessibilityRole="button"
                onPress={() => {
                  setPaidBy(p.userId)
                  setShowPayerSheet(false)
                  Haptics.selectionAsync()
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppUserAvatar
                  user={{
                    id: p.userId,
                    name: p.name,
                    initials: p.name.charAt(0).toUpperCase(),
                  }}
                  size="md"
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {isMe ? "You" : p.name}
                </Text>
                {isSelected && (
                  <icons.Check size={20} color={coral.accent} strokeWidth={2.5} />
                )}
              </Pressable>
            )
          })}
        </View>
      </CoralSheet>

      <CoralSheet visible={showDateSheet} onClose={() => setShowDateSheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 17,
              color: coral.foreground,
              marginBottom: 12,
            }}
          >
            Date
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 15,
              color: coral.muted,
              marginBottom: 16,
            }}
          >
            {dateString}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDate(new Date())
              setShowDateSheet(false)
              Haptics.selectionAsync()
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 15,
                color: coral.accent,
              }}
            >
              Set to today
            </Text>
          </Pressable>
        </View>
      </CoralSheet>

      <CoralSheet visible={showReceiptSheet} onClose={() => setShowReceiptSheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 17,
              color: coral.foreground,
              marginBottom: 12,
            }}
          >
            Add receipt
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => handlePickImage(false)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <icons.Image size={20} color={coral.foreground} />
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 16,
                color: coral.foreground,
              }}
            >
              Gallery
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handlePickImage(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <icons.Camera size={20} color={coral.foreground} />
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 16,
                color: coral.foreground,
              }}
            >
              Camera
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handlePickPdf}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <icons.FileText size={20} color={coral.foreground} />
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 16,
                color: coral.foreground,
              }}
            >
              PDF
            </Text>
          </Pressable>
        </View>
      </CoralSheet>

      <CoralSheet visible={showCategorySheet} onClose={() => setShowCategorySheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 4 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 17,
              color: coral.foreground,
              marginBottom: 12,
            }}
          >
            Category
          </Text>
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = composer.category === cat.key
            return (
              <Pressable
                key={cat.key}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(cat.key)
                  setShowCategorySheet(false)
                  Haptics.selectionAsync()
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {cat.label}
                </Text>
                {isSelected && (
                  <icons.Check size={20} color={coral.accent} strokeWidth={2.5} />
                )}
              </Pressable>
            )
          })}
        </View>
      </CoralSheet>
    </CoralScreen>
  )
}
