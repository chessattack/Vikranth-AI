import { ProjectWorkspace } from '../types';

export const DEFAULT_PROJECTS: Record<string, ProjectWorkspace> = {
  starter: {
    id: 'starter',
    name: 'Workspace',
    path: 'Workspace',
    lastModified: 'Just now',
    activeFile: 'note',
    files: {
      note: 'Import code or generate code',
    },
  },
};
