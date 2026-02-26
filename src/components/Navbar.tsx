"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">
            Perfish
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Profile
          </Link>
          {user.role === "SUPERADMIN" && (
            <Link
              href="/admin/users"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Manage Users
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user.name}{" "}
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {user.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
