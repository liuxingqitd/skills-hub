# Skills Hub

本地 AI agent skills 管理工作台，一站式管理多个 AI coding agent 的技能（skills）。支持哪些 agent 完全由后台配置，随时增删。

<p align="center">
  <a href="README.md">English</a>
  •
  <a href="https://skills-hub.dev">🌐 官网</a>
</p>

<p align="center">
  <a href="https://github.com/liuxingqitd/skills-hub/releases">
    <img src="https://img.shields.io/github/v/release/liuxingqitd/skills-hub" alt="Release" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/liuxingqitd/skills-hub" alt="MIT 许可证" />
  </a>
  <a href="https://github.com/liuxingqitd/skills-hub/stargazers">
    <img src="https://img.shields.io/github/stars/liuxingqitd/skills-hub" alt="Stars" />
  </a>
  <img src="https://img.shields.io/github/languages/top/liuxingqitd/skills-hub" alt="TypeScript" />
  <img src="https://img.shields.io/badge/平台-macOS%20%7C%20Windows-lightgrey" alt="平台" />
</p>

---

## ❤️ 赞助商

| 赞助商 | |
|---|---|
| <a href="https://ofox.ai"><strong>Ofox AI</strong></a> | 感谢 [Ofox AI](https://ofox.ai) 赞助本项目！通过该链接注册并首充，可领取 3 美元赠送额度。Ofox AI 是可靠的大模型 API 中转与聚合服务商，提供一个 API 接入 OpenAI、Claude、Gemini、DeepSeek、Qwen、Kimi、Doubao、GLM、Mistral 等 100+ 主流模型。 |

---

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

## 官网

访问 **[skills-hub.dev](https://skills-hub.dev)** —— Skills Hub 产品官网，包含功能介绍、展示等。

## 快速开始

### 普通用户：安装桌面客户端

到 [Releases 页面](https://github.com/liuxingqitd/skills-hub/releases) 下载安装包：

- macOS Intel → 文件名含 `x86_64` 的 `.dmg`
- macOS Apple Silicon → 文件名含 `aarch64` 或 `arm64` 的 `.dmg`
- Windows → `.exe` 或 `.msi`

安装后直接打开即可使用。客户端会自动扫描本机各 agent 的 skills 目录。

> macOS 如果提示"已损坏，无法打开"，执行：
> ```bash
> xattr -dr com.apple.quarantine "/Applications/Skills Hub.app"
> ```

### 维护者：发布安装包

推送 `v*` tag 触发 GitHub Actions 自动构建：

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 开发者：本地开发

```bash
npm install
npm run dev
# → http://localhost:3000
```

| 命令 | 说明 |
|---|---|
| `npm run build` | 开发者 Web 生产构建 |
| `npm start` | 启动 Web 生产服务器 |
| `npm run desktop:build` | 构建桌面安装包 |
| `npm test` | 运行测试 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

## 技术栈

Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + Tauri 2。桌面客户端直接访问本机文件系统，零外部依赖。

## 支持的 Agent

Skills Hub 是 agent 无关的 —— 修改 `config/agents.json` 即可添加任意 agent。开箱支持：

- OpenClaw
- Cursor
- Claude Code
- Windsurf
- [添加你的 →](CONTRIBUTING.md)

## 路线图

- [x] 桌面客户端（Tauri）
- [x] 多 agent 同步
- [x] 全局规则编辑器
- [ ] 社区技能商店 / 市场
- [ ] 技能使用数据分析
- [ ] 一键发布 skill 到 GitHub
- [ ] 自定义 agent 集成插件 API

## 参与贡献

欢迎所有人参与！详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
