import { SessionProvider } from "@/src/context/SessionContext";
import { SyncProvider } from "@/src/context/SyncContext";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <SyncProvider>
          <Slot />
        </SyncProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
