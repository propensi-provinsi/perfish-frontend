"use client";

import { useEffect, useState, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import type { ApiResponse, ProfileData } from "@/types";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
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
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Invalid email format";
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
      setSuccessMsg("Profile updated successfully");
      await refreshProfile();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; fieldErrors?: Record<string, string> } };
      };
      if (axiosErr.response?.data?.fieldErrors) {
        setFieldErrors(axiosErr.response.data.fieldErrors);
      } else {
        setError(
          axiosErr.response?.data?.message || "Failed to update profile"
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {successMsg && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {!editing ? (
            /* ── View Mode ──────────────────────────────── */
            <>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Name</dt>
                  <dd className="mt-1 text-gray-900 font-medium">
                    {profile?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email</dt>
                  <dd className="mt-1 text-gray-900 font-medium">
                    {profile?.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {profile?.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {profile?.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-gray-900 text-sm">
                    {profile?.lastLoginAt
                      ? new Date(profile.lastLoginAt).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-gray-900 text-sm">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
              </dl>
              <button
                onClick={() => setEditing(true)}
                className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </>
          ) : (
            /* ── Edit Mode ──────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save Changes"}
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
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
