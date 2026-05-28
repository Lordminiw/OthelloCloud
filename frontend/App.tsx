import { createElement, useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://app.othello-cloud.de";

function getUrlOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "OthelloCloud";
    }
  }, []);

  if (Platform.OS === "web") {
    const targetOrigin = getUrlOrigin(APP_URL);
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : null;

    if (!targetOrigin || !currentOrigin) {
      return (
        <View style={styles.page}>
          <View style={styles.card}>
            <Text style={styles.kicker}>OthelloCloud</Text>
            <Text style={styles.title}>Client shell</Text>
            <Text style={styles.body}>
              Set <Text style={styles.mono}>EXPO_PUBLIC_APP_URL</Text> to the frontend you want to embed.
            </Text>
          </View>
        </View>
      );
    }

    if (targetOrigin === currentOrigin) {
      return (
        <View style={styles.page}>
          <View style={styles.card}>
            <Text style={styles.kicker}>OthelloCloud</Text>
            <Text style={styles.title}>Frontend is already here</Text>
            <Text style={styles.body}>
              This web build is hosted on the same origin as the target frontend, so embedding it here would create a loop.
              Point <Text style={styles.mono}>EXPO_PUBLIC_APP_URL</Text> at a different frontend URL for the web shell.
            </Text>
          </View>
        </View>
      );
    }

    return createElement("iframe", {
      src: APP_URL,
      title: "OthelloCloud",
      style: styles.iframe,
      allow: "clipboard-read; clipboard-write",
    });
  }

  return (
    <View style={styles.nativeRoot}>
      <StatusBar style="light" />
      <WebView
        source={{ uri: APP_URL }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  nativeRoot: {
    flex: 1,
    backgroundColor: "#0b0b0f",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 24,
    backgroundColor: "#17171d",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    gap: 12,
  },
  kicker: {
    color: "#4f87ff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#f4f7fb",
    fontSize: 28,
    fontWeight: "700",
  },
  body: {
    color: "#c2c7d0",
    fontSize: 16,
    lineHeight: 22,
  },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    color: "#edf2ff",
  },
  iframe: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderWidth: 0,
    backgroundColor: "#0b0b0f",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0b0b0f",
  },
});
