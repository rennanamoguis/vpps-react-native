// useTheme.ts (optional hook)
import { useColorScheme } from "react-native";
import { getThemeFromColorScheme } from "./theme";

export function useTheme() {
  const scheme = useColorScheme();
  return getThemeFromColorScheme(scheme);
}
