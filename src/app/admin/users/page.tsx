"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import apiClient from "@/lib/api";
import type { ApiResponse, UserData } from "@/types";
import { USER_ROLES } from "@/types";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
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
      setError("Failed to load users");
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
      setSuccessMsg("Role updated successfully");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosErr.response?.data?.message || "Failed to update role"
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          User Management
        </h1>

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

        {loading ? (
          <p className="text-gray-400">Loading users…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === user.id ? (
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="">Select role</option>
                          {USER_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === user.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRole(user.id)}
                            disabled={updating || !newRole}
                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating ? "…" : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setNewRole("");
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setNewRole(user.role);
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
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
    </div>
  );
}
