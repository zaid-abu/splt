import { supabase } from "@/services/supabase/client";
import type { Activity } from "@/types";
import { mapActivity, toActivityInsert, type ActivityRow } from "./mappers";

const activitySelect =
  "*, user:users(*), group:groups(*), expense:expenses(*), settlement:settlements(*)";

export const activitiesApi = {
  async fetchActivities(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select(activitySelect)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .returns<ActivityRow[]>();

    if (error) throw error;
    return data?.map(mapActivity) ?? [];
  },

  async logActivity(activityData: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from("activities")
      .insert(toActivityInsert(activityData))
      .select(activitySelect)
      .single()
      .returns<ActivityRow>();

    if (error) throw error;
    return mapActivity(data);
  },

  async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase.from("activities").delete().eq("id", activityId);
    if (error) throw error;
  },
};
