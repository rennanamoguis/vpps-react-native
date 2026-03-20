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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

      Alert.alert("Success", "Profile image update successfully.");
    } catch (error: any) {
      Alert.alert(
        "upload failed",
        error?.message || "Unable to update profile image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
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

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

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

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.navigation.tabActive }]}>
          Profile
        </Text>
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.components.cardBackground,
              borderColor: theme.surface.border,
            },
          ]}
        >
          <View style={styles.avatarWrap}>
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
          <Text style={[styles.email, { color: theme.text.secondary }]}>
            {session?.user.email}
          </Text>
          <Text style={[styles.meta, { color: theme.text.secondary }]}>
            Municipality: {session?.user.municipality_name || "-"}
          </Text>
          <Pressable
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.brand.primary,
                opacity: isUploadingImage ? 0.7 : 1,
              },
            ]}
            onPress={handlePickImage}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator color={theme.brand.onPrimary} />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: theme.brand.onPrimary,
                  },
                ]}
              >
                Update Profile Image
              </Text>
            )}
          </Pressable>
        </View>
        <View
          style={[
            styles.passwordCard,
            {
              backgroundColor: theme.components.cardBackground,
              borderColor: theme.surface.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Change Password
          </Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current Password"
            placeholderTextColor={theme.components.inputPlaceholder}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme.components.inputBackground,
                borderColor: theme.surface.border,
                color: theme.text.primary,
              },
            ]}
          />

          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
            placeholderTextColor={theme.components.inputPlaceholder}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme.components.inputBackground,
                borderColor: theme.surface.border,
                color: theme.text.primary,
              },
            ]}
          />

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm Password"
            placeholderTextColor={theme.components.inputPlaceholder}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme.components.inputBackground,
                borderColor: theme.surface.border,
                color: theme.text.primary,
              },
            ]}
          />

          <Pressable
            style={[
              styles.primaryButton,
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
                  styles.primaryButtonText,
                  {
                    color: theme.brand.onPrimary,
                  },
                ]}
              >
                Change Password
              </Text>
            )}
          </Pressable>
        </View>
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
                color: theme.brand.onSecondary,
              },
            ]}
          >
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    //marginBottom: 20,
  },
  content: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    paddingBottom: 28,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
  },

  avatarWrap: {
    marginBottom: 14,
  },

  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },

  avatarPlaceholder: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },

  avatarPlaceholderText: {
    fontSize: 42,
    fontWeight: "700",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  email: {
    marginTop: 6,
    fontSize: 15,
    textAlign: "center",
  },

  meta: {
    marginTop: 4,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
  },

  passwordCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },

  primaryButton: {
    marginTop: 6,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },

  logoutButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
