# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (默认 3000)
npm run dev:reset    # Clear .next cache then start dev server
npm run build        # Production build
npm start            # Start production server
npm run lint         # next lint
npm test             # vitest run (all tests)
npx tsc --noEmit     # TypeScript type check
```

> **重要：** 开发服务器在 `http://localhost:3000` 运行。不要手动修改端口。

## Project Overview

Skills Hub — 本地 AI agent skills 管理工作台 (Next.js 15 / React 19 / TypeScript 5.9 / Tailwind CSS v4)。浏览和管理各 AI agent（Codex、Codex、Cursor、Trae）已安装的 skills，跟踪同步状态与差异，编辑全局规则文件。

## Architecture

### 应用结构

- **`app/`** — Next.js App Router（页面 + API 路由）
  - 页面：`/`（技能仪表盘）、`/instructions`（全局规则编辑器）、`/agents`、`/registry`、`/sync`
  - 数据获取：页面使用 server component 直接调用 `src/lib/server/` 中的模型函数
  - API：`app/api/` 下的 route handlers 供客户端组件调用
- **`src/components/`** — React 客户端组件
  - `ui/` — 通用 UI 原子组件
  - `board/`, `instructions/`, `overview/`, `registry/`, `sync/` — 页面级组件
- **`src/lib/`** — 核心业务逻辑，按领域分包：
  - `config/` — agent 配置与 custom skills
  - `skills/` — skill 扫描、分类、安装状态判断
  - `instructions/` — 规则文件扫描、哈希、写入
  - `sync/` — 同步计划构建、应用、移除
  - `server/` — server-only 模型构建函数
- **`src/types/`** — 全局类型定义
- **`config/`** — agent 定义 (`agents.json`) 和 custom skills 列表
- **`tests/fixtures/`** — 测试夹具目录

### 关键设计决策

- **文件系统即数据源**：所有 agent 配置和 skill 都来自本地文件系统，无外部数据库
- **测试与源码同目录**：`*.test.ts` 放在对应 `src/lib/` 源码旁，而非集中存放
- **无 ESLint 配置文件**：依赖 Next.js 内置 lint
- **无 Tailwind 配置文件**：使用 Tailwind v4 零配置模式 (`@import "tailwindcss"`)
- **Server/Client 明确分层**：数据模型在 `src/lib/server/` 中构建（仅服务端），组件层负责展示

### Agent 配置格式

`config/agents.json` 定义各 agent 的 skills 目录路径和安装规则。每个 agent 包含名称、技能目录路径、以及源 skills 目录的映射（source → 安装路径）。
