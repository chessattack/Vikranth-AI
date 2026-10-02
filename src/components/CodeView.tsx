import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectWorkspace } from '../types';
import {
  FileCode,
  FolderOpen,
  Plus,
  Trash2,
  Save,
  Download,
  Copy,
  Check,
  Terminal,
  HardDrive,
  GitBranch,
  X,
  FileText,
  UploadCloud,
} from 'lucide-react';
import { highlightCode, getLanguageDisplayName } from '../utils/codeHighlighter';

interface CodeViewProps {
  workspace: ProjectWorkspace;
  onUpdateFile: (filename: string, content: string) => void;
  onSelectFile: (filename: string) => void;
  onAddFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onExportZip: () => void;
  onSaveToDisk?: () => void;
  onAgentPrompt: (prompt: string) => void;
  onOpenFirebaseDeploy?: () => void;
  isDiskBacked?: boolean;
}

export const CodeView: React.FC<CodeViewProps> = ({
  workspace,
  onUpdateFile,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onExportZip,
  onSaveToDisk,
  onAgentPrompt,
  onOpenFirebaseDeploy,
  isDiskBacked = false,
}) => {
  const fileKeys = Object.keys(workspace.files);
  const [activeTab, setActiveTab] = useState<string>(
    workspace.activeFile && workspace.files[workspace.activeFile] !== undefined
      ? workspace.activeFile
      : fileKeys[0] || 'note'
  );

  const [copied, setCopied] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [agentTerminalInput, setAgentTerminalInput] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Sync activeTab when workspace files change
  useEffect(() => {
    if (workspace.activeFile && workspace.files[workspace.activeFile] !== undefined) {
      setActiveTab(workspace.activeFile);
    } else if (fileKeys.length > 0 && !workspace.files[activeTab]) {
      setActiveTab(fileKeys[0]);
    }
  }, [workspace.activeFile, workspace.files, activeTab, fileKeys]);

  const currentContent = workspace.files[activeTab] || '';

  // Synchronized syntax-highlighted HTML via Prism (VS Code theme)
  const highlightedHtml = useMemo(() => {
    return highlightCode(currentContent, activeTab);
  }, [currentContent, activeTab]);

  const lines = useMemo(() => currentContent.split('\n'), [currentContent]);

  // Update cursor position from selection
  const updateCursorPosition = (el: HTMLTextAreaElement) => {
    const textBefore = el.value.substring(0, el.selectionStart);
    const splitLines = textBefore.split('\n');
    const line = splitLines.length;
    const col = splitLines[splitLines.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  // Synchronize gutter line number scrolling with editor scrolling
  const handleScroll = () => {
    if (scrollContainerRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = scrollContainerRef.current.scrollTop;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateFile(activeTab, e.target.value);
    updateCursorPosition(e.target);
  };

  // VS Code smart keyboard interactions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // 1. Tab key: Indent / Unindent 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Unindent
        const lineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
        if (currentContent.substring(lineStart, lineStart + 2) === '  ') {
          const updated = currentContent.substring(0, lineStart) + currentContent.substring(lineStart + 2);
          onUpdateFile(activeTab, updated);
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = Math.max(start - 2, lineStart);
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
              updateCursorPosition(textareaRef.current);
            }
          }, 0);
        }
      } else {
        // Tab: Insert 2 spaces
        const updated = currentContent.substring(0, start) + '  ' + currentContent.substring(end);
        onUpdateFile(activeTab, updated);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
            updateCursorPosition(textareaRef.current);
          }
        }, 0);
      }
      return;
    }

    // 2. Enter key: Auto-indent to match previous line
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
      const currentLine = currentContent.substring(lineStart, start);
      const match = currentLine.match(/^(\s+)/);
      const indent = match ? match[1] : '';

      const charBefore = currentContent[start - 1];
      const extraIndent = charBefore === '{' || charBefore === '(' || charBefore === '[' ? '  ' : '';

      const insert = '\n' + indent + extraIndent;
      const updated = currentContent.substring(0, start) + insert + currentContent.substring(end);
      onUpdateFile(activeTab, updated);
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + insert.length;
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
          updateCursorPosition(textareaRef.current);
        }
      }, 0);
      return;
    }

    // 3. Auto-close brackets & quotes
    const pairs: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (start === end) {
        e.preventDefault();
        const closing = pairs[e.key];
        const updated = currentContent.substring(0, start) + e.key + closing + currentContent.substring(end);
        onUpdateFile(activeTab, updated);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
            updateCursorPosition(textareaRef.current);
          }
        }, 0);
        return;
      }
    }
  };

  const handleSave = () => {
    if (onSaveToDisk && isDiskBacked) {
      onSaveToDisk();
    }
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    onAddFile(name);
    setActiveTab(name);
    setNewFileName('');
    setShowNewFileInput(false);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentTerminalInput.trim()) return;
    onAgentPrompt(agentTerminalInput.trim());
    setAgentTerminalInput('');
  };

  // Visual file type badge
  const renderFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'html' || ext === 'htm') {
      return <span className="text-[#E44D26] font-bold text-[10px] shrink-0">&lt;/&gt;</span>;
    }
    if (ext === 'css') {
      return <span className="text-[#264DE4] font-bold text-[10px] shrink-0">#</span>;
    }
    if (ext === 'js' || ext === 'mjs') {
      return <span className="text-[#F7DF1E] font-bold text-[10px] shrink-0">JS</span>;
    }
    if (ext === 'ts') {
      return <span className="text-[#3178C6] font-bold text-[10px] shrink-0">TS</span>;
    }
    if (ext === 'jsx' || ext === 'tsx') {
      return <span className="text-[#61DAFB] font-bold text-[10px] shrink-0">⚛</span>;
    }
    if (ext === 'json') {
      return <span className="text-[#CBCB41] font-bold text-[10px] shrink-0">&#123;&#125;</span>;
    }
    if (filename.toLowerCase() === 'note') {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    return <FileCode className="w-3.5 h-3.5 text-stone-400 shrink-0" />;
  };

  return (
    <div className="flex-1 flex h-full bg-[#1E1E1E] text-stone-200 overflow-hidden font-mono select-none">
      {/* 1. Left Explorer (Sublime / VS Code style) */}
      <div className="w-56 sm:w-60 bg-[#181818] border-r border-[#2D2D2D] flex flex-col justify-between shrink-0">
        <div>
          {/* Top Folder Header */}
          <div className="p-3 border-b border-[#2D2D2D] flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-400 uppercase tracking-wider truncate">
              <HardDrive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">EXPLORER</span>
            </div>
            <button
              onClick={() => setShowNewFileInput(true)}
              className="p-1 hover:bg-[#2A2A2A] text-stone-400 hover:text-white rounded transition-colors"
              title="New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Root Directory */}
          <div className="px-3 py-2 text-xs">
            <div className="flex items-center space-x-1.5 text-stone-300 font-semibold mb-1 truncate">
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate" title={workspace.path}>
                {workspace.name}
              </span>
            </div>

            {/* New File Input */}
            {showNewFileInput && (
              <form onSubmit={handleCreateFile} className="my-1.5 ml-4">
                <input
                  type="text"
                  placeholder="filename.js..."
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                  className="w-full text-xs p-1 bg-[#252526] border border-[#3E3E42] rounded text-white focus:outline-none focus:border-[#007ACC]"
                />
              </form>
            )}

            {/* Files List */}
            <div className="ml-2 pl-2 border-l border-[#2D2D2D] space-y-0.5 mt-1 max-h-[50vh] overflow-y-auto">
              {fileKeys.length === 0 ? (
                <div className="text-[11px] text-stone-500 italic py-2">
                  No files in workspace. Click + to add a file.
                </div>
              ) : (
                fileKeys.map((filename) => {
                  const isActive = filename === activeTab;
                  return (
                    <div
                      key={filename}
                      onClick={() => {
                        setActiveTab(filename);
                        onSelectFile(filename);
                      }}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                        isActive
                          ? 'bg-[#2A2D2E] text-white font-semibold'
                          : 'text-stone-400 hover:bg-[#222222] hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {renderFileIcon(filename)}
                        <span className="truncate">{filename}</span>
                      </div>

                      {fileKeys.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFile(filename);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity"
                          title="Delete file"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Workspace Quick Actions */}
        <div className="p-3 border-t border-[#2D2D2D] space-y-2 text-xs">
          {onOpenFirebaseDeploy && (
            <button
              onClick={onOpenFirebaseDeploy}
              className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
              title="Deploy to Firebase Hosting (vikranth-ai-web)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-stone-950" />
              <span>Deploy to Firebase</span>
            </button>
          )}

          <button
            onClick={onExportZip}
            className="w-full py-2 px-3 rounded-lg bg-[#252526] hover:bg-[#2F2F32] text-stone-200 font-semibold flex items-center justify-center space-x-1.5 border border-[#3E3E42] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </button>
        </div>
      </div>

      {/* 2. Center: VS Code Style Code Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1E1E1E]">
        {/* VS Code Tab Bar */}
        <div className="h-9 bg-[#252526] border-b border-[#1E1E1E] flex items-center justify-between px-2 overflow-x-auto select-none no-scrollbar">
          <div className="flex items-center space-x-0.5">
            {fileKeys.map((filename) => {
              const isActive = filename === activeTab;
              return (
                <div
                  key={filename}
                  onClick={() => {
                    setActiveTab(filename);
                    onSelectFile(filename);
                  }}
                  className={`group flex items-center space-x-2 px-3 py-1.5 text-xs border-t-2 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#1E1E1E] text-white border-[#007ACC] font-semibold'
                      : 'bg-[#2D2D2D] text-stone-400 border-transparent hover:bg-[#262626] hover:text-stone-200'
                  }`}
                >
                  {renderFileIcon(filename)}
                  <span className="truncate max-w-[140px]">{filename}</span>
                  {fileKeys.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(filename);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-stone-100 rounded-sm p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2D2D2D] hover:bg-[#383838] text-stone-300 text-xs font-semibold transition-colors"
              title={isDiskBacked ? 'Save directly to local disk' : 'Save workspace'}
            >
              {savedBadge ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span>{savedBadge ? 'Saved' : isDiskBacked ? 'Save to Disk' : 'Save'}</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#333333] transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* VS Code Breadcrumb Bar */}
        <div className="h-6 bg-[#1E1E1E] border-b border-[#252526] px-4 flex items-center space-x-1.5 text-[11px] text-[#858585] select-none">
          <span className="text-[#969696] hover:text-stone-200 cursor-pointer">{workspace.name}</span>
          <span>&rsaquo;</span>
          <span className="flex items-center space-x-1 text-[#CCCCCC]">
            {renderFileIcon(activeTab)}
            <span>{activeTab}</span>
          </span>
        </div>

        {/* Code Content with Line Numbers & Real VS Code Syntax Highlighting */}
        <div className="flex-1 flex overflow-hidden relative bg-[#1E1E1E]">
          {/* Line Numbers Column */}
          <div
            ref={gutterRef}
            className="w-12 bg-[#1E1E1E] border-r border-[#2A2A2A] text-right pr-3 select-none text-[13px] font-mono leading-[22px] overflow-hidden shrink-0 pt-3"
          >
            {lines.map((_, i) => (
              <div
                key={i}
                className={`h-[22px] leading-[22px] ${
                  cursorPos.line === i + 1 ? 'text-[#C6C6C6] font-bold' : 'text-[#858585]'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Actual Code Area: Underlying Colored Pre + Overlay Interactive Textarea */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 relative overflow-auto bg-[#1E1E1E]"
          >
            <div className="relative inline-block min-w-full" style={{ minHeight: '100%' }}>
              {/* Active line highlight strip */}
              <div
                className="absolute left-0 right-0 bg-[#282828]/50 pointer-events-none transition-all duration-75"
                style={{
                  top: `${(cursorPos.line - 1) * 22 + 12}px`,
                  height: '22px',
                }}
              />

              {/* 1. Underlying Syntax-Highlighted HTML (Prism VS Code Dark+ Tokens) */}
              <pre
                className="vscode-theme m-0 p-3 pointer-events-none select-none font-mono text-[13px] leading-[22px] whitespace-pre"
                aria-hidden="true"
                style={{ tabSize: 2 }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
              />

              {/* 2. Interactive Transparent Textarea (Handles user typing, selection, IME, undo) */}
              <textarea
                ref={textareaRef}
                value={currentContent}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
                onClick={(e) => updateCursorPosition(e.currentTarget)}
                onSelect={(e) => updateCursorPosition(e.currentTarget)}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="absolute inset-0 w-full h-full m-0 p-3 bg-transparent text-transparent caret-white selection:bg-[#264F78]/80 font-mono text-[13px] leading-[22px] whitespace-pre resize-none border-none outline-none focus:ring-0 overflow-hidden"
                style={{
                  WebkitTextFillColor: 'transparent',
                  tabSize: 2,
                }}
                placeholder="// Import code or ask Vikranth AI to build..."
              />
            </div>
          </div>
        </div>

        {/* VS Code Iconic Status Bar */}
        <div className="h-6 bg-[#007ACC] text-white text-[11px] px-3 flex items-center justify-between font-sans select-none">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 font-semibold hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer">
              <GitBranch className="w-3 h-3" />
              <span>main*</span>
            </span>
            <span className="text-white/80">0 ⊗ 0 ⚠</span>
            {isDiskBacked && (
              <span className="bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                Disk Linked
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-white/90">
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span>LF</span>
            <span className="font-semibold text-white bg-white/15 px-1.5 py-0.5 rounded">
              {getLanguageDisplayName(activeTab)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Right: Agent Live Console / Terminal */}
      <div className="hidden xl:flex w-80 bg-[#181818] border-l border-[#2D2D2D] flex-col justify-between shrink-0">
        <div>
          <div className="p-3 border-b border-[#2D2D2D] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-stone-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Real Agent Console</span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
              Live
            </span>
          </div>

          {/* Agent execution log */}
          <div className="p-3 text-[11px] font-mono text-stone-400 space-y-2 max-h-[60vh] overflow-y-auto">
            <div className="text-emerald-400 font-bold">● Connected to Vikranth AI Core</div>
            <div className="text-stone-300 truncate">
              Workspace: <span className="text-amber-400">{workspace.name}</span>
            </div>
            <div className="text-stone-400 bg-[#222222] p-2.5 rounded-lg border border-[#2F2F2F]">
              <div className="text-stone-200 font-semibold mb-1">Loaded Files:</div>
              {fileKeys.length === 0 ? (
                <p>No files loaded yet.</p>
              ) : (
                fileKeys.map((f) => (
                  <p key={f}>
                    • {f} ({workspace.files[f]?.length || 0} bytes)
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Agent Terminal Input */}
        <div className="p-3 border-t border-[#2D2D2D] bg-[#141414]">
          <form onSubmit={handleTerminalSubmit} className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Direct Agent Command:
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                placeholder="e.g. Add responsive navbar..."
                value={agentTerminalInput}
                onChange={(e) => setAgentTerminalInput(e.target.value)}
                className="flex-1 text-xs p-1.5 bg-[#252526] border border-[#3E3E42] rounded text-white focus:outline-none focus:border-[#007ACC] font-mono"
              />
              <button
                type="submit"
                className="p-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-white rounded font-bold text-xs transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
