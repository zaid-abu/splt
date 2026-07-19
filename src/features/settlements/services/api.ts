import { supabase } from "@/services/supabase/client";
import type { Settlement } from "@/types";
import { mapSettlement, toSettlementInsert, type SettlementRow } from "@/services/api/mappers";
import type { SettlementMutationInput } from "@/features/money/types";

const settlementSelect = "*, fromUser:users!from_user_id(*), toUser:users!to_user_id(*)";

function getGroupAndFriendship(context: SettlementMutationInput["context"]) {
  if (context.type === "group") {
    return { groupId: context.groupId, friendshipId: "" };
  }
  return { groupId: "", friendshipId: context.friendshipId };
}

export const settlementsApi = {
  async fetchGroupSettlements(groupId: string): Promise<Settlement[]> {
    const { data, error } = await supabase
      .from("settlements")
      .select(settlementSelect)
      .eq("group_id", groupId)
      .order("date", { ascending: false })
      .returns<SettlementRow[]>();

    if (error) throw error;
    return data?.map(mapSettlement) ?? [];
  },

  async fetchUserSettlements(userId: string): Promise<Settlement[]> {
    const { data, error } = await supabase
      .from("settlements")
      .select(settlementSelect)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("date", { ascending: false })
      .returns<SettlementRow[]>();

    if (error) throw error;
    return data?.map(mapSettlement) ?? [];
  },

  async createSettlement(input: SettlementMutationInput): Promise<Settlement> {
    const { groupId, friendshipId } = getGroupAndFriendship(input.context);

    const { data, error } = await supabase.rpc("create_settlement_v2", {
      p_client_operation_id: input.clientOperationId,
      p_counterparty_id: input.counterpartyId,
      p_group_id: groupId,
      p_friendship_id: friendshipId,
      p_amount_minor: input.amountMinor,
      p_currency: input.currency,
      p_method: input.method,
      p_note: input.note ?? "",
    });

    if (error) throw error;
    return this.fetchSettlement(data);
  },

  async fetchSettlement(settlementId: string): Promise<Settlement> {
    const { data, error } = await supabase
      .from("settlements")
      .select(settlementSelect)
      .eq("id", settlementId)
      .single()
      .returns<SettlementRow>();

    if (error) throw error;
    return mapSettlement(data);
  },

  async addSettlement(settlementData: Partial<Settlement>): Promise<Settlement> {
    const { data, error } = await supabase
      .from("settlements")
      .insert(toSettlementInsert(settlementData))
      .select(settlementSelect)
      .single()
      .returns<SettlementRow>();

    if (error) throw error;
    return mapSettlement(data);
  },

  async deleteSettlement(settlementId: string): Promise<void> {
    const { error } = await supabase.from("settlements").delete().eq("id", settlementId);
    if (error) throw error;
  },
};
