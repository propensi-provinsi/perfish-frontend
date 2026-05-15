"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HiOutlineChevronDown } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { bottomMenu, getMainMenuForRole, type MenuItem } from "@/lib/menu";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

function hrefMatchesPath(href: string, pathname: string): boolean {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(href + "/");
}

function collectMenuLeaves(items: MenuItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  for (const it of items) {
    if (it.href) out.push(it);
    if (it.children) out.push(...collectMenuLeaves(it.children));
  }
  return out;
}

/** Leaf dengan href terpanjang yang cocok — hindari /cold-storage menang atas /cold-storage/assign-location */
function findBestActiveMenuKey(menuItems: MenuItem[], pathname: string): string | null {
  const leaves = collectMenuLeaves(menuItems).filter((l) => l.href);
  const hits = leaves.filter((l) => hrefMatchesPath(l.href!, pathname));
  hits.sort((a, b) => (b.href!.length ?? 0) - (a.href!.length ?? 0));
  return hits[0]?.key ?? null;
}

function subtreeHasPathMatch(items: MenuItem[], pathname: string): boolean {
  for (const it of items) {
    if (it.href && hrefMatchesPath(it.href, pathname)) return true;
    if (it.children && subtreeHasPathMatch(it.children, pathname)) return true;
  }
  return false;
}

function collectAncestorKeysToExpand(items: MenuItem[], pathname: string): string[] {
  const keys: string[] = [];
  for (const item of items) {
    if (!item.children?.length) continue;
    if (subtreeHasPathMatch(item.children, pathname)) {
      keys.push(item.key);
      keys.push(...collectAncestorKeysToExpand(item.children, pathname));
    }
  }
  return keys;
}

function branchContainsActiveKey(items: MenuItem[], activeKey: string | null): boolean {
  if (!activeKey) return false;
  for (const it of items) {
    if (it.key === activeKey) return true;
    if (it.children && branchContainsActiveKey(it.children, activeKey)) return true;
  }
  return false;
}

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const menuItems = useMemo(() => getMainMenuForRole(user?.role), [user?.role]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const bestActiveKey = useMemo(
    () => findBestActiveMenuKey(menuItems, pathname),
    [menuItems, pathname]
  );

  useEffect(() => {
    const keys = collectAncestorKeysToExpand(menuItems, pathname);
    setExpandedKeys((prev) => Array.from(new Set([...prev, ...keys])));
  }, [pathname, menuItems]);

  function toggleExpand(key: string) {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function renderNavItem(item: MenuItem, depth: number): ReactNode {
    const hasChildren = Boolean(item.children?.length);
    const Icon = item.icon;

    if (!hasChildren && item.href) {
      const active = item.key === bestActiveKey;
      return (
        <li key={item.key}>
          <Link
            href={item.href}
            onClick={() => onClose()}
            className={`
              group relative flex items-center gap-3 rounded-lg px-3 py-2
              text-sm font-medium transition-colors
              ${active ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}
              ${collapsed && !open && depth === 0 ? "justify-center py-2.5" : ""}
            `}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-cyan" />
            )}
            {Icon && depth === 0 && <Icon className="h-5 w-5 shrink-0" />}
            {(!collapsed || open) && <span>{item.label}</span>}
          </Link>
        </li>
      );
    }

    if (hasChildren) {
      const expanded = expandedKeys.includes(item.key);
      const branchActive = branchContainsActiveKey(item.children!, bestActiveKey);
      return (
        <li key={item.key}>
          <button
            type="button"
            onClick={() => toggleExpand(item.key)}
            className={`
              group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5
              text-sm font-medium transition-colors
              ${branchActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}
              ${collapsed && !open && depth === 0 ? "justify-center" : ""}
            `}
          >
            {branchActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-cyan" />
            )}
            {Icon && <Icon className={`shrink-0 ${depth === 0 ? "h-5 w-5" : "h-4 w-4 opacity-90"}`} />}
            {(!collapsed || open) && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <HiOutlineChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {expanded && (!collapsed || open) && (
            <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-3 ml-1">
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    }

    return null;
  }

  const sidebarWidth = collapsed && !open ? "w-16" : "w-64";

  return (
    <>
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
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <Image
            src="/logo-w.png"
            alt="PERFISH"
            width={180}
            height={100}
            className="shrink-0"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">{menuItems.map((item) => renderNavItem(item, 0))}</ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <ul>{renderNavItem(bottomMenu, 0)}</ul>
        </div>

        <button
          type="button"
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
