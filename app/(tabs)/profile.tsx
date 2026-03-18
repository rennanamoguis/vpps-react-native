import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/theme/useTheme";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut } = useSession();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.navigation.tabActive,
          },
        ]}
      >
        Profile
      </Text>

      <Text style={[styles.text, { color: theme.text.secondary }]}>
        {session?.user.firstname} {session?.user.lastname}
      </Text>

      <Text style={[styles.text, { color: theme.text.secondary }]}>
        {session?.user.email}
      </Text>

      <Pressable
        style={[
          styles.logoutButton,
          {
            backgroundColor: theme.brand.secondary,
          },
        ]}
        onPress={handleLogout}
      >
        <Text
          style={[
            styles.logoutButtonText,
            {
              color: theme.brand.onSecondary,
            },
          ]}
        >
          Logout
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    //padding: 20,
    paddingLeft: 20,
    paddingBottom: 20,
    paddingRight: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 24,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
