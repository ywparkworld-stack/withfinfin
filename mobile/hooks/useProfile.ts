import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Profile {
  uid: string;
  displayName: string;
}

const PROFILE_KEY = "@mith_profile";

function generateUid(): string {
  return "uid_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then((raw) => {
      if (raw) setProfile(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const saveProfile = async (displayName: string) => {
    const p: Profile = { uid: generateUid(), displayName };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
    return p;
  };

  const updateDisplayName = async (displayName: string) => {
    if (!profile) return;
    const p = { ...profile, displayName };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  };

  return { profile, loading, saveProfile, updateDisplayName };
}
