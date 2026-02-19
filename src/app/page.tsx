"use client";

import { useHealthCheck } from "@/hooks/useHealthCheck";

export default function Home() {
  const { health, loading, error } = useHealthCheck();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Perfish</h1>
        <p className="mt-2 text-gray-500">Full-stack application boilerplate</p>
      </div>

      {/* Backend Status Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm w-full max-w-md">
        <h2 className="text-lg font-semibold mb-3">Backend Status</h2>
        {loading && <p className="text-gray-400">Checking...</p>}
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            {error}
          </div>
        )}
        {health && (
          <div className="flex items-center gap-2 text-green-600">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            {health.status} &mdash;{" "}
            <span className="text-xs text-gray-400">{health.timestamp}</span>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/swagger-ui.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-gray-200 p-4 hover:border-blue-400 transition-colors"
        >
          <h3 className="font-medium">API Docs &rarr;</h3>
          <p className="text-sm text-gray-500">Swagger UI for the backend</p>
        </a>
        <a
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-gray-200 p-4 hover:border-blue-400 transition-colors"
        >
          <h3 className="font-medium">Next.js Docs &rarr;</h3>
          <p className="text-sm text-gray-500">Learn about Next.js features</p>
        </a>
      </div>
    </main>
  );
}
