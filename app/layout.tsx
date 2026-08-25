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
        <div
          className="impeccable-contract"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: Skills Hub turns cross-agent skill drift into one legible local workbench, refusing the generic SaaS hero that hides the product behind claims.
OWN-WORLD: Cool near-white field, white bordered work surfaces, dark ink, disciplined sync-green, 8px controls, 14px panels, literal file facts in mono.
STORY: Visitors see the real state matrix, understand local filesystem truth and explicit sync, then download the desktop app or inspect the MIT source.
FIRST VIEWPORT: Restrained nav; dominant Skills Hub name and supporting Chinese proposition; download and GitHub actions; a large dashboard rising immediately below with multiple rows and all sync states visible.
FORM: Workbench-cinema, grounded candidate 5 of 7, selected from surface seed 2d6997ff.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        <AppShell isDesktopBuild={isDesktopBuild}>{children}</AppShell>
      {/* impeccable-live-start */}
<script src="http://localhost:8401/live.js?token=6572963a-6517-423a-babd-d006dd40f6c0"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
