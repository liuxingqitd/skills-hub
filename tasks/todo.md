# 2026-06-23 macOS “已损坏，无法打开” 修复

## Spec

- 目标：修复 macOS `.app` 代码签名校验失败导致 Gatekeeper 提示“Skills Hub 已损坏，无法打开”的问题。
- 根因：Tauri 生成的 macOS bundle 只有 Mach-O linker ad-hoc 签名，`Info.plist` 与资源未被封存，`codesign --verify --deep --strict` 报 `code has no resources but signature indicates they must be present`。
- 范围：显式配置 macOS ad-hoc signing；补充 README 中未签名/未公证应用的打开说明；用本地 app-only build 证明签名校验通过。
- 非目标：本轮不申请 Apple Developer ID，不做 notarization，不消除所有 Gatekeeper 首次打开提示。
- 设计方向：保持 unsigned release 策略不变，但发布的 `.app` 必须先通过本地代码签名完整性校验；用户侧隔离属性问题用明确说明处理。

## Tasks

- [x] 复现并定位本地 `.app` 签名校验失败
- [x] 在 Tauri macOS bundle 配置中启用显式 ad-hoc signing
- [x] 更新 README 的 macOS “已损坏”处理说明
- [x] 重新构建 macOS `.app`
- [x] 验证 `codesign --verify --deep --strict`
- [x] 运行基础回归检查
- [x] 记录 Review / 复盘

## Verify

- `npm run desktop:build:app` 成功。
- `codesign --verify --deep --strict --verbose=4 "src-tauri/target/release/bundle/macos/Skills Hub.app"` 成功。
- `spctl --assess` 对未公证 ad-hoc app 仍可能拒绝；完整通过 Gatekeeper 需要 Developer ID 签名和 notarization。
- README 明确说明 unsigned/not notarized 与 `com.apple.quarantine` 的区别。

## Review

- 根因：未显式配置 macOS signing 时，Tauri 产物只有可执行文件的 linker ad-hoc 签名，bundle 的 `Info.plist` 与资源没有被封存，导致严格 `codesign` 校验失败。
- 结果：`src-tauri/tauri.conf.json` 的 `bundle.macOS.signingIdentity` 设置为 `"-"`，Tauri build 会对可执行文件和 `.app` bundle 执行 ad-hoc signing。
- 结果：由于 `v0.1.1` tag 已存在，发布版本继续升到 `0.1.2`，使用新 tag 触发 release workflow。
- 结果：重新构建后生成 `Contents/_CodeSignature/CodeResources`，`codesign -dv` 显示 `Identifier=com.skillshub.desktop`、`Info.plist entries=15`、`Sealed Resources version=2`。
- 结果：README 增加 macOS “已损坏，无法打开”说明，区分 app 自身签名完整性与下载隔离属性；用户信任 release 后可移除 `com.apple.quarantine`。
- 边界：当前机器没有 Developer ID identity，`security find-identity -v -p codesigning` 返回 0 个有效身份；`spctl --assess` 对 ad-hoc/未公证 app 仍返回拒绝/内部评估错误。公开分发要彻底免 Gatekeeper 提示，需要 Apple Developer ID 签名与 notarization。
- 通过：`npm run desktop:build:app`
- 通过：`codesign --verify --deep --strict --verbose=4 "src-tauri/target/release/bundle/macos/Skills Hub.app"`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`git diff --check`

# 2026-06-23 Windows Tauri 图标构建失败

## Spec

- 目标：修复 GitHub Actions Windows 桌面安装包构建中 `icons/icon.ico not found` 导致的 Tauri build 失败。
- 根因假设：本地 `src-tauri/icons/icon.ico` 已存在、有效且被 `v0.1.0` tag 跟踪；CI 仍报缺失时，需要在 Tauri build 前证明 runner 实际 checkout 的 commit/tag 与资源文件状态。
- 范围：补充 release workflow 的 Tauri 资源 preflight；清理 Windows resource build 的误导日志；运行本地可执行的验证。
- 追加范围：为了避免移动既有 `v0.1.0` tag，发布版本升到 `0.1.1`，并准备使用新 tag 触发 release。
- 非目标：不在 macOS 本机交叉生成 Windows NSIS/MSI，不处理签名/公证。
- 设计方向：保持现有 Tauri icon 配置不变，增加 CI 早期检查 `src-tauri/icons/icon.ico`、`.icns`、`.png` 与 `tauri.conf.json`，并输出 commit/ref 和 git 跟踪状态，避免失败延迟到 Rust build script。

## Tasks

- [x] 核对 Tauri 配置、Cargo 配置、workflow 和 icon 文件状态
- [x] 增加 GitHub Actions 资源 preflight
- [x] 清理 Windows resource metadata 日志
- [x] 将发布版本升到 `0.1.1`
- [x] 运行本地验证
- [x] 记录 Review / 复盘

## Verify

- `src-tauri/icons/icon.ico` 在当前 tag 中被 git 跟踪。
- release workflow 在 Tauri build 前检查 Windows 必需 icon。
- Windows resource 日志不再输出误导性的 `package.metadata does not exist`。
- npm、Tauri 和 Cargo 版本号保持一致。
- 本地 `cargo check`、配置解析和 diff 检查通过。

## Review

- 根因判断：当前本地 `v0.1.0` tag 中已经包含 `src-tauri/icons/icon.ico`，且文件格式有效；如果 GitHub Actions 仍报缺失，需要先确认 runner 实际 checkout 的 ref/sha 与资源文件状态。
- 结果：release workflow 增加 `Verify Tauri bundle resources` 步骤，在 Tauri action 前输出 ref、sha、tracked files，并检查 `.ico`、`.icns`、`.png` 确实存在。
- 结果：`src-tauri/Cargo.toml` 增加空的 `[package.metadata.tauri-winres]`，避免 Windows resource 构建日志输出误导性的 `package.metadata does not exist`。
- 结果：发布版本从 `0.1.0` 升到 `0.1.1`，避免 force-move 已存在的 `v0.1.0` tag。
- 通过：`cargo check --manifest-path src-tauri/Cargo.toml`
- 通过：`ruby -e "require 'yaml'; YAML.load_file('.github/workflows/release.yml'); puts 'yaml ok'"`
- 通过：`git diff --check`

# 2026-06-22 桌面 Agent 注册表修复

## Spec

- 目标：修复桌面静态包中 Agent 管理显示“暂无 Agent / Agent 注册表为空”的问题。
- 根因：桌面静态导出排除了 `app/api`，设置页仍在客户端请求 `/api/agents`，请求失败后保留空数组。
- 范围：补齐桌面运行时 Agent 读取/保存桥；Web 模式继续使用现有 API route；增加回归测试和验证。
- 非目标：本轮不迁移同步、安装、路径选择器等其他 API。
- 设计方向：复用已有 `tauri-runtime` 判定模式，新增 `agents-client`。Web 下调用 `/api/agents`，Tauri 下调用 Rust commands 读取 registry/selection 并保存 Agent 配置。

## Tasks

- [x] 定位空状态来源与根因
- [x] 梳理现有 Agent API 与配置读写边界
- [x] 实现桌面 Agent client bridge 与 Rust commands
- [x] 改造设置页使用 bridge，保留 Web fallback
- [x] 增加回归测试
- [x] 运行定向测试、类型检查、构建和 Rust 检查
- [x] 记录 Review / 复盘

## Verify

- 桌面/Tauri 模式不再依赖 `/api/agents` 获取内置 Agent。
- Web 模式仍请求现有 `/api/agents` route。
- 旧版 `{ enabledIds, customized }` 配置仍能读出内置 registry。
- 保存 Agent 配置后返回最新 Agent 列表。

## Review

