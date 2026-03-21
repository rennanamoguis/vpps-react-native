import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BarangaySelector } from "@/src/components/search/BarangaySelector";
import { VoterListItem } from "@/src/components/search/VoterListItem";
import { useSession } from "@/src/context/SessionContext";
import {
  getBarangays,
  getLocalSearchSummary,
  getVoterCountForBarangay,
  markVoterSearched,
  searchVotersByBarangayAndFullname,
  type VoterRow,
} from "@/src/database/voterRepo";
import { useDebounce } from "@/src/hooks/useDebounce";
import { toAbsoluteImageUrl } from "@/src/lib/imgCache";
import { useTheme } from "@/src/theme/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const theme = useTheme();
  const { session } = useSession();
  const insets = useSafeAreaInsets();

  const [barangays, setBarangays] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<VoterRow[]>([]);
  const [isBarangayModalVisible, setIsBarangayModalVisible] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [localSummary, setLocalSummary] = useState({ voters: 0, barangays: 0 });

  const debouncedKeyword = useDebounce(keyword, 300);

  const avatarUri =
    session?.user.img_local_uri || toAbsoluteImageUrl(session?.user.img);

  const loadOfflineSearchData = useCallback(async () => {
    try {
      setIsLoadingBarangays(true);

      const [barangayRows, summary] = await Promise.all([
        getBarangays(),
        getLocalSearchSummary(),
      ]);

      const names = barangayRows.map((row) => row.barangay_name);

      setBarangays(names);
      setLocalSummary(summary);
      setResults([]);

      if (!selectedBarangay || !names.includes(selectedBarangay)) {
        setSelectedBarangay(null);
        setKeyword("");
      }
    } catch (error) {
      console.error("SEARCH LOAD ERROR:", error);
      setBarangays([]);
      setResults([]);
      setLocalSummary({ voters: 0, barangays: 0 });
      setSelectedBarangay(null);
      setKeyword("");
    } finally {
      setIsLoadingBarangays(false);
    }
  }, [selectedBarangay]);

  useFocusEffect(
    useCallback(() => {
      loadOfflineSearchData();
    }, [loadOfflineSearchData]),
  );

  useEffect(() => {
    setSelectedBarangay(null);
    setKeyword("");
    setResults([]);
  }, [session?.user.assigned_municipality]);

  useEffect(() => {
    const runSearch = async () => {
      if (!selectedBarangay) {
        setResults([]);
        return;
      }

      if (debouncedKeyword.trim().length < 3) {
        setResults([]);
        return;
      }

      try {
        setIsSearching(true);

        const barangayCount = await getVoterCountForBarangay(selectedBarangay);
        // console.log("BARANGAY LOCAL COUNT:", {
        //   selectedBarangay,
        //   barangayCount,
        //   keyword: debouncedKeyword,
        // });

        const rows = await searchVotersByBarangayAndFullname(
          selectedBarangay,
          debouncedKeyword,
        );

        setResults(rows);
      } catch (error) {
        console.error("SEARCH QUERY ERROR:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    runSearch();
  }, [selectedBarangay, debouncedKeyword]);

  const handleMarkSearched = async (id: number) => {
    await markVoterSearched(id);

    setResults((prev) =>
      prev.map((item) => (item.id === id ? { ...item, searched: 1 } : item)),
    );
  };

  const helperText = useMemo(() => {
    if (localSummary.voters === 0) {
      return "No offline voter data found yet. Go to Data and run the update first.";
    }

    if (!selectedBarangay) {
      return "Select a barangay first before searching.";
    }

    if (keyword.trim().length < 3) {
      return "Type at least 3 characters to search by fullname.";
    }

    if (!isSearching && results.length === 0) {
      return "No matching voters found in the selected barangay.";
    }

    return null;
  }, [
    localSummary.voters,
    selectedBarangay,
    keyword,
    isSearching,
    results.length,
  ]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface.background,
          paddingTop: insets.top + 24,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.greetingWrap}>
            <Text
              style={[styles.greeting, { color: theme.text.primary }]}
              numberOfLines={1}
            >
              Hello {session?.user.firstname || "User"}!
            </Text>
          </View>

          <View
            style={[
              styles.avatarOuter,
              {
                borderColor: theme.text.secondary,
                backgroundColor: theme.surface.surfaceAlt,
              },
            ]}
          >
            {avatarUri ? (
              <Image
                source={avatarUri}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="disk"
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: theme.surface.surfaceAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarPlaceholderText,
                    { color: theme.text.secondary },
                  ]}
                >
                  {session?.user.firstname?.[0] || "U"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.subLabel, { color: theme.text.secondary }]}>
          You are viewing barangay:
        </Text>

        <Pressable
          style={styles.barangayRow}
          onPress={() => setIsBarangayModalVisible(true)}
          disabled={isLoadingBarangays}
        >
          <Ionicons
            name="location-sharp"
            size={28}
            color={theme.text.primary}
            style={styles.locationIcon}
          />

          <Text
            style={[
              styles.barangayText,
              {
                color: selectedBarangay
                  ? theme.brand.secondary
                  : theme.components.inputPlaceholder,
              },
            ]}
            numberOfLines={1}
          >
            {selectedBarangay || "← Tap to select Barangay"}
          </Text>
        </Pressable>

        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Search"
          placeholderTextColor={theme.components.inputPlaceholder}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.components.inputBackground,
              borderColor: theme.surface.border,
              color: theme.text.primary,
            },
          ]}
          autoCorrect={false}
          autoCapitalize="words"
          editable={!isLoadingBarangays}
        />

        <View
          style={[
            styles.divider,
            { backgroundColor: theme.components.divider },
          ]}
        />
      </View>

      <View style={styles.resultsContainer}>
        {isLoadingBarangays ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.brand.primary} />
            <Text style={[styles.helperText, { color: theme.text.secondary }]}>
              Loading offline barangays...
            </Text>
          </View>
        ) : isSearching ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.brand.primary} />
            <Text style={[styles.helperText, { color: theme.text.secondary }]}>
              Searching local records...
            </Text>
          </View>
        ) : helperText ? (
          <View style={styles.centerState}>
            <Text style={[styles.helperText, { color: theme.text.secondary }]}>
              {helperText}
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <VoterListItem voter={item} onMarkSearched={handleMarkSearched} />
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <BarangaySelector
        visible={isBarangayModalVisible}
        barangays={barangays}
        selectedBarangay={selectedBarangay}
        onClose={() => setIsBarangayModalVisible(false)}
        onSelect={(value) => setSelectedBarangay(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 16,
  },
  greetingWrap: {
    flex: 1,
    paddingTop: 6,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "500",
    lineHeight: 34,
  },
  avatarOuter: {
    width: 52,
    height: 52,
    borderRadius: 41,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 41,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  barangayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  locationIcon: {
    marginRight: 10,
  },
  barangayText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
  },
  searchInput: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 17,
  },
  divider: {
    height: 1,
    marginTop: 18,
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  helperText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
});

