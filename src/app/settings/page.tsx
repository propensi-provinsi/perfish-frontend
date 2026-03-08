"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";

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
  const { logout } = useAuth();
  const router = useRouter();
  const { health, loading, error } = useHealthCheck();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Pengaturan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Konfigurasi sistem dan status backend</p>
      </div>

      {/* Backend Status Card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy dark:text-white mb-4">
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
            <div className="rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{health.timestamp}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">API URL</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy dark:text-white mb-4">
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
      {/* Logout */}
      <div className="rounded-xl border border-red/20 bg-white dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy dark:text-white mb-2">Keluar</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Anda akan keluar dari akun dan diarahkan ke halaman login.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg bg-red px-4 py-2.5 text-sm font-semibold text-white
            hover:bg-red/90 active:scale-[0.98] transition-all"
        >
          <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
