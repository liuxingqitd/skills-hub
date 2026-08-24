import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleMinus,
  Download,
  FileCode2,
  Folder,
  Github,
  LayoutGrid,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";

const agents = [
  { id: "codex", name: "Codex" },
  { id: "claude", name: "Claude Code" },
  { id: "cursor", name: "Cursor" },
  { id: "trae", name: "Trae" },
] as const;

const rows = [
  {
    name: "impeccable",
    path: "skills/impeccable/SKILL.md",
    states: ["synced", "synced", "drift", "synced"],
  },
  {
    name: "skill-creator",
    path: "skills/skill-creator/SKILL.md",
    states: ["synced", "missing", "synced", "drift"],
  },
  {
    name: "browser-control",
    path: "skills/browser-control/SKILL.md",
    states: ["drift", "synced", "missing", "synced"],
  },
  {
    name: "humanizer-zh",
    path: "skills/humanizer-zh/SKILL.md",
    states: ["synced", "drift", "synced", "missing"],
  },
] as const;

type SyncState = (typeof rows)[number]["states"][number];

function Status({ state }: { state: SyncState }) {
  if (state === "synced") {
    return (
      <span className="landing-status landing-status--synced">
        <Check size={12} aria-hidden="true" /> 已同步
      </span>
    );
  }

  if (state === "drift") {
    return (
      <span className="landing-status landing-status--drift">
        <TriangleAlert size={12} aria-hidden="true" /> 有漂移
      </span>
    );
  }

  return (
    <span className="landing-status landing-status--missing">
      <CircleMinus size={12} aria-hidden="true" /> 缺失
    </span>
  );
}

function AgentMark({ id, name }: { id: string; name: string }) {
  return (
    <span className="landing-agent">
      <span className="landing-agent__icon">
        <img src={`/icons/${id}.svg`} alt="" width="18" height="18" />
      </span>
      <span>{name}</span>
    </span>
  );
}