//*--------------- OLD CODE -------------------------
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useFocusEffect } from "@react-navigation/native";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import { BarangaySelector } from "@/src/components/search/BarangaySelector";
// import { VoterListItem } from "@/src/components/search/VoterListItem";
// import { useSession } from "@/src/context/SessionContext";
// import {
//   getBarangays,
//   getLocalSearchSummary,
//   getVoterCountForBarangay,
//   markVoterSearched,
//   searchVotersByBarangayAndFullname,
//   type VoterRow,
// } from "@/src/database/voterRepo";
// import { useDebounce } from "@/src/hooks/useDebounce";
// import { useTheme } from "@/src/theme/useTheme";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// export default function Index() {
//   const theme = useTheme();
//   const { session } = useSession();
//   const insets = useSafeAreaInsets();

//   const [barangays, setBarangays] = useState<string[]>([]);
//   const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
//   const [keyword, setKeyword] = useState("");
//   const [results, setResults] = useState<VoterRow[]>([]);
//   const [isBarangayModalVisible, setIsBarangayModalVisible] = useState(false);
//   const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
//   const [isSearching, setIsSearching] = useState(false);
//   const [localSummary, setLocalSummary] = useState({ voters: 0, barangays: 0 });

//   const debouncedKeyword = useDebounce(keyword, 300);

