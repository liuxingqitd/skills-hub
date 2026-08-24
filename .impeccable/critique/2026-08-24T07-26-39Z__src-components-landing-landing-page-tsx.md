---
target: 首页
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-24T07-26-39Z
slug: src-components-landing-landing-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | 状态矩阵清楚，但滚动位置与外链下载过程没有反馈。 |
| 2 | Match System / Real World | 4 | Agent、SKILL.md、目录、漂移与 SHA-256 都符合开发者心智。 |
| 3 | User Control and Freedom | 3 | 桌面入口清楚；移动端隐藏页内导航和“打开工作台”。 |
| 4 | Consistency and Standards | 3 | 视觉语言统一，但首屏强调下载、结尾却把源码升为主操作。 |
| 5 | Error Prevention | 2 | 示例数据有标注；下载却落到通用 Releases，缺少平台/架构选择说明。 |
| 6 | Recognition Rather Than Recall | 4 | Agent、状态、文件名和路径都直接可见。 |
| 7 | Flexibility and Efficiency | 2 | 有下载、源码和 Web 工作台三条路径，但缺少按系统直达下载。 |
| 8 | Aesthetic and Minimalist Design | 3 | 层级与克制感优秀，但小字和低对比破坏可读性底线。 |
| 9 | Error Recovery | 2 | 外链可自然返回，但下载失败或资产选错时没有恢复说明。 |
| 10 | Help and Documentation | 1 | 没有快速上手、系统要求、资产选择或任务型文档入口。 |
| **Total** |  | **27/40** | **Acceptable — 视觉成熟，但转化和可访问性需在发布前收口。** |

## Design Specificity Verdict

**LLM assessment：强产品特异性，约 8/10。** 四个真实 Agent、SKILL.md 路径、同步/漂移/缺失矩阵、SHA-256 和全局规则编辑器形成了完整的“本地 Agent 工作台”叙事；它不是换个 Logo 就能套给其他 SaaS 的页面。冷白、深色大字、绿色强调和细边框本身仍属于开发者工具常见语汇，真正的专属性来自产品证据与构图，而不是装饰。

**Deterministic scan：** CLI 扫描 `src/components/landing/landing-page.tsx` 为 0 项；浏览器运行时检测到 39 个去重覆盖点、43 次规则事件：`low-contrast` 8 次、`undersized-ui-text` 30 次、`tiny-text` 5 次。主要根因是 9px 的“示意数据”和路径、10px 的状态/Agent/矩阵脚注，以及白字配主绿色仅 4.3:1、部分灰字配白底仅 3.6:1。30 次小字命中多数来自共享样式的重复渲染，不等于 30 个独立根因；4 个路径同时命中低对比和 tiny-text，属于规则重叠。

**Visual overlays：** 覆盖层注入成功，但子代理线程不支持把 in-app Browser 显示给用户，因此没有可靠的用户可见 `[Human]` 标签页；浏览器 console 证据与 DOM 覆盖层计数已成功读取。

## Overall Impression

这是一个明显经过设计、且懂产品的首页：第一屏就用工作台矩阵证明价值，后续用本地文件、显式同步和开源建立信任。最大机会不是变得更“炫”，而是让同一份信任在手机和下载决策的最后一步仍然成立。

## What's Working

1. **首屏用产品证明，不用空泛口号。** 工作台预览把四个 Agent、四个 Skill 与三类状态直接摆出来，迅速解释“为什么需要 Skills Hub”。
2. **视觉系统克制且统一。** 冷白表面、同步绿、细边框以及 display/body/mono 的角色分工，非常适合本地开发者工具。
3. **信任文案具体。** “不引入数据库”“不上传云端”“SHA-256”“同步前先看见差异”比泛化的“安全、隐私”更可信。

## Priority Issues

### [P1] 移动端裁掉了最关键的跨 Agent 证明

**Why it matters：** 390px 视图只看到 Skill 与 Codex 列，其余 Agent 越出窗口且没有滑动提示；产品最强差异点在手机上退化成普通 Skill 列表。

**Fix：** 为移动端改成每个 Skill 下堆叠四个 Agent 状态，或允许真实横向滚动并添加边缘渐隐与“滑动查看 4 个 Agent”提示。

