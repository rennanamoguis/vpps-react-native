import type { VoterRow } from "@/src/database/voterRepo";
import { useTheme } from "@/src/theme/useTheme";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { CircularCheckbox } from "../ui/CircularCheckbox";

type Props = {
  voter: VoterRow;
  onMarkSearched: (id: number) => Promise<void>;
};

export function VoterListItem({ voter, onMarkSearched }: Props) {
  const theme = useTheme();

  const handlePressCheckbox = async () => {
    if (voter.searched === 1) {
      return;
    }

    Alert.alert(
      "Mark as Searched",
      `Mark ${voter.fullname} as already searched? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await onMarkSearched(voter.id);
          },
        },
      ],
    );
  };
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.components.cardBackground,
          borderColor: theme.surface.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <Text style={[styles.precinct, { color: theme.text.primary }]}>
            {voter.precinct || "-"}
          </Text>
          <Text style={[styles.seq, { color: theme.text.secondary }]}>
            {voter.seq || "-"}
          </Text>
        </View>

        <View style={styles.mainInfo}>
          <Text style={[styles.name, { color: theme.text.primary }]}>
            {voter.fullname}
          </Text>

          <Text style={[styles.sitio, { color: theme.text.secondary }]}>
            {voter.sitio || ""}
          </Text>
        </View>

        <CircularCheckbox
          checked={voter.searched === 1}
          disabled={voter.searched === 1}
          onPress={handlePressCheckbox}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.badgeText, { color: theme.brand.secondary }]}>
          {voter.verification || "Verified"}
        </Text>
        <Text style={[styles.badgeText, { color: theme.brand.secondary }]}>
          {voter.priority_meaning || "-"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  leftMeta: {
    width: 64,
    alignItems: "flex-start",
  },
  precinct: {
    fontSize: 18,
    fontWeight: "700",
  },
  seq: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "600",
  },
  mainInfo: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  sitio: {
    marginTop: 4,
    fontSize: 13,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
