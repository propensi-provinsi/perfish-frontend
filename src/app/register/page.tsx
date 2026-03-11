"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { USER_ROLES } from "@/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#2CABDB] focus:outline-none focus:ring-2 focus:ring-[#2CABDB]/20 transition-all";

  if (success) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #1A2B3C 0%, #2a4158 50%, #3865A2 100%)" }}
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#1A2B3C]">Registrasi Berhasil!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Akun Anda telah berhasil dibuat. Mengarahkan ke halaman login…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1A2B3C 0%, #2a4158 50%, #3865A2 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-40 -top-40 h-80 w-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2CABDB 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2CABDB 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo di luar card */}
        <div className="mb-4 flex justify-center">
          <Image src="/logo-w.png" alt="PERFISH" width={210} height={46} />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Form body ── */}
        <div className="px-7 py-7">
          <div className="mb-5 text-center">
            <h2 className="text-lg font-semibold text-[#1A2B3C]">Buat Akun Baru</h2>
            <p className="mt-0.5 text-xs text-gray-500">Lengkapi data di bawah untuk mendaftar</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputBase}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-0.5 text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  placeholder="nama@perfish.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-0.5 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${inputBase} appearance-none pr-8 text-gray-700`}
                >
                  <option value="">Pilih role</option>
                  {USER_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {fieldErrors.role && (
                <p className="mt-0.5 text-xs text-red-500">{fieldErrors.role}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pr-9`}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">Kombinasi huruf dan angka</p>
              {fieldErrors.password && (
                <p className="mt-0.5 text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-lg py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #2CABDB 0%, #3865A2 100%)",
                boxShadow: "0 4px 12px rgba(44, 171, 219, 0.35)",
              }}
            >
              {submitting ? "Mendaftar…" : "Daftar"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#2CABDB] hover:text-[#3865A2] transition-colors"
            >
              Masuk
            </Link>
          </p>
        </div>
        </div>
      </div>
    </main>
  );
}