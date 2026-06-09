"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileStack, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/" as const, label: "Skill 管理", icon: LayoutGrid, prefetch: false },
  { href: "/instructions" as const, label: "全局规则", icon: FileStack },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg viewBox="0 0 28 28" fill="none">
          <rect x="2" y="2" width="24" height="24" rx="6" fill="oklch(56% 0.12 170)" opacity="0.15" />
          <path d="M14 7L8 10.5v7L14 21l6-3.5v-7L14 7z" stroke="oklch(48% 0.14 170)" strokeWidth="1.8" fill="none" />
          <circle cx="14" cy="14" r="3" fill="oklch(48% 0.14 170)" opacity="0.3" />
        </svg>
        Skill Hub
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch}
              className="sidebar-link"
              data-active={isActive}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Link
          href="/settings"
          className="sidebar-link"
          data-active={pathname === "/settings"}
        >
          <Settings size={16} />
          设置
        </Link>
      </div>
    </aside>
  );
}
