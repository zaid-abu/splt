import { supabase } from "@/services/supabase/client";
import type { Settlement } from "@/types";
import { mapSettlement, toSettlementInsert, type SettlementRow } from "@/services/api/mappers";
import { handleSupabaseError } from "@/services/api/errors";

const settlementSelect = "*, fromUser:users!from_user_id(*), toUser:users!to_user_id(*)";

export const settlementsApi = {
  async fetchGroupSettlements(groupId: string): Promise<Settlement[]> {
    const { data, error } = await supabase
      .from("settlements")
      .select(settlementSelect)
      .eq("group_id", groupId)
      .order("date", { ascending: false })
      .returns<SettlementRow[]>();

    if (error) handleSupabaseError(error, "Failed to fetch group settlements");
    return data?.map(mapSettlement) ?? [];
  },

  async fetchUserSettlements(userId: string): Promise<Settlement[]> {
    const { data, error } = await supabase
      .from("settlements")
      .select(settlementSelect)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("date", { ascending: false })
      .returns<SettlementRow[]>();

    if (error) handleSupabaseError(error, "Failed to fetch user settlements");
    return data?.map(mapSettlement) ?? [];
  },

  async addSettlement(settlementData: Partial<Settlement>): Promise<Settlement> {
    const { data, error } = await supabase
      .from("settlements")
      .insert(toSettlementInsert(settlementData))
      .select(settlementSelect)
      .single()
      .returns<SettlementRow>();

    if (error) handleSupabaseError(error, "Failed to add settlement");
    return mapSettlement(data);
  },

  async deleteSettlement(settlementId: string): Promise<void> {
    const { error } = await supabase.from("settlements").delete().eq("id", settlementId);
    if (error) handleSupabaseError(error, "Failed to delete settlement");
  },
};
