import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/theme/useTheme";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const APP_LOGO = require("@/assets/images/vpps_logo.png");

export default function SplashScreenRoute() {
  const theme = useTheme();
  const { session, isLoading } = useSession();
  const insets = useSafeAreaInsets();

  const progress = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const loadingAnimation = Animated.timing(progress, {
      toValue: 0.72,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    loadingAnimation.start();

    return () => {
      loadingAnimation.stop();
    };
  }, [progress]);

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    const elapsed = Date.now() - mountedAt.current;
    const minimumSplashMs = 1200;
    const waitMs = Math.max(0, minimumSplashMs - elapsed);

    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;

        if (session) {
          router.replace("/(tabs)");
        } else {
          router.replace("/sign-in");
        }
      });
    }, waitMs);

    return () => clearTimeout(timer);
  }, [isLoading, progress, session]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.centerContent}>
        <Image source={APP_LOGO} style={styles.logo} contentFit="contain" />
      </View>

      <View style={styles.bottomArea}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.surface.border },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: theme.brand.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 320,
    height: 320,
  },
  bottomArea: {
    paddingHorizontal: 24,
  },
  progressTrack: {
    height: 5,
    width: "50%",
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "center",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
