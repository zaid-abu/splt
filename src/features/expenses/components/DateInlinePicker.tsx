import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import dayjs from "dayjs";
import DateTimePicker from "react-native-ui-datepicker";
import { useUI } from "@/components/ui";
import { styles } from "@/features/expenses/utils/styles";

export function DateInlinePicker({
  value,
  visible,
  onToggle,
  onChange,
}: {
  value: Date;
  visible: boolean;
  onToggle: () => void;
  onChange: (date: Date) => void;
}): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <View style={styles.dateBlock}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [styles.detailRow, pressed && styles.rowPressed]}
      >
        <View style={styles.detailIcon}>
          <icons.Calendar size={18} color={color.text} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography style={styles.detailTitle}>{dayjs(value).format("MMMM D, YYYY")}</Typography>
          <Typography style={styles.detailMeta}>Expense date</Typography>
        </View>
        <icons.ChevronDown
          size={18}
          color={color.muted}
          strokeWidth={1.8}
          style={{ transform: [{ rotate: visible ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {visible ? (
        <View style={styles.datePicker}>
          <DateTimePicker
            mode="single"
            date={dayjs(value)}
            onChange={(params: any) => {
              if (params.date) onChange(dayjs(params.date).toDate());
            }}
            styles={{
              selected: { backgroundColor: color.text, borderRadius: 999 },
              selected_label: { color: color.textInverse },
              today: { backgroundColor: color.control, borderRadius: 999 },
              today_label: { color: color.text },
              day_label: { color: color.text, fontSize: 15 },
              header: { paddingBottom: 12 },
              month_selector_label: { color: color.text, fontSize: 16 },
              year_selector_label: { color: color.text, fontSize: 16 },
              weekday_label: { color: color.muted },
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
