# Skills Hub

本地 AI agent skills 管理工作台 — 统一管理 Claude Code、Codex、Cursor、Trae 四个 AI coding agent 的技能（skills），追踪同步状态与差异，编辑全局规则文件。

> 设计理念：「少跳转、少解释、直接操作」

![Dashboard](screenshots/dashboard.png)

## 核心功能

### Skills 管理

- **双视图浏览**：卡片网格或紧凑列表，自由切换
- **多维度筛选**：按同步状态（全部 / 待同步 / 异常）、分类、自研/开源筛选，支持关键词实时搜索
- **多 agent 状态矩阵**：每个 skill 展示在 4 个 agent 上的安装状态——已同步 / 缺失 / 内容漂移 / 路径冲突 / 孤立副本
- **Skill 详情抽屉**：查看完整元数据、各 agent 安装路径、SKILL.md 原始内容，编辑分类，切换自研/开源标签
- **安装 skill**：支持 GitHub 仓库地址（含分支/子目录）、SSH 地址和本地目录路径，自动发现 `SKILL.md` 并安装到所有启用 agent
- **一键同步**：支持全局同步全部待处理项，也可逐个 skill 单独同步
- **删除副本**：移除所有 agent 中已安装的 skill 副本（源文件不受影响）

### 同步状态追踪

系统通过 SHA-256 比对源和目标目录的 `SKILL.md` 内容，将每个 skill 在每个 agent 上的状态判定为以下五种之一：

| 状态 | 含义 |
|---|---|
| `synced` | 目标目录内容与源一致 |
| `missing` | 目标目录不存在，尚未安装 |
| `drifted` | 目标目录存在但内容与源不一致 |
| `conflict` | 目标路径存在但不是目录（文件阻塞） |
| `orphaned` | 目标目录存在但没有对应的源 skill |

同步操作映射：`missing` / `drifted` → 复制修复，`conflict` → 跳过，`orphaned` → 可选择清理。

### 分类与标签

- **8 个预设分类**：代码审查、搜索检索、内容生成、数据分析、开发工具、测试质量、部署运维、其他
- **自动分类**：首次加载时基于 skill 名称和描述的关键词匹配
- **手动分类**：在 skill 详情抽屉中使用多选复选框调整分类
- **分类管理**：在设置页中支持分类的创建、编辑、删除，支持一键恢复预设
- **自研 / 开源标签**：二分类标记，在 skill 详情中一键切换

### 全局规则编辑器

- 编辑两个全局规则文件：`~/.claude/CLAUDE.md` 和 `~/.codex/AGENTS.md`
- 三种视图模式：纯编辑 / Markdown 预览 / 分栏对照
- 文件切换面板显示每个文件的行数或「文件缺失」状态
- 脏状态检测：修改未保存时显示黄色标记，Cmd+S / Ctrl+S 快捷保存
- **陈旧内容冲突保护**：保存时服务端比对文件 SHA-256 哈希，若磁盘文件已被外部修改则返回 409 并提示用户刷新

### 安全机制

- **路径穿越保护（安装）**：tar.gz 解压后递归校验所有路径未逃逸出解压根目录，校验仓库子目录不含 `..` 或绝对路径
- **路径穿越保护（同步/删除）**：校验目标路径位于 agent skills 根目录内才允许写入或删除
- **路径穿越保护（规则保存）**：`realpath` 解析后校验父目录位于允许根目录内，拒绝符号链接和非普通文件
- **写入范围收敛**：规则编辑器只允许更新两个已知主文件，禁止创建新文件

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Next.js 15（App Router）、React 19 |
| 语言 | TypeScript 5.9 |
| 样式 | Tailwind CSS v4、Lucide React |
| Markdown | react-markdown + remark-gfm（GFM 支持）、gray-matter（frontmatter 解析） |
| 校验 | Zod 4 |
| 测试 | Vitest 3 + @testing-library/react + jsdom |
| 部署 | Node.js 直接运行 |

