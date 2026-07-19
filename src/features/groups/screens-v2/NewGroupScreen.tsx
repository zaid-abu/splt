import { useState, useRef } from "react"
import { View, ScrollView, Pressable, Text, Keyboard } from "react-native"
import { randomUUID } from "@/utils/randomUUID"
import { BottomSheetModal } from "@gorhom/bottom-sheet"
import * as Haptics from "expo-haptics"
import * as icons from "lucide-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"

import { CoralScreen } from "@/components/coral/CoralScreen"
import { CoralTopBar } from "@/components/coral/CoralTopBar"
import { CoralField } from "@/components/coral/CoralField"
import { CoralButton } from "@/components/coral/CoralButton"
import { CoralSelect, type SelectOption } from "@/components/coral/CoralSelect"
import { Eyebrow } from "@/components/coral/Eyebrow"
import { useCoralColors } from "@/components/coral/useCoral"
import { MoneyRow } from "@/components/coral/MoneyRow"
import { CoralSnackbar } from "@/components/coral/CoralSnackbar"

import { useCreateGroup } from "@/features/groups/queries/useGroups"
import { useFriends } from "@/features/friends/queries/useFriends"
import { useAuth } from "@/context/AppContext"
import { useUIStore } from "@/store/useUIStore"
import { useAppToast } from "@/hooks/useAppToast"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { UserSearchBottomSheet } from "@/features/groups/components/UserSearchBottomSheet"
import { GROUP_ICONS } from "@/constants/icons"
import type { User } from "@/types"
import { CURRENCIES } from "@/types"

export default function NewGroupScreen() {
  const router = useRouter()
  const { resume } = useLocalSearchParams<{ resume?: string }>()
  const coral = useCoralColors()
  const { currentUser } = useAuth()
  const { mutateAsync: createGroup, isPending } = useCreateGroup()
  const { data: friends = [] } = useFriends(currentUser.id)
  const { toast } = useAppToast()
  const preferredCurrency = useUIStore((s) => s.preferredCurrency)

  const searchSheetRef = useRef<BottomSheetModal>(null)

  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [icon, setIcon] = useState("Home")
  const [currencyCode, setCurrencyCode] = useState(preferredCurrency.code ?? "USD")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" })

  const operationId = useRef(randomUUID())

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    searchSheetRef.current?.dismiss()
  }

  const handleRemoveUser = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError("Group name is required")
      return
    }

    try {
      const group = await createGroup({
        clientOperationId: operationId.current,
        name: name.trim(),
        icon,
        currency: currencyCode,
        inviteeIds: selectedUsers.map((u) => u.id),
      })

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      operationId.current = randomUUID()

      if (resume === "expense") {
        router.replace({ pathname: "/expense/new", params: { groupId: group.id } })
      } else {
        router.replace(`/group/${group.id}`)
      }
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to create group. Please try again.",
        variant: "danger",
        placement: "top",
      })
    }
  }

  const currencyOptions: SelectOption[] = CURRENCIES.map((c) => ({
    label: `${c.symbol} ${c.code}`,
    value: c.code,
  }))

  return (
    <CoralScreen contentContainerStyle={{ gap: 12 }}>
      <CoralTopBar title="New Group" onBack={() => router.back()} />

      <CoralField
        label="Group name"
        placeholder="e.g. Day trip to Warsaw"
        value={name}
        onChangeText={(v) => {
          setNameError("")
          setName(v)
        }}
        error={nameError}
        autoCapitalize="words"
      />

      <Eyebrow>Icon</Eyebrow>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {GROUP_ICONS.map((i) => {
          const Ico = (icons as any)[i] || icons.HelpCircle
          const isSelected = icon === i
          return (
            <Pressable
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setIcon(i)
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected ? coral.accent : coral.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? coral.accent : coral.border,
                }}
              >
                <Ico
                  size={22}
                  color={isSelected ? coral.inkOnAccent : coral.foreground}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
              </View>
            </Pressable>
          )
        })}
      </ScrollView>

      <Eyebrow>Currency</Eyebrow>
      <CoralSelect
        options={currencyOptions}
        value={currencyCode}
        onValueChange={setCurrencyCode}
        placeholder="Select currency"
      />

      <Eyebrow>Participants</Eyebrow>
      <View style={{ gap: 8 }}>
        <MoneyRow
          avatar={
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: coral.avatarSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <icons.User size={20} color={coral.avatarInk} strokeWidth={1.5} />
            </View>
          }
          title="You"
          subtitle="Organizer"
          amount=""
        />
        {selectedUsers.map((user) => (
          <MoneyRow
            key={user.id}
            avatar={<AppUserAvatar user={user} size="sm" />}
            title={user.name}
            subtitle={friends.some((f) => f.id === user.id) ? "Friend" : "Will receive invite"}
            amount=""
            rightElement={
              <Pressable
                onPress={() => handleRemoveUser(user.id)}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <icons.Trash2 size={18} color={coral.muted} strokeWidth={1.5} />
              </Pressable>
            }
          />
        ))}
        <CoralButton
          label="+ Add participant"
          variant="secondary"
          onPress={() => {
            Keyboard.dismiss()
            searchSheetRef.current?.present()
          }}
        />
      </View>

      <View style={{ height: 20 }} />

      <CoralButton
        label="Create group"
        onPress={handleCreate}
        disabled={!name.trim() || isPending}
        loading={isPending}
      />

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 13,
          color: coral.muted,
          textAlign: "center",
        }}
      >
        All participants will receive an invite
      </Text>

      <UserSearchBottomSheet
        ref={searchSheetRef}
        onSelect={handleAddUser}
        excludeUserIds={selectedUsers.map((u) => u.id)}
        title="Add to Group"
      />

      <CoralSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        actionLabel="Dismiss"
        onAction={() => setSnackbar({ visible: false, message: "" })}
      />
    </CoralScreen>
  )
}
