import type { Metadata } from "next";

import "./globals.css";
import { AppShell } from "@/src/components/app-shell";

export const metadata: Metadata = {
  title: "Skills Hub — 统一管理所有 Agent Skills",
  description: "本地优先的 AI agent skills 管理工作台：浏览、比较、同步技能，并统一维护全局规则。"
};

const isDesktopBuild = process.env.SKILLS_HUB_DESKTOP === "1";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AppShell isDesktopBuild={isDesktopBuild}>{children}</AppShell>
      </body>
    </html>
  );
}
