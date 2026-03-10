"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HiOutlineChevronDown } from "react-icons/hi2";
import { mainMenu, bottomMenu, type MenuItem } from "@/lib/menu";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // Auto-expand parent whose child matches the current path
  useEffect(() => {
    mainMenu.forEach((item) => {
      if (
        item.children?.some((child) => child.href && pathname.startsWith(child.href))
      ) {
        setExpandedKeys((prev) =>
          prev.includes(item.key) ? prev : [...prev, item.key]
        );
      }
    });
  }, [pathname]);

  function toggleExpand(key: string) {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function isActive(href?: string) {
    if (!href) return false;
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isParentActive(item: MenuItem) {
    if (item.href) return isActive(item.href);
    return item.children?.some((c) => isActive(c.href)) ?? false;
  }

  /* ── single menu item renderer ──────────────────────── */
  function renderItem(item: MenuItem, isBottom = false) {
    const hasChildren = item.children && item.children.length > 0;
    const active = isParentActive(item);
    const expanded = expandedKeys.includes(item.key);
    const Icon = item.icon;

    // Leaf link (no children)
    if (!hasChildren && item.href) {
      return (
        <li key={item.key}>
          <Link
            href={item.href}
            onClick={() => onClose()}
            className={`
              group relative flex items-center gap-3 rounded-lg px-3 py-2.5
              text-sm font-medium transition-colors
              ${active
                ? "bg-white/10 text-white"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
              }
              ${collapsed && !open ? "justify-center" : ""}
            `}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-cyan" />
            )}
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            {(!collapsed || open) && <span>{item.label}</span>}
          </Link>
        </li>
      );
    }

    // Parent with children (expandable)
    return (
      <li key={item.key}>
        <button
          onClick={() => toggleExpand(item.key)}
          className={`
            group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5
            text-sm font-medium transition-colors
            ${active
              ? "bg-white/10 text-white"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
            }
            ${collapsed && !open ? "justify-center" : ""}
          `}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-cyan" />
          )}
          {Icon && <Icon className="h-5 w-5 shrink-0" />}
          {(!collapsed || open) && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <HiOutlineChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* Children */}
        {expanded && (!collapsed || open) && (
          <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
            {item.children!.map((child) => {
              const childActive = isActive(child.href);
              return (
                <li key={child.key}>
                  <Link
                    href={child.href!}
                    onClick={() => onClose()}
                    className={`
                      block rounded-md px-3 py-2 text-sm transition-colors
                      ${childActive
                        ? "text-cyan font-medium"
                        : "text-gray-400 hover:text-white"
                      }
                    `}
                  >
                    {child.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  const sidebarWidth = collapsed && !open ? "w-16" : "w-64";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-screen flex-col bg-navy
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* ── Logo area ───────────────────────────────── */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <Image
            src="/logo.png"
            alt="PERFISH"
            width={32}
            height={32}
            className="shrink-0"
          />
          {(!collapsed || open) && (
            <span className="text-lg font-bold text-white tracking-wide">
              PERFISH
            </span>
          )}
        </div>

        {/* ── Main nav ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">{mainMenu.map((item) => renderItem(item))}</ul>
        </nav>

        {/* ── Bottom (Pengaturan) ──────────────────────── */}
        <div className="border-t border-white/10 px-3 py-3">
          <ul>{renderItem(bottomMenu, true)}</ul>
        </div>

        {/* ── Collapse toggle (desktop only) ──────────── */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-10 items-center justify-center border-t border-white/10 text-gray-400 hover:text-white transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <HiOutlineChevronDown
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-[-90deg]" : "rotate-90"
            }`}
          />
        </button>
      </aside>
    </>
  );
}
