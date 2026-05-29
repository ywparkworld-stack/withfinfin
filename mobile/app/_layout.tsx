import { Stack } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { Redirect } from "expo-router";

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
