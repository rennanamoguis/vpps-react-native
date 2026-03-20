import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/theme/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";

export default function TabLayout() {
  const theme = useTheme();
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.navigation.tabActive,
        tabBarInactiveTintColor: theme.navigation.tabInactive,
        headerStyle: {
          backgroundColor: theme.navigation.tabBarBackground,
        },
        headerShown: false,
        headerShadowVisible: false,
        headerTintColor: theme.navigation.tabActive,
        tabBarStyle: {
          backgroundColor: theme.navigation.tabBarBackground,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: "Data",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "file-tray-full" : "file-tray-full-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "information-circle" : "information-circle-outline"
              }
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// import { useSession } from "@/src/context/SessionContext";
// import { useTheme } from "@/src/theme/useTheme";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { Redirect, Tabs } from "expo-router";
// import { StyleSheet, Text, View } from "react-native";

// type TabIconProps = {
//   focused: boolean;
//   icon: keyof typeof Ionicons.glyphMap;
//   label: string;
//   theme: ReturnType<typeof useTheme>;
// };

// function TabIcon({ focused, icon, label, theme }: TabIconProps) {
//   return (
//     <View
//       style={[
//         styles.tabPill,
//         focused && {
//           backgroundColor: theme.brand.primaryContainer,
//           paddingHorizontal: 14,
//           minWidth: 100,
//         },
//       ]}
//     >
//       <Ionicons
//         name={icon}
//         size={24}
//         color={
//           focused ? theme.navigation.tabActive : theme.navigation.tabInactive
//         }
//       />
//       {focused && (
//         <Text style={[styles.tabLabel, { color: theme.navigation.tabActive }]}>
//           {label}
//         </Text>
//       )}
//     </View>
//   );
// }

// export default function TabLayout() {
//   const theme = useTheme();
//   const { session, isLoading } = useSession();

//   if (isLoading) return null;
//   if (!session) return <Redirect href="/sign-in" />;

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarShowLabel: false,
//         sceneStyle: {
//           backgroundColor: theme.surface.background,
//         },
//         tabBarStyle: {
//           backgroundColor: theme.navigation.tabBarBackground,
//           borderTopColor: theme.components.divider,
//           height: 82,
//           paddingTop: 10,
//           paddingBottom: 12,
//         },
//         tabBarItemStyle: {
//           justifyContent: "center",
//           alignItems: "center",
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Search",
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               focused={focused}
//               icon="search-outline"
//               label="Search"
//               theme={theme}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="data"
//         options={{
//           title: "Data",
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               focused={focused}
//               icon="file-tray-full-outline"
//               label="Data"
//               theme={theme}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               focused={focused}
//               icon="person-outline"
//               label="Profile"
//               theme={theme}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="about"
//         options={{
//           title: "About",
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               focused={focused}
//               icon="information-circle-outline"
//               label="About"
//               theme={theme}
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

// const styles = StyleSheet.create({
//   tabPill: {
//     height: 54,
//     borderRadius: 999,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 10,
//     paddingHorizontal: 0,
//   },
//   tabLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//   },
// });
