"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Language, LanguagePreference } from "@/src/lib/config/settings-store";
import { loadAppSettings, saveAppSettings } from "@/src/lib/config/settings-client";
import type { Category } from "@/src/types/categories";

type TranslationValue = string | ((params: Record<string, string | number>) => string);
type TranslationMap = Record<string, TranslationValue>;

const dictionaries: Record<Language, TranslationMap> = {
  zh: {
    "common.back": "返回",
    "common.cancel": "取消",
    "common.close": "关闭",
    "common.confirm": "确认",
    "common.delete": "删除",
    "common.loading": "加载中……",
    "common.save": "保存",
    "common.saving": "保存中……",
    "common.reset": "重置",
    "common.missing": "缺失",
    "common.error": "异常",
    "common.installed": "已安装",
    "common.choose": "选择",
    "common.unknownTime": "时间未知",
    "common.today": "今天",
    "common.yesterday": "昨天",
    "common.daysAgo": ({ count }) => `${count} 天前`,
    "common.lines": ({ count }) => `${count} 行`,
    "locale.date": "zh-CN",
    "nav.skills": "Skill 管理",
    "nav.instructions": "全局规则",
    "nav.settings": "设置",
    "settings.title": "设置",
    "settings.categories": "分类管理",
    "settings.general": "通用设置",
    "settings.agents": "Agent 管理",
    "settings.language.title": "界面语言",
    "settings.language.desc": "选择客户端界面显示语言。默认跟随系统，也可以手动固定。",
    "settings.language.system": "跟随系统",
    "settings.language.zh": "中文",
    "settings.language.en": "English",
    "settings.language.saved.system": "已切换为跟随系统",
    "settings.language.saved.zh": "已切换为中文",
    "settings.language.saved.en": "Switched to English",
    "settings.general.desc": "应用级别的通用配置。",
    "settings.sync.title": "Skill 同步方式",
    "settings.sync.desc": "选择将 Skill 从数据源部署到各 Agent 目录的方式。切换后新操作立即生效，已同步的 Skill 不受影响。",
    "settings.sync.copy": "拷贝文件夹",
    "settings.sync.copyDesc": "将 Skill 完整复制到每个 Agent 目录，各副本独立，磁盘占用较大但无耦合。",
    "settings.sync.symlink": "软链接",
    "settings.sync.symlinkDesc": "创建指向数据源的符号链接，所有 Agent 共享同一份文件，节省磁盘空间。",
    "settings.sync.saved.copy": "已切换为拷贝模式",
    "settings.sync.saved.symlink": "已切换为软链接模式",
    "settings.saveFailed": "保存失败",
    "settings.categories.desc": ({ count }) => `管理 Skill 的功能分类，共 ${count} 个分类。每个 Skill 可关联多个分类，方便按功能快速筛选。`,
    "settings.categories.restore": "恢复预设",
    "settings.categories.new": "新建分类",
    "settings.categories.emptyTitle": "暂无分类",
    "settings.categories.emptyDesc": "点击“新建分类”开始创建，或恢复预设分类。",
    "settings.categories.preset": "预设",
    "settings.categories.noDesc": "暂无描述",
    "settings.categories.added": ({ name }) => `已添加分类「${name}」`,
    "settings.categories.updated": ({ name }) => `已更新分类「${name}」`,
    "settings.categories.deleted": "已删除分类",
    "settings.categories.restored": "已恢复预设分类",
    "settings.categories.restoreFailed": "恢复失败，已重新加载分类状态",
    "settings.categories.addFailed": "添加失败",
    "settings.categories.updateFailed": "更新失败",
    "settings.categories.deleteFailed": "删除失败",
    "settings.categories.deleteTitle": ({ name }) => `删除分类「${name}」`,
    "settings.categories.deleteText": "确定要删除此分类吗？所有关联的 Skill 将不再标记为此分类。",
    "settings.categories.restoreTitle": "恢复预设分类",
    "settings.categories.restoreText": "将重置所有分类为系统预设分类。自定义分类将被移除。确定继续？",
    "settings.agents.desc": "管理所有 Coding Agent。启用的 Agent 将显示在首页并参与 Skill 同步；Skill 文件夹路径以这里选择的目录为准。",
    "settings.agents.new": "新增 Agent",
    "settings.agents.saved": "Agent 配置已保存",
    "settings.agents.autoSaved": "已自动保存",
    "settings.agents.emptyTitle": "暂无 Agent",
    "settings.agents.emptyDesc": "Agent 注册表为空，请检查配置。",
    "settings.agents.builtin": "内置",
    "settings.agents.custom": "自定义 Agent",
    "settings.agents.website": "官网",
    "settings.agents.pathPlaceholder": "选择 Skill 文件夹路径",
    "settings.agents.chooseFolder": "选择文件夹",
    "settings.agents.checkPath": "检测路径",
    "settings.agents.checking": "检测中……",
    "settings.agents.notChecked": "尚未检测",
    "settings.agents.checkFailed": "检测失败",
    "settings.agents.enabled": "已启用",
    "settings.agents.disabled": "已禁用",
    "settings.agents.deleteCustom": "删除自定义 Agent",
    "settings.agents.cannotDeleteBuiltin": "内置 Agent 不能删除，可以选择禁用",
    "settings.agents.pickerFailed": "无法打开文件夹选择器，请手动输入路径",
    "settings.agents.deleteTitle": ({ name }) => `删除 Agent「${name}」`,
    "settings.agents.deleteText": "确定要删除这个自定义 Agent 吗？已安装在该目录下的 Skill 文件不会被删除。",
    "settings.agentModal.title": "新增 Agent",
    "settings.agentModal.desc": "添加一个自定义 Agent，并指定它读取 Skill 的文件夹。",
    "settings.agentModal.name": "Agent 名称",
    "settings.agentModal.namePlaceholder": "例如：My Local Agent",
    "settings.agentModal.path": "Skill 文件夹路径",
    "settings.agentModal.nameRequired": "请输入 Agent 名称",
    "settings.agentModal.pathRequired": "请选择或输入 Skill 文件夹路径",
    "settings.agentModal.add": "添加 Agent",
    "settings.categoryModal.addTitle": "新建分类",
    "settings.categoryModal.editTitle": "编辑分类",
    "settings.categoryModal.addDesc": "添加一个新的 Skill 分类，方便按功能组织所有 Skill。",
    "settings.categoryModal.editDesc": "修改分类的名称、描述、图标或颜色。",
    "settings.categoryModal.name": "名称",
    "settings.categoryModal.desc": "描述",
    "settings.categoryModal.icon": "图标",
    "settings.categoryModal.color": "标识色",
    "settings.categoryModal.namePlaceholder": "例如：代码审查、自动化流程",
    "settings.categoryModal.descPlaceholder": "简要描述此分类包含哪些类型的 Skill……",
    "settings.categoryModal.nameRequired": "请输入分类名称",
    "settings.categoryModal.nameTooLong": "名称不超过 20 个字符",
    "settings.categoryModal.add": "添加分类",
    "settings.categoryModal.save": "保存修改",
    "categories.cat-code-review.name": "代码审查",
    "categories.cat-code-review.desc": "代码差异审查、逻辑缺陷检测、安全审计",
    "categories.cat-search.name": "搜索检索",
    "categories.cat-search.desc": "网络搜索、文档检索、信息提取",
    "categories.cat-content.name": "内容生成",
    "categories.cat-content.desc": "文本、图片、演示文稿等内容创作",
    "categories.cat-data.name": "数据分析",
    "categories.cat-data.desc": "数据探索、统计分析、可视化",
    "categories.cat-dev-tools.name": "开发工具",
    "categories.cat-dev-tools.desc": "代码生成、重构、开发流程辅助",
    "categories.cat-test.name": "测试质量",
    "categories.cat-test.desc": "自动化测试、质量检查、覆盖率",
    "categories.cat-devops.name": "部署运维",
    "categories.cat-devops.desc": "CI/CD、部署管理、运行监控",
    "dashboard.search": "搜索 Skill……",
    "dashboard.install": "安装",
    "dashboard.installing": "安装中……",
    "dashboard.syncAll": "同步全部",
    "dashboard.sync": "同步",
    "dashboard.syncing": "同步中……",
    "dashboard.allSkills": "全部 Skill",
    "dashboard.synced": ({ count }) => `${count} 已同步`,
    "dashboard.connectedAgents": "连接 Agent",
    "dashboard.onlineAgents": ({ count }) => `${count} 个在线`,
    "dashboard.pendingSync": "待同步",
    "dashboard.needsSyncChanges": "需同步变更",
    "dashboard.allSynced": "全部已同步",
    "dashboard.sourceDistribution": "来源分布",
    "dashboard.sourceCounts": ({ custom, open }) => `自研 ${custom} · 开源 ${open}`,
    "dashboard.filterAll": "全部",
    "dashboard.filterBroken": "异常",
    "dashboard.allCategories": "全部分类",
    "dashboard.custom": "自研",
    "dashboard.opensource": "开源",
    "dashboard.sectionSub": ({ count }) => `共 ${count} 个，管理已安装的 Skill`,
    "dashboard.cardView": "卡片视图",
    "dashboard.listView": "列表视图",
    "dashboard.emptyTitle": "没有找到匹配的 Skill",
    "dashboard.emptyDesc": "试试调整搜索关键词",
    "dashboard.desktopLoadFailed": "桌面数据加载失败，请重新打开应用。",
    "dashboard.syncFailed": "同步失败",
    "dashboard.syncDone": ({ count }) => `同步完成（${count} 项）`,
    "dashboard.noSyncNeeded": "无需同步",
    "dashboard.installDone": ({ names }) => `已安装 ${names}`,
    "dashboard.installFailed": "安装失败",
    "dashboard.deleteDone": ({ name }) => `已删除 ${name}`,
    "dashboard.deleteFailed": "删除失败",
    "dashboard.markCustom": "标记自研",
    "dashboard.unmarkCustom": "取消自研",
    "dashboard.markedCustom": "已标记为自研",
    "dashboard.unmarkedCustom": "已取消自研标记",
    "dashboard.updateFailed": "更新失败",
    "dashboard.categoryUpdated": "分类已更新",
    "dashboard.categoryUpdateFailed": "更新分类失败",
    "dashboard.notFoundSkillMd": "未找到 SKILL.md。",
    "dashboard.installResult": ({ installed, skipped, failed }) => `已安装 ${installed} · 跳过 ${skipped} · 失败 ${failed}`,
    "dashboard.installModal.title": "通过链接安装 Skill",
    "dashboard.installModal.desc": "粘贴 GitHub 或市场链接，自动安装对应的 Skill",
    "dashboard.deleteTitle": ({ name }) => `删除「${name}」`,
    "dashboard.deleteText": "此操作将从所有 Agent 及源目录中彻底删除此 Skill，不可恢复。",
    "dashboard.syncToAgent": "同步到 Agent",
    "dashboard.sourceFile": "源文件",
    "dashboard.agentStatus": "Agent 安装状态",
    "dashboard.categories": "分类",
    "dashboard.uncategorized": "暂未分类",
    "dashboard.editCategories": "编辑分类",
    "dashboard.skillContent": "Skill 内容",
    "dashboard.deleteSkill": "删除 Skill",
    "editor.title": "全局规则编辑器",
    "editor.saveFailed": "保存失败",
    "editor.loadFailed": "加载失败",
    "editor.pathSaveFailed": "路径保存失败",
    "editor.pickerFailed": "无法打开文件选择器，请手动输入路径",
    "editor.savedToast": ({ title }) => `${title} 已保存`,
    "editor.pathUpdated": "规则文件路径已更新",
    "editor.pathReset": "规则文件路径已重置",
    "editor.files": "规则文件",
    "editor.noEditableFile": "没有可编辑的文件",
    "editor.unsaved": "● 未保存",
    "editor.saved": "✓ 已保存",
    "editor.placeholder": "在此编辑文件内容……",
    "editor.emptyContent": "暂无内容",
    "editor.pathPlaceholder": "全局规则文件路径",
    "editor.chooseFile": "选择文件",
    "editor.applying": "应用中……",
    "editor.applyPath": "应用路径",
    "editor.errorTitle": "全局规则加载失败",
    "editor.errorDesc": "页面渲染时遇到异常，请重试。若问题持续出现，可以打开开发者控制台查看详细错误。",
    "editor.reload": "重新加载",
  },
  en: {
    "common.back": "Back",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.saving": "Saving...",
    "common.reset": "Reset",
    "common.missing": "Missing",
    "common.error": "Error",
    "common.installed": "Installed",
    "common.choose": "Choose",
    "common.unknownTime": "Unknown time",
    "common.today": "Today",
    "common.yesterday": "Yesterday",
    "common.daysAgo": ({ count }) => `${count} days ago`,
    "common.lines": ({ count }) => `${count} lines`,
    "locale.date": "en-US",
    "nav.skills": "Skills",
    "nav.instructions": "Global Rules",
    "nav.settings": "Settings",
    "settings.title": "Settings",
    "settings.categories": "Categories",
    "settings.general": "General",
    "settings.agents": "Agents",
    "settings.language.title": "Interface Language",
    "settings.language.desc": "Choose the client UI language. By default it follows your system, or you can pin a language.",
    "settings.language.system": "Follow system",
    "settings.language.zh": "中文",
    "settings.language.en": "English",
    "settings.language.saved.system": "Following system language",
    "settings.language.saved.zh": "Switched to Chinese",
    "settings.language.saved.en": "Switched to English",
    "settings.general.desc": "Application-level preferences.",
    "settings.sync.title": "Skill Sync Mode",
    "settings.sync.desc": "Choose how Skills are deployed from the source into each Agent directory. New operations use the new mode immediately; existing synced Skills are unchanged.",
    "settings.sync.copy": "Copy folders",
    "settings.sync.copyDesc": "Copy the full Skill into every Agent directory. Copies are independent and use more disk space.",
    "settings.sync.symlink": "Symbolic links",
    "settings.sync.symlinkDesc": "Create links to the source so all Agents share one copy and save disk space.",
    "settings.sync.saved.copy": "Switched to copy mode",
    "settings.sync.saved.symlink": "Switched to symlink mode",
    "settings.saveFailed": "Save failed",
    "settings.categories.desc": ({ count }) => `Manage functional categories for Skills. ${count} categories total.`,
    "settings.categories.restore": "Restore presets",
    "settings.categories.new": "New category",
    "settings.categories.emptyTitle": "No categories",
    "settings.categories.emptyDesc": "Create a category or restore the presets.",
    "settings.categories.preset": "Preset",
    "settings.categories.noDesc": "No description",
    "settings.categories.added": ({ name }) => `Added category "${name}"`,
    "settings.categories.updated": ({ name }) => `Updated category "${name}"`,
    "settings.categories.deleted": "Category deleted",
    "settings.categories.restored": "Preset categories restored",
    "settings.categories.restoreFailed": "Restore failed. Categories were reloaded.",
    "settings.categories.addFailed": "Add failed",
    "settings.categories.updateFailed": "Update failed",
    "settings.categories.deleteFailed": "Delete failed",
    "settings.categories.deleteTitle": ({ name }) => `Delete category "${name}"`,
    "settings.categories.deleteText": "Delete this category? Skills linked to it will no longer show this category.",
    "settings.categories.restoreTitle": "Restore Presets",
    "settings.categories.restoreText": "Reset categories to the system presets. Custom categories will be removed.",
    "settings.agents.desc": "Manage Coding Agents. Enabled Agents appear on the dashboard and participate in Skill sync. Skill folders use the paths configured here.",
    "settings.agents.new": "New Agent",
    "settings.agents.saved": "Agent settings saved",
    "settings.agents.autoSaved": "Auto-saved",
    "settings.agents.emptyTitle": "No Agents",
    "settings.agents.emptyDesc": "The Agent registry is empty. Check the configuration.",
    "settings.agents.builtin": "Built-in",
    "settings.agents.custom": "Custom Agent",
    "settings.agents.website": "Website",
    "settings.agents.pathPlaceholder": "Choose Skill folder path",
    "settings.agents.chooseFolder": "Choose folder",
    "settings.agents.checkPath": "Check path",
    "settings.agents.checking": "Checking...",
    "settings.agents.notChecked": "Not checked",
    "settings.agents.checkFailed": "Check failed",
    "settings.agents.enabled": "Enabled",
    "settings.agents.disabled": "Disabled",
    "settings.agents.deleteCustom": "Delete custom Agent",
    "settings.agents.cannotDeleteBuiltin": "Built-in Agents cannot be deleted. Disable them instead.",
    "settings.agents.pickerFailed": "Could not open the folder picker. Enter the path manually.",
    "settings.agents.deleteTitle": ({ name }) => `Delete Agent "${name}"`,
    "settings.agents.deleteText": "Delete this custom Agent? Skill files already in that directory will not be removed.",
    "settings.agentModal.title": "New Agent",
    "settings.agentModal.desc": "Add a custom Agent and point it at its Skill folder.",
    "settings.agentModal.name": "Agent name",
    "settings.agentModal.namePlaceholder": "For example: My Local Agent",
    "settings.agentModal.path": "Skill folder path",
    "settings.agentModal.nameRequired": "Enter an Agent name",
    "settings.agentModal.pathRequired": "Choose or enter a Skill folder path",
    "settings.agentModal.add": "Add Agent",
    "settings.categoryModal.addTitle": "New Category",
    "settings.categoryModal.editTitle": "Edit Category",
    "settings.categoryModal.addDesc": "Add a Skill category to organize Skills by function.",
    "settings.categoryModal.editDesc": "Update the category name, description, icon, or color.",
    "settings.categoryModal.name": "Name",
    "settings.categoryModal.desc": "Description",
    "settings.categoryModal.icon": "Icon",
    "settings.categoryModal.color": "Color",
    "settings.categoryModal.namePlaceholder": "For example: Code review, Automation",
    "settings.categoryModal.descPlaceholder": "Briefly describe which Skills belong here...",
    "settings.categoryModal.nameRequired": "Enter a category name",
    "settings.categoryModal.nameTooLong": "Name must be 20 characters or fewer",
    "settings.categoryModal.add": "Add category",
    "settings.categoryModal.save": "Save changes",
    "categories.cat-code-review.name": "Code Review",
    "categories.cat-code-review.desc": "Code diff review, logic defect detection, and security audits",
    "categories.cat-search.name": "Search & Retrieval",
    "categories.cat-search.desc": "Web search, document retrieval, and information extraction",
    "categories.cat-content.name": "Content Creation",
    "categories.cat-content.desc": "Text, image, presentation, and other content creation",
    "categories.cat-data.name": "Data Analysis",
    "categories.cat-data.desc": "Data exploration, statistical analysis, and visualization",
    "categories.cat-dev-tools.name": "Developer Tools",
    "categories.cat-dev-tools.desc": "Code generation, refactoring, and development workflow support",
    "categories.cat-test.name": "Testing & Quality",
    "categories.cat-test.desc": "Automated tests, quality checks, and coverage",
    "categories.cat-devops.name": "Deployment & Ops",
    "categories.cat-devops.desc": "CI/CD, deployment management, and runtime monitoring",
    "dashboard.search": "Search Skills...",
    "dashboard.install": "Install",
    "dashboard.installing": "Installing...",
    "dashboard.syncAll": "Sync all",
    "dashboard.sync": "Sync",
    "dashboard.syncing": "Syncing...",
    "dashboard.allSkills": "All Skills",
    "dashboard.synced": ({ count }) => `${count} synced`,
    "dashboard.connectedAgents": "Connected Agents",
    "dashboard.onlineAgents": ({ count }) => `${count} online`,
    "dashboard.pendingSync": "Pending Sync",
    "dashboard.needsSyncChanges": "Changes need sync",
    "dashboard.allSynced": "All synced",
    "dashboard.sourceDistribution": "Source Mix",
    "dashboard.sourceCounts": ({ custom, open }) => `Custom ${custom} · Open source ${open}`,
    "dashboard.filterAll": "All",
    "dashboard.filterBroken": "Broken",
    "dashboard.allCategories": "All categories",
    "dashboard.custom": "Custom",
    "dashboard.opensource": "Open source",
    "dashboard.sectionSub": ({ count }) => `${count} total, manage installed Skills`,
    "dashboard.cardView": "Card view",
    "dashboard.listView": "List view",
    "dashboard.emptyTitle": "No matching Skills",
    "dashboard.emptyDesc": "Try a different search term",
    "dashboard.desktopLoadFailed": "Desktop data failed to load. Reopen the app.",
    "dashboard.syncFailed": "Sync failed",
    "dashboard.syncDone": ({ count }) => `Sync complete (${count} items)`,
    "dashboard.noSyncNeeded": "Nothing to sync",
    "dashboard.installDone": ({ names }) => `Installed ${names}`,
    "dashboard.installFailed": "Install failed",
    "dashboard.deleteDone": ({ name }) => `Deleted ${name}`,
    "dashboard.deleteFailed": "Delete failed",
    "dashboard.markCustom": "Mark custom",
    "dashboard.unmarkCustom": "Unmark custom",
    "dashboard.markedCustom": "Marked as custom",
    "dashboard.unmarkedCustom": "Removed custom mark",
    "dashboard.updateFailed": "Update failed",
    "dashboard.categoryUpdated": "Categories updated",
    "dashboard.categoryUpdateFailed": "Category update failed",
    "dashboard.notFoundSkillMd": "SKILL.md not found.",
    "dashboard.installResult": ({ installed, skipped, failed }) => `Installed ${installed} · Skipped ${skipped} · Failed ${failed}`,
    "dashboard.installModal.title": "Install Skill from Link",
    "dashboard.installModal.desc": "Paste a GitHub or marketplace link to install the matching Skill.",
    "dashboard.deleteTitle": ({ name }) => `Delete "${name}"`,
    "dashboard.deleteText": "This permanently deletes the Skill from all Agents and the source directory.",
    "dashboard.syncToAgent": "Sync to Agent",
    "dashboard.sourceFile": "Source file",
    "dashboard.agentStatus": "Agent install status",
    "dashboard.categories": "Categories",
    "dashboard.uncategorized": "Uncategorized",
    "dashboard.editCategories": "Edit categories",
    "dashboard.skillContent": "Skill content",
    "dashboard.deleteSkill": "Delete Skill",
    "editor.title": "Global Rules Editor",
    "editor.saveFailed": "Save failed",
    "editor.loadFailed": "Load failed",
    "editor.pathSaveFailed": "Path save failed",
    "editor.pickerFailed": "Could not open the file picker. Enter the path manually.",
    "editor.savedToast": ({ title }) => `${title} saved`,
    "editor.pathUpdated": "Rule file path updated",
    "editor.pathReset": "Rule file path reset",
    "editor.files": "Rule Files",
    "editor.noEditableFile": "No editable files",
    "editor.unsaved": "● Unsaved",
    "editor.saved": "✓ Saved",
    "editor.placeholder": "Edit file content here...",
    "editor.emptyContent": "No content",
    "editor.pathPlaceholder": "Global rule file path",
    "editor.chooseFile": "Choose file",
    "editor.applying": "Applying...",
    "editor.applyPath": "Apply path",
    "editor.errorTitle": "Global rules failed to load",
    "editor.errorDesc": "The page hit an error while rendering. Try again, or check the developer console if it keeps happening.",
    "editor.reload": "Reload",
  },
};