- 根因：桌面静态导出移除了 `/api/agents`，设置页客户端请求失败后没有可用 fallback，导致 Agent 列表为空。
- 结果：新增 `src/lib/config/agents-client.ts`，Web 模式继续调用 `/api/agents` 和 `/api/agents/validate-path`，Tauri 模式改用 commands。
- 结果：新增 `src-tauri/src/agents.rs`，提供 `get_agents`、`save_agents_config` 和 `validate_agent_path`，内置 registry 在桌面端不再依赖 Next API。
- 结果：`SettingsPage` 通过 client bridge 读写 Agent，内置 Agent 在桌面静态包中可恢复显示。
- 通过：`npm test -- src/lib/config/agents-client.test.ts src/components/settings/settings-page.test.tsx src/lib/config/load-agents.test.ts app/api/agents/route.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`npm run build:desktop-web`
- 通过：`cargo check --manifest-path src-tauri/Cargo.toml`
- 通过：`cargo fmt --manifest-path src-tauri/Cargo.toml --check`
- 通过：`git diff --check`

# 2026-06-23 GitHub Release 安装包发布

## Spec

- 目标：通过 GitHub Releases 自动发布 unsigned macOS / Windows 桌面安装包，让用户不需要运行 npm 命令即可安装。
- 范围：新增 GitHub Actions release workflow、README 发布说明、实施计划文档。
- 非目标：不做 macOS Developer ID 签名/公证，不做 Windows Authenticode 签名，不引入自动更新。
- 触发方式：推送 `v*` tag 自动发布；同时支持 `workflow_dispatch` 手动输入 tag。
- 设计方向：使用 `tauri-apps/tauri-action@v1` 在 `macos-latest` 生成 `.dmg`，在 `windows-latest` 生成 NSIS `.exe` 和 `.msi`，上传到同一个 GitHub Release。

## Tasks

- [x] 写入实现计划 `docs/plans/2026-06-23-github-release-installers.md`
- [x] 新增 GitHub Release workflow
- [x] 在 README 说明安装包下载、未签名提示和 tag 发布方式
- [x] 运行测试、类型检查、桌面静态构建和 diff 检查
- [x] 记录 Review / 复盘

## Verify

- tag `v*` 会触发 release workflow。
- 手动触发 workflow 时必须输入 release tag。
- macOS job 构建并上传 `.dmg`。
- Windows job 构建并上传 NSIS `.exe` 和 `.msi`。
- Release body 明确说明当前安装包未签名。

## Review

- 结果：新增 `.github/workflows/release.yml`，推送 `v*` tag 或手动输入 tag 时会运行 macOS / Windows 矩阵构建，并通过 `tauri-apps/tauri-action@v1` 创建或更新 GitHub Release。
- 结果：macOS job 使用 `--bundles dmg`，Windows job 使用 `--bundles nsis,msi`；Release asset 命名包含版本、平台、架构和 bundle 类型。
- 结果：Release body 明确说明安装包未签名，README 也补充了下载入口、未签名提示和维护者 tag 发布命令。
- 边界：本地未生成 Windows 安装包；该部分由 GitHub `windows-latest` runner 验证。macOS/Windows 完整安装器产物需要在首次 push tag 后由 Actions 实际产出。
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build:desktop-web`
- 通过：`ruby -e "require 'yaml'; YAML.load_file('.github/workflows/release.yml'); puts 'yaml ok'"`
- 通过：`git diff --check`

# 2026-06-22 桌面首页数据迁移

## Spec

- 目标：桌面生产包首页不再显示构建期空模型，Agent、Skill、分类标签和同步状态要与 Web 版读取同一批本地文件。
- 根因：`app/page.tsx` 在 `SKILLS_HUB_DESKTOP=1` 时返回空 `SkillBoardModel`，桌面首页没有运行时数据加载。
- 范围：新增桌面 Skill Board 读取 command、前端 board client、首页运行时加载状态和回归测试。
- 非目标：本切片先不迁移同步/安装/删除/分类保存等写操作按钮。
- 设计方向：静态导出仍输出一个可启动壳层；Tauri 运行时挂载后调用本地 Rust `get_skill_board_model` 扫描 `~/.agents/skills`、各 Agent skills 目录、分类配置和自研标记。

## Tasks

- [x] 定位首页 Skill=0 与分类标签缺失根因
- [x] 实现 Rust Skill Board 扫描模型
- [x] 新增前端 Skill Board client bridge
- [x] 改造首页/仪表盘在 Tauri 运行时加载本地模型
- [x] 增加回归测试
- [x] 运行测试、类型检查、Web/桌面构建和 Rust 检查
- [x] 记录 Review / 复盘

## Verify

- 桌面静态包首页不再依赖构建期空模型作为最终数据。
- Tauri 运行时能显示本机 Agent、Skill 和分类标签。
- Web 模式仍使用 server component 模型，不破坏 `npm run dev`。
- `npm run build:desktop-web` 仍能静态导出。

## Review

