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
          amount_minor: number | null;
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
          amount_minor?: number | null;
          currency?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
        Relationships: [];
      };
      expense_comments: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expense_comments"]["Insert"]>;
        Relationships: [];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          amount_minor: number;
          percentage: number | null;
          shares: number | null;
          position: number;
          paid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          amount_minor: number;
          percentage?: number | null;
          shares?: number | null;
          position: number;
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
          friendship_id: string | null;
          title: string;
          amount: number;
          amount_minor: number;
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
          created_by: string;
          split_method: "equal" | "custom" | "percentage" | "shares";
          date: string;
          notes: string | null;
          receipt_url: string | null;
          receipt_key: string | null;
          client_operation_id: string | null;
          recurring_expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          friendship_id?: string | null;
          title: string;
          amount: number;
          amount_minor: number;
          currency: string;
          category: Database["public"]["Tables"]["expenses"]["Row"]["category"];
          paid_by: string;
          created_by: string;
          split_method: Database["public"]["Tables"]["expenses"]["Row"]["split_method"];
          date?: string;
          notes?: string | null;
          receipt_url?: string | null;
          receipt_key?: string | null;
          client_operation_id?: string | null;
          recurring_expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      friend_invites: {
        Row: {
          id: string;
          created_by: string;
          token_hash: number[];
          client_operation_id: string;
          expires_at: string;
          revoked_at: string | null;
          redeemed_by: string | null;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          token_hash: number[];
          client_operation_id: string;
          expires_at: string;
          revoked_at?: string | null;
          redeemed_by?: string | null;
          redeemed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friend_invites"]["Insert"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: "pending" | "accepted" | "blocked" | "declined" | "removed";
          metadata: Json | null;
          requested_by: string;
          blocked_by: string | null;
          request_expires_at: string | null;
          status_before_block: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: "pending" | "accepted" | "blocked" | "declined" | "removed";
          metadata?: Json | null;
          requested_by: string;
          blocked_by?: string | null;
          request_expires_at?: string | null;
          status_before_block?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          inviter_id: string;
          invitee_id: string;
          status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          inviter_id: string;
          invitee_id: string;
          status?: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_invitations"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          balance: number;
          new_expense_alerts: boolean;
          created_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          balance?: number;
          new_expense_alerts?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          kind: string | null;
          icon: string;
          description: string | null;
          currency: string;
          archived_at: string | null;
          created_at: string;
          created_by: string;
          total_expenses: number;
          simplify_debts: boolean;
          default_split_method: "equal" | "custom" | "percentage" | "shares";
          client_operation_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          kind?: string | null;
          icon: string;
          description?: string | null;
          currency: string;
          archived_at?: string | null;
          created_at?: string;
          created_by: string;
          total_expenses?: number;
          simplify_debts?: boolean;
          default_split_method?: "equal" | "custom" | "percentage" | "shares";
          client_operation_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          kind: "friend_request" | "group_invite" | "balance_reminder" | "expense_added";
          actor_id: string | null;
          group_id: string | null;
          friendship_id: string | null;
          expense_id: string | null;
          payload: Json;
          client_operation_id: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          kind: "friend_request" | "group_invite" | "balance_reminder" | "expense_added";
          actor_id?: string | null;
          group_id?: string | null;
          friendship_id?: string | null;
          expense_id?: string | null;
          payload?: Json;
          client_operation_id?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      receipt_uploads: {
        Row: {
          id: string;
          owner_id: string;
          client_operation_id: string;
          object_key: string;
          status: "staged" | "attached" | "cleanup_pending" | "cleaned";
          attached_expense_id: string | null;
          mime_type: string;
          size_bytes: number;
          created_at: string;
          cleaned_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          client_operation_id: string;
          object_key: string;
          status?: "staged" | "attached" | "cleanup_pending" | "cleaned";
          attached_expense_id?: string | null;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
          cleaned_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["receipt_uploads"]["Insert"]>;
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
          amount_minor: number | null;
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
          amount_minor?: number | null;
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
      settlements: {
        Row: {
          id: string;
          group_id: string | null;
          friendship_id: string | null;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          amount_minor: number;
          currency: string;
          method: "cash" | "bank_transfer" | "other";
          date: string;
          note: string | null;
          client_operation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          friendship_id?: string | null;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          amount_minor: number;
          currency: string;
          method: "cash" | "bank_transfer" | "other";
          date?: string;
          note?: string | null;
          client_operation_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlements"]["Insert"]>;
        Relationships: [];
      };
      user_search_attempts: {
        Row: {
          id: number;
          user_id: string;
          attempted_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          attempted_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_search_attempts"]["Insert"]>;
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
    };
    Views: Record<string, never>;
    Functions: {
      acquire_balance_locks: {
        Args: {
          p_keys: string[];
        };
        Returns: void;
      };
      archive_group_v2: {
        Args: {
          p_group_id: string;
        };
        Returns: void;
      };
      balance_key: {
        Args: {
          p_context_type: string;
          p_context_id: string;
          p_user_a: string;
          p_user_b: string;
          p_currency: string;
        };
        Returns: string;
      };
      can_view_expense: {
        Args: {
          p_expense_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      can_view_group_history: {
        Args: {
          p_group_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      cancel_group_invitation: {
        Args: {
          p_invitation_id: string;
        };
        Returns: void;
      };
      context_has_nonzero_balances: {
        Args: {
          p_context_type: string;
          p_context_id: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      create_expense_internal_v2: {
        Args: {
          p_actor_id: string;
          p_client_operation_id: string;
          p_group_id: string;
          p_friendship_id: string;
          p_title: string;
          p_amount_minor: number;
          p_currency: string;
          p_category: string;
          p_paid_by: string;
          p_split_method: string;
          p_date: string;
          p_notes: string;
          p_receipt_key: string;
          p_splits: Json;
        };
        Returns: string;
      };
      create_expense_v2: {
        Args: {
          p_client_operation_id: string;
          p_group_id: string;
          p_friendship_id: string;
          p_title: string;
          p_amount_minor: number;
          p_currency: string;
          p_category: string;
          p_paid_by: string;
          p_split_method: string;
          p_date: string;
          p_notes: string;
          p_receipt_key: string;
          p_splits: Json;
        };
        Returns: string;
      };
      create_friend_invite: {
        Args: {
          p_client_operation_id: string;
        };
        Returns: {
          invite_id: string;
          raw_token: string;
          expires_at: string;
        }[];
      };
      create_group_v2: {
        Args: {
          p_client_operation_id: string;
          p_name: string;
          p_kind: string;
          p_icon: string;
          p_currency: string;
          p_invitee_ids: string[];
        };
        Returns: string;
      };
      create_settlement_v2: {
        Args: {
          p_client_operation_id: string;
          p_counterparty_id: string;
          p_group_id: string;
          p_friendship_id: string;
          p_amount_minor: number;
          p_currency: string;
          p_method: string;
          p_note: string;
        };
        Returns: string;
      };
      currency_minor_scale: {
        Args: {
          p_currency: string;
        };
        Returns: number;
      };
      delete_expense_v2: {
        Args: {
          p_expense_id: string;
        };
        Returns: void;
      };
      generate_due_recurring_expenses: {
        Args: {
          run_date?: string;
        };
        Returns: number;
      };
      get_open_balances: {
        Args: Record<string, never>;
        Returns: {
          counterparty_id: string;
          context_type: string;
          context_id: string;
          currency: string;
          signed_amount_minor: number;
          last_activity_at: string;
        }[];
      };
      invite_group_members_v2: {
        Args: {
          p_group_id: string;
          p_invitee_ids: string[];
        };
        Returns: string[];
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
      leave_group_v2: {
        Args: {
          p_group_id: string;
        };
        Returns: void;
      };
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
      redeem_friend_invite: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
      register_receipt_upload: {
        Args: {
          p_client_operation_id: string;
          p_object_key: string;
          p_mime_type: string;
          p_size_bytes: number;
        };
        Returns: string;
      };
      remove_group_member_v2: {
        Args: {
          p_group_id: string;
          p_user_id: string;
        };
        Returns: void;
      };
      resolve_friend_invite: {
        Args: {
          p_token: string;
        };
        Returns: {
          state: string;
          inviter_id: string;
          expires_at: string;
        }[];
      };
      respond_group_invitation: {
        Args: {
          p_invitation_id: string;
          p_decision: string;
        };
        Returns: string;
      };
      revoke_friend_invite: {
        Args: {
          p_invite_id: string;
        };
        Returns: void;
      };
      search_user_by_exact_email: {
        Args: {
          p_email: string;
        };
        Returns: {
          state: string;
          user_id: string;
          name: string;
          initials: string;
          avatar: string;
        }[];
      };
      send_balance_reminder: {
        Args: {
          p_client_operation_id: string;
          p_group_id: string;
          p_friendship_id: string;
          p_currency: string;
          p_message: string;
        };
        Returns: string;
      };
      transition_friendship: {
        Args: {
          p_counterparty_id: string;
          p_action: string;
        };
        Returns: string;
      };
      update_expense_v2: {
        Args: {
          p_expense_id: string;
          p_title: string;
          p_amount_minor: number;
          p_currency: string;
          p_category: string;
          p_paid_by: string;
          p_split_method: string;
          p_date: string;
          p_notes: string;
          p_receipt_key: string;
          p_splits: Json;
        };
        Returns: string;
      };
      update_group_settings_v2: {
        Args: {
          p_group_id: string;
          p_name: string;
          p_kind: string;
          p_icon: string;
          p_currency: string;
          p_new_expense_alerts: boolean;
        };
        Returns: void;
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
