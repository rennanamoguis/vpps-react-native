import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/theme/useTheme";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface.background,
        },
      ]}
    >
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>
        Hello {session?.user.nick_name || session?.user.firstname || "User"}!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
});
