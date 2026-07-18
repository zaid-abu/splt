export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string;
          type: "expense" | "settlement" | "member_joined" | "group_created";
          group_id: string | null;
          expense_id: string | null;
          settlement_id: string | null;
          user_id: string;
          description: string;
          amount: number | null;
          currency: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "expense" | "settlement" | "member_joined" | "group_created";
          group_id?: string | null;
          expense_id?: string | null;
          settlement_id?: string | null;
          user_id: string;
          description: string;
          amount?: number | null;
          currency?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
        Relationships: [];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          percentage: number | null;
          paid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          percentage?: number | null;
          paid?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expense_splits"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          group_id: string | null;
          title: string;
          amount: number;
          currency: string;
          category:
            | "food"
            | "transport"
            | "accommodation"
            | "entertainment"
            | "shopping"
            | "utilities"
            | "health"
            | "travel"
            | "other";
          paid_by: string;
          split_method: "equal" | "custom" | "percentage";
          date: string;
          notes: string | null;
          receipt_url: string | null;
          recurring_expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          title: string;
          amount: number;
          currency: string;
          category: Database["public"]["Tables"]["expenses"]["Row"]["category"];
          paid_by: string;
          split_method: Database["public"]["Tables"]["expenses"]["Row"]["split_method"];
          date?: string;
          notes?: string | null;
          receipt_url?: string | null;
          recurring_expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          balance?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          icon: string;
          description: string | null;
          currency: string;
          created_at: string;
          created_by: string;
          total_expenses: number;
          simplify_debts: boolean;
          default_split_method: "equal" | "custom" | "percentage";
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          description?: string | null;
          currency: string;
          created_at?: string;
          created_by: string;
          total_expenses?: number;
          simplify_debts?: boolean;
          default_split_method?: "equal" | "custom" | "percentage";
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          group_id: string | null;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          currency: string;
          date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          currency: string;
          date?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlements"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar: string | null;
          initials: string;
          default_currency: string;
          setup_state: "profile_pending" | "activation_pending" | "complete";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar?: string | null;
          initials: string;
          default_currency?: string;
          setup_state?: "profile_pending" | "activation_pending" | "complete";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: "pending" | "accepted" | "rejected";
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: "pending" | "accepted" | "rejected";
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          id: string;
          group_id: string;
          created_by: string;
          paid_by_user_id: string;
          title: string;
          amount: number | null;
          currency_code: string;
          split_method: "equal" | "amount" | "percentage" | "shares";
          split_config: Json | null;
          frequency: "weekly" | "monthly" | "yearly";
          interval_value: number;
          day_of_week: number | null;
          day_of_month: number | null;
          start_date: string;
          next_run_date: string;
          reminder_days_before: number;
          auto_post: boolean;
          status: "active" | "paused";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by: string;
          paid_by_user_id: string;
          title: string;
          amount?: number | null;
          currency_code: string;
          split_method: "equal" | "amount" | "percentage" | "shares";
          split_config?: Json | null;
          frequency: "weekly" | "monthly" | "yearly";
          interval_value?: number;
          day_of_week?: number | null;
          day_of_month?: number | null;
          start_date: string;
          next_run_date: string;
          reminder_days_before?: number;
          auto_post?: boolean;
          status?: "active" | "paused";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_expenses"]["Insert"]>;
        Relationships: [];
      };
      recurring_occurrences: {
        Row: {
          id: string;
          recurring_expense_id: string;
          scheduled_for: string;
          expense_id: string | null;
          status: "pending" | "generated" | "skipped" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          recurring_expense_id: string;
          scheduled_for: string;
          expense_id?: string | null;
          status?: "pending" | "generated" | "skipped" | "failed";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_occurrences"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_recurring_date: {
        Args: {
          p_frequency: string;
          p_interval: number;
          p_current_date: string;
          p_day_of_week?: number;
          p_day_of_month?: number;
        };
        Returns: string;
      };
      generate_due_recurring_expenses: {
        Args: {
          run_date?: string;
        };
        Returns: number;
      };
      is_group_member: {
        Args: {
          target_group_id: string;
          target_user_id: string;
        };
        Returns: boolean;
      };
      is_group_owner: {
        Args: {
          target_group_id: string;
          target_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
