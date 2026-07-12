import * as icons from "lucide-react-native";
import type { SplitMethod } from "@/types";

export const SPLIT_METHODS: {
  key: SplitMethod;
  label: string;
  helper: string;
  icon: keyof typeof icons;
}[] = [
  { key: "equal", label: "Equal", helper: "Same share", icon: "Users" },
  { key: "custom", label: "Custom", helper: "Exact amounts", icon: "SlidersHorizontal" },
  { key: "percentage", label: "Percent", helper: "By percent", icon: "Percent" },
];

export const QUICK_CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY"];