type I18nContextValue = {
  language: Language;
  languagePreference: LanguagePreference;
  isLanguageReady: boolean;
  setLanguage: (language: LanguagePreference) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");
  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreference>("system");
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLanguage() {
      try {
        const settings = await loadAppSettings();
        const nextPreference = normalizeLanguagePreference(settings.language);
        const nextLanguage = resolveLanguage(nextPreference);
        if (cancelled) return;
        setLanguagePreferenceState(nextPreference);
        setLanguageState(nextLanguage);
        setDocumentLanguage(nextLanguage);
        setIsLanguageReady(true);
      } catch {
        const nextLanguage = detectBrowserLanguage();
        if (cancelled) return;
        setLanguagePreferenceState("system");
        setLanguageState(nextLanguage);
        setDocumentLanguage(nextLanguage);
        setIsLanguageReady(true);
      }
    }

    void loadLanguage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (languagePreference !== "system") return;

    function handleLanguageChange() {
      const nextLanguage = detectBrowserLanguage();
      setLanguageState(nextLanguage);
      setDocumentLanguage(nextLanguage);
    }

    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, [languagePreference]);

  const updateLanguage = useCallback(async (nextPreference: LanguagePreference) => {
    const nextLanguage = resolveLanguage(nextPreference);
    setLanguagePreferenceState(nextPreference);
    setLanguageState(nextLanguage);
    setDocumentLanguage(nextLanguage);
    await saveLanguage(nextPreference);
  }, []);

  const translate = useCallback((key: string, params: Record<string, string | number> = {}) => {
    const value = dictionaries[language][key] ?? dictionaries.zh[key] ?? key;
    return typeof value === "function" ? value(params) : value;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    languagePreference,
    isLanguageReady,
    setLanguage: updateLanguage,
    t: translate,
  }), [isLanguageReady, language, languagePreference, translate, updateLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}

export function getLocalizedCategory(
  category: Category,
  t: I18nContextValue["t"]
): Pick<Category, "name" | "desc"> {
  if (!category.isPreset) {
    return { name: category.name, desc: category.desc };
  }

  return {
    name: translateWithFallback(t, `categories.${category.id}.name`, category.name),
    desc: translateWithFallback(t, `categories.${category.id}.desc`, category.desc),
  };
}

function translateWithFallback(
  t: I18nContextValue["t"],
  key: string,
  fallback: string
) {
  const value = t(key);
  return value === key ? fallback : value;
}

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "zh";
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((language) => language.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

function resolveLanguage(languagePreference: LanguagePreference): Language {
  return languagePreference === "system" ? detectBrowserLanguage() : languagePreference;
}

function normalizeLanguagePreference(language: unknown): LanguagePreference {
  return language === "zh" || language === "en" || language === "system" ? language : "system";
}

function setDocumentLanguage(language: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
}

async function saveLanguage(language: LanguagePreference) {
  await saveAppSettings({ language });
}
