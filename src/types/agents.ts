export type AgentRegistryEntry = {
  id: string;
  name: string;
  skillsPath: string;
  description: string;
  homepage: string;
};

export type AgentDefinition = AgentRegistryEntry & {
  enabled: boolean;
};
