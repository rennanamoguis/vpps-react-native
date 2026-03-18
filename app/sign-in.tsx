import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/theme/useTheme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const theme = useTheme();
  const { session, signIn } = useSession();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/(tabs)");
    }
  }, [session]);

  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert("Required", "Please enter your email and password.");
        return;
      }

      setIsSubmitting(true);
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(error);
      const message =
        error?.response?.data?.message || "Unable to login. Please try again.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
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
      {/*Decorative shapes*/}
      <View
        style={[
          styles.shapeTopRight,
          {
            backgroundColor: theme.brand.secondary,
          },
        ]}
      />

      <View
        style={[
          styles.shapeBottomLeft,
          {
            backgroundColor: theme.brand.secondary,
          },
        ]}
      />

      <View style={styles.content}>
        <Text style={[styles.welcome, { color: theme.text.primary }]}>
          Welcome!
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.primary }]}>
          Please login to continue
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={theme.components.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: theme.components.inputBackground,
              color: theme.text.primary,
              borderColor: theme.surface.border,
            },
          ]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.components.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: theme.components.inputBackground,
              color: theme.text.primary,
              borderColor: theme.surface.border,
            },
          ]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable>
          <Text style={[styles.forgotText, { color: theme.brand.primary }]}>
            Forgot Password
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.loginButton,
            {
              backgroundColor: theme.brand.primary,
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.brand.onPrimary} />
          ) : (
            <Text
              style={[
                styles.loginButtonText,
                {
                  color: theme.brand.onPrimary,
                },
              ]}
            >
              LOGIN
            </Text>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.googleButton,
            {
              borderColor: theme.brand.secondary,
              backgroundColor: theme.surface.surface,
            },
          ]}
          disabled
        >
          <Text
            style={[
              styles.googleButtonText,
              {
                color: theme.brand.secondary,
              },
            ]}
          >
            Login with Google
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 140,
  },
  welcome: {
    fontSize: 42,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 24,
    marginBottom: 48,
  },
  input: {
    height: 74,
    borderRadius: 18,
    paddingHorizontal: 22,
    fontSize: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  forgotText: {
    textAlign: "right",
    fontSize: 17,
    marginBottom: 36,
  },
  loginButton: {
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  googleButton: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  shapeTopRight: {
    position: "absolute",
    top: 40,
    right: -60,
    width: 170,
    height: 170,
    borderRadius: 40,
    transform: [
      {
        rotate: "45deg",
      },
    ],
  },
  shapeBottomLeft: {
    position: "absolute",
    bottom: 40,
    left: -80,
    width: 170,
    height: 170,
    borderRadius: 40,
    transform: [
      {
        rotate: "45deg",
      },
    ],
  },
});
