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

// import * as Application from "expo-application";
// import { Image } from "expo-image";
// import {
//   Alert,
//   Linking,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// import { APP_INFO } from "@/src/constants/appInfo";
// import { useTheme } from "@/src/theme/useTheme";

// export default function AboutScreen() {
//   const theme = useTheme();

//   const appName = Application.applicationName || APP_INFO.appName;
//   const appVersion = Application.nativeApplicationVersion || "1.0.0";
//   const appId = Application.applicationId || "N/A";

//   const openLink = async (url: string) => {
//     try {
//       const supported = await Linking.canOpenURL(url);

//       if (!supported) {
//         Alert.alert(
//           "Unavailable",
//           "This link cannot be opened on this device.",
//         );
//         return;
//       }

//       await Linking.openURL(url);
//     } catch (error) {
//       Alert.alert("Error", "Unable to open the requested link.");
//     }
//   };

//   return (
//     <View style={[styles.root, { backgroundColor: theme.surface.background }]}>
//       <ScrollView contentContainerStyle={styles.content}>
//         <View
//           style={[
//             styles.heroCard,
//             {
//               backgroundColor: theme.components.cardBackground,
//               borderColor: theme.surface.border,
//             },
//           ]}
//         >
//           <Image
//             source={require("../../assets/images/vpps_logo.png")}
//             style={styles.logo}
//             contentFit="contain"
//           />

//           <Text style={[styles.appName, { color: theme.text.primary }]}>
//             {appName}
//           </Text>

//           <Text style={[styles.tagline, { color: theme.text.secondary }]}>
//             {APP_INFO.firstDescription}
//           </Text>
//         </View>

//         <View
//           style={[
//             styles.card,
//             {
//               backgroundColor: theme.components.cardBackground,
//               borderColor: theme.surface.border,
//             },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
//             About the App
//           </Text>

//           <Text style={[styles.paragraph, { color: theme.text.secondary }]}>
//             {APP_INFO.secondDescription}
//           </Text>
//         </View>

//         <View
//           style={[
//             styles.card,
//             {
//               backgroundColor: theme.components.cardBackground,
//               borderColor: theme.surface.border,
//             },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
//             Application Information
//           </Text>

//           <View style={styles.infoRow}>
//             <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>
//               Version
//             </Text>
//             <Text style={[styles.infoValue, { color: theme.text.primary }]}>
//               {appVersion}
//             </Text>
//           </View>

//           <View style={styles.infoRow}>
//             <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>
//               Application ID
//             </Text>
//             <Text style={[styles.infoValue, { color: theme.text.primary }]}>
//               {appId}
//             </Text>
//           </View>

//           <View style={styles.infoRow}>
//             <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>
//               Developer
//             </Text>
//             <Text style={[styles.infoValue, { color: theme.text.primary }]}>
//               {APP_INFO.developerName}
//             </Text>
//           </View>
//         </View>

//         <View
//           style={[
//             styles.card,
//             {
//               backgroundColor: theme.components.cardBackground,
//               borderColor: theme.surface.border,
//             },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
//             Contact and Links
//           </Text>

//           <Pressable
//             style={[
//               styles.linkButton,
//               { backgroundColor: theme.brand.primary },
//             ]}
//             onPress={() => openLink(`mailto:${APP_INFO.supportEmail}`)}
//           >
//             <Text
//               style={[styles.linkButtonText, { color: theme.brand.onPrimary }]}
//             >
//               Email Support
//             </Text>
//           </Pressable>

//           <Pressable
//             style={[
//               styles.secondaryButton,
//               {
//                 borderColor: theme.brand.secondary,
//                 backgroundColor: theme.surface.surface,
//               },
//             ]}
//             onPress={() => openLink(APP_INFO.websiteUrl)}
//           >
//             <Text
//               style={[
//                 styles.secondaryButtonText,
//                 { color: theme.brand.secondary },
//               ]}
//             >
//               Visit Website
//             </Text>
//           </Pressable>

//           <Pressable
//             style={[
//               styles.secondaryButton,
//               {
//                 borderColor: theme.brand.secondary,
//                 backgroundColor: theme.surface.surface,
//               },
//             ]}
//             onPress={() => openLink(APP_INFO.privacyUrl)}
//           >
//             <Text
//               style={[
//                 styles.secondaryButtonText,
//                 { color: theme.brand.secondary },
//               ]}
//             >
//               Privacy Policy
//             </Text>
//           </Pressable>
//         </View>

//         <Text style={[styles.footerText, { color: theme.text.secondary }]}>
//           © 2026 {APP_INFO.developerName}
//         </Text>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },
//   content: {
//     padding: 20,
//     gap: 16,
//     paddingBottom: 28,
//   },
//   heroCard: {
//     borderWidth: 1,
//     borderRadius: 22,
//     padding: 22,
//     alignItems: "center",
//   },
//   logo: {
//     width: 110,
//     height: 110,
//     marginBottom: 14,
//   },
//   appName: {
//     fontSize: 28,
//     fontWeight: "700",
//     textAlign: "center",
//   },
//   tagline: {
//     marginTop: 8,
//     fontSize: 15,
//     textAlign: "center",
//     lineHeight: 22,
//   },
//   card: {
//     borderWidth: 1,
//     borderRadius: 22,
//     padding: 18,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     marginBottom: 12,
//   },
//   paragraph: {
//     fontSize: 15,
//     lineHeight: 24,
//   },
//   infoRow: {
//     marginBottom: 10,
//   },
//   infoLabel: {
//     fontSize: 13,
//     marginBottom: 2,
//   },
//   infoValue: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   linkButton: {
//     height: 52,
//     borderRadius: 26,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   linkButtonText: {
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   secondaryButton: {
//     height: 52,
//     borderRadius: 26,
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1.5,
//     marginBottom: 12,
//   },
//   secondaryButtonText: {
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   footerText: {
//     textAlign: "center",
//     fontSize: 13,
//     marginTop: 4,
//   },
// });
