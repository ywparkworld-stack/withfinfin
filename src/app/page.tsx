"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export default function RootPage() {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(profile ? "/dashboard" : "/setup");
  }, [profile, loading, router]);

  return null;
}
