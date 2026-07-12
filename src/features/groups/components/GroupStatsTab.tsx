import { View } from "react-native"
import { Typography } from "heroui-native"
import { PieChart } from "react-native-gifted-charts"
import * as icons from "lucide-react-native"

import { formatAmount } from "@/components/ui/AmountDisplay"
import { UI, MetricCell } from "@/components/ui/native-ui"
import type { Expense, ExpenseCategory } from "@/types"
import { EXPENSE_CATEGORIES } from "@/types"

const CATEGORY_COLORS: Record<string, string> = {
  food: "#D97706",
  transport: "#2563EB",
  accommodation: "#DB2777",
  entertainment: "#7C3AED",
  shopping: "#DC2626",
  utilities: "#059669",
  health: "#0891B2",
  travel: "#4F46E5",
  other: "#6B7280",
}

interface GroupStatsTabProps {
  groupId: string
  expenses: Expense[]
  groupCurrency: string
}

export function GroupStatsTab({ groupId: _groupId, expenses, groupCurrency }: GroupStatsTabProps) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const expenseCount = expenses.length

  const categoryTotals = new Map<ExpenseCategory, number>()
  expenses.forEach((e) => {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount)
  })
  const categoryData = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  const perPerson = new Map<string, { name: string; total: number; count: number }>()
  expenses.forEach((e) => {
    const entry = perPerson.get(e.paidBy) ?? {
      name: e.paidByUser?.name ?? "Someone",
      total: 0,
      count: 0,
    }
    entry.total += e.amount
    entry.count += 1
    perPerson.set(e.paidBy, entry)
  })
  const personEntries = Array.from(perPerson.entries())
    .map(([, v]) => v)
    .sort((a, b) => b.total - a.total)

  const topSpender = personEntries[0]
  const mostExpenses = personEntries.sort((a, b) => b.count - a.count)[0]

  if (expenses.length === 0) {
    return (
      <View
        style={{
          margin: UI.space.page,
          alignItems: "center",
          paddingVertical: 36,
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: UI.radius.lg,
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <icons.BarChart3 size={24} color={UI.color.text} strokeWidth={1.8} />
        </View>
        <Typography
          style={{
            fontSize: 16,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            marginBottom: 4,
          }}
        >
          No stats yet
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            textAlign: "center",
          }}
        >
          Add expenses to see group statistics
        </Typography>
      </View>
    )
  }

  return (
    <View style={{ paddingHorizontal: UI.space.page, paddingTop: 16, gap: 20 }}>
      {/* Metric row */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCell label="Total Spent" value={formatAmount(totalSpent, groupCurrency)} tone="brand" />
        <MetricCell label="Expenses" value={String(expenseCount)} />
      </View>

      {/* Category pie chart */}
      {categoryData.length > 0 && (
        <View
          style={{
            backgroundColor: UI.color.surface,
            borderRadius: UI.radius.lg,
            borderWidth: 1,
            borderColor: UI.color.border,
            padding: 16,
          }}
        >
          <Typography
            style={{
              fontSize: 11,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: UI.color.text,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Categories
          </Typography>

          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <PieChart
              data={categoryData.map((item) => ({
                value: item.amount,
                color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other,
              }))}
              donut
              innerRadius={60}
              radius={100}
              innerCircleColor={UI.color.surface}
              showText={false}
            />
          </View>

          <View style={{ marginTop: 24, gap: 14 }}>
            {categoryData.map((item) => {
              const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === item.category)
              const Icon = catInfo ? (icons as any)[catInfo.icon] : icons.Package
              const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
              const percent = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0

              return (
                <View key={item.category} style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: UI.color.control,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Icon size={16} color={color} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Typography
                      style={{
                        fontSize: 14,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {catInfo?.label || "Other"}
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 12,
                        color: UI.color.muted,
                        fontFamily: "IBMPlexSans_500Medium",
                        marginTop: 2,
                      }}
                    >
                      {percent}%
                    </Typography>
                  </View>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {formatAmount(item.amount, groupCurrency)}
                  </Typography>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Per-person contribution */}
      {personEntries.length > 0 && (
        <View
          style={{
            backgroundColor: UI.color.surface,
            borderRadius: UI.radius.lg,
            borderWidth: 1,
            borderColor: UI.color.border,
            padding: 16,
          }}
        >
          <Typography
            style={{
              fontSize: 11,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: UI.color.text,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            People
          </Typography>

          {/* Top spender */}
          {topSpender && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: UI.color.border,
              }}
            >
              <View>
                <Typography
                  style={{
                    fontSize: 13,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Top Spender
                </Typography>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    marginTop: 2,
                  }}
                >
                  {topSpender.name}
                </Typography>
              </View>
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {formatAmount(topSpender.total, groupCurrency)}
              </Typography>
            </View>
          )}

          {/* Most expenses */}
          {mostExpenses && mostExpenses.name !== topSpender?.name && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
              }}
            >
              <View>
                <Typography
                  style={{
                    fontSize: 13,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Most Expenses
                </Typography>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    marginTop: 2,
                  }}
                >
                  {mostExpenses.name}
                </Typography>
              </View>
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {mostExpenses.count} {mostExpenses.count === 1 ? "expense" : "expenses"}
              </Typography>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
