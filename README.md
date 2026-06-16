# Skills Hub

本地 AI agent skills 管理工作台，一站式管理多个 AI coding agent 的技能（skills）。支持哪些 agent 完全由后台配置，随时增删。

<p align="center">
  <img src="screenshots/dashboard.png" alt="Skills Hub Dashboard" width="800" />
</p>

## ❤️ Sponsor

| Sponsor | |
|---|---|
| <a href="https://ofox.ai/x/xingqi"><strong>Ofox AI</strong></a> | 感谢 [Ofox AI](https://ofox.ai/x/xingqi) 赞助本项目！Ofox AI 是可靠的大模型 API 中转与聚合服务商，提供一个 API 接入 OpenAI、Claude、Gemini、DeepSeek、Qwen、Kimi、Doubao、GLM、Mistral 等 100+ 主流模型。 |

## 它能做什么

Skills Hub 扫描你本地各个 agent 安装的 skills，把它们汇聚在一个统一的仪表盘里：

- **一目了然的仪表盘** — 卡片网格或列表视图，看到所有 skill 在每个 agent 上的安装状态
- **一键同步** — 发现缺失或内容不一致的 skill？一键同步到所有 agent
- **安装新 skill** — 支持 GitHub 仓库、SSH 地址或本地路径，自动识别 `SKILL.md` 并安装
- **全局规则编辑器** — 在一个界面里编辑各 agent 的全局规则文件，支持实时预览
- **分类与标签** — 自动分类 + 手动标记，帮你整理 skills 库

### 原理

Skills Hub **不做数据库，不做云端存储**。它直接读取你本机上的 agent 目录和 skill 文件，通过 SHA-256 比对源和目标 `SKILL.md` 内容来判断每个 skill 的同步状态：

| 状态 | 含义 |
|:---:|---|
| **已同步** | 目标目录与源内容一致 |
| **缺失** | skill 尚未安装到该 agent |
| **内容漂移** | 已安装但内容与源不一致 |
| **路径冲突** | 目标路径被文件阻塞 |
| **孤立副本** | 已安装但源 skill 已删除 |

同步操作就是在这个状态模型上进行的：缺失/漂移的 → 复制修复，冲突的 → 跳过，孤立的 → 可选择清理。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:3000
```

### 其他命令

| 命令 | 说明 |
|---|---|
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务器 |
| `npm test` | 运行测试 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

## 技术栈

Next.js 15 + React 19 + TypeScript + Tailwind CSS v4，直接跑在 Node.js 上，零外部依赖服务。
