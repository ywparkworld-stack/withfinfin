"use client";

import { useState, useEffect } from "react";

export interface Profile {
  uid: string;
  displayName: string;
}

const PROFILE_KEY = "mith_profile";

function generateUid(): string {
  return "uid_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) setProfile(JSON.parse(raw));
    setLoading(false);
  }, []);

  const saveProfile = (displayName: string) => {
    const p: Profile = { uid: generateUid(), displayName };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
    return p;
  };

  return { profile, loading, saveProfile };
}
