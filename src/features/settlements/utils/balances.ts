import type { Group, Expense, Settlement, Currency } from "@/types";

export type CurrencyConverter = (amount: number, from: string, to: string) => number;

export function getGroupBalances(
  groupId: string,
  expenses: Expense[],
  settlements: Settlement[],
  group: Group | undefined,
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
): Map<string, number> {
  const balances = new Map<string, number>();
  const targetCurrency = group ? group.currency : preferredCurrency.code;

  expenses
    .filter((e) => e.groupId === groupId)
    .forEach((exp) => {
      exp.splits.forEach((s) => {
        if (s.userId !== exp.paidBy) {
          const amtInPref = convertCurrency(s.amount, exp.currency, targetCurrency);
          balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) + amtInPref);
          balances.set(s.userId, (balances.get(s.userId) || 0) - amtInPref);
        }
      });
    });

  settlements
    .filter((s) => s.groupId === groupId)
    .forEach((set) => {
      const amtInPref = convertCurrency(set.amount, set.currency, targetCurrency);
      balances.set(set.toUserId, (balances.get(set.toUserId) || 0) - amtInPref);
      balances.set(set.fromUserId, (balances.get(set.fromUserId) || 0) + amtInPref);
    });

  return balances;
}

export function getSimplifiedDebts(
  groupId: string,
  expenses: Expense[],
  settlements: Settlement[],
  group: Group | undefined,
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
): { fromUserId: string; toUserId: string; amount: number }[] {
  const balances = getGroupBalances(
    groupId,
    expenses,
    settlements,
    group,
    preferredCurrency,
    convertCurrency
  );
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
    else if (balance > 0.01) creditors.push({ userId, amount: balance });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const payments: { fromUserId: string; toUserId: string; amount: number }[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      payments.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return payments;
}

export function getExactPairwiseDebts(
  groupId: string,
  expenses: Expense[],
  settlements: Settlement[],
  group: Group | undefined,
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
): { fromUserId: string; toUserId: string; amount: number }[] {
  const pairwise = new Map<string, number>();
  const targetCurrency = group ? group.currency : preferredCurrency.code;

  expenses
    .filter((e) => e.groupId === groupId)
    .forEach((exp) => {
      exp.splits.forEach((s) => {
        if (s.userId !== exp.paidBy) {
          const amtInPref = convertCurrency(s.amount, exp.currency, targetCurrency);
          const key = `${s.userId}:${exp.paidBy}`;
          pairwise.set(key, (pairwise.get(key) || 0) + amtInPref);
        }
      });
    });

  settlements
    .filter((s) => s.groupId === groupId)
    .forEach((set) => {
      const amtInPref = convertCurrency(set.amount, set.currency, targetCurrency);
      const key = `${set.fromUserId}:${set.toUserId}`;
      if (pairwise.has(key)) {
        pairwise.set(key, pairwise.get(key)! - amtInPref);
      } else {
        const revKey = `${set.toUserId}:${set.fromUserId}`;
        pairwise.set(revKey, (pairwise.get(revKey) || 0) + amtInPref);
      }
    });

  const finalDebts: { fromUserId: string; toUserId: string; amount: number }[] = [];
  const processedPairs = new Set<string>();

  for (const [key, amount] of pairwise.entries()) {
    if (processedPairs.has(key)) continue;

    const [from, to] = key.split(":");
    const revKey = `${to}:${from}`;

    const revAmount = pairwise.get(revKey) || 0;
    processedPairs.add(key);
    processedPairs.add(revKey);

    const netAmount = amount - revAmount;
    if (netAmount > 0.01) {
      finalDebts.push({ fromUserId: from, toUserId: to, amount: netAmount });
    } else if (netAmount < -0.01) {
      finalDebts.push({ fromUserId: to, toUserId: from, amount: Math.abs(netAmount) });
    }
  }

  return finalDebts.sort((a, b) => b.amount - a.amount);
}

export function getUserBalances(
  currentUserId: string,
  groupId: string | undefined,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
): Map<string, number> {
  const balances = new Map<string, number>();

  const processDebts = (group: Group, exact: boolean) => {
    const debts = exact
      ? getExactPairwiseDebts(
          group.id,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        )
      : getSimplifiedDebts(
          group.id,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        );

    const targetCurrency = exact ? group.currency : preferredCurrency.code;

    debts.forEach((debt) => {
      if (debt.fromUserId === currentUserId) {
        const amtInPref = exact
          ? convertCurrency(debt.amount, targetCurrency, preferredCurrency.code)
          : convertCurrency(debt.amount, group.currency, preferredCurrency.code);
        balances.set(debt.toUserId, (balances.get(debt.toUserId) || 0) - amtInPref);
      } else if (debt.toUserId === currentUserId) {
        const amtInPref = exact
          ? convertCurrency(debt.amount, targetCurrency, preferredCurrency.code)
          : convertCurrency(debt.amount, group.currency, preferredCurrency.code);
        balances.set(debt.fromUserId, (balances.get(debt.fromUserId) || 0) + amtInPref);
      }
    });
  };

  if (groupId) {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      processDebts(group, !group.simplifyDebts);
    }
    return balances;
  }

  groups.forEach((group) => {
    processDebts(group, !group.simplifyDebts);
  });

  const groupIds = new Set(groups.map((g) => g.id));
  const nonGroupExpenses = expenses.filter((e) => !e.groupId || !groupIds.has(e.groupId));
  const nonGroupSettlements = settlements.filter((s) => !s.groupId || !groupIds.has(s.groupId));

  nonGroupExpenses.forEach((exp) => {
    if (exp.paidBy === currentUserId) {
      exp.splits.forEach((s) => {
        if (s.userId !== currentUserId) {
          const amtInPref = convertCurrency(s.amount, exp.currency, preferredCurrency.code);
          balances.set(s.userId, (balances.get(s.userId) || 0) + amtInPref);
        }
      });
    } else {
      const mySplit = exp.splits.find((s) => s.userId === currentUserId);
      if (mySplit) {
        const amtInPref = convertCurrency(mySplit.amount, exp.currency, preferredCurrency.code);
        balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) - amtInPref);
      }
    }
  });

  nonGroupSettlements.forEach((set) => {
    if (set.fromUserId === currentUserId) {
      const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
      balances.set(set.toUserId, (balances.get(set.toUserId) || 0) + amtInPref);
    } else if (set.toUserId === currentUserId) {
      const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
      balances.set(set.fromUserId, (balances.get(set.fromUserId) || 0) - amtInPref);
    }
  });

  return balances;
}

export function getTotalOwedToMe(
  currentUserId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
): number {
  let total = 0;
  for (const [, balance] of getUserBalances(
    currentUserId,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  )) {
    if (balance > 0) total += balance;
  }
  return total;
}

export function getTotalIOwe(
  currentUserId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
): number {
  let total = 0;
  for (const [, balance] of getUserBalances(
    currentUserId,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  )) {
    if (balance < 0) total += balance;
  }
  return total;
}
