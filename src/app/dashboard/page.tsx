"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selamat datang kembali, <span className="font-medium">{user?.name}</span>!
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* User Info Card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy dark:text-white mb-3">
            Akun Anda
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Nama</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Role</dt>
              <dd>
                <span className="inline-flex rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
                  {user?.role}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy dark:text-white mb-3">
            Pintasan
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/swagger-ui.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:underline"
              >
                API Documentation →
              </a>
            </li>
            {user?.role === "SUPERADMIN" && (
              <li>
                <a
                  href="/master-data/users"
                  className="text-cyan hover:underline"
                >
                  Kelola Pengguna →
                </a>
              </li>
            )}
            <li>
              <a
                href="/settings"
                className="text-cyan hover:underline"
              >
                Pengaturan & Status Backend →
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
