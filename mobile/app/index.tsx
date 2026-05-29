import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Redirect href={user ? "/(app)/groups" : "/(auth)/login"} />;
}
