"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

interface AppShellProps {
  children: ReactNode;
  /** Override `<main>` classes (e.g. home hero: no padding, no scroll). */
  mainClassName?: string;
}

const COLLAPSED_KEY = "sidebar-collapsed";

export default function AppShell({ children, mainClassName }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  });

  function handleToggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-page transition-colors">
      <Sidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content area — shifts right by sidebar width */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "md:ml-16" : "md:ml-64"}
        `}
      >
        <TopHeader onMenuClick={() => setMobileOpen(true)} />

        <main
          className={
            mainClassName ??
            "p-4 md:p-6 text-gray-900 dark:text-gray-100"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