## 快速开始

### 本地开发

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run dev:reset` | 清除 `.next` 缓存后启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | Next.js 代码检查 |
| `npm test` | 运行全部测试 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

## 项目结构

```text
skills_hub/
├── app/                          # Next.js App Router（页面 + API 路由）
│   ├── layout.tsx                # 根布局（AppShell + ToastProvider）
│   ├── page.tsx                  # 首页：Skills 仪表盘
│   ├── globals.css               # 全局样式 + Tailwind
│   ├── instructions/page.tsx     # 全局规则编辑器
│   ├── settings/page.tsx         # 设置（分类管理 + 通用设置）
│   └── api/
│       ├── overview/             # GET  — 概览统计
│       ├── registry/             # GET  — 完整 skill 注册表
│       ├── skills/install/       # POST — 从 GitHub / 本地安装 skill
│       ├── sync/
│       │   ├── preview/          # GET  — 生成同步计划
│       │   ├── apply/            # POST — 执行同步操作
│       │   └── remove/           # DELETE — 删除已安装副本
│       ├── categories/           # GET/POST/PUT/DELETE — 分类 CRUD
│       ├── skill-categories/     # GET/POST — skill ↔ 分类映射
│       ├── custom-tag/           # GET/POST/DELETE — 自研/开源标签
│       ├── instructions/         # GET  — 读取规则文件
│       └── instructions/update/  # POST — 保存规则文件（含哈希校验）
├── src/
│   ├── components/               # React 客户端组件
│   │   ├── app-shell.tsx         # 应用壳层布局
│   │   ├── dashboard/            # 仪表盘页面组件
│   │   ├── editor/               # 规则编辑器页面组件
│   │   ├── settings/             # 设置页面组件
│   │   └── ui/                   # 通用 UI 原子组件
│   │       ├── sidebar.tsx       # 侧边导航
│   │       ├── modal.tsx         # 确认对话框
│   │       ├── toast.tsx         # Toast 通知系统
│   │       ├── badge.tsx         # 状态/标签徽章
│   │       └── agent-icon.tsx    # Agent 状态图标
│   ├── lib/                      # 核心业务逻辑（纯函数）
│   │   ├── config/               # 配置文件读写
│   │   │   ├── load-agents.ts          # 加载 agents.json
│   │   │   ├── categories-store.ts     # 读写 categories.json
│   │   │   ├── custom-skills-store.ts  # 读写 custom-skills.json
│   │   │   └── skill-categories-store.ts # 读写 skill-categories.json
│   │   ├── server/               # 服务端模型构建器
│   │   │   ├── build-overview-model.ts     # 核心模型：agent + skill + 状态 + 同步计划
│   │   │   ├── build-skill-board-model.ts  # 仪表盘模型：行 + 单元格 + 分类 + 计数
│   │   │   └── build-instructions-model.ts # 规则编辑模型：文件 + 内容
│   │   ├── skills/               # skill 扫描与安装
│   │   │   ├── scan-all-skills.ts         # 扫描所有源 skill
│   │   │   ├── scan-agent-skills.ts       # 扫描各 agent 的已安装 skill
│   │   │   ├── classify-install-state.ts  # 判定安装状态
│   │   │   ├── install-skill-source.ts    # GitHub 下载 + 本地安装
│   │   │   └── auto-categorize.ts         # 关键词自动分类
│   │   ├── sync/                 # 同步计划与执行
│   │   │   ├── build-sync-plan.ts         # 生成同步操作列表
│   │   │   └── apply-sync-plan.ts         # 执行同步操作
│   │   └── instructions/         # 规则文件扫描与保存
│   │       ├── scan-claude-instructions.ts   # 扫描 ~/.claude/ 目录
│   │       ├── scan-codex-instructions.ts    # 扫描 ~/.codex/ 目录
│   │       ├── hash-instruction-content.ts   # SHA-256 哈希（陈旧检测）
│   │       └── save-instruction-asset.ts     # 保存（含路径校验 + 哈希比对）
│   └── types/                    # TypeScript 类型定义
│       ├── agents.ts             # AgentDefinition
│       ├── skills.ts             # SkillRecord, SkillInstallState, InstallStatus
│       ├── board.ts              # SkillBoardModel, SkillBoardRow, SkillBoardCell
│       ├── sync.ts               # SyncPlan, SyncAction, SyncExecutionResult
│       ├── categories.ts         # Category
│       └── instructions.ts       # InstructionAsset, InstructionSurface
├── config/                       # 静态 + 运行时配置文件
│   ├── agents.json               # Agent 定义（id、名称、skills 路径、启用状态）
│   ├── categories.json           # 预设 + 用户自定义分类
│   ├── custom-skills.json        # 用户标记为「自研」的 skill 名称列表
│   └── skill-categories.json     # Skill → 分类 ID 的映射
├── tests/fixtures/               # 测试夹具（模拟目录树）
├── public/                       # 静态资源
├── screenshots/                  # README 截图
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## API 参考

