import { useTheme } from "@/src/theme/useTheme";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  barangays: string[];
  selectedBarangay: string | null;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function BarangaySelector({
  visible,
  barangays,
  selectedBarangay,
  onClose,
  onSelect,
}: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
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
            Select Barangay
          </Text>
          <FlatList
            data={barangays}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const active = item === selectedBarangay;

              return (
                <Pressable
                  style={[
                    styles.item,
                    {
                      backgroundColor: active
                        ? theme.surface.surfaceAlt
                        : theme.components.cardBackground,
                    },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      {
                        color: theme.text.primary,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
          <Pressable
            style={[
              styles.closeButton,
              {
                backgroundColor: theme.brand.primary,
              },
            ]}
            onPress={onClose}
          >
            <Text
              style={[styles.closeButtonText, { color: theme.brand.onPrimary }]}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28",
  },
  card: {
    maxHeight: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 12,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
