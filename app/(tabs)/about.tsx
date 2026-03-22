import { APP_INFO } from "@/src/constants/appInfo";
import { useTheme } from "@/src/theme/useTheme";
import Constants from "expo-constants";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: theme.surface.background,
        },
      ]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={require("../../assets/images/vpps_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={[styles.description, { color: theme.text.primary }]}>
        {APP_INFO.firstDescription}
      </Text>

      <Text
        style={[
          styles.description,
          styles.secondParagraph,
          {
            color: theme.text.primary,
          },
        ]}
      >
        {APP_INFO.secondDescription}
      </Text>

      <View style={styles.infoBlock}>
        <Text style={[styles.label, { color: theme.text.primary }]}>
          Developers
        </Text>
        <Text style={[styles.teamName, { color: theme.brand.primary }]}>
          {APP_INFO.developerName}
        </Text>
      </View>

      <View style={styles.versionBlock}>
        <Text style={[styles.label, { color: theme.text.primary }]}>
          Version
        </Text>
        <Text style={[styles.versionText, { color: theme.text.secondary }]}>
          {APP_VERSION}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  logo: {
    width: 220,
    height: 220,
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 700,
  },

  secondParagraph: {
    marginTop: 28,
  },

  infoBlock: {
    marginTop: 48,
    alignItems: "center",
  },

  versionBlock: {
    marginTop: 48,
    alignItems: "center",
  },

  label: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "500",
  },
  teamName: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  versionText: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "500",
  },
});
