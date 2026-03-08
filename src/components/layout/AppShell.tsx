"use client";

import { useState, useEffect, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

interface AppShellProps {
  children: ReactNode;
}

const COLLAPSED_KEY = "sidebar-collapsed";

export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function handleToggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          md:ml-64
          ${collapsed ? "md:ml-16" : "md:ml-64"}
        `}
      >
        <TopHeader onMenuClick={() => setMobileOpen(true)} />

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
