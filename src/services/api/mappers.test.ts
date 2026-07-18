import { mapUser } from "./mappers";
import type { Tables } from "@/services/supabase/database.types";

describe("mapUser", () => {
  it("maps account setup state", () => {
    const row = {
      id: "user-1",
      name: "Abu Zaid",
      email: "abu@example.com",
      avatar: null,
      initials: "AZ",
      default_currency: "USD",
      setup_state: "activation_pending",
      created_at: "2026-07-18T10:00:00.000Z",
      updated_at: "2026-07-18T10:00:00.000Z",
    } as Tables<"users">;

    expect(mapUser(row)).toMatchObject({
      id: "user-1",
      setupState: "activation_pending",
    });
  });
});
