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
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_comments_expense_id_fkey";
            columns: ["expense_id"];
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_comments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
