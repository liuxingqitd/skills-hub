import { invokeTauri, isTauriRuntime } from "@/src/lib/desktop/tauri-runtime";
import type { AgentDefinition, AgentPathValidation } from "@/src/types/agents";

export async function loadAgentDefinitions(): Promise<AgentDefinition[]> {
  if (isTauriRuntime()) {
    return invokeTauri<AgentDefinition[]>("get_agents");
  }

  const res = await fetch("/api/agents", { cache: "no-store" });
  if (!res.ok) throw new Error(`加载 Agent 失败：${res.status}`);
  return (await res.json()) as AgentDefinition[];
}

export async function saveAgentDefinitions(
  agents: AgentDefinition[]
): Promise<AgentDefinition[]> {
  if (isTauriRuntime()) {
    return invokeTauri<AgentDefinition[]>("save_agents_config", { input: { agents } });
  }

  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agents }),
  });
  if (!res.ok) throw new Error(`保存 Agent 失败：${res.status}`);
  return (await res.json()) as AgentDefinition[];
}

export async function validateAgentSkillsPath(path: string): Promise<AgentPathValidation> {
  if (isTauriRuntime()) {
    return invokeTauri<AgentPathValidation>("validate_agent_path", { input: { path } });
  }

  const res = await fetch("/api/agents/validate-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) throw new Error(`检测路径失败：${res.status}`);
  return (await res.json()) as AgentPathValidation;
}