//   const loadOfflineSearchData = useCallback(async () => {
//     try {
//       setIsLoadingBarangays(true);

//       const [barangayRows, summary] = await Promise.all([
//         getBarangays(),
//         getLocalSearchSummary(),
//       ]);

//       const names = barangayRows.map((row) => row.barangay_name);

//       setBarangays(names);
//       setLocalSummary(summary);
//       setResults([]);

//       if (!selectedBarangay || !names.includes(selectedBarangay)) {
//         setSelectedBarangay(null);
//         setKeyword("");
//       }
//     } catch (error) {
//       console.error("SEARCH LOAD ERROR:", error);
//       setBarangays([]);
//       setResults([]);
//       setLocalSummary({ voters: 0, barangays: 0 });
//       setSelectedBarangay(null);
//       setKeyword("");
//     } finally {
//       setIsLoadingBarangays(false);
//     }
//   }, [selectedBarangay]);

//   useFocusEffect(
//     useCallback(() => {
//       loadOfflineSearchData();
//     }, [loadOfflineSearchData]),
//   );

//   useEffect(() => {
//     setSelectedBarangay(null);
//     setKeyword("");
//     setResults([]);
//   }, [session?.user.assigned_municipality]);

//   useEffect(() => {
//     const runSearch = async () => {
//       if (!selectedBarangay) {
//         setResults([]);
//         return;
//       }

//       if (debouncedKeyword.trim().length < 3) {
//         setResults([]);
//         return;
//       }

//       try {
//         setIsSearching(true);

//         const barangayCount = await getVoterCountForBarangay(selectedBarangay);
//         console.log("BARANGAY LOCAL COUNT:", {
//           selectedBarangay,
//           barangayCount,
//           keyword: debouncedKeyword,
//         });

//         const rows = await searchVotersByBarangayAndFullname(
//           selectedBarangay,
//           debouncedKeyword,
//         );

//         setResults(rows);
//       } catch (error) {
//         console.error("SEARCH QUERY ERROR:", error);
//         setResults([]);
//       } finally {
//         setIsSearching(false);
//       }
//     };

//     runSearch();
//   }, [selectedBarangay, debouncedKeyword]);

//   const handleMarkSearched = async (id: number) => {
//     await markVoterSearched(id);

//     setResults((prev) =>
//       prev.map((item) => (item.id === id ? { ...item, searched: 1 } : item)),
//     );
//   };

//   const helperText = useMemo(() => {
//     if (localSummary.voters === 0) {
//       return "No offline voter data found yet. Go to Data and run the update first.";
//     }

//     if (!selectedBarangay) {
//       return "Select a barangay first before searching.";
//     }

//     if (keyword.trim().length < 3) {
//       return "Type at least 3 characters to search by fullname.";
//     }

//     if (!isSearching && results.length === 0) {
//       return "No matching voters found in the selected barangay.";
//     }

//     return null;
//   }, [
//     localSummary.voters,
//     selectedBarangay,
//     keyword,
//     isSearching,
//     results.length,
//   ]);

//   return (
//     <View
//       style={[
//         styles.root,
//         {
//           backgroundColor: theme.surface.background,
//           paddingTop: insets.top + 32,
//         },
//       ]}
//     >
//       <View style={styles.header}>
//         {/* <Text style={[styles.title, { color: theme.navigation.tabActive }]}>
//           Search
//         </Text> */}
//         <Text style={[styles.greeting, { color: theme.text.primary }]}>
//           Hello {session?.user.firstname || "User"}!
//         </Text>