| 方法 | 路由 | 说明 | 请求体 | 响应 |
|---|---|---|---|---|
| GET | `/api/overview` | 概览统计 | — | agent 列表、状态摘要、同步摘要、skill 总数 |
| GET | `/api/registry` | 完整注册表 | — | agent 列表 + 所有 skill 的安装状态 |
| POST | `/api/skills/install` | 安装 skill | `{ source }` | discovered / completed / skipped / failed 计数 |
| GET | `/api/sync/preview` | 生成同步计划 | — | SyncPlan（操作列表 + 统计摘要） |
| POST | `/api/sync/apply` | 执行同步 | `{ skillName?, types?, pruneOrphans? }` | SyncExecutionResult |
| DELETE | `/api/sync/remove` | 删除已安装副本 | `{ skillName }` | `{ ok, removed: string[] }` |
| GET | `/api/categories` | 列出全部分类 | — | `Category[]` |
| POST | `/api/categories` | 创建分类 | `{ name, icon?, desc?, color? }` | 创建的 `Category` (201) |
| PUT | `/api/categories` | 更新分类 | `Category` 完整对象 | 更新后的 `Category` |
| DELETE | `/api/categories?id=` | 删除分类 | Query 参数 | `{ ok: true }` |
| GET | `/api/skill-categories` | 获取所有 skill↔分类映射 | — | `Record<string, string[]>` |
| POST | `/api/skill-categories` | 设置 skill 的分类 | `{ skillName, categoryIds }` | `{ ok: true }` |
| GET | `/api/custom-tag` | 列出「自研」skill | — | `{ names: string[] }` |
| POST | `/api/custom-tag` | 标记为「自研」 | `{ skillName }` | `{ ok: true }` |
| DELETE | `/api/custom-tag` | 取消「自研」标记 | `{ skillName }` | `{ ok: true }` |
| GET | `/api/instructions` | 列出规则文件 | — | InstructionsPageModel |
| POST | `/api/instructions/update` | 保存规则文件 | `{ path, content, previousHash }` | `{ ok, path, contentHash }` 或错误 `{ ok:false, code, error }` |

`/api/instructions/update` 的错误码：`STALE_CONTENT` (409) 表示磁盘文件已被外部修改，`INVALID_PATH` (400) 表示路径不在允许范围内，`NOT_FOUND` (400) 表示目标文件不存在。

## 架构说明

### 数据流

```
config/*.json  ──┐
agent 目录      ──┼──→ buildOverviewModel() ──→ buildSkillBoardModel() ──→ 仪表盘 UI
skill 源目录    ──┘       │
                          ├── syncPlan ──→ Sync API (apply / remove)
                          └── registry ──→ Registry API
```

### 关键设计决策

