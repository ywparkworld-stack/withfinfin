import { Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { Redirect } from "expo-router";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

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
