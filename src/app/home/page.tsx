"use client";

import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import HomeHeroCarousel from "@/components/home/HomeHeroCarousel";
import { getHomeQuickCardsForRole } from "@/components/home/homeQuickCards";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <AppShell mainClassName="h-[calc(100dvh-4rem)] overflow-hidden p-0">
        <HomeContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function HomeContent() {
  const { user } = useAuth();

  const menuCards = getHomeQuickCardsForRole(user?.role);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <HomeHeroCarousel userName={user?.name} menuCards={menuCards} />
  );
}
