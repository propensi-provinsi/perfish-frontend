"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HiOutlineBars3, HiOutlineBell, HiOutlineSun, HiOutlineMoon, HiOutlineXMark } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getExpiryNotifications, markExpiryNotificationAsRead } from "@/lib/expiry";
import type { ExpiryNotificationListData, ExpiryStatus } from "@/types";

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

function statusClass(status: ExpiryStatus) {
  if (status === "EXPIRED") return "bg-red/10 text-red";
  if (status === "WARNING") return "bg-yellow/10 text-yellow";
  return "bg-green/10 text-green";
}

export default function TopHeader({ onMenuClick }: TopHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const crumbs = buildBreadcrumb(pathname);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ExpiryNotificationListData | null>(null);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  const loadNotifications = useCallback(async () => {
    setDrawerLoading(true);
    setNotificationError(null);
    try {
      const data = await getExpiryNotifications({ limit: 10 });
      setUnreadCount(data.unreadCount ?? 0);
      setNotifications(data);
    } catch {
      setUnreadCount(0);
      setNotificationError("Gagal memuat notifikasi expired.");
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!drawerOpen) return;
    void loadNotifications();
  }, [drawerOpen, loadNotifications]);

  const handleMarkRead = useCallback(async (notificationId: string) => {
    try {
      await markExpiryNotificationAsRead(notificationId);
      await loadNotifications();
    } catch {
      setNotificationError("Gagal menandai notifikasi sebagai dibaca.");
    }
  }, [loadNotifications]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-4 md:px-6 transition-colors">
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

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-red px-1.5 text-[10px] font-bold leading-4 text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
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

      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-gray-700 dark:bg-dark-card ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Expired Notifications</h2>
            <p className="text-xs text-gray-500">Unread: {unreadCount}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            aria-label="Close notifications"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {notificationError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {notificationError}
            </div>
          )}

          {drawerLoading ? (
            <p className="text-sm text-gray-500">Memuat notifikasi...</p>
          ) : notifications?.items.length ? (
            <div className="space-y-3">
              {notifications.items.map((item) => (
                <div key={item.notificationId} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(item.expiryStatus)}`}>
                      {item.expiryStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                    {!item.isRead ? (
                      <Button size="sm" variant="outline" onClick={() => void handleMarkRead(item.notificationId)}>
                        Mark as read
                      </Button>
                    ) : (
                      <span className="text-xs text-green">Read</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Belum ada notifikasi expired.</p>
          )}
        </div>
      </aside>
    </>
  );
}
