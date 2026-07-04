import type { SplitMethod, User } from "@/types";

export interface SplitUser {
  id: string;
}

export function calculateEqualShare(includedMembers: SplitUser[], parsedAmount: number): number {
  return includedMembers.length > 0 ? parsedAmount / includedMembers.length : 0;
}

export function calculateCustomSum(
  includedMembers: SplitUser[],
  customAmounts: Record<string, string>
): number {
  return includedMembers.reduce((sum, u) => sum + (parseFloat(customAmounts[u.id] ?? "0") || 0), 0);
}

export function calculatePercentSum(
  includedMembers: SplitUser[],
  customPercentages: Record<string, string>
): number {
  return includedMembers.reduce(
    (sum, u) => sum + (parseFloat(customPercentages[u.id] ?? "0") || 0),
    0
  );
}

export function generateSplits(
  includedMembers: User[],
  parsedAmount: number,
  splitMethod: SplitMethod,
  customAmounts: Record<string, string>,
  customPercentages: Record<string, string>
) {
  const equalShare = calculateEqualShare(includedMembers, parsedAmount);

  return includedMembers.map((u) => {
    let splitAmt = equalShare;
    if (splitMethod === "custom") {
      splitAmt = parseFloat(customAmounts[u.id] ?? "0") || 0;
    } else if (splitMethod === "percentage") {
      const pct = parseFloat(customPercentages[u.id] ?? "0") || 0;
      splitAmt = (parsedAmount * pct) / 100;
    }
    return {
      userId: u.id,
      user: u,
      amount: splitAmt,
    };
  });
}
