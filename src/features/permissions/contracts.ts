export interface ExpensePermissionInput {
  currentUserId: string;
  createdBy: string;
  groupCreatedBy?: string;
}

export interface ExpensePermissions {
  canEdit: boolean;
  canDelete: boolean;
  deleteNeedsOwnerConfirmation: boolean;
}

export interface GroupPermissionInput {
  currentUserId: string;
  createdBy: string;
  memberIds: readonly string[];
}

export interface GroupPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canLeave: boolean;
  canRemoveMember: (memberId: string) => boolean;
  canAddMember: boolean;
}

export interface RelationshipPermissionInput {
  currentUserId: string;
  targetUserId: string;
  friendshipStatus?: string;
}

export interface RelationshipPermissions {
  canSendRequest: boolean;
  canCancelRequest: boolean;
  canAcceptRequest: boolean;
  canRejectRequest: boolean;
  canRemoveFriend: boolean;
  canBlock: boolean;
  canUnblock: boolean;
}

export function getExpensePermissions(input: ExpensePermissionInput): ExpensePermissions {
  const { currentUserId, createdBy, groupCreatedBy } = input;
  const isCreator = currentUserId === createdBy;
  const isGroupCreator = groupCreatedBy !== undefined && currentUserId === groupCreatedBy;
  const canDelete = isCreator || isGroupCreator;

  return {
    canEdit: isCreator,
    canDelete,
    deleteNeedsOwnerConfirmation: canDelete && !isCreator,
  };
}

export function getGroupPermissions(input: GroupPermissionInput): GroupPermissions {
  const { currentUserId, createdBy, memberIds } = input;
  const isCreator = currentUserId === createdBy;
  const isOnlyMember = memberIds.length === 1 && memberIds[0] === currentUserId;

  return {
    canEdit: isCreator,
    canDelete: isCreator,
    canLeave: !isCreator || (isCreator && memberIds.length <= 1),
    canRemoveMember: (memberId: string) =>
      isCreator && memberId !== createdBy && memberIds.includes(memberId),
    canAddMember: isCreator,
  };
}

export function getRelationshipPermissions(
  input: RelationshipPermissionInput
): RelationshipPermissions {
  const { friendshipStatus } = input;

  if (friendshipStatus === undefined || friendshipStatus === null) {
    return {
      canSendRequest: true,
      canCancelRequest: false,
      canAcceptRequest: false,
      canRejectRequest: false,
      canRemoveFriend: false,
      canBlock: false,
      canUnblock: false,
    };
  }

  switch (friendshipStatus) {
    case "pending":
      return {
        canSendRequest: false,
        canCancelRequest: true,
        canAcceptRequest: true,
        canRejectRequest: true,
        canRemoveFriend: false,
        canBlock: true,
        canUnblock: false,
      };
    case "accepted":
      return {
        canSendRequest: false,
        canCancelRequest: false,
        canAcceptRequest: false,
        canRejectRequest: false,
        canRemoveFriend: true,
        canBlock: true,
        canUnblock: false,
      };
    case "blocked":
      return {
        canSendRequest: false,
        canCancelRequest: false,
        canAcceptRequest: false,
        canRejectRequest: false,
        canRemoveFriend: false,
        canBlock: false,
        canUnblock: true,
      };
    case "declined":
    case "removed":
      return {
        canSendRequest: true,
        canCancelRequest: false,
        canAcceptRequest: false,
        canRejectRequest: false,
        canRemoveFriend: false,
        canBlock: true,
        canUnblock: false,
      };
    default:
      return {
        canSendRequest: true,
        canCancelRequest: false,
        canAcceptRequest: false,
        canRejectRequest: false,
        canRemoveFriend: false,
        canBlock: false,
        canUnblock: false,
      };
  }
}
