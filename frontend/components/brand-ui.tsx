import { PropsWithChildren, useEffect, useRef } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import {
  Button,
  ButtonProps,
  Dialog,
  DialogProps,
  Text,
  TextInput,
  TextInputProps,
} from "react-native-paper";
import { useAppTheme } from "@/constants/theme";

export function BrandBackdrop() {
  const theme = useAppTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.glowOrb,
          {
            top: -60,
            right: -80,
            backgroundColor: theme.brand.heroOverlay[0],
            width: 260,
            height: 260,
          },
        ]}
      />
      <View
        style={[
          styles.glowOrb,
          {
            top: 180,
            left: -110,
            backgroundColor: theme.brand.heroOverlay[1],
            width: 220,
            height: 220,
          },
        ]}
      />
      <View
        style={[
          styles.gridFrame,
          {
            borderColor: theme.brand.palette.divider,
          },
        ]}
      />
    </View>
  );
}

export function ScreenReveal({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useAppTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.brand.motion.normal,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.brand.motion.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, theme.brand.motion.normal, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function SectionEyebrow({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  const theme = useAppTheme();

  return (
    <Text
      variant="labelMedium"
      style={[
        styles.eyebrow,
        {
          color: theme.brand.palette.accentStrong,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.sectionHeading,
        {
          borderBottomColor: theme.brand.palette.divider,
        },
      ]}
    >
      <View style={styles.sectionHeadingText}>
        {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
        <Text variant="titleLarge">{title}</Text>
        {subtitle ? (
          <Text
            variant="bodyMedium"
            style={{ color: theme.brand.palette.textMuted }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

export function SurfaceChip({
  label,
  active = false,
  style,
}: {
  label: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.surfaceChip,
        {
          borderColor: active
            ? theme.brand.palette.chromeStrong
            : theme.brand.palette.divider,
          backgroundColor: active
            ? theme.brand.palette.accentSoft
            : theme.brand.palette.chrome,
        },
        style,
      ]}
    >
      <Text
        variant="labelMedium"
        style={{
          color: active
            ? theme.brand.palette.accentStrong
            : theme.brand.palette.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function BrandButton(props: ButtonProps) {
  const theme = useAppTheme();
  const isContained =
    props.mode === "contained" || props.mode === "contained-tonal";

  return (
    <Button
      {...props}
      style={[
        styles.button,
        {
          borderColor: theme.brand.palette.chromeStrong,
          backgroundColor:
            props.mode === "contained"
              ? theme.brand.palette.accent
              : props.mode === "contained-tonal"
                ? theme.brand.palette.accentSoft
                : "transparent",
        },
        props.style,
      ]}
      contentStyle={[styles.buttonContent, props.contentStyle]}
      labelStyle={[
        styles.buttonLabel,
        {
          color: isContained
            ? theme.colors.onPrimary
            : theme.brand.palette.text,
        },
        props.labelStyle,
      ]}
    />
  );
}

export function BrandTextInput(props: TextInputProps) {
  const theme = useAppTheme();

  return (
    <TextInput
      {...props}
      mode={props.mode ?? "outlined"}
      outlineStyle={[
        styles.inputOutline,
        {
          borderColor: theme.brand.palette.chromeStrong,
        },
        props.outlineStyle,
      ]}
      style={[
        styles.input,
        {
          backgroundColor: theme.brand.palette.panelAlt,
        },
        props.style,
      ]}
    />
  );
}

export function BrandDialog({
  children,
  style,
  ...props
}: PropsWithChildren<DialogProps>) {
  const theme = useAppTheme();

  return (
    <Dialog
      {...props}
      style={[
        styles.dialog,
        {
          backgroundColor: theme.brand.palette.panel,
          borderColor: theme.brand.palette.chromeStrong,
          shadowColor: theme.brand.shadowColor,
        },
        style,
      ]}
    >
      {children}
    </Dialog>
  );
}

export function useBrandSurfaceStyles() {
  const theme = useAppTheme();

  return {
    panelCard: {
      backgroundColor: theme.brand.palette.panel,
      borderColor: theme.brand.palette.chromeStrong,
      borderWidth: 1,
      shadowColor: theme.brand.shadowColor,
      shadowOpacity: theme.brand.isDark ? 0.22 : 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    } satisfies ViewStyle,
    mutedCard: {
      backgroundColor: theme.brand.palette.panelAlt,
      borderColor: theme.brand.palette.divider,
      borderWidth: 1,
    } satisfies ViewStyle,
    divider: {
      backgroundColor: theme.brand.palette.divider,
    } satisfies ViewStyle,
    softBlock: {
      backgroundColor: theme.brand.palette.chrome,
      borderColor: theme.brand.palette.divider,
      borderWidth: 1,
      borderRadius: 18,
    } satisfies ViewStyle,
  };
}

const styles = StyleSheet.create({
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  gridFrame: {
    position: "absolute",
    top: 18,
    right: 18,
    bottom: 18,
    left: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 28,
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 2.2,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeadingText: {
    flex: 1,
    gap: 4,
  },
  surfaceChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  button: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  buttonContent: {
    minHeight: 46,
    paddingHorizontal: 12,
  },
  buttonLabel: {
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 18,
  },
  inputOutline: {
    borderWidth: 1,
    borderRadius: 18,
  },
  dialog: {
    borderWidth: 1,
    borderRadius: 24,
  },
});
