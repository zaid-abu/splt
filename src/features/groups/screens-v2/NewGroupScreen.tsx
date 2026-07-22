import { useState, useRef } from "react"
import { View, Pressable, Text, Keyboard } from "react-native"
import { randomUUID } from "@/utils/randomUUID"
import * as Haptics from "expo-haptics"
import * as icons from "lucide-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"

import { CoralScreen } from "@/components/coral/CoralScreen"
import { CoralTopBar } from "@/components/coral/CoralTopBar"
import { CoralField } from "@/components/coral/CoralField"
import { CoralButton } from "@/components/coral/CoralButton"
import { CoralSelect, type SelectOption } from "@/components/coral/CoralSelect"
import { useCoralColors } from "@/components/coral/useCoral"
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

function SectionLabel({ text }: { text: string }) {
  const coral = useCoralColors()
  return (
    <Text
      style={{
        fontFamily: "InstrumentSans_600SemiBold",
        fontSize: 13,
        letterSpacing: 0.04 * 13,
        color: coral.muted,
        marginTop: 4,
        marginBottom: 6,
      }}
    >
      {text}
    </Text>
  )
}

export default function NewGroupScreen() {
  const router = useRouter()
  const { resume } = useLocalSearchParams<{ resume?: string }>()
  const coral = useCoralColors()
  const { currentUser } = useAuth()
  const { mutateAsync: createGroup, isPending } = useCreateGroup()
  const { data: friends = [] } = useFriends(currentUser.id)
  const { toast } = useAppToast()
  const preferredCurrency = useUIStore((s) => s.preferredCurrency)

  const [searchSheetVisible, setSearchSheetVisible] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [icon, setIcon] = useState("Home")
  const [currencyCode, setCurrencyCode] = useState(preferredCurrency.code ?? "USD")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  const operationId = useRef(randomUUID())

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user])
    }
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
    <CoralScreen>
      <CoralTopBar title="New group" onBack={() => router.back()} />

      <CoralField
        label="Name"
        placeholder="e.g. Weekend trip"
        value={name}
        onChangeText={(v) => {
          setNameError("")
          setName(v)
        }}
        error={nameError}
        autoCapitalize="words"
      />

      <CoralSelect
        label="Currency"
        options={currencyOptions}
        value={currencyCode}
        onValueChange={setCurrencyCode}
        placeholder="Select currency"
      />

      <SectionLabel text="Icon" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? coral.accent : coral.surface,
                borderWidth: 1,
                borderColor: isSelected ? coral.accent : coral.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ico
                size={20}
                color={isSelected ? coral.inkOnAccent : coral.foreground}
                strokeWidth={isSelected ? 2.2 : 1.5}
              />
            </Pressable>
          )
        })}
      </View>

      <SectionLabel text="Participants" />
      <View
        style={{
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 12,
            minHeight: 58,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: coral.avatarSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <icons.User size={18} color={coral.avatarInk} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 15,
                color: coral.foreground,
              }}
            >
              You
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 12,
                color: coral.muted,
                marginTop: 1,
              }}
            >
              Organizer
            </Text>
          </View>
        </View>
        {selectedUsers.map((user) => (
          <View
            key={user.id}
            accessibilityLabel={user.name}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 12,
              minHeight: 58,
              borderTopWidth: 1,
              borderTopColor: coral.border,
            }}
          >
            <AppUserAvatar user={user} size="sm" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 15,
                  color: coral.foreground,
                }}
              >
                {user.name}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 12,
                  color: coral.muted,
                  marginTop: 1,
                }}
              >
                {friends.some((f) => f.id === user.id) ? "Friend" : "Will receive invite"}
              </Text>
            </View>
            <Pressable
              onPress={() => handleRemoveUser(user.id)}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <icons.X size={18} color={coral.muted} strokeWidth={1.5} />
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() => {
            Keyboard.dismiss()
            setSearchSheetVisible(true)
          }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 12,
            minHeight: 58,
            borderTopWidth: 1,
            borderTopColor: coral.border,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: coral.border,
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <icons.Plus size={18} color={coral.muted} strokeWidth={1.5} />
          </View>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 15,
              color: coral.muted,
            }}
          >
            Add participant
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 12, gap: 8 }}>
        <CoralButton
          label="Create group"
          onPress={handleCreate}
          disabled={!name.trim() || isPending}
          loading={isPending}
        />
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            textAlign: "center",
          }}
        >
          All participants will receive an invite
        </Text>
      </View>

      <UserSearchBottomSheet
        visible={searchSheetVisible}
        onClose={() => setSearchSheetVisible(false)}
        onSelect={handleAddUser}
        excludeUserIds={selectedUsers.map((u) => u.id)}
        title="Add to Group"
      />
    </CoralScreen>
  )
}
