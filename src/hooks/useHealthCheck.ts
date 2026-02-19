"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { HealthStatus } from "@/types";

export function useHealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await apiClient.get<HealthStatus>("/health");
        setHealth(data);
        setError(null);
      } catch (err) {
        setError("Backend is unreachable");
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { health, loading, error };
}