**Suggested command：** `$impeccable adapt 首页`

### [P1] 小字与对比度没有达到发布底线

**Why it matters：** 浏览器检测到 39 个覆盖点；主 CTA 白字/绿色为 4.3:1，部分灰字/白底为 3.6:1，预览内大量文字只有 9–10px。低视力、缩放和普通笔记本用户都会更难读懂最重要的产品证据。

**Fix：** 将产品预览内功能性文字统一提高到至少 11–12px；加深主绿色或 CTA 文字方案以达到 4.5:1；提高搜索提示、路径和脚注的灰阶对比。用共享 token/样式一次修复，不逐个元素打补丁。

**Suggested command：** `$impeccable audit 首页`

### [P1] 下载转化路径前后不一致

**Why it matters：** 首屏主按钮承诺“下载桌面版”，却进入通用 GitHub Releases；没有 macOS/Windows、Intel/Apple Silicon 或资产选择说明。到结尾时“查看源代码”反而成为绿色主按钮，下载退为次级。

**Fix：** 若无法提供 OS 感知直链，把首屏文案改为“前往 Releases 下载”，旁边补最短的资产选择说明；结尾继续保持下载为主操作、源码为次操作。

**Suggested command：** `$impeccable clarify 首页`

### [P2] 静态预览长得像可操作产品

**Why it matters：** 筛选、搜索、同步、设置和侧栏都有真实控件外观，却由 div/span 构成且不可操作。“示意数据”只说明数据，不足以说明整个窗口是静态预览，点击无响应容易被理解为失效。

**Fix：** 明确标成“产品预览 · 不可交互”，弱化非关键控件的按钮质感；更好的方案是让筛选或一次“漂移 → 已同步”演示真正可交互。

**Suggested command：** `$impeccable clarify 首页`

### [P2] 移动端导航删得过头

**Why it matters：** 780px 以下同时隐藏页内导航与“打开工作台”，只剩品牌和 GitHub 图标；长页面只能线性滚动，Web 试用入口也消失。

**Fix：** 保留一个清晰的“打开工作台”动作，或加入精简菜单；GitHub 图标不应成为手机导航唯一动作。

**Suggested command：** `$impeccable adapt 首页`

## Persona Red Flags

**Jordan（首次接触者）：** 进入首屏后连续遇到 Agent、Skills、SKILL.md、漂移和 SHA-256，但没有一句解释 Skill 是什么或为什么要同步；他能感到专业，却可能在下载前因没有快速上手、支持 Agent 与资产选择说明而停住。静态筛选和搜索看似可点，会进一步制造误解。

**Casey（分心的移动用户）：** 44px CTA 和双列按钮很好点，但手机首屏只能看到 Codex，无法在几秒内理解跨 Agent 比较；页内导航与工作台入口消失，中断后只能重新滚动定位。

**Riley（压力测试者）：** 会立即追问 macOS Intel/Apple Silicon 与 Windows 应选哪个资产；会尝试点击预览控件并发现无响应；也会注意首屏强调下载、结尾强调源码的目标反转。

## Minor Observations

- 900ms 产品窗口入场动画使用 blur，短暂模糊了最重要的产品证明；已有 `prefers-reduced-motion` 处理是加分项。
- GitHub/下载外链新开标签，但没有离站视觉提示。
- 预览中的 Settings SVG 在可访问树中是“设置”图片却不可操作，预览语义需要统一。
- “Agent / Skills / AI agent skills”大小写与中英文混用，开发者能理解，但品牌文案可以更一致。
- 桌面导航加 GitHub 与工作台共五个目的地，首屏又追加两个 CTA；认知负荷仍低，但已经触及选择数量上限。

## Questions to Consider

- 如果首页只能优化一个结果，到底是“下载桌面版”还是“打开 Web 工作台”？
- 如果四 Agent 对照是产品最强证据，为什么移动端只允许用户看到一个 Agent？
- 静态工作台是否应该真正演示一次“漂移 → 已同步”，让用户在下载前体验因果？
- 用户允许本地工具读写 Agent 目录前，最后最需要的答案是系统兼容性、写入边界，还是恢复/回滚能力？
