import { useTheme } from "@/src/theme/useTheme";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  percent: number;
  isRunning: boolean;
  onClose: () => void;
  onMinimize: () => void;
};

export function LoadingOverlay({
  visible,
  title,
  message,
  percent,
  isRunning,
  onClose,
  onMinimize,
}: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.components.cardBackground,
              borderColor: theme.surface.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.text.primary }]}>
            {title}
          </Text>
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
          <Text style={[styles.message, { color: theme.text.secondary }]}>
            {message}
          </Text>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: theme.surface.surfaceAlt,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.brand.primary,
                  width: `${Math.max(0, Math.min(percent, 100))}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.percent, { color: theme.text.primary }]}>
            {percent}%
          </Text>

          {isRunning ? (
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme.brand.secondary,
                  backgroundColor: theme.surface.surface,
                },
              ]}
              onPress={onMinimize}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  {
                    color: theme.brand.secondary,
                  },
                ]}
              >
                Continue in background
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.brand.primary,
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: theme.brand.onPrimary,
                  },
                ]}
              >
                Close
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  spinnerWrap: {
    marginTop: 18,
    marginBottom: 18,
  },
  message: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 12,
    borderRadius: 999,
  },
  percent: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
