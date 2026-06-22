# Skills Hub

本地 AI agent skills 管理工作台，一站式管理多个 AI coding agent 的技能（skills）。支持哪些 agent 完全由后台配置，随时增删。

<p align="center">
  <img src="screenshots/dashboard.png" alt="Skills Hub Dashboard" width="800" />
</p>

## ❤️ Sponsor

| Sponsor | |
|---|---|
| <a href="https://ofox.ai"><strong>Ofox AI</strong></a> | 感谢 [Ofox AI](https://ofox.ai) 赞助本项目！通过该链接注册并首充，可领取 3 美元赠送额度。Ofox AI 是可靠的大模型 API 中转与聚合服务商，提供一个 API 接入 OpenAI、Claude、Gemini、DeepSeek、Qwen、Kimi、Doubao、GLM、Mistral 等 100+ 主流模型。 |

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

### 普通用户：安装桌面客户端

Skills Hub 现在以桌面客户端作为默认使用方式。普通用户只需要到 GitHub Releases 下载安装包，不需要在本地启动 API 服务，也不需要运行 `npm run dev`、`npm run build` 或其他 npm 命令。

- macOS：下载 `.dmg`
- Windows：下载 `.exe` 或 `.msi`

安装完成后直接打开 Skills Hub 客户端即可使用。客户端会读取你本机各 agent 的 skills 目录，并在本地完成扫描、同步、编辑和管理。

当前安装包是 unsigned builds。首次打开时，macOS 或 Windows 可能会显示安全提示，这是未签名开源安装包的常见情况。

macOS 如果提示“Skills Hub 已损坏，无法打开”，通常是下载隔离属性拦截了未公证应用。确认你信任该 release 后，可以对安装到 `/Applications` 的应用执行：

```bash
xattr -dr com.apple.quarantine "/Applications/Skills Hub.app"
```

然后再次打开应用。维护者构建 macOS 包时会使用 ad-hoc signing，确保 `.app` 自身通过本地代码签名校验；完整免提示分发仍需要 Apple Developer ID 签名与公证。

### 维护者：发布客户端安装包

维护者发布新版本时，推送 `v*` tag 即可触发 GitHub Actions 自动构建 macOS / Windows 安装包：

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 开发者：本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:3000
```

本地开发模式只面向项目开发者。普通用户不需要本地运行 Next.js 服务，也不需要执行生产构建命令。

### 其他命令

| 命令 | 说明 |
|---|---|
| `npm run build` | 开发者 Web 生产构建 |
| `npm start` | 开发者启动 Web 生产服务器 |
| `npm run desktop:build` | 维护者构建桌面安装包 |
| `npm test` | 运行测试 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

## 技术栈

Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + Tauri 2。桌面客户端直接访问本机文件系统作为数据源，零外部依赖服务。
