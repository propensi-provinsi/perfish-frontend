"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { health, loading, error } = useHealthCheck();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi sistem dan status backend</p>
      </div>

      {/* Backend Status Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy mb-4">
          Status Backend
        </h2>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="inline-block h-3 w-3 rounded-full bg-gray-300 animate-pulse" />
            Memeriksa koneksi…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-block h-3 w-3 rounded-full bg-red shrink-0" />
            <div>
              <p className="font-medium text-red">Tidak Terhubung</p>
              <p className="text-gray-500 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {health && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-block h-3 w-3 rounded-full bg-green shrink-0" />
              <div>
                <p className="font-medium text-green">Terhubung</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Status: {health.status}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp</span>
                <span className="font-medium text-gray-900">{health.timestamp}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">API URL</span>
                <span className="font-medium text-gray-900 text-xs">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Documentation link */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy mb-4">
          Tautan Cepat
        </h2>
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/swagger-ui.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:underline"
            >
              Swagger API Documentation →
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
