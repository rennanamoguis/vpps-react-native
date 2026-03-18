import { useTheme } from "@/src/theme/useTheme";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  checked: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function CircularCheckbox({ checked, disabled, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outer,
        {
          borderColor: checked ? theme.brand.primary : theme.surface.border,
          backgroundColor: checked
            ? theme.brand.primary
            : theme.surface.surface,
          opacity: disabled ? 0.8 : 1,
        },
      ]}
    >
      {checked ? (
        <View
          style={[styles.inner, { backgroundColor: theme.brand.onPrimary }]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
