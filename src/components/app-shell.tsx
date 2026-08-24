"use client";

import { Sidebar } from "@/src/components/ui/sidebar";
import { ToastProvider } from "@/src/components/ui/toast";
import { I18nProvider } from "@/src/lib/i18n";
import { usePathname } from "next/navigation";

export function AppShell({
  children,
  isDesktopBuild = false,
}: {
  children: React.ReactNode;
  isDesktopBuild?: boolean;
}) {
  const pathname = usePathname();
  const isMarketingHome = pathname === "/" && !isDesktopBuild;

  return (
    <I18nProvider>
      <ToastProvider>
        {isMarketingHome ? (
          children
        ) : (
          <div className="app-shell">
            <Sidebar />
            <div className="main">{children}</div>
          </div>
        )}
      </ToastProvider>
    </I18nProvider>
  );
}
