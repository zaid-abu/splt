import { useMemo } from "react"
import type { ExpenseCategory } from "@/types"

interface CategoryHeuristic {
  minAmount?: number
  maxAmount?: number
  keywords: string[]
  category: ExpenseCategory
}

const CATEGORY_HEURISTICS: CategoryHeuristic[] = [
  {
    minAmount: 5,
    maxAmount: 50,
    keywords: ["coffee", "lunch", "dinner", "food", "pizza"],
    category: "food",
  },
  {
    minAmount: 5,
    maxAmount: 60,
    keywords: ["uber", "lyft", "taxi", "gas", "fuel", "transport"],
    category: "transport",
  },
  {
    minAmount: 50,
    maxAmount: 300,
    keywords: ["rent", "utilities", "electricity", "water", "internet"],
    category: "utilities",
  },
  {
    minAmount: 100,
    keywords: ["hotel", "flight", "airbnb", "booking"],
    category: "travel",
  },
  {
    minAmount: 10,
    maxAmount: 100,
    keywords: ["movie", "concert", "ticket", "drinks", "bar"],
    category: "entertainment",
  },
]

export function useCategorySuggestion(amount: number, description: string): ExpenseCategory {
  return useMemo(() => {
    if (!description.trim()) return "other"

    const lowerDesc = description.toLowerCase()

    const matching = CATEGORY_HEURISTICS.find((h) => {
      if (h.minAmount !== undefined && amount < h.minAmount) return false
      if (h.maxAmount !== undefined && amount > h.maxAmount) return false
      return h.keywords.some((kw) => lowerDesc.includes(kw))
    })

    return matching?.category ?? "other"
  }, [amount, description])
}
