import { Redirect } from "expo-router";
import { useProfile } from "../hooks/useProfile";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Redirect href={profile ? "/(app)/groups" : "/setup"} />;
}
