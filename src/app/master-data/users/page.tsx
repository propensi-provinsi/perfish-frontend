"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse, UserData } from "@/types";
import { USER_ROLES } from "@/types";

export default function MasterDataUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
      <AppShell>
        <UsersContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data } = await apiClient.get<ApiResponse<UserData[]>>(
        "/v1/users"
      );
      setUsers(data.data);
    } catch {
      setError("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(userId: string) {
    if (!newRole) return;
    setUpdating(true);
    setSuccessMsg(null);
    try {
      const { data } = await apiClient.put<ApiResponse<UserData>>(
        `/v1/users/${userId}/role`,
        { role: newRole }
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? data.data : u))
      );
      setEditingId(null);
      setNewRole("");
      setSuccessMsg("Role berhasil diperbarui");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosErr.response?.data?.message || "Gagal memperbarui role"
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola pengguna dan role akses</p>
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

      {loading ? (
        <p className="text-gray-400">Memuat pengguna…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Login Terakhir
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === user.id ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-2.5 py-1.5 text-sm
                          focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                      >
                        <option value="">Pilih role</option>
                        {USER_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-green-light px-2.5 py-0.5 text-xs font-medium text-green">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("id-ID")
                      : "Belum pernah"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateRole(user.id)}
                          disabled={updating || !newRole}
                          className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-medium text-white
                            hover:bg-cyan-hover disabled:opacity-50 transition-colors"
                        >
                          {updating ? "…" : "Simpan"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setNewRole("");
                          }}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium
                            text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(user.id);
                          setNewRole(user.role);
                        }}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium
                          text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
