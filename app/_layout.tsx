import { SessionProvider } from "@/src/context/SessionContext";
import { SyncProvider } from "@/src/context/SyncContext";
import { configureGoogleSignIn } from "@/src/lib/googleSignIn";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

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
