import { useTheme } from "@/src/theme/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  checked: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function CircularCheckbox({
  checked,
  disabled = false,
  onPress,
}: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: disabled ? 0.7 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? theme.brand.primary : theme.text.secondary,
            backgroundColor: checked
              ? theme.brand.primaryContainer
              : "transparent",
          },
        ]}
      >
        {checked ? (
          <Ionicons name="checkmark" size={16} color={theme.brand.primary} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});

// import { useTheme } from "@/src/theme/useTheme";
// import { Pressable, StyleSheet, View } from "react-native";

// type Props = {
//   checked: boolean;
//   disabled?: boolean;
//   onPress: () => void;
// };

// export function CircularCheckbox({ checked, disabled, onPress }: Props) {
//   const theme = useTheme();

//   return (
//     <Pressable
//       onPress={onPress}
//       disabled={disabled}
//       style={[
//         styles.outer,
//         {
//           borderColor: checked ? theme.brand.primary : theme.surface.border,
//           backgroundColor: checked
//             ? theme.brand.primary
//             : theme.surface.surface,
//           opacity: disabled ? 0.8 : 1,
//         },
//       ]}
//     >
//       {checked ? (
//         <View
//           style={[styles.inner, { backgroundColor: theme.brand.onPrimary }]}
//         />
//       ) : null}
//     </Pressable>
//   );
// }

// const styles = StyleSheet.create({
//   outer: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     borderWidth: 2,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   inner: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },
// });
