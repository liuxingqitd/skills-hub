"use client";

import { Sidebar } from "@/src/components/ui/sidebar";
import { ToastProvider } from "@/src/components/ui/toast";
import { I18nProvider } from "@/src/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <div className="app-shell">
          <Sidebar />
          <div className="main">{children}</div>
        </div>
      </ToastProvider>
    </I18nProvider>
  );
}
