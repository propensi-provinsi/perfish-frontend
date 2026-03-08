"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="PERFISH" width={56} height={56} />
          <h1 className="mt-3 text-2xl font-bold text-navy">PERFISH</h1>
          <p className="text-sm text-gray-500">Masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Masukkan password"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50
              transition-all"
          >
            {submitting ? "Masuk…" : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-cyan hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
