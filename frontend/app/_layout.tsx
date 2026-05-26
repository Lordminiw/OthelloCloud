import { Stack } from "expo-router";
import { PaperProvider, MD3LightTheme } from "react-native-paper";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563eb",
    background: "#ffffff",
    surface: "#ffffff",
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack />
    </PaperProvider>
  );
}