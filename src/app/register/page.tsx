"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { USER_ROLES } from "@/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ── Client-side validation ─────────────────────────── */
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama wajib diisi";
    if (!email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Format email tidak valid";
    if (!password) errs.password = "Password wajib diisi";
    else if (password.length < 8)
      errs.password = "Password minimal 8 karakter";
    else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password))
      errs.password = "Password harus mengandung huruf dan angka";
    if (!role) errs.role = "Pilih role terlebih dahulu";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; fieldErrors?: Record<string, string> } };
      };
      if (axiosErr.response?.data?.fieldErrors) {
        setFieldErrors(axiosErr.response.data.fieldErrors);
      } else {
        setError(
          axiosErr.response?.data?.message || "Registrasi gagal. Coba lagi."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-light">
              <span className="text-3xl text-green">✓</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-navy">
            Registrasi Berhasil!
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Mengarahkan ke halaman login…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="PERFISH" width={56} height={56} />
          <h1 className="mt-3 text-2xl font-bold text-navy">PERFISH</h1>
          <p className="text-sm text-gray-500">Buat akun baru</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm
                focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
                transition-colors"
              placeholder="Nama lengkap"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm
                focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
                transition-colors"
              placeholder="nama@email.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm
                focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
                transition-colors"
              placeholder="Min 8 karakter, huruf + angka"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm
                focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
                transition-colors"
            >
              <option value="">Pilih role</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <p className="mt-1 text-xs text-red">{fieldErrors.role}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50
              transition-all"
          >
            {submitting ? "Mendaftar…" : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-cyan hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
