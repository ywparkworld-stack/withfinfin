import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1E293B",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    />
  );
}
