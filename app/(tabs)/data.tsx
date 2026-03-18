import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";
import { useSession } from "@/src/context/SessionContext";
import { useSync } from "@/src/context/SyncContext";
import { useTheme } from "@/src/theme/useTheme";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DataScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const insets = useSafeAreaInsets();
  const {
    status,
    isSyncing,
    overlayVisible,
    progressText,
    progressPercent,
    lastSyncAt,
    localVoterCount,
    localBarangayCount,
    startFullSync,
    hideOverlay,
    showOverlay,
  } = useSync();

  const [buttonBusy, setButtonBusy] = useState(false);

  const handleStartUpdate = async () => {
    try {
      setButtonBusy(true);
      await startFullSync();
    } catch (error: any) {
      Alert.alert(
        "Update failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update local data.",
      );
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.navigation.tabActive }]}>
          Data
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          Assigned municipality:{" "}
          {session?.user.municipality_name || "Not available"}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.components.cardBackground,
              borderColor: theme.surface.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>
            Offline Records
          </Text>
          <Text style={[styles.cardLine, { color: theme.text.secondary }]}>
            Voters: {localVoterCount}
          </Text>
          <Text style={[styles.cardLine, { color: theme.text.secondary }]}>
            Barangays: {localBarangayCount}
          </Text>
          <Text style={[styles.cardLine, { color: theme.text.secondary }]}>
            Last update:{" "}
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString()
              : "No updates yet."}
          </Text>
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.components.cardBackground,
              borderColor: theme.surface.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>
            Update Local Data
          </Text>
          <Text style={[styles.description, { color: theme.text.secondary }]}>
            Tap the button below to download fresh voter and barangay records
            from the cloud and save them for offline use on this device.
          </Text>
          <Pressable
            style={[
              styles.updateButton,
              {
                backgroundColor: theme.brand.primary,
                opacity: isSyncing || buttonBusy ? 0.7 : 1,
              },
            ]}
            disabled={isSyncing || buttonBusy}
            onPress={handleStartUpdate}
          >
            <Text
              style={[
                styles.updateButtonText,
                {
                  color: theme.brand.onPrimary,
                },
              ]}
            >
              {isSyncing ? "Updating..." : "Tap me to start update"}
            </Text>
          </Pressable>

          {status === "running" && !overlayVisible ? (
            <Pressable
              style={[
                styles.smallButton,
                {
                  borderColor: theme.brand.secondary,
                  backgroundColor: theme.surface.surface,
                },
              ]}
              onPress={showOverlay}
            >
              <Text
                style={[
                  styles.smallButtonText,
                  {
                    color: theme.brand.secondary,
                  },
                ]}
              >
                Show download progress
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <LoadingOverlay
        visible={overlayVisible}
        title="Updating Offline Records"
        message={progressText}
        percent={progressPercent}
        isRunning={isSyncing}
        onClose={hideOverlay}
        onMinimize={hideOverlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  content: {
    // padding: 20,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardLine: {
    fontSize: 15,
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  updateButton: {
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  smallButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
