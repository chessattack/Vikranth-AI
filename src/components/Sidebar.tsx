import React, { useRef } from 'react';
import { VikranthLogo } from './VikranthLogo';
import { ProjectWorkspace } from '../types';
import {
  Plus,
  FolderGit2,
  MessageSquare,
  HardDrive,
  FileArchive,
  Wrench,
  CheckCircle,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentWorkspaceId: string;
  workspaces: Record<string, ProjectWorkspace>;
  onSelectWorkspace: (id: string) => void;
  onNewProject: () => void;
  onNewChat: () => void;
  chatHistory: { id: string; title: string; timestamp: string }[];
  currentChatId?: string;
  onSelectChat: (id: string) => void;
  onOpenLocalFolder: () => void;
  onImportZipFile: (file: File) => void;
  onFixWorkspaceBugs: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  currentWorkspaceId,
  workspaces,
  onSelectWorkspace,
  onNewProject,
  onNewChat,
  chatHistory,
  currentChatId,
  onSelectChat,
  onOpenLocalFolder,
  onImportZipFile,
  onFixWorkspaceBugs,
}) => {
  const zipInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportZipFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-64 h-full bg-[#F3F1EC] border-r border-[#E6E3DC] flex flex-col justify-between shrink-0 select-none z-30 transition-all">
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleZipChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] border border-[#F2DACF] flex items-center justify-center p-1.5 shadow-2xs">
              <VikranthLogo size={20} />
            </div>
            <div>
              <span className="font-extrabold text-stone-900 tracking-tight text-base leading-none block">
                Vikranth AI
              </span>
              <span className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase">
                Code Studio
              </span>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 font-bold py-2.5 px-3 rounded-xl border border-stone-200/90 shadow-2xs transition-all text-xs"
          >
            <Plus className="w-4 h-4 text-[#D45B38]" />
            <span>New chat</span>
          </button>
        </div>

        {/* Project Workspaces Section */}
        <div className="px-3 py-2 space-y-1">
          <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <span>Workspaces</span>
            <button
              onClick={onNewProject}
              className="hover:text-stone-700 p-0.5 rounded"
              title="Create New Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {Object.values(workspaces).map((ws) => (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                  ws.id === currentWorkspaceId
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FolderGit2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      ws.id === currentWorkspaceId ? 'text-[#D45B38]' : 'text-stone-400'
                    }`}
                  />
                  <span className="truncate">{ws.name}</span>
                </div>
                {ws.id === currentWorkspaceId && (
                  <CheckCircle className="w-3 h-3 text-[#D45B38] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Project Quick Actions */}
        <div className="px-3 py-2 space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Project Actions
          </div>
          <button
            onClick={onFixWorkspaceBugs}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200/70 bg-white transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-rose-600" />
            <span>Audit & Fix Workspace</span>
          </button>
          <button
            onClick={onOpenLocalFolder}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5 text-stone-500" />
            <span>Open Local Folder</span>
          </button>
          <button
            onClick={() => zipInputRef.current?.click()}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <FileArchive className="w-3.5 h-3.5 text-stone-500" />
            <span>Upload ZIP Project</span>
          </button>
        </div>

        {/* Recent Chat Sessions */}
        {chatHistory.length > 0 && (
          <div className="px-3 py-2 space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Recent Sessions
            </div>
            <div className="space-y-0.5">
              {chatHistory.slice(0, 10).map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left truncate ${
                    chat.id === currentChatId
                      ? 'bg-white text-stone-900 font-bold shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-[#E6E3DC] text-[11px] text-stone-400 flex items-center justify-between">
        <span>Vikranth AI Engine</span>
        <span className="text-emerald-600 font-semibold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ready</span>
        </span>
      </div>
    </aside>
  );
};