function ProductWindow() {
  return (
    <div className="landing-product-window" aria-label="Skills Hub 跨 Agent 同步工作台预览">
      <div className="landing-product-topbar">
        <div className="landing-product-wordmark">
          <span className="landing-mini-mark" aria-hidden="true">
            <span />
          </span>
          Skills Hub
        </div>
        <div className="landing-product-path">
          <Folder size={14} aria-hidden="true" /> ~/Skills Hub
          <ChevronRight size={12} aria-hidden="true" />
        </div>
        <div className="landing-local-mode">
          <span aria-hidden="true" /> 本地模式
        </div>
        <Settings size={16} aria-label="设置" />
      </div>

      <div className="landing-product-body">
        <aside className="landing-product-sidebar" aria-label="产品导航预览">
          <div className="landing-product-nav landing-product-nav--active">
            <LayoutGrid size={15} aria-hidden="true" /> 总览
          </div>
          <div className="landing-product-nav">
            <FileCode2 size={15} aria-hidden="true" /> Skills
          </div>
          <div className="landing-product-nav">
            <SlidersHorizontal size={15} aria-hidden="true" /> Agents
          </div>
          <div className="landing-product-nav">
            <RefreshCw size={15} aria-hidden="true" /> 同步
          </div>
          <div className="landing-product-nav landing-product-nav--rules">
            <FileCode2 size={15} aria-hidden="true" /> 全局规则
          </div>
        </aside>

        <div className="landing-workbench">
          <div className="landing-workbench-heading">
            <div>
              <h2>Skills 工作台</h2>
              <p>比较源文件与每个 Agent 的安装状态</p>
            </div>
            <span className="landing-sync-button" aria-hidden="true">
              <RefreshCw size={14} aria-hidden="true" /> 同步所选
            </span>
          </div>

          <div className="landing-table-tools">
            <div className="landing-segmented" aria-label="状态筛选预览">
              <span className="is-active">全部</span>
              <span>需同步</span>
              <span>有差异</span>
            </div>
            <div className="landing-search">
              <Search size={14} aria-hidden="true" /> 搜索 Skills
            </div>
          </div>

          <div className="landing-skill-matrix">
            <span className="landing-preview-note">示意数据</span>
            <div className="landing-matrix-row landing-matrix-row--head">
              <div>Skill</div>
              {agents.map((agent) => (
                <div key={agent.id}>
                  <AgentMark {...agent} />
                </div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="landing-matrix-row" key={row.name}>
                <div className="landing-skill-name">
                  <FileCode2 size={15} aria-hidden="true" />
                  <span>
                    <strong>{row.name}</strong>
                    <small>{row.path}</small>
                  </span>
                  <code>SKILL.md</code>
                </div>
                {row.states.map((state, index) => (
                  <div key={`${row.name}-${agents[index].id}`}>
                    <Status state={state} />
                  </div>
                ))}
              </div>
            ))}
            <div className="landing-matrix-footer">
              <span>4 个 Skills · 4 个 Agents</span>
              <span><Check size={12} /> 已同步</span>
              <span><TriangleAlert size={12} /> 有漂移</span>
              <span><CircleMinus size={12} /> 缺失</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="主导航">
        <a href="#top" className="landing-brand" aria-label="Skills Hub 首页">
          <span className="landing-brand__mark" aria-hidden="true"><span /></span>
          Skills Hub
        </a>
        <div className="landing-nav__links">
          <a href="#features">功能</a>
          <a href="#local-first">本地优先</a>
          <a href="#open-source">开源</a>
        </div>
        <div className="landing-nav__actions">
          <a
            className="landing-icon-link"
            href="https://github.com/liuxingqitd/skills-hub"
            target="_blank"
            rel="noreferrer"
            aria-label="在 GitHub 查看 Skills Hub"
          >
            <Github size={19} />
          </a>
          <Link href={"/dashboard" as Route} className="landing-open-app">
            打开工作台 <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="landing-hero__copy">
          <h1>Skills Hub</h1>
          <h2>把所有 Agent 的 Skills，放回同一个工作台</h2>
          <p>
            在一个本地工作台中浏览、比较与同步 Skills。文件系统就是数据源，
            每次差异和变更都清楚可见。
          </p>
          <div className="landing-hero__actions">
            <a
              className="landing-cta landing-cta--primary"
              href="https://github.com/liuxingqitd/skills-hub/releases"
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} /> 下载桌面版
            </a>
            <a
              className="landing-cta landing-cta--secondary"
              href="https://github.com/liuxingqitd/skills-hub"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} /> 查看 GitHub
            </a>
          </div>
          <div className="landing-hero__facts" aria-label="产品信息">
            <span><Check size={13} /> 本地优先</span>
            <span><Check size={13} /> MIT 开源</span>
            <span>macOS 与 Windows</span>
          </div>
        </div>

        <ProductWindow />
      </section>

      <section className="landing-principle" id="local-first">
        <div className="landing-principle__statement">
          <h2>你的文件，始终是唯一可信源。</h2>
        </div>
        <div className="landing-principle__detail">
          <p>
            Skills Hub 直接读取本机的 Agent 目录和 <code>SKILL.md</code>，
            不引入数据库，也不把技能上传到云端。
          </p>
          <div className="landing-proof-list">
            <span><strong>SHA-256</strong> 比较源与安装副本</span>
            <span><strong>显式操作</strong> 同步前先看见差异</span>
            <span><strong>可配置</strong> Agent 与路径不被写死</span>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading">
          <h2>跨 Agent 的重复工作，<br />现在只有一个入口。</h2>
          <p>
            从发现差异到修复副本，再到维护全局规则，整个流程都围绕本地文件展开。
          </p>
        </div>

        <article className="landing-feature landing-feature--sync">
          <div className="landing-feature__copy">
            <h3>先比较，再改变。</h3>
            <p>
              同步、缺失、漂移、冲突和孤立副本被清楚区分。缺失或漂移可修复，
              冲突会跳过，孤立副本始终由你决定是否清理。
            </p>
          </div>
          <div className="landing-sync-map" aria-label="从源 Skill 同步到多个 Agent 的示意图">
            <span className="landing-preview-note">示意数据</span>
            <div className="landing-source-node">
              <span className="landing-source-node__icon"><FileCode2 size={20} /></span>
              <span><strong>skill-creator</strong><code>~/skills/skill-creator/SKILL.md</code></span>
              <em>源</em>
            </div>
            <div className="landing-map-lines" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="landing-agent-targets">
              {agents.map((agent, index) => (
                <div key={agent.id}>
                  <AgentMark {...agent} />
                  <Status state={index === 2 ? "drift" : index === 3 ? "missing" : "synced"} />
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="landing-feature landing-feature--editor">
          <div className="landing-editor-preview" aria-label="全局规则编辑器预览">
            <span className="landing-preview-note">示意数据</span>
            <div className="landing-editor-files">
              <strong>全局规则</strong>
              <span className="is-active"><img src="/icons/codex.svg" alt="" /> AGENTS.md</span>
              <span><img src="/icons/claude.svg" alt="" /> CLAUDE.md</span>
              <span><img src="/icons/cursor.svg" alt="" /> Rules</span>
            </div>
            <pre><span># Working agreement</span>{`\n\n`}## Quality{`\n`}- Verify before done{`\n`}- Keep changes focused{`\n`}- Prefer root-cause fixes{`\n\n`}## Skills{`\n`}- Reuse shared skills</pre>
          </div>
          <div className="landing-feature__copy">
            <h3>不同 Agent，一套维护方式。</h3>
            <p>
              定位并编辑每个 Agent 的全局规则文件，实时预览内容，保存前保留明确边界。
            </p>
          </div>
        </article>

        <article className="landing-feature landing-feature--install">
          <div className="landing-feature__copy">
            <h3>从仓库或本地路径，直接发现 Skills。</h3>
            <p>
              支持 GitHub、SSH 与本地目录，自动发现包含 <code>SKILL.md</code> 的技能，
              再用分类和标签整理你的库。
            </p>
          </div>
          <div className="landing-install-preview">
            <span className="landing-preview-note">示意数据</span>
            <div className="landing-install-field">
              <span>来源</span>
              <code>github.com/example/agent-skills</code>
              <span className="landing-install-action" aria-hidden="true">扫描</span>
            </div>
            <div className="landing-discovery-row">
              <FileCode2 size={18} />
              <span><strong>3 个 Skills 已发现</strong><small>review · testing · release</small></span>
              <Check size={16} />
            </div>
          </div>
        </article>
      </section>

      <section className="landing-open-source" id="open-source">
        <div>
          <Github size={28} aria-hidden="true" />
          <h2>本地工具，也应该保持开放。</h2>
          <p>Skills Hub 基于 MIT 协议开源。检查代码、提交改进，或按自己的 Agent 目录扩展它。</p>
        </div>
        <div className="landing-open-source__actions">
          <a href="https://github.com/liuxingqitd/skills-hub" target="_blank" rel="noreferrer">
            查看源代码 <ArrowRight size={15} />
          </a>
          <a href="https://github.com/liuxingqitd/skills-hub/releases" target="_blank" rel="noreferrer">
            下载最新版本
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <a href="#top" className="landing-brand">
          <span className="landing-brand__mark" aria-hidden="true"><span /></span>
          Skills Hub
        </a>
        <p>一个本地 AI agent skills 管理工作台。</p>
        <span>MIT License</span>
      </footer>
    </main>
  );
}
