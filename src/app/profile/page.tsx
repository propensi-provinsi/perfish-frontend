"use client";

import { useEffect, useState, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import type { ApiResponse, ProfileData } from "@/types";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { refreshProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data } = await apiClient.get<ApiResponse<ProfileData>>(
        "/v1/profile"
      );
      setProfile(data.data);
      setName(data.data.name);
      setEmail(data.data.email);
    } catch {
      setError("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama wajib diisi";
    if (!email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Format email tidak valid";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.put<ApiResponse<ProfileData>>(
        "/v1/profile",
        { name, email }
      );
      setProfile(data.data);
      setEditing(false);
      setSuccessMsg("Profil berhasil diperbarui");
      await refreshProfile();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; fieldErrors?: Record<string, string> } };
      };
      if (axiosErr.response?.data?.fieldErrors) {
        setFieldErrors(axiosErr.response.data.fieldErrors);
      } else {
        setError(
          axiosErr.response?.data?.message || "Gagal memperbarui profil"
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Memuat profil…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Profil Saya</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola informasi akun Anda</p>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-green-light border border-green/20 p-3 text-sm text-green">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm">
        {!editing ? (
          /* ── View Mode ──────────────────────────────── */
          <>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Nama</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                  {profile?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                  {profile?.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="mt-1">
                  <span className="inline-flex rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
                    {profile?.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className="inline-flex rounded-full bg-green-light px-2.5 py-0.5 text-xs font-medium text-green">
                    {profile?.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Login Terakhir</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 text-sm">
                  {profile?.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString("id-ID")
                    : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Bergabung Sejak</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 text-sm">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleString("id-ID")
                    : "N/A"}
                </dd>
              </div>
            </dl>
            <button
              onClick={() => setEditing(true)}
              className="mt-6 rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-cyan-hover active:scale-[0.98] transition-all"
            >
              Edit Profil
            </button>
          </>
        ) : (
          /* ── Edit Mode ──────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nama
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-3.5 py-2.5 text-sm
                  focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
                  transition-colors"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-3.5 py-2.5 text-sm
                  focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
                  transition-colors"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white
                  hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {submitting ? "Menyimpan…" : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(profile?.name || "");
                  setEmail(profile?.email || "");
                  setFieldErrors({});
                  setError(null);
                }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium
                  text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