- **Server Components 负责数据，Client Components 负责交互**：页面在需要交互时才使用 `"use client"`，数据由 Model Builder 在服务端构建完成后作为 props 传递给客户端组件
- **Model Builder 作为服务层**：`buildOverviewModel()`、`buildSkillBoardModel()`、`buildInstructionsModel()` 将多次配置读取、文件系统扫描和计算聚合为单次服务端数据载荷，避免客户端多次串行 API 调用
- **无状态 API 设计**：无数据库，所有状态存储在 JSON 配置文件和文件系统中，API handler 每次请求重新读取配置
- **同步采用两阶段模式**：预览阶段（只读扫描生成操作计划）和执行阶段（实际写入），仪表盘直接触发执行，预览端点保留用于排查

### 同步状态机

```
源 skill 存在？   ──否──→ [orphaned]
    │
   是
    │
目标目录存在？    ──否──→ [missing]
    │
   是
    │
目标是目录？      ──否──→ [conflict]
    │
   是
    │
SKILL.md 哈希一致？──否──→ [drifted]
    │
   是
    │
[synced]
```

### 安全架构

路径穿越防护分布在三个层次：
- **安装层**：解压后递归校验 + 子目录名清理
- **同步/删除层**：target-under-root 前缀校验
- **规则保存层**：`realpath` 解析 + 根目录包含校验 + 拒绝符号链接

规则保存额外使用 SHA-256 内容哈希实现并发修改检测：客户端传入 `previousHash`，服务端与当前磁盘内容哈希比对，不一致时拒绝写入（409 `STALE_CONTENT`）。

## 测试

```bash
npm test              # 运行全部单元测试
npx tsc --noEmit      # TypeScript 类型检查
```

| 测试文件 | 覆盖范围 |
|---|---|
| `src/lib/skills/scan-all-skills.test.ts` | 源 skill 扫描与 frontmatter 解析 |
| `src/lib/skills/scan-agent-skills.test.ts` | Agent 目录扫描与状态判定 |
| `src/lib/skills/scan-source-skills.test.ts` | 源目录遍历 |
| `src/lib/skills/install-skill-source.test.ts` | GitHub URL 解析、skill 发现 |
| `src/lib/sync/build-sync-plan.test.ts` | 从状态序列生成同步计划 |
| `src/lib/instructions/scan-claude-instructions.test.ts` | Claude 规则文件扫描 |
| `src/lib/instructions/scan-codex-instructions.test.ts` | Codex 规则文件扫描 |
| `src/lib/instructions/hash-instruction-content.test.ts` | 内容哈希一致性 |
| `src/lib/instructions/save-instruction-asset.test.ts` | 陈旧内容检测、路径校验 |
| `src/lib/config/load-agents.test.ts` | Agent 配置加载 |

测试夹具位于 `tests/fixtures/`，提供模拟的 `.claude/` 和 `.codex/` 目录树。

## 配置文件

项目在 `config/` 目录下维护 4 个配置文件：

- **`agents.json`** — Agent 定义数组，每个 agent 包含 `id`、`name`、`skillsPath`（支持 `$HOME` 变量）、`enabled`
- **`categories.json`** — 分类定义数组，包含 `id`、`name`、`icon`、`desc`、`color`（oklch）、`order`、`isPreset`、`keywords[]`
- **`custom-skills.json`** — 字符串数组，用户标记为「自研」的 skill 名称列表
- **`skill-categories.json`** — `{ "skill名称": ["分类ID", ...] }` 映射表，无映射时回退到自动分类

## 注意事项

- 这是一个本地工作台项目，直接读取当前机器上的 agent 目录和 skill 文件
- skill 安装支持 GitHub 仓库地址（HTTPS/SSH）、含分支的 URL、子目录路径，以及本地目录；根目录或一级子目录中包含 `SKILL.md` 即被识别为 skill，目标目录已存在时跳过而非覆盖
- 全局规则编辑器刻意收敛为最小能力集：仅支持编辑两个现有主文件，不支持新建规则文件
- 部署到其他机器前，请确认目标环境存在对应的 agent 目录和配置文件
