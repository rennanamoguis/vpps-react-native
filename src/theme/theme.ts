import { Appearance, ColorSchemeName } from "react-native";

export type ThemeMode = keyof typeof tokens;
export type ThemeTokens = (typeof tokens)[ThemeMode];

export const tokens = {
  light: {
    brand: {
      primary: "#2A9D8F",
      onPrimary: "#FFFFFF",
      primaryContainer: "#D7F2EE",
      onPrimaryContainer: "#124E47",
      secondary: "#E76F51",
      onSecondary: "#FFFFFF",
    },
    surface: {
      background: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceAlt: "#F7F7F7",
      border: "#E6D9C8",
    },
    text: {
      primary: "#23313A",
      secondary: "#5F6B73",
      inverse: "#FFFFFF",
    },
    status: {
      success: "#2A9D8F",
      warning: "#F4A261",
      error: "#E76F51",
      info: "#4C7FA8",
    },
    navigation: {
      tabBarBackground: "#FFFFFF",
      tabActive: "#2A9D8F",
      tabInactive: "#6B7280",
      scanFabBackground: "#2A9D8F",
      scanFabIcon: "#FFFFFF",
    },
    components: {
      cardBackground: "#FFFFFF",
      inputBackground: "#F7F7F7",
      inputPlaceholder: "#7A8691",
      divider: "#E6D9C8",
      shadow: "rgba(35, 49, 58, 0.10)",
    },
    timeline: {
      current: "#2A9D8F",
      completed: "#E9C46A",
      pending: "#E6D9C8",
      text: "#23313A",
    },
    escalation: {
      tint: "rgba(244, 162, 97, 0.16)",
      icon: "#F4A261",
      text: "#A3541A",
    },
    security: {
      restrictedBannerBackground: "rgba(42, 157, 143, 0.10)",
      restrictedBannerText: "#2A9D8F",
      restrictedIcon: "#2A9D8F",
    },
  },
  dark: {
    brand: {
      primary: "#58C7BA",
      onPrimary: "#082C29",
      primaryContainer: "#164B45",
      onPrimaryContainer: "#C9FFF7",
      secondary: "#FF9B86",
      onSecondary: "#3D130C",
    },
    surface: {
      background: "#161716",
      surface: "#1F2322",
      surfaceAlt: "#28302E",
      border: "#394442",
    },
    text: {
      primary: "#F6F3ED",
      secondary: "#B8B1A7",
      inverse: "#082C29",
    },
    status: {
      success: "#58C7BA",
      warning: "#F6B26B",
      error: "#FF8B78",
      info: "#7FB0D6",
    },
    navigation: {
      tabBarBackground: "#1F2322",
      tabActive: "#58C7BA",
      tabInactive: "#A9A297",
      scanFabBackground: "#58C7BA",
      scanFabIcon: "#082C29",
    },
    components: {
      cardBackground: "#1F2322",
      inputBackground: "#28302E",
      inputPlaceholder: "#8E8A82",
      divider: "#394442",
      shadow: "rgba(0, 0, 0, 0.35)",
    },
    timeline: {
      current: "#58C7BA",
      completed: "#E9C46A",
      pending: "#394442",
      text: "#F6F3ED",
    },
    escalation: {
      tint: "rgba(244, 162, 97, 0.18)",
      icon: "#F6B26B",
      text: "#FFD9B0",
    },
    security: {
      restrictedBannerBackground: "rgba(88, 199, 186, 0.12)",
      restrictedBannerText: "#58C7BA",
      restrictedIcon: "#58C7BA",
    },
  },
} as const;

/** Force valid mode; fall back to system if missing. */
export function resolveThemeMode(mode?: ThemeMode | null): ThemeMode {
  if (mode === "light" || mode === "dark") return mode;
  const system = Appearance.getColorScheme();
  return system === "dark" ? "dark" : "light";
}

/** Get the theme tokens for a given mode (or system mode by default). */
export function getTheme(mode?: ThemeMode | null): ThemeTokens {
  const resolved = resolveThemeMode(mode);
  return tokens[resolved];
}

/** Convenience helper if you already have ColorSchemeName from RN hook */
export function getThemeFromColorScheme(
  colorScheme: ColorSchemeName,
): ThemeTokens {
  return tokens[colorScheme === "dark" ? "dark" : "light"];
}

/** Typed style shortcut: themeStyle(theme, (t) => ({ ... })) */
export function themeStyle<T>(
  theme: ThemeTokens,
  builder: (t: ThemeTokens) => T,
): T {
  return builder(theme);
}
