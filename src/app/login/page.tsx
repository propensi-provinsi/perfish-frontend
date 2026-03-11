"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Format email tidak valid";
    if (!password) errs.password = "Password wajib diisi";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/home");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        axiosErr.response?.data?.message || "Login gagal. Periksa kembali email dan password Anda."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#2CABDB] focus:outline-none focus:ring-2 focus:ring-[#2CABDB]/20 transition-all";

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
              <h2 className="text-lg font-semibold text-[#1A2B3C]">Masuk ke Akun Anda</h2>
              <p className="mt-0.5 text-xs text-gray-500">Masukkan email dan password untuk melanjutkan</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
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
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-0.5 text-xs text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              <div className="h-2" />

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
                {submitting ? "Masuk…" : "Masuk"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#2CABDB] hover:text-[#3865A2] transition-colors"
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}