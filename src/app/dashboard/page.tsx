"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { health, loading: healthLoading, error: healthError } = useHealthCheck();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome back, <span className="font-medium">{user?.name}</span>!
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Your Account
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{user?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {user?.role}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Backend Status Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Backend Status
            </h2>
            {healthLoading && (
              <p className="text-gray-400 text-sm">Checking…</p>
            )}
            {healthError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                {healthError}
              </div>
            )}
            {health && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {health.status}
                <span className="text-xs text-gray-400">
                  {health.timestamp}
                </span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Links
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/swagger-ui.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  API Documentation →
                </a>
              </li>
              {user?.role === "SUPERADMIN" && (
                <li>
                  <a
                    href="/admin/users"
                    className="text-blue-600 hover:underline"
                  >
                    Manage Users →
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
