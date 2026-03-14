import { SessionProvider } from "@/src/context/SessionContext";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Slot />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
