import { useSession } from "@/src/context/SessionContext";
import {
  cacheRemoteProfileImage,
  toAbsoluteImageUrl,
} from "@/src/lib/imgCache";
import {
  changePassword,
  uploadProfileImage,
} from "@/src/services/profileService";
import { useTheme } from "@/src/theme/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut, updateSessionUser } = useSession();
  const insets = useSafeAreaInsets();

  const [avatarUri, setAvatarUri] = useState<string | null>(
    session?.user.img_local_uri || toAbsoluteImageUrl(session?.user.img),
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const hydrateImage = async () => {
      if (!session?.user) return;

      if (session.user.img_local_uri) {
        setAvatarUri(session.user.img_local_uri);
        return;
      }

      const remoteUrl = toAbsoluteImageUrl(session.user.img);

      if (!remoteUrl) {
        setAvatarUri(null);
        return;
      }

      const localUri = await cacheRemoteProfileImage(
        remoteUrl,
        session.user.id,
      );

      if (localUri) {
        await updateSessionUser({
          img_local_uri: localUri,
        });
        setAvatarUri(localUri);
      } else {
        setAvatarUri(remoteUrl);
      }
    };

    hydrateImage();
  }, [session?.user.id, session?.user.img, session?.user.img_local_uri]);

  const fullName = useMemo(() => {
    if (!session?.user) return "";
    return [
      session.user.firstname,
      session.user.middlename,
      session.user.lastname,
    ]
      .filter(Boolean)
      .join(" ");
  }, [session?.user]);

  const assignedMunicipality = session?.user.municipality_name || "-";

  const handlePickImage = async () => {
    try {
      if (!session?.token || !session.user) {
        Alert.alert("Unavailable", "Please login again.");
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access the media library is required.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      setIsUploadingImage(true);

      const uploadResult = await uploadProfileImage(
        session.token,
        result.assets[0],
      );

      const remoteUrl =
        uploadResult.imageUrl || toAbsoluteImageUrl(uploadResult.img);

      const localUri = remoteUrl
        ? await cacheRemoteProfileImage(remoteUrl, session.user.id)
        : null;

      await updateSessionUser({
        img: uploadResult.img,
        img_local_uri: localUri,
      });

      setAvatarUri(localUri || remoteUrl || null);

      Alert.alert("Success", "Profile image updated successfully.");
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error?.message || "Unable to update profile image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closePasswordModal = () => {
    if (isChangingPassword) return;
    resetPasswordFields();
    setIsPasswordModalVisible(false);
  };

  const handleChangePassword = async () => {
    try {
      if (!session?.token) {
        Alert.alert("Unavailable", "Please login again.");
        return;
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Required", "Please fill in all password fields.");
        return;
      }

      if (newPassword.length < 8) {
        Alert.alert("Invalid", "New password must be at least 8 characters.");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert(
          "Mismatch",
          "New password and confirm password do not match.",
        );
        return;
      }

      setIsChangingPassword(true);
      await changePassword(session.token, currentPassword, newPassword);

      resetPasswordFields();
      setIsPasswordModalVisible(false);

      Alert.alert("Success", "Password changed successfully.");
    } catch (error: any) {
      Alert.alert(
        "Change password failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to change password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const renderPasswordField = ({
    value,
    onChangeText,
    placeholder,
    visible,
    onToggleVisible,
  }: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    visible: boolean;
    onToggleVisible: () => void;
  }) => (
    <View
      style={[
        styles.passwordInputWrap,
        {
          backgroundColor: theme.components.inputBackground,
          borderColor: theme.surface.border,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.components.inputPlaceholder}
        secureTextEntry={!visible}
        style={[
          styles.passwordInput,
          {
            color: theme.text.primary,
          },
        ]}
      />
      <Pressable
        onPress={onToggleVisible}
        hitSlop={10}
        style={styles.eyeButton}
      >
        <Ionicons
          name={visible ? "eye-off" : "eye"}
          size={24}
          color={theme.text.secondary}
        />
      </Pressable>
    </View>
  );

  return (
    <>
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.surface.background,
            paddingTop: insets.top + 20,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.topSection}>
            <View
              style={[
                styles.avatarOuter,
                {
                  borderColor: theme.brand.primary,
                },
              ]}
            >
              {avatarUri ? (
                <Image
                  key={avatarUri || "no-avatar"}
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
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    {session?.user.firstname?.[0] || "U"}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.name, { color: theme.text.primary }]}>
              {fullName}
            </Text>

            <View style={styles.assignmentRow}>
              <View style={styles.assignmentBlock}>
                <Text
                  style={[
                    styles.assignmentLabel,
                    { color: theme.text.primary },
                  ]}
                >
                  Assigned At:
                </Text>
                <Text
                  style={[
                    styles.assignmentValue,
                    { color: theme.brand.primary },
                  ]}
                >
                  {assignedMunicipality}
                </Text>
              </View>

              <View style={styles.assignmentBlock}>
                <Text
                  style={[
                    styles.assignmentLabel,
                    { color: theme.text.primary },
                  ]}
                >
                  Assigned As:
                </Text>
                <Text
                  style={[
                    styles.assignmentValue,
                    { color: theme.brand.primary },
                  ]}
                >
                  Volunteer
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <Pressable
              style={[
                styles.outlineButton,
                {
                  borderColor: theme.text.primary,
                  opacity: isUploadingImage ? 0.7 : 1,
                },
              ]}
              onPress={handlePickImage}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator color={theme.text.primary} />
              ) : (
                <Text
                  style={[
                    styles.outlineButtonText,
                    { color: theme.text.primary },
                  ]}
                >
                  Change Photo
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.outlineButton,
                {
                  borderColor: theme.text.primary,
                },
              ]}
              onPress={() => setIsPasswordModalVisible(true)}
            >
              <Text
                style={[
                  styles.outlineButtonText,
                  { color: theme.text.primary },
                ]}
              >
                Change Password
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.logoutButton,
                {
                  backgroundColor: theme.brand.secondary,
                },
              ]}
              onPress={handleLogout}
            >
              <Text
                style={[
                  styles.logoutButtonText,
                  {
                    color: theme.brand.onPrimary,
                  },
                ]}
              >
                Logout
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={isPasswordModalVisible}
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboardWrap}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface.surface,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Change Password
              </Text>

              {renderPasswordField({
                value: newPassword,
                onChangeText: setNewPassword,
                placeholder: "New Password",
                visible: showNewPassword,
                onToggleVisible: () => setShowNewPassword((prev) => !prev),
              })}

              {renderPasswordField({
                value: confirmPassword,
                onChangeText: setConfirmPassword,
                placeholder: "Retype New Password",
                visible: showConfirmPassword,
                onToggleVisible: () => setShowConfirmPassword((prev) => !prev),
              })}

              <Text
                style={[
                  styles.modalHint,
                  {
                    color: theme.text.secondary,
                  },
                ]}
              >
                Input old password to save changes.
              </Text>

              {renderPasswordField({
                value: currentPassword,
                onChangeText: setCurrentPassword,
                placeholder: "Old Password",
                visible: showCurrentPassword,
                onToggleVisible: () => setShowCurrentPassword((prev) => !prev),
              })}

              <Pressable
                style={[
                  styles.modalPrimaryButton,
                  {
                    backgroundColor: theme.brand.primary,
                    opacity: isChangingPassword ? 0.7 : 1,
                  },
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color={theme.brand.onPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.modalPrimaryButtonText,
                      {
                        color: theme.brand.onPrimary,
                      },
                    ]}
                  >
                    Save Changes
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.modalSecondaryButton,
                  {
                    backgroundColor: theme.brand.secondary,
                    opacity: isChangingPassword ? 0.7 : 1,
                  },
                ]}
                onPress={closePasswordModal}
                disabled={isChangingPassword}
              >
                <Text
                  style={[
                    styles.modalSecondaryButtonText,
                    {
                      color: theme.brand.onSecondary,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
  },

  topSection: {
    alignItems: "center",
    paddingTop: 18,
  },

  avatarOuter: {
    width: 206,
    height: 206,
    borderRadius: 103,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 22,
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 103,
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 103,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPlaceholderText: {
    fontSize: 64,
    fontWeight: "700",
  },

  name: {
    fontSize: 26,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 32,
  },

  assignmentRow: {
    width: "100%",
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  assignmentBlock: {
    flex: 1,
    alignItems: "center",
  },

  assignmentLabel: {
    fontSize: 16,
    fontWeight: "300",
    marginBottom: 8,
    textAlign: "center",
  },

  assignmentValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  buttonGroup: {
    marginTop: 72,
    gap: 18,
    paddingHorizontal: 12,
  },

  outlineButton: {
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  outlineButtonText: {
    fontSize: 16,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  logoutButton: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  logoutButtonText: {
    fontSize: 16,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalKeyboardWrap: {
    width: "100%",
  },

  modalCard: {
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 24,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 22,
  },

  passwordInputWrap: {
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 12,
  },

  passwordInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 14,
  },

  eyeButton: {
    marginLeft: 10,
    padding: 4,
  },

  modalHint: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
  },

  modalPrimaryButton: {
    minHeight: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  modalSecondaryButton: {
    minHeight: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

//*-----------------------OLD PROFILE CODE -----------------------
// import { useSession } from "@/src/context/SessionContext";
// import {
//   cacheRemoteProfileImage,
//   toAbsoluteImageUrl,
// } from "@/src/lib/imgCache";
// import {
//   changePassword,
//   uploadProfileImage,
// } from "@/src/services/profileService";
// import { useTheme } from "@/src/theme/useTheme";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { router } from "expo-router";
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// export default function ProfileScreen() {
//   const theme = useTheme();
//   const { session, signOut, updateSessionUser } = useSession();
//   const insets = useSafeAreaInsets();

//   const [avatarUri, setAvatarUri] = useState<string | null>(
//     session?.user.img_local_uri || toAbsoluteImageUrl(session?.user.img),
//   );
//   const [isUploadingImage, setIsUploadingImage] = useState(false);
//   const [isChangingPassword, setIsChangingPassword] = useState(false);

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   useEffect(() => {
//     const hydrateImage = async () => {
//       if (!session?.user) return;

//       if (session.user.img_local_uri) {
//         setAvatarUri(session.user.img_local_uri);
//         return;
//       }

//       const remoteUrl = toAbsoluteImageUrl(session.user.img);

//       if (!remoteUrl) {
//         setAvatarUri(null);
//         return;
//       }

//       const localUri = await cacheRemoteProfileImage(
//         remoteUrl,
//         session.user.id,
//       );
//       if (localUri) {
//         await updateSessionUser({
//           img_local_uri: localUri,
//         });
//         setAvatarUri(localUri);
//       } else {
//         setAvatarUri(remoteUrl);
//       }
//     };
//     hydrateImage();
//   }, [session?.user.id, session?.user.img, session?.user.img_local_uri]);

//   const fullName = useMemo(() => {
//     if (!session?.user) return "";
//     return [
//       session.user.firstname,
//       session.user.middlename,
//       session.user.lastname,
//     ]
//       .filter(Boolean)
//       .join(" ");
//   }, [session?.user]);

//   const handlePickImage = async () => {
//     try {
//       if (!session?.token || !session.user) {
//         Alert.alert("Unavailable", "Please login again.");
//         return;
//       }
//       const permission =
//         await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           "Permission required",
//           "Permission to access the media library is required.",
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ["images"],
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });
//       if (result.canceled || !result.assets?.[0]) {
//         return;
//       }

//       setIsUploadingImage(true);
//       const uploadResult = await uploadProfileImage(
//         session.token,
//         result.assets[0],
//       );
//       const remoteUrl =
//         uploadResult.imageUrl || toAbsoluteImageUrl(uploadResult.img);
//       const localUri = remoteUrl
//         ? await cacheRemoteProfileImage(remoteUrl, session.user.id)
//         : null;

//       await updateSessionUser({
//         img: uploadResult.img,
//         img_local_uri: localUri,
//       });

//       setAvatarUri(localUri || remoteUrl || null);

//       Alert.alert("Success", "Profile image update successfully.");
//     } catch (error: any) {
//       Alert.alert(
//         "upload failed",
//         error?.message || "Unable to update profile image.",
//       );
//     } finally {
//       setIsUploadingImage(false);
//     }
//   };

//   const handleChangePassword = async () => {
//     try {
//       if (!session?.token) {
//         Alert.alert("Unavailable", "Please login again.");
//         return;
//       }

//       if (!currentPassword || !newPassword || !confirmPassword) {
//         Alert.alert("Required", "Please fill in all password fields.");
//         return;
//       }

//       if (newPassword.length < 8) {
//         Alert.alert("Invalid", "New password must be at least 8 characters.");
//         return;
//       }

//       if (newPassword !== confirmPassword) {
//         Alert.alert(
//           "Mismatch",
//           "New password and confirm password do not match.",
//         );
//         return;
//       }

//       setIsChangingPassword(true);
//       await changePassword(session.token, currentPassword, newPassword);

//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");

//       Alert.alert("Success", "Password changed successfully.");
//     } catch (error: any) {
//       Alert.alert(
//         "Change password failed",
//         error?.response?.data?.message ||
//           error?.message ||
//           "Unable to change password.",
//       );
//     } finally {
//       setIsChangingPassword(false);
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert("Logout", "Are you sure you want to logout?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Logout",
//         style: "destructive",
//         onPress: async () => {
//           await signOut();
//           router.replace("/sign-in");
//         },
//       },
//     ]);
//   };

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
//       <ScrollView contentContainerStyle={styles.content}>
//         {/* <Text style={[styles.title, { color: theme.navigation.tabActive }]}>
//           Profile
//         </Text> */}
//         <View
//           style={[
//             styles.profileCard,
//             {
//               backgroundColor: theme.components.cardBackground,
//               borderColor: theme.surface.border,
//             },
//           ]}
//         >
//           <View style={styles.avatarWrap}>
//             {avatarUri ? (
//               <Image
//                 key={avatarUri || "no-avatar"}
//                 source={avatarUri}
//                 style={styles.avatar}
//                 contentFit="cover"
//                 cachePolicy="disk"
//               />
//             ) : (
//               <View
//                 style={[
//                   styles.avatarPlaceholder,
//                   {
//                     backgroundColor: theme.surface.surfaceAlt,
//                   },
//                 ]}
//               >
//                 <Text
//                   style={[
//                     styles.avatarPlaceholderText,
//                     {
//                       color: theme.text.secondary,
//                     },
//                   ]}
//                 >
//                   {session?.user.firstname?.[0] || "U"}
//                 </Text>
//               </View>
//             )}
//           </View>
//           <Text style={[styles.name, { color: theme.text.primary }]}>
//             {fullName}
//           </Text>
//           <Text style={[styles.email, { color: theme.text.secondary }]}>
//             {session?.user.email}
//           </Text>
//           <Text style={[styles.meta, { color: theme.text.secondary }]}>
//             Municipality: {session?.user.municipality_name || "-"}
//           </Text>
//           <Pressable
//             style={[
//               styles.primaryButton,
//               {
//                 backgroundColor: theme.brand.primary,
//                 opacity: isUploadingImage ? 0.7 : 1,
//               },
//             ]}
//             onPress={handlePickImage}
//             disabled={isUploadingImage}
//           >
//             {isUploadingImage ? (
//               <ActivityIndicator color={theme.brand.onPrimary} />
//             ) : (
//               <Text
//                 style={[
//                   styles.primaryButtonText,
//                   {
//                     color: theme.brand.onPrimary,
//                   },
//                 ]}
//               >
//                 Update Profile Image
//               </Text>
//             )}
//           </Pressable>
//         </View>
//         <View
//           style={[
//             styles.passwordCard,
//             {
//               backgroundColor: theme.components.cardBackground,
//               borderColor: theme.surface.border,
//             },
//           ]}
//         >
//           <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
//             Change Password
//           </Text>
//           <TextInput
//             value={currentPassword}
//             onChangeText={setCurrentPassword}
//             placeholder="Current Password"
//             placeholderTextColor={theme.components.inputPlaceholder}
//             secureTextEntry
//             style={[
//               styles.input,
//               {
//                 backgroundColor: theme.components.inputBackground,
//                 borderColor: theme.surface.border,
//                 color: theme.text.primary,
//               },
//             ]}
//           />

//           <TextInput
//             value={newPassword}
//             onChangeText={setNewPassword}
//             placeholder="New Password"
//             placeholderTextColor={theme.components.inputPlaceholder}
//             secureTextEntry
//             style={[
//               styles.input,
//               {
//                 backgroundColor: theme.components.inputBackground,
//                 borderColor: theme.surface.border,
//                 color: theme.text.primary,
//               },
//             ]}
//           />

//           <TextInput
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             placeholder="Confirm Password"
//             placeholderTextColor={theme.components.inputPlaceholder}
//             secureTextEntry
//             style={[
//               styles.input,
//               {
//                 backgroundColor: theme.components.inputBackground,
//                 borderColor: theme.surface.border,
//                 color: theme.text.primary,
//               },
//             ]}
//           />

//           <Pressable
//             style={[
//               styles.primaryButton,
//               {
//                 backgroundColor: theme.brand.primary,
//                 opacity: isChangingPassword ? 0.7 : 1,
//               },
//             ]}
//             onPress={handleChangePassword}
//             disabled={isChangingPassword}
//           >
//             {isChangingPassword ? (
//               <ActivityIndicator color={theme.brand.onPrimary} />
//             ) : (
//               <Text
//                 style={[
//                   styles.primaryButtonText,
//                   {
//                     color: theme.brand.onPrimary,
//                   },
//                 ]}
//               >
//                 Change Password
//               </Text>
//             )}
//           </Pressable>
//         </View>
//         <Pressable
//           style={[
//             styles.logoutButton,
//             {
//               backgroundColor: theme.brand.secondary,
//             },
//           ]}
//           onPress={handleLogout}
//         >
//           <Text
//             style={[
//               styles.logoutButtonText,
//               {
//                 color: theme.brand.onSecondary,
//               },
//             ]}
//           >
//             Logout
//           </Text>
//         </Pressable>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "700",
//     //marginBottom: 20,
//   },
//   content: {
//     paddingLeft: 20,
//     paddingRight: 20,
//     gap: 16,
//     paddingBottom: 28,
//   },
//   profileCard: {
//     borderWidth: 1,
//     borderRadius: 22,
//     padding: 18,
//     alignItems: "center",
//   },

//   avatarWrap: {
//     marginBottom: 14,
//   },

//   avatar: {
//     width: 118,
//     height: 118,
//     borderRadius: 59,
//   },

//   avatarPlaceholder: {
//     width: 118,
//     height: 118,
//     borderRadius: 59,
//   },

//   avatarPlaceholderText: {
//     fontSize: 42,
//     fontWeight: "700",
//   },

//   name: {
//     fontSize: 22,
//     fontWeight: "700",
//     textAlign: "center",
//   },

//   email: {
//     marginTop: 6,
//     fontSize: 15,
//     textAlign: "center",
//   },

//   meta: {
//     marginTop: 4,
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 18,
//   },

//   passwordCard: {
//     borderWidth: 1,
//     borderRadius: 22,
//     padding: 18,
//   },

//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     marginBottom: 14,
//   },

//   input: {
//     minHeight: 54,
//     borderRadius: 16,
//     borderWidth: 1,
//     paddingHorizontal: 16,
//     fontSize: 16,
//     marginBottom: 12,
//   },

//   primaryButton: {
//     marginTop: 6,
//     height: 54,
//     borderRadius: 27,
//     justifyContent: "center",
//     alignItems: "center",
//     alignSelf: "stretch",
//   },

//   primaryButtonText: {
//     fontSize: 16,
//     fontWeight: "700",
//   },

//   logoutButton: {
//     height: 54,
//     borderRadius: 27,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   logoutButtonText: {
//     fontSize: 16,
//     fontWeight: "700",
//   },
// });
