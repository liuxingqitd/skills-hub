export type AgentRegistryEntry = {
  id: string;
  name: string;
  skillsPath: string;
  description: string;
  homepage: string;
};

export type AgentDefinition = AgentRegistryEntry & {
  enabled: boolean;
  builtin?: boolean;
};

export type EditableAgentConfig = AgentDefinition;

export type AgentPathStatus =
  | "ok"
  | "missing"
  | "not-directory"
  | "no-access"
  | "empty";

export type AgentPathValidation = {
  inputPath: string;
  resolvedPath: string;
  status: AgentPathStatus;
  skillCount: number;
  message: string;
};