//         <Text style={[styles.subLabel, { color: theme.text.secondary }]}>
//           You are viewing barangay:
//         </Text>

//         <Pressable
//           style={styles.barangayRow}
//           onPress={() => setIsBarangayModalVisible(true)}
//           disabled={isLoadingBarangays}
//         >
//           <Ionicons
//             name="location-sharp"
//             size={28}
//             color={theme.text.primary}
//             style={styles.locationIcon}
//           />

//           <Text
//             style={[
//               styles.barangayText,
//               {
//                 color: selectedBarangay
//                   ? theme.brand.secondary
//                   : theme.components.inputPlaceholder,
//               },
//             ]}
//           >
//             {selectedBarangay || "← Tap to select Barangay"}
//           </Text>
//         </Pressable>

//         <TextInput
//           value={keyword}
//           onChangeText={setKeyword}
//           placeholder="Search"
//           placeholderTextColor={theme.components.inputPlaceholder}
//           style={[
//             styles.searchInput,
//             {
//               backgroundColor: theme.components.inputBackground,
//               borderColor: theme.surface.border,
//               color: theme.text.primary,
//             },
//           ]}
//           autoCorrect={false}
//           autoCapitalize="words"
//           editable={!isLoadingBarangays}
//         />

//         <View
//           style={[
//             styles.divider,
//             { backgroundColor: theme.components.divider },
//           ]}
//         />
//       </View>

//       <View style={styles.resultsContainer}>
//         {isLoadingBarangays ? (
//           <View style={styles.centerState}>
//             <ActivityIndicator color={theme.brand.primary} />
//             <Text style={[styles.helperText, { color: theme.text.secondary }]}>
//               Loading offline barangays...
//             </Text>
//           </View>
//         ) : isSearching ? (
//           <View style={styles.centerState}>
//             <ActivityIndicator color={theme.brand.primary} />
//             <Text style={[styles.helperText, { color: theme.text.secondary }]}>
//               Searching local records...
//             </Text>
//           </View>
//         ) : helperText ? (
//           <View style={styles.centerState}>
//             <Text style={[styles.helperText, { color: theme.text.secondary }]}>
//               {helperText}
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={results}
//             keyExtractor={(item) => item.id.toString()}
//             renderItem={({ item }) => (
//               <VoterListItem voter={item} onMarkSearched={handleMarkSearched} />
//             )}
//             contentContainerStyle={styles.listContent}
//             keyboardShouldPersistTaps="handled"
//           />
//         )}
//       </View>

//       <BarangaySelector
//         visible={isBarangayModalVisible}
//         barangays={barangays}
//         selectedBarangay={selectedBarangay}
//         onClose={() => setIsBarangayModalVisible(false)}
//         onSelect={(value) => setSelectedBarangay(value)}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingBottom: 12,
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "700",
//   },
//   greeting: {
//     fontSize: 24,
//     fontWeight: "500",
//     marginBottom: 22,
//     paddingTop: 10,
//   },
//   subLabel: {
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   barangayRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 18,
//   },
//   locationIcon: {
//     marginRight: 10,
//   },
//   barangayText: {
//     fontSize: 18,
//     fontWeight: "500",
//   },
//   searchInput: {
//     minHeight: 56,
//     borderRadius: 18,
//     borderWidth: 1,
//     paddingHorizontal: 18,
//     fontSize: 17,
//   },
//   divider: {
//     height: 1,
//     marginTop: 18,
//   },
//   resultsContainer: {
//     flex: 1,
//     paddingTop: 10,
//   },
//   listContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   centerState: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 28,
//   },
//   helperText: {
//     textAlign: "center",
//     fontSize: 15,
//     lineHeight: 22,
//     marginTop: 12,
//   },
// });
