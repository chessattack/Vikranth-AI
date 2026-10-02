export type ViewMode = 'chat' | 'code' | 'preview';

export type ModelCategory = 'reasoning' | 'fast';

export interface ModelInfo {
  id: string; // API model identifier e.g. gemini-3.8-flash
  originalName: string;
  premiumName: string;
  feel: string;
  category: ModelCategory;
  description: string;
  badge: string;
  effortSupported: boolean;
}

export interface Artifact {
  id: string;
  title: string;
  type: 'website' | 'code' | 'folder';
  subtitle?: string;
  files: Record<string, string>;
  mainFile: string;
  description?: string;
  open?: boolean;
}

export interface AgentStep {
  id: string;
  title: string;
  details?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  premiumName?: string;
  steps?: AgentStep[];
  artifact?: Artifact;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  path: string; // e.g. D:\petfeeder or D:\Vikranth AI\print
  files: Record<string, string>;
  activeFile: string;
  lastModified: string;
}
