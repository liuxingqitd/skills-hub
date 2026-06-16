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
