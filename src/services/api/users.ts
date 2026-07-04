import { supabase } from "@/services/supabase/client";
import type { User } from "@/types";
import { mapUser } from "./mappers";

export const UsersService = {
  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    if (!query.trim()) return [];
    
    // ilike is case-insensitive in Postgres
    const searchTerm = `%${query.trim()}%`;
    
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .neq("id", excludeUserId)
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(20);

    if (error) throw error;
    return data.map(mapUser);
  },
};