- 根因：桌面静态构建为了避开 Next API routes，把首页模型固定成空数组；Tauri 运行时没有再加载真实本机数据。
- 结果：新增 `get_skill_board_model` Tauri command，运行时扫描启用 Agent、`~/.agents/skills`、Agent skills 目录、分类配置、自研标记和 skill 分类映射。
- 结果：新增 `src/lib/board/skill-board-client.ts`，Web 模式返回 `null` 保持 server component 模型，Tauri 模式通过 `invoke` 获取本地模型。
- 结果：`DashboardPage` 挂载后在 Tauri 中用本地模型替换构建期空壳，Skill 数量、Agent 数、分类标签、自研/开源标签和状态恢复显示。
- 结果：桌面静态导出目录 `out/` 仍无 `/api/*` 输出；普通 Web 构建仍保留 API routes，这是 Web 运行模式需要的。
- 剩余：同步、安装、删除、自研标记切换、分类保存、Skill 内容详情等写/详情操作仍需继续迁移到 Tauri commands，才能宣称桌面生产功能与 Web 完全一致且全程不依赖 Next API。
- 通过：`npm test -- src/lib/board/skill-board-client.test.ts src/lib/config/agents-client.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`npm run build:desktop-web`
- 通过：`cargo check --manifest-path src-tauri/Cargo.toml`
- 通过：`cargo fmt --manifest-path src-tauri/Cargo.toml --check`
- 通过：`find out -path '*/api/*' -print` 无输出
- 通过：`git diff --check`

# 2026-06-22 桌面 Dashboard 操作迁移

## Spec

- 目标：Dashboard 在 Tauri 桌面生产运行时不再调用 Next `/api/*`，同步、安装、删除、自研标记、分类保存和 Skill 内容详情都走本地 commands。
- 范围：Dashboard action client、Rust commands、同步/安装/删除/配置写入/详情读取、本地与 GitHub 安装、回归测试。
- 非目标：本切片不迁移 Settings 分类管理、通用设置页、系统目录选择器和 Sync 专页。
- 设计方向：前端 Dashboard 只调用 `dashboard-actions-client`；Web 模式保留原 API fallback，Tauri 模式调用 Rust commands。Rust 侧复刻当前 Web 行为，使用本地文件系统作为数据源。

## Tasks

- [x] 梳理 Dashboard 现存 `/api/*` 触点
- [x] 新增 Rust Dashboard 操作 commands
- [x] 新增 Dashboard action client bridge
- [x] 替换 Dashboard 组件里的直接 API fetch
- [x] 增加 action client 回归测试
- [x] 运行定向测试、全量测试、类型检查、Web/桌面构建和 Rust 检查
- [x] 记录 Review / 复盘

## Verify

- Tauri 运行时 Dashboard 组件不直接请求 `/api/*`。
- Web 模式仍能通过原 API fallback 使用相同组件。
- 桌面静态导出目录不包含 `/api/*`。
- 同步/安装/删除等文件操作不依赖 Next 后端。

## Review

- 结果：新增 `src/lib/board/dashboard-actions-client.ts`，统一封装 sync、install、remove、custom tag、skill categories 和 skill content。
- 结果：Tauri 模式调用 `apply_sync_actions`、`install_skill_source_command`、`remove_skill`、`set_custom_skill`、`set_skill_categories_command`、`get_skill_content`；Web 模式继续 fallback 到原 `/api/*`。
- 结果：`DashboardPage` 移除直接 API fetch，所有 Dashboard 操作都经过 bridge。
- 结果：Rust 侧实现递归复制、修复替换、symlink 创建、symlink 安全删除、配置 JSON 写入、Skill 内容读取、Skill 删除、本地目录安装和 GitHub archive 安装。
- 结果：GitHub 安装在桌面端使用系统 `curl` 和 `tar`，不启动 Next API 服务；若系统缺少命令会返回明确错误。
- 剩余：Settings 分类管理、通用设置、系统目录选择器、Sync 专页如果要在桌面生产中完整可用，仍应迁到 Tauri commands。
- 通过：`npm test -- src/lib/board/dashboard-actions-client.test.ts src/lib/board/skill-board-client.test.ts src/lib/config/agents-client.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`npm run build:desktop-web`
- 通过：`cargo check --manifest-path src-tauri/Cargo.toml`
- 通过：`cargo fmt --manifest-path src-tauri/Cargo.toml --check`
- 通过：`find out -path '*/api/*' -print` 无输出
- 通过：`git diff --check`

# 2026-06-22 桌面客户端长期方案

## Spec

- 目标：启动 macOS / Windows 长期桌面客户端迁移，采用 Tauri 2 + Rust 本地核心 + 静态 React 前端。
- 范围：新增桌面客户端实现计划、Tauri 2 项目骨架、桌面构建脚本、Next 静态导出切换，以及首轮验证。
- 非目标：本轮不迁移全部 API route，不重写 skill/sync/instructions 核心逻辑，不引入 Electron 或 Node sidecar 作为长期依赖。
- 设计方向：先建立可维护的桌面外壳，让现有 Web 开发模式保持不变；桌面生产构建使用静态前端，后续逐步把文件系统能力迁入 Rust commands。

## Tasks

- [x] 确认长期技术路线：Tauri 2 + Rust core + React static UI
- [x] 创建客户端开发分支 `codex-desktop-client`
- [x] 写入实现计划 `docs/plans/2026-06-22-desktop-client-implementation.md`
- [x] 新增 Tauri 2 桌面项目骨架
- [x] 增加桌面构建脚本与静态导出配置
- [x] 运行格式、类型、测试和构建验证
- [x] 记录 Review / 复盘

## Verify

- 普通 Web 开发仍然使用 `npm run dev` 和 `http://localhost:3000`。
- 桌面开发有独立命令，不改变现有服务端页面开发路径。
- 桌面生产构建可以切到 Next static export，为后续 Tauri `frontendDist` 提供 `out/`。
- Tauri 配置明确面向 macOS / Windows 分发，不依赖临时 Node sidecar。
- 当前改动不破坏现有测试、类型检查和 Next 构建。

## Review

- 结果：新增 `src-tauri/` Tauri 2 Rust 工程，包含 `Cargo.toml`、`tauri.conf.json`、默认 capability、入口文件和最小应用图标。
- 结果：Tauri dev mode 指向 `http://localhost:3000`，保持现有 `npm run dev` Web 开发体验不变。
- 结果：新增 `@tauri-apps/api` 与 `@tauri-apps/cli`，并增加 `tauri`、`desktop:dev`、`desktop:build`、`build:desktop-web` 脚本。
- 结果：`build:desktop-web` 通过 Node 脚本设置 `SKILLS_HUB_DESKTOP=1`，避免 Windows 不支持 POSIX 环境变量写法。
- 结果：`next.config.ts` 只在桌面构建时启用 `output: "export"` 和 `images.unoptimized`。
- 已知阻塞：`npm run build:desktop-web` 当前失败在 `/api/instructions`、`/api/custom-tag` 等 App Router API routes；这是预期迁移点，后续需要把 `/api/*` 文件系统能力迁到 Tauri commands 或桌面桥接层。
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`cargo check --manifest-path src-tauri/Cargo.toml`
- 通过：`git diff --check`

## Follow-up: 桌面打包可用性收口

### Spec

- 目标：让桌面打包命令区分“应用本体可生成”和“安装器镜像可生成”，并消除 macOS bundle identifier 警告。
- 范围：Tauri identifier、npm 打包脚本、macOS `.app` 产物验证、DMG/Windows 打包状态记录。
- 非目标：本切片不继续迁移 Dashboard/Settings/Sync 的运行时 API，不处理签名/公证，不在 macOS 本机强行交叉生成 Windows 安装包。
- 设计方向：保留 `desktop:build` 作为完整构建命令，同时增加更细的 `desktop:build:app`、`desktop:build:dmg`、`desktop:build:windows`，让 CI 和本地排障能明确失败发生在应用构建还是安装包封装。

### Tasks

- [x] 写入实现计划 `docs/plans/2026-06-22-desktop-packaging-readiness.md`
- [x] 修正 Tauri bundle identifier
- [x] 增加细分桌面打包脚本
- [x] 验证 macOS `.app` 构建
- [x] 记录 DMG 与 Windows 打包边界
- [x] 运行测试、类型检查、桌面静态构建和 diff 检查

### Verify

- `npm run desktop:build:app` 在 macOS 生成 `Skills Hub.app`。
- `npm run desktop:build:dmg` 与 `.app` 构建解耦，能单独暴露 `hdiutil` 问题。
- Windows 安装包命令存在，但明确要求 Windows 或 Windows CI 环境运行。
- 常规测试、类型检查和桌面静态导出仍通过。

### Review

- 结果：Tauri identifier 从 `com.skillshub.app` 改为 `com.skillshub.desktop`，`npx tauri build --bundles app` 不再出现 macOS `.app` 后缀警告。
- 结果：新增 `desktop:build:app`、`desktop:build:dmg`、`desktop:build:windows`，分别用于 macOS app bundle、macOS DMG 和 Windows NSIS/MSI installer 验证。
- 结果：`npm run desktop:build:app` 成功生成 `/Users/liuxingqi/ai_lab/skills_hub/src-tauri/target/release/bundle/macos/Skills Hub.app`。
- 已知边界：`npm run desktop:build:dmg` 当前仍失败在 macOS `hdiutil: create failed - 设备未配置`，应用本体已生成，失败点是本机 DMG 镜像封装环境。
- 已知边界：`desktop:build:windows` 需要 Windows 机器或配置了 Windows target 的 CI runner；本机 macOS 不作为 Windows installer 生成环境。
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build:desktop-web`
- 通过：`npm run desktop:build:app`
- 通过：`git diff --check`

## Follow-up: Instructions Tauri Bridge

### Spec

- 目标：把 `/instructions` 页面作为第一条桌面本地能力迁移切片，桌面运行时通过 Tauri commands 读取和保存全局规则文件。
- 范围：Rust instructions commands、前端 instructions 数据访问桥、规则编辑器调用点、定向测试和构建验证。
- 非目标：本切片不迁移 Dashboard 同步/安装，不迁移 Settings Agent 管理，不移除现有 Web `/api/instructions*` route handlers。
- 设计方向：保持 Web 路径继续 fetch `/api/instructions*`；当运行在 Tauri WebView 中时，前端使用 `@tauri-apps/api/core.invoke` 调用 Rust commands。Rust 侧复刻当前安全边界：只扫描 Claude/Codex/Hermes 主规则文件，只允许保存这些主文件，并检查 previousHash。

### Tasks

- [x] 梳理 instructions 模型与保存安全边界
- [x] 新增 Rust instructions 模型扫描与保存 commands
- [x] 注册 Tauri command handler
- [x] 新增前端 instructions client bridge
- [x] 改造 `EditorPage` 使用 bridge，保留 Web API fallback
- [x] 增加桥接层单元测试
- [x] 运行定向测试、全量测试、类型检查、Web 构建、桌面静态构建、Cargo 检查和 diff 检查
- [x] 记录 Review / 复盘

### Verify

- Web 模式仍请求 `/api/instructions` 和 `/api/instructions/update`。
- Tauri 模式调用 `get_instructions_model` 和 `update_instruction_asset`。
- 保存时 stale hash 返回明确错误，不覆盖已变化文件。
- `npm run build:desktop-web` 仍通过。
- `cargo check --manifest-path src-tauri/Cargo.toml` 通过。

### Review

- 结果：新增 `src-tauri/src/instructions.rs`，提供 `get_instructions_model` 和 `update_instruction_asset` commands，扫描 Claude/Codex/Hermes 主规则文件，并复刻现有 hash 归一化、stale 检查和主文件写入边界。
- 结果：`src-tauri/src/lib.rs` 注册 instructions commands；`src-tauri/Cargo.toml` 增加 `serde` 与 `sha2`。
- 结果：新增 `src/lib/desktop/tauri-runtime.ts` 和 `src/lib/instructions/instructions-client.ts`，Tauri WebView 中使用 `invoke`，普通 Web 中继续调用 `/api/instructions*`。
- 结果：`EditorPage` 不再直接 fetch instructions API，而是通过 client bridge 读写；现有 Web route handlers 保留，便于渐进迁移。
- 结果：新增 `instructions-client.test.ts`，覆盖 Web fallback、Tauri invoke 和 command error 归一化；Rust 单元测试覆盖 BOM/CRLF hash 归一化。
- 结果：`vitest.config.ts` 排除 `.next-desktop-export`，避免桌面 shadow app 存在时 Vitest 扫到重复测试。
- 通过：`npm test -- src/lib/instructions/instructions-client.test.ts`
- 通过：`cargo test --manifest-path src-tauri/Cargo.toml`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`npm run build:desktop-web`
- 通过：`find out -path '*/api/*' -print` 无输出
- 通过：`git diff --check`

## Follow-up: 桌面静态导出切片

### Spec

- 目标：让 `npm run build:desktop-web` 先稳定产出 Tauri 可消费的 `out/` 静态前端包。
- 范围：桌面构建脚本、桌面构建期首页模型、静态导出验证记录。
- 非目标：本切片不迁移全部 `/api/*` 到 Rust commands，不承诺桌面生产包里的同步/安装/设置写入功能已经可用。
- 设计方向：Web 仍使用 Next server/API routes；桌面静态构建使用临时 shadow app 排除 `app/api`，首页渲染无本机数据的静态壳层，为下一步 Tauri command bridge 留出清晰边界。

### Tasks

- [x] 确认 `build:desktop-web` 真实阻塞点
- [x] 将首页 `force-dynamic` 改为 Web 请求期动态、桌面构建期静态
- [x] 将桌面构建脚本改为 shadow app 构建并排除 `app/api`
- [x] 运行桌面静态构建、常规 Web 构建、类型检查和测试
- [x] 记录 Review / 复盘

### Verify

- `npm run build:desktop-web` 生成根目录 `out/`。
- `out/index.html` 存在，并且不包含 Next API route 输出。
- `npm run build` 仍保持 Web server 构建路径。
- `npm test` 和 `npx tsc --noEmit` 通过。

### Review

- 根因：Next static export 会收集 `app/api/**/route.ts`，当前 `/api/custom-tag`、`/api/instructions` 等 route handlers 依赖运行时文件系统和动态请求语义，不能直接参与静态导出。
- 结果：`scripts/build-desktop-web.mjs` 改为在 `.next-desktop-export` 创建临时 shadow app，复制页面代码但排除 `app/api`，构建完成后把静态产物复制回根目录 `out/`。
- 结果：`app/page.tsx` 移除全局 `force-dynamic`，Web 请求期使用 `connection()` 保持动态 server render；桌面构建期返回空 `SkillBoardModel`，避免构建时把本机 skill 状态固化进静态包。
- 结果：`.gitignore` 忽略 `.next-desktop-export` 和 `out`，避免临时项目与静态产物进入版本控制。
- 已知边界：桌面静态包目前是迁移壳层，客户端仍有 `/api/*` fetch；下一步应建立 Tauri command bridge，并优先迁移 `/instructions` 这条读写边界清楚的路径。
- 通过：`npm run build:desktop-web`
- 通过：`test -f out/index.html && find out -maxdepth 2 -type f | sort | sed -n '1,40p'`
- 通过：`find out -path '*/api/*' -print` 无输出
- 通过：`npx tsc --noEmit`
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`cargo check --manifest-path src-tauri/Cargo.toml`
- 通过：`git diff --check`

# 2026-06-22 自定义 Agent 与 Skill 路径选择

## Spec

- 目标：在 Agent 管理中支持用户编辑内置 Agent 的 Skill 文件夹路径，并新增自定义 Agent。
- 范围：Agent 配置模型、Agent API、路径检测、系统目录选择入口、设置页 Agent 管理 UI、回归测试。
- 非目标：不做复杂的跨平台自动推断；不引入 overrides/customAgents 双层配置；不改变 skill 扫描、同步、安装的核心模型。
- 设计方向：`config/agents.json` 成为完整可编辑 Agent 列表；`config/agent-registry.json` 只作为初始化和恢复默认值模板。路径以用户选择为准。

## Tasks

- [x] 梳理现有 Agent registry、enabledIds、扫描与设置页数据流
- [x] 制定简化方案并确认文件选择器交互
- [x] 写入实现计划 `docs/plans/2026-06-22-custom-agent-paths-implementation.md`
- [x] 实现可编辑 Agent 配置模型并兼容旧格式
- [x] 新增/调整 Agent 保存、路径检测、目录选择 API
- [x] 改造 Agent 管理 UI：路径选择、检测、新增自定义 Agent、删除
- [x] 增加配置/API/UI 回归测试
- [x] 运行定向测试、全量测试、类型检查、构建和 diff 检查
- [x] 补充 Review / 复盘

## Verify

- 旧版 `{ enabledIds, customized }` 配置可以无痛读取。
- 内置 Agent 的路径可被用户修改并持久化。
- 用户可以点击“选择文件夹”填充路径；失败时仍可手动输入。
- 自定义 Agent 可新增、启用、禁用、删除。
- 路径检测能区分可读取目录、路径不存在、非目录、无权限和空目录。
- 首页、同步、安装继续使用 enabled agents 的 `skillsPath`。

## Review

- 结果：`config/agents.json` 兼容旧版 `{ enabledIds, customized }`，新保存格式为 `{ version: 2, agents: [...] }`，每个 Agent 直接包含 `enabled` 和 `skillsPath`。
- 结果：`agent-registry.json` 继续作为内置 Agent 模板；旧配置读取时仍显示所有 registry Agent，并按旧 enabledIds 计算启用状态。
- 结果：新增 `POST /api/agents/validate-path`，返回路径不存在、非目录、无权限、空目录和已发现 Skill 数量。
- 结果：新增 `POST /api/system/select-directory`，在 macOS/Windows/Linux 尝试打开系统目录选择器；不可用时前端回退到手动输入。
- 结果：Agent 管理页支持路径输入、选择文件夹、检测路径、新增自定义 Agent、删除自定义 Agent、启用/禁用自动保存。
- 通过：`npm test -- src/lib/config/agent-registry-store.test.ts src/lib/config/load-agents.test.ts app/api/agents/route.test.ts src/components/settings/settings-page.test.tsx`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`
- 通过：浏览器打开 `http://localhost:3003/settings`，确认 Agent 管理列表、路径检测状态和新增 Agent 弹窗正常渲染。

## 2026-06-22 桌面端分类管理空列表修复

### Spec

- 目标：Tauri 桌面生产运行时，设置页“分类管理”读取、创建、编辑、删除和恢复预设分类都使用本地配置，不再因为依赖 Next API 而显示空列表。
- 范围：分类管理客户端封装、Tauri 分类 CRUD command、设置页接入和回归测试。
- 非目标：不改变分类数据结构，不恢复自动分类匹配逻辑，不迁移通用设置页的其它能力。
- 验证：Web 模式仍请求 `/api/categories`；Tauri 模式调用本地 command；设置页能通过客户端加载分类。

### Tasks

- [x] 定位分类管理空列表根因
- [x] 新增分类客户端封装
- [x] 新增 Tauri 分类 CRUD command
- [x] 接入 SettingsPage 分类管理
- [x] 增加回归测试
- [x] 运行相关测试、类型检查和 diff 检查

### Review

- 根因：设置页分类管理仍直接请求 `/api/categories`，桌面静态包没有 Next API runtime，因此加载失败后保留空数组。
- 结果：新增 `src/lib/config/categories-client.ts`，Web 模式继续走 `/api/categories`，Tauri 模式调用 `get_categories`、`create_category`、`update_category`、`delete_category`。
- 结果：`SettingsPage` 分类加载、创建、编辑、删除和恢复预设分类都改为通过 client bridge；恢复预设改为顺序写入，避免本地 JSON 并发覆盖。
- 结果：Rust 侧新增分类 CRUD commands，并继续读写同一个 `config/categories.json`。
- 通过：`npm test -- src/lib/config/categories-client.test.ts src/components/settings/settings-page.test.tsx`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`cargo check`
- 通过：`cargo fmt --check`
- 通过：`git diff --check`

## Follow-up: 隐藏 Agent ID

- [x] 移除 Agent 列表中的 ID 展示
- [x] 移除新增 Agent 弹窗中的 Agent ID 输入框
- [x] 根据 Agent 名称自动生成唯一内部 ID，重名时自动追加数字后缀
- [x] 增加 UI 回归测试，确认用户无需填写 ID

# 2026-05-14 页面设计优化

## Spec

- 目标：优化 Skills Hub 的主工作区视觉与操作体验，让技能管理页更像高效的本地运维控制台，而不是普通数据表。
- 范围：首页技能管理页、全局壳层、导航、列表工具条、状态展示、详情抽屉、响应式样式，以及必要的设计文档与验证记录。
- 非目标：不改变同步、删除、标记自制、规则编辑等业务行为；不新增后端数据结构；不引入大型 UI 框架。
- 设计方向：采用安静、清晰、偏工具型的“本地控制台”风格。保留高信息密度，但把状态、筛选、批量操作和行内操作做出更明确的层级。
- 参考原则：
  - 首屏优先显示关键指标与待处理状态。
  - 搜索、筛选、批量操作常驻，不藏在弹窗里。
  - 行内操作靠近资源本身，减少来回跳转。
  - 移动端避免不可控横向表格，必要时转为卡片式资源列表。
  - 颜色服务状态语义，不做单一色系装饰。

## Tasks

- [x] 审查当前页面、组件、样式与既有设计文档
- [x] 联网调研类似 SaaS/admin dashboard 的近期最佳实践
- [x] 与用户确认优化方案
- [x] 写入设计文档 `docs/plans/2026-05-14-page-design-optimization-design.md`
- [x] 制定实现计划并挑战是否有更优雅方案
- [x] 优化全局壳层、导航和页面标题区
- [x] 优化技能列表工具条、状态层级、行内操作与详情抽屉
- [x] 优化移动端布局与可点击区域
- [x] 运行类型检查、测试和浏览器视觉验证
- [x] 在本文档补充 Review / 复盘
- [x] 更新 `tasks/lessons.md`

## Verify

- 首页打开后 5 秒内能看清总量、待同步、异常、外部项和可执行主操作。
- 搜索、筛选、批量同步、单项同步、标记自制、删除和详情入口仍可用。
- 详情抽屉保持补充信息查看职责，不抢占列表主流程。
- 移动端关键操作不丢失，文本不重叠，不依赖用户猜测横向滚动。
- TypeScript 和现有测试通过。
- 使用浏览器截图检查桌面与移动端主要页面。

## Review

- 结果：全局壳层改成更明确的本地控制台表达，顶部显示 `Local console`，左侧导航 active/hover 层级更清楚。
- 结果：首页新增状态概览区，直接展示全部技能、待同步、异常和自制条目；搜索、筛选、选择和同步操作被整理成常驻控制条。
- 结果：技能矩阵保留桌面高密度表格，同时强化 sticky 表头、行 hover、选中态、状态 pill 和行内操作按钮。
- 结果：窄屏下技能表格会转为卡片式行布局，关键状态与操作不再只能依赖横向滚动。
- 结果：详情抽屉更像 inspector，代码区高度更实用，并支持 Escape 关闭。
- 结果：移除 `next/font/google` 依赖，改用本地/系统字体栈，避免本地构建因无法访问 Google Fonts 失败。
- 通过：`npx tsc --noEmit`
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`curl --noproxy '*' -s http://127.0.0.1:3015` 返回真实 Next 页面 HTML，确认本地渲染入口正常。
- 通过：`git diff --check`
- 未完成：当前工具列表没有可用的浏览器截图工具，未能产出桌面/移动截图；已用类型、测试、生产构建和本地页面请求覆盖主要风险。

## Follow-up: 视觉返工

- [x] 降低卡片套卡片、重阴影和粗边框带来的笨重感
- [x] 将左侧导航从大块深色按钮改为更轻的工具 rail
- [x] 将状态概览从四张大卡改成紧凑指标条
- [x] 压缩表格按钮和行高，让资源列表更像专业工作台
- [x] 重新运行类型检查、测试和构建

### Follow-up Review

- 结果：移除主控制区的大卡片容器，让页面从“卡片堆叠”回到更轻的工具台布局。
- 结果：左侧 active 导航不再使用大块深色底，改为白底轻边框，视觉负担更小。
- 结果：状态概览高度、间距和图标块都压缩，减少首屏臃肿感。
- 结果：表格按钮、行高、标题字号和描述字号进一步收紧，资源列表更密、更像工作台。
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`npx tsc --noEmit`
- 通过：`git diff --check`

# 2026-05-15 Skill 安装功能

## Spec

- 目标：在 Skills Hub 中增加安装入口，用户输入 GitHub skill 项目地址或本地目录后，将其中的 skill 安装到所有 enabled coding agent 的 skills 目录。
- 范围：安装器核心逻辑、安装 API、首页表单入口、结果反馈、单元测试、文档和验证记录。
- 非目标：不做覆盖安装、不做版本管理、不改变现有同步/删除/标记自制语义。
- 安装策略：
  - 根目录有 `SKILL.md` 时按单个 skill 安装。
  - 子目录有 `SKILL.md` 时按多个 skill 安装。
  - 目标目录已存在时跳过并报告冲突。
  - 安装目标来自 `config/agents.json` 中 enabled agent 的 `skillsPath`。

## Tasks

- [x] 审查现有 skill 扫描、同步、页面和 agent 配置结构
- [x] 与用户确认安装设计
- [x] 写入设计文档 `docs/plans/2026-05-15-skill-installer-design.md`
- [x] 写入实现计划 `docs/plans/2026-05-15-skill-installer-implementation.md`
- [x] 实现安装器核心逻辑
- [x] 新增安装 API
- [x] 在首页 Skills Board 增加安装表单和结果反馈
- [x] 增加安装器单元测试
- [x] 运行测试、类型检查、构建和 diff 检查
- [x] 在本文档补充 Review / 复盘
- [x] 更新 `tasks/lessons.md`

## Verify

- 本地目录根部 `SKILL.md` 可安装到所有 enabled agent。
- 多 skill 目录可一次识别并安装多个 skill。
- 已存在目标目录不会被覆盖。
- 无效目录或无 skill 输入返回清晰错误。
- GitHub URL 通过 clone 后按同一套发现逻辑安装。
- 首页安装后刷新列表，并展示安装/跳过/失败结果。

## Review

- 结果：新增 `installSkillSource` server library，集中处理输入分类、GitHub clone、本地目录读取、skill 发现、复制安装、冲突跳过和临时目录清理。
- 结果：新增 `POST /api/skills/install`，前端只提交 `{ source }`，目标 agent 目录仍来自 `config/agents.json` 的 enabled agents。
- 结果：首页 Skills Board 新增安装栏，支持输入 GitHub skill 地址或本地目录，安装后展示发现的 skill 名称，以及已安装/跳过/失败数量，并刷新现有列表。
- 结果：GitHub 根目录 skill 会使用仓库名作为安装目录名；本地根目录 skill 使用本地目录名。
- 结果：目标目录已存在时跳过，不覆盖现有内容。
- 通过：`npm test -- src/lib/skills/install-skill-source.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`

## 2026-06-16 Windows Codex Skill 首次检测排查

### Spec

- 目标：定位 Windows 用户首次打开时 `.codex` 下 skill 没有被检测出来的原因。
- 范围：Codex agent 的 `skillsPath` 展开、首次 agent 选择逻辑、Windows home / Codex home 环境变量兼容，以及回归测试。
- 非目标：不恢复插件缓存递归扫描，不改变用户显式启用/禁用 Agent 的语义，不改 UI。
- 验证标准：Codex 使用自定义 `CODEX_HOME` 时，`skillsPath` 指向该目录下的 `skills`；没有 `CODEX_HOME` 时优先使用 `$HOME/.codex/skills`；Windows 默认路径无 skill 时可 fallback 到盘符根目录 `.codex/skills`。

### Tasks

- [x] 梳理当前 Codex skills 路径来源与 Windows 环境变量差异
- [x] 设计最小修复并挑战是否存在更优雅方案
- [x] 增加 Codex home 路径展开回归测试
- [x] 实现路径展开修复
- [x] 运行定向测试、全量测试、类型检查和 diff 检查
- [x] 记录根因与验证结果

### Review

- 根因：Codex 的 skill registry 路径写死为 `$HOME/.codex/skills`，但 Codex 全局规则扫描已经使用 `CODEX_HOME || ~/.codex`。Windows 或自定义 Codex home 环境下，首次扫描会去错目录，因此看不到实际 `.codex` 根目录下的 skills。
- 结果：Codex registry 改为 `$CODEX_HOME/skills`，路径展开层在没有 `CODEX_HOME` 时回退到 `homedir()/.codex`，保持默认行为不变。
- 结果：新增 `resolveCodexSkillsPath()`，显式 `CODEX_HOME` 优先；默认路径已有合法 skill 时保持默认；Windows 默认路径无 skill 时，轻量探测 `C:\.codex\skills` 到 `Z:\.codex\skills`，命中后作为 Codex 的最终 `skillsPath`。
- 结果：新增 `CODEX_HOME`、Windows drive-root fallback、默认路径优先三个回归测试，确保截图里的 `D:\.codex\skills` 类路径能被兼容，同时不误覆盖正常 home 路径。
- 通过：`npm test -- src/lib/config/load-agents.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`

# 2026-06-16 Agent Skill 检测范围收窄

## Spec

- 目标：更新 skill 检测逻辑，只检测每个 agent 根目录下一级的 `skills` 目录，例如 `$HOME/.codex/skills`、`$HOME/.claude/skills`。
- 范围：agent 检测、agent skill 状态扫描、bootstrap 回填、删除实例时的扫描根，以及对应单元测试。
- 非目标：不扫描 `$HOME/.codex/plugins/cache`、`$HOME/.claude/plugins/cache` 等其它目录；不改变安装目标仍写入 `agent.skillsPath` 的行为；不改 UI。
- 设计方向：以 `skillsPath` 作为唯一 agent skill 检测根；保留目录下“每个直接子目录是一个 skill”的模型，避免递归扫到插件缓存或其它非用户安装目录。

## Tasks

- [x] 审查现有扫描入口和配置
- [x] 确认实现方案
- [x] 收窄 discovery roots 到 `agent.skillsPath`
- [x] 将 discovery 行为改为只识别 `skillsPath` 的直接子目录
- [x] 更新配置/类型/测试以反映不再使用 `skillDiscoveryPaths`
- [x] 运行针对性测试、全量测试和类型检查
- [x] 在本文档补充 Review / 复盘

## Verify

- `$HOME/.codex/skills/foo/SKILL.md` 能被识别为 `foo`。
- `$HOME/.codex/plugins/cache/.../skills/foo/SKILL.md` 不再被识别。
- `$HOME/.claude/skills/foo/SKILL.md` 能被识别。
- 缺失、无权限或不存在的 `skillsPath` 仍然安全跳过。
- 删除 skill 时只删除 source 和各 agent 的 `skillsPath/<skillName>` 匹配项，不触碰插件缓存。

## Review

- 结果：`discoverSkillDirs()` 改为只扫描传入 `skillsPath` 的直接子目录，只有子目录内存在 `SKILL.md` 才会识别为 skill。
- 结果：`scanAllSkills()`、`scanAgentStates()`、`bootstrapSourceFromAgents()`、`resolveActiveAgentIds()` 和 `removeSkillInstances()` 都统一只使用 `agent.skillsPath`。
- 结果：从 agent registry 配置、schema 和类型中移除 `skillDiscoveryPaths`，避免 Claude/Codex 插件缓存继续进入检测范围。
- 结果：回归测试改为覆盖插件缓存路径不被识别、删除不触碰插件缓存、直接 skills 目录仍正常识别。
- 通过：`npm test -- ./src/lib/skills/discover-skill-dirs.test.ts ./src/lib/skills/scan-all-skills.test.ts ./src/lib/skills/bootstrap-source.test.ts ./src/lib/skills/remove-skill-instances.test.ts ./src/lib/skills/scan-agent-skills.test.ts ./src/lib/config/load-agents.test.ts`
- 通过：`npx tsc --noEmit`
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`git diff --check`

## Follow-up: GitHub clone 代理失败

- [x] 定位 `CONNECT tunnel failed, response 501` 来自 `git clone` 继承代理环境
- [x] 增加代理隧道失败后的无代理重试
- [x] 增加 HTTP/2 framing 失败后的 HTTP/1.1 重试
- [x] 增加 git clone 超时，避免网络挂起导致安装按钮一直等待
- [x] 增加 git clone 环境构造测试
- [x] 重新运行安装器测试、完整测试、类型检查和构建
- [x] 更新复盘记录

### Follow-up Review

- 结果：`git clone` 仍先使用默认环境，兼容需要代理的正常场景。
- 结果：当 clone 报 `CONNECT tunnel failed` / `response 501` / proxy 类错误时，自动清理 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 等变量后重试。
- 结果：当 clone 报 HTTP/2 framing 类错误时，自动使用 `git -c http.version=HTTP/1.1 clone ...` 重试。
- 结果：clone 增加 180 秒超时，避免当前网络链路长时间挂起时 UI 无限等待。
- 通过：`npm test -- src/lib/skills/install-skill-source.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`
- 说明：对 `https://github.com/pbakaus/impeccable/` 的临时真实 clone 已经越过原始 501 和 HTTP/2 framing 报错，但当前网络传输长时间未完成；因此保留代码级重试并加入超时保护。

## Follow-up: 重复 skill key

- [x] 定位 React key warning 来自扫描层把多个目录的 `frontmatter.name` 都映射成 `impeccable`
- [x] 将 skill identity 固定为目录名，避免同步状态和 UI key 被 frontmatter 撞名影响
- [x] 增加扫描层重复 frontmatter name 的回归测试
- [x] 重新运行测试、类型检查和构建
- [x] 更新复盘记录

### Follow-up Review

- 结果：`scanAllSkills` 和 `scanSourceSkills` 现在都使用目录名作为 skill identity，不再用 `SKILL.md` frontmatter 的 `name` 覆盖目录名。
- 结果：Skills Board 的表格行 key 改为 `sourcePath:name`，即使扫描数据异常也更不容易触发 React 重复 key warning。
- 结果：新增 `scan-all-skills.test.ts`，覆盖多个目录拥有同一个 frontmatter `name` 的场景。
- 结果：补强 `scan-source-skills.test.ts`，保证 source scanner 也遵守同一身份规则。
- 通过：`npm test -- src/lib/skills/scan-all-skills.test.ts src/lib/skills/scan-source-skills.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`

# 2026-06-16 首次启动 Skill 扫描缺失排查

## Spec

- 目标：定位第一次使用时未检测到本地全部 Skill、只拉取部分 Skill 的根因，重点检查应用启动初期的 Skill 获取与 bootstrap 机制。
- 范围：启动首页数据链路、agent 配置加载、source skills 扫描、agent skills 扫描、bootstrap 回填、缓存策略，以及相关单元测试。
- 非目标：不重做同步模型，不改变 UI 交互，不引入外部数据库。
- 成功标准：能解释为什么首次启动会漏扫，给出最小修复，补充回归测试，并用测试/类型检查证明行为正确。

## Tasks

- [x] 梳理首页启动数据流：`app/page.tsx` 到 server model 到扫描函数
- [x] 检查默认 agent 配置与 bootstrap 是否漏掉未启用 agent
- [x] 检查缓存、错误吞吐、过滤规则是否会造成首次扫描不完整
- [x] 设计最小修复并挑战是否有更优雅方案
- [x] 增加失败优先的回归测试
- [x] 实现修复
- [x] 运行定向测试、完整测试、类型检查和 diff 检查
- [x] 记录排查结论和验证结果

## Verify

- 默认只启用部分 agent 时，首次 bootstrap 仍能从本机已知 agent skills 目录收集缺失 Skill。
- 权威目录已存在部分 Skill 时，bootstrap 仍会补齐其他 agent 独有 Skill。
- 不存在的 agent 目录不报错，不影响其他目录扫描。
- 现有同步状态和缺失状态语义不变。

## Review

- 根因 1：首次启动 `buildOverviewModel()` 只把 `loadAgents()` 的 enabled agents 传给 bootstrap；默认只启用 `claude`、`codex`，其他本机已知 agent 目录不会参与 source 回填。
- 根因 2：bootstrap 和 `scanAllSkills()` 只扫描 `skillsPath` 第一层，漏掉 Codex/Claude 插件缓存中的嵌套 skills。
- 修复：`buildOverviewModel()` 展示仍使用 enabled agents，但 bootstrap 改用 `loadAllRegistryAgents()`。
- 修复：新增 `skillDiscoveryPaths` 配置，保留 `skillsPath` 作为安装目标，同时允许启动发现扫描稳定的插件 cache 目录。
- 修复：新增 `discoverSkillDirs()`，递归发现可控根目录中的 `SKILL.md`，跳过隐藏目录、`.system`、`.tmp`、`.git`、`.next`、`node_modules` 等噪声。
- 修复：将首页设为动态渲染，避免 `next build` 预渲染时执行 bootstrap 并写入本机 skill source。
- 修复：Vitest 排除 `.claude/**`，避免仓库内临时 worktree 的测试污染当前验证。
- 通过：`npm test -- ./src/lib/skills/discover-skill-dirs.test.ts ./src/lib/skills/bootstrap-source.test.ts ./src/lib/skills/scan-all-skills.test.ts ./src/lib/server/build-overview-model.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`

## Follow-up: 首次使用默认展示本机 Agent

- [x] 明确首次使用 UX：首页默认展示本机已检测到的 Agent，而不是只展示静态 enabled 列表
- [x] 增加本机 Agent 检测 helper，基于 `skillsPath` 和 `skillDiscoveryPaths` 判断是否有可用目录或 Skill
- [x] 调整首页模型的 agent 选择策略：enabled agent + detected registry agent
- [x] 保留 Agent 管理页的显式启用/禁用能力
- [x] 增加回归测试覆盖未启用但本机存在 Skill 的 agent 会出现在首页
- [x] 运行测试、类型检查、构建和 diff 检查

### Follow-up Review

- 结果：`config/agents.json` 缺少 `customized` 标记时视为首次/默认状态，首页会自动合并本机检测到 skills 的 registry agents。
- 结果：Agent 管理页保存后写入 `customized: true`，之后严格尊重用户显式 enabledIds，避免用户禁用的 Agent 被自动加回。
- 结果：`loadAllRegistryAgents()` 也使用同一套有效 enabled 状态，设置页初次打开时会把本机检测到的 Agent 显示为已启用。
- 通过：`npm test -- ./src/lib/config/load-agents.test.ts ./src/lib/server/build-overview-model.test.ts ./src/lib/skills/discover-skill-dirs.test.ts ./src/lib/skills/bootstrap-source.test.ts ./src/lib/skills/scan-all-skills.test.ts`
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`npx tsc --noEmit`
- 通过：`git diff --check`

## Follow-up: 删除清除所有 Skill 实例

- [x] 定位 Azure skills 重启后复现的回填路径
- [x] 明确删除语义：删除这个 skill 在所有 source、agent、discovery roots 下的实例
- [x] 增加全实例删除 helper
- [x] 删除 API 改为扫描并删除所有同名实例
- [x] 增加回归测试
- [x] 运行测试、类型检查、构建和 diff 检查

### Follow-up Review

- 原因：Azure skills 仍存在于 Claude 插件 cache 的 discovery path 中；用户删除 source 后，启动 bootstrap 会把它当成缺失 skill 从插件 cache 复制回 `~/.agents/skills`。
- 结果：撤掉 tombstone 方案，删除不再表示“忽略回填”，而是删除所有已知位置的同名 skill 实例。
- 结果：新增 `removeSkillInstances()`，扫描 `~/.agents/skills`、所有 registry agent 的 `skillsPath` 与 `skillDiscoveryPaths`，删除所有 name 匹配的 skill 目录。
- 结果：`DELETE /api/sync/remove` 使用全实例删除 helper，并清理 overview model 缓存，避免 30 秒 TTL 内刷新仍看到旧数据。
- 通过：`npm test -- ./src/lib/skills/remove-skill-instances.test.ts ./src/lib/skills/bootstrap-source.test.ts ./src/lib/server/build-overview-model.test.ts`
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`npx tsc --noEmit`
- 通过：`git diff --check`

## Follow-up: 启动 Inventory 与显式 Canonical Source 边界

- [x] 移除启动阶段自动 bootstrap
- [x] 首页模型合并 source skills 与本机 Agent inventory
- [x] Agent 状态扫描支持 discovery roots 中的真实实例
- [x] 保持 `.agents/skills` 仅作为显式同步后的 canonical source
- [x] 更新回归测试覆盖首次启动不写 source、但展示本机 Agent skills
- [x] 运行测试、类型检查、构建和 diff 检查

### Follow-up Review

- 结果：`buildOverviewModel()` 不再调用 `bootstrapSourceFromAgents()`，启动首页只读 `.agents/skills` 和本机 Agent inventory，不再写入 source。
- 结果：首页展示集合改为 `scanSourceSkills()` 与 `scanAllSkills(agents)` 的 union；`.agents` 中已有记录优先，否则保留真实 Agent/plugin 来源。
- 结果：`scanAgentStates()` 支持 `skillDiscoveryPaths`，可以显示插件 cache 等 discovery roots 中的真实实例状态。
- 结果：`applySyncPlan()` 遇到 inventory source 时会先 materialize 到 `SOURCE_SKILLS_DIR/<skill>`，再从 canonical source 同步到目标 Agent。
- 结果：删除仍使用全实例删除语义，清除所有已知 source、agent、discovery roots 下的同名 skill。
- 通过：`npm test -- ./src/lib/server/build-overview-model.test.ts ./src/lib/skills/scan-agent-skills.test.ts ./src/lib/sync/apply-sync-plan.test.ts ./src/lib/skills/remove-skill-instances.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`

## 2026-05-14 专业 UI/UX 改版

### Spec

- 目标：按专业开发者工具的审美重塑项目视觉，形成统一、克制、精密的 Calm Developer Console 设计语言。
- 范围：首页 Skills 工作台、规则编辑器的共享视觉语言、全局 token、按钮/状态/表格/工具栏样式。
- 非目标：不改变后端同步语义，不新增页面，不引入重型组件库。
- 原则：
  - 表格是核心，指标和操作栏只为表格服务。
  - 高频操作显性，危险/低频操作收敛到 inspector。
  - 状态色只表达语义，不做装饰。
  - 少卡片、少阴影、少大块背景，靠间距、边框和排版建立层级。

### Tasks

- [x] 将首页顶部指标改为紧凑状态 strip
- [x] 简化表格行内操作，只保留同步和详情
- [x] 将标记自制和删除移入详情 inspector
- [x] 统一规则编辑器与首页的按钮、边框、状态语言
- [x] 收紧全局设计 token 和页面版式
- [x] 运行类型检查、测试、构建与 diff 检查
- [x] 记录复盘

### Review

- 结果：首页从指标卡堆叠改为紧凑状态 strip，视觉层级更靠近专业 data console。
- 结果：技能表格行内只保留同步和详情，标记自制与删除移动到详情 inspector，降低行内噪音。
- 结果：规则编辑器退出“深色孤岛”状态，顶部栏、按钮、状态提示与首页统一；代码编辑区保留深色以服务阅读和编辑。
- 结果：全局 token 进一步收紧，减少圆角、阴影、灰色背景层级和装饰性边框。
- 通过：`npm test`
- 通过：`npm run build`
- 通过：`npx tsc --noEmit`
- 通过：`git diff --check`

## 2026-06-16 Skill 默认不自动加标签

### Spec

- 目标：Skill 没有显式分类配置时，默认不添加任何标签/分类。
- 范围：首页 Skill board 模型中的 `categoryIds` 默认值与回归测试。
- 非目标：不移除分类管理功能，不改变用户手动编辑分类的保存和展示逻辑。
- 验证：构造一个名称/描述命中分类关键词的 Skill，确认没有手动配置时仍返回空分类；手动配置时仍保留配置值。

### Tasks

- [x] 定位自动分类入口
- [x] 修改未显式配置分类时的默认行为
- [x] 增加回归测试
- [x] 运行相关测试、类型检查和 diff 检查

### Review

- 结果：`buildSkillBoardModel()` 在没有 `config/skill-categories.json` 显式配置时，返回空 `categoryIds`，不再根据关键词自动分类。
- 结果：手动保存过的 skill 分类仍然按配置返回，不影响分类编辑和筛选。
- 通过：`npm test -- ./src/lib/server/build-skill-board-model.test.ts`
- 通过：`npx tsc --noEmit`
- 通过：`npm test`
- 通过：`git diff --check`

## 2026-06-16 Agent 管理禁用状态修复

### Spec

- 目标：设置页禁用 Agent 后，首页立即不再展示该 Agent；重新进入设置页时保持服务端保存后的启用状态。
- 范围：Agent 配置保存 API、设置页保存后的本地状态同步、主页模型缓存失效，以及对应回归测试。
- 非目标：不改变 Agent 自动发现的首次默认启用规则，不改同步/删除 skill 的业务语义。
- 验证：保存 Agent 选择后失效 overview cache；保存响应驱动设置页草稿状态；运行相关测试和类型检查。

### Tasks

- [x] 定位设置页、Agent API、首页模型之间的状态链路
- [x] 修复保存 Agent 后主页缓存未失效的问题
- [x] 修复设置页保存后草稿状态未跟随服务端返回值的问题
- [x] 增加回归测试覆盖缓存失效
- [x] 运行相关测试、类型检查和 diff 检查

### Review

- 结果：`/api/agents` 保存启用列表后会立即调用 `invalidateOverviewModelCache()`，首页下次渲染会重新读取启用 Agent。
- 结果：设置页保存成功后使用服务端返回的 Agent 列表重建 `draftEnabledIds`，避免 UI 草稿状态和落盘配置分叉。
- 通过：`npm test -- app/api/agents/route.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`

## 2026-06-16 Agent 禁用状态仍被重新开启二次排查

### Spec

- 目标：禁用任意 Agent 后，主页不展示该 Agent；重新进入设置页时该 Agent 仍保持禁用。
- 已知失败：保存后主页仍可见；再次进入设置页，被禁用 Agent 又显示为启用。
- 排查范围：`config/agents.json` 实际落盘内容、`loadAllRegistryAgents()` 启用判定、API 缓存/路由缓存、设置页 GET/POST 时序、可能的 service worker 或 client fetch 缓存。
- 验证标准：写入禁用选择后，`GET /api/agents` 返回禁用状态；`buildSkillBoardModel()` 不包含禁用 Agent；设置页重新加载不会自动恢复。

### Tasks

- [x] 检查当前 `config/agents.json` 与 registry 状态
- [x] 写测试复现旧格式配置导致检测到的 Agent 被重新开启
- [x] 写测试复现旧格式配置下 `loadAllRegistryAgents()` 只返回显式启用项
- [x] 修复配置语义或缓存语义的根因
- [x] 运行相关测试、类型检查、构建和 diff 检查

### Review

- 根因：`config/agents.json` 现有格式只有 `enabledIds`，没有 `customized`；读取逻辑把缺失 `customized` 当成未自定义，于是本机检测到有 skills 的 Agent 会被自动加回。
- 结果：存在选择文件时，旧格式 `{ "enabledIds": [...] }` 现在视为显式用户选择；只有选择文件缺失时才进入自动检测模式。
- 结果：`/api/agents` GET/POST 返回 `Cache-Control: no-store`，设置页加载 Agent 时也使用 `cache: "no-store"`。
- 结果：保存 Agent 配置后仍会失效 homepage overview cache，并用服务端返回值重建设置页草稿状态。
- 验证：在运行中的 `localhost:3000` 上临时保存 `{ enabledIds: ["claude"] }` 后，`/api/agents` 返回 `codex.enabled=false`，`/api/overview` 的 `agents` 仅包含 `claude`。
- 验证：随后恢复为 `{ enabledIds: ["claude", "codex"] }`，并写入 `customized: true` 作为显式选择标记。
- 通过：`npm test -- src/lib/config/agent-registry-store.test.ts src/lib/config/load-agents.test.ts app/api/agents/route.test.ts src/lib/server/build-skill-board-model.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`

## 2026-06-16 Agent 开启后又自动禁用三次排查

### Spec

- 目标：开启或禁用任意 Agent 后，设置页、`config/agents.json`、首页模型三者立即且持久一致。
- 已知失败：开启 Agent 后回主页不展示；回设置后该 Agent 又显示禁用。
- 新排查重点：设置页交互是否真实发送最新 enabledIds、POST 是否真实落盘、GET 是否读到同一文件、主页模型是否读同一选择。
- 修复原则：减少草稿状态分叉，必要时让每次切换直接持久化，避免“开关 UI 状态”和保存 payload 不一致。

### Tasks

- [x] 检查当前落盘 Agent 配置
- [x] 用运行中 API 复现开启一个非默认 Agent 后服务端和主页是否一致
- [x] 审查设置页开关交互和保存按钮的状态来源
- [x] 修复导致开启状态丢失的根因
- [x] 运行测试、构建和端到端 API 验证

### Review

- 根因：设置页 Agent 开关之前只是修改本地草稿，用户如果切换后直接回主页，没有点击右上角保存，开启/禁用不会落盘；回设置后又从服务端状态还原，看起来像被自动改回。
- 结果：Agent 开关改为切换即保存，POST 成功后用服务端返回值同步开关状态；右上角按钮改为“已自动保存”，只保留手动重试语义。
- 结果：开关保存中会禁用输入，避免连续点击造成请求竞态。
- 结果：新增设置页交互测试，覆盖“只点开关、不点保存”也会发送包含新 Agent 的 `enabledIds`。
- 验证：重启 `npm run dev` 到 `http://localhost:3000` 后，临时启用 Cursor，`config/agents.json` 写入 `cursor`，主页 HTML 出现 `cursor`；随后恢复为 `claude` + `codex`。
- 通过：`npm test -- src/components/settings/settings-page.test.tsx app/api/agents/route.test.ts src/lib/config/agent-registry-store.test.ts src/lib/config/load-agents.test.ts src/lib/server/build-skill-board-model.test.ts`
- 通过：`npm test`
- 通过：`npx tsc --noEmit`
- 通过：`npm run build`
- 通过：`git diff --check`
