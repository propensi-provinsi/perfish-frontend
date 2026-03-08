"use client";

import { usePathname } from "next/navigation";
import { HiOutlineBars3, HiOutlineBell, HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

/* Build breadcrumb from pathname */
function buildBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, href, isLast: idx === segments.length - 1 };
  });
}

interface TopHeaderProps {
  onMenuClick: () => void;
}

export default function TopHeader({ onMenuClick }: TopHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const crumbs = buildBreadcrumb(pathname);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-4 md:px-6 transition-colors">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <HiOutlineBars3 className="h-6 w-6" />
        </button>

        <nav className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
              {crumb.isLast ? (
                <span className="font-medium text-gray-900 dark:text-gray-100">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-cyan transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: notification bell + avatar + name */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
        </button>

        <button
          className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <HiOutlineBell className="h-5 w-5" />
        </button>

        <Link href="/profile" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan text-sm font-bold text-white">
            {initial}
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 leading-tight">
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
