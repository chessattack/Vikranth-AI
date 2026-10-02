import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ModelInfo, Artifact, ProjectWorkspace } from '../types';
import { VikranthLogo } from './VikranthLogo';
import {
  Send,
  Plus,
  ChevronDown,
  ChevronRight,
  Code2,
  Play,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  HardDrive,
  FileCode,
  FolderOpen,
  FileArchive,
  Wrench,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, options?: { role?: string }) => void;
  isLoading: boolean;
  selectedModel: ModelInfo;
  onSelectModelById: (id: string) => void;
  effort: string;
  onOpenModelSelector: () => void;
  onOpenArtifact: (artifact: Artifact) => void;
  onSwitchToCode: () => void;
  isIncognito: boolean;
  onOpenLocalFolder: () => void;
  onImportZipFile: (file: File) => void;
  onFixWorkspaceBugs: () => void;
  currentWorkspace: ProjectWorkspace;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModelById,
  effort,
  onOpenModelSelector,
  onOpenArtifact,
  onSwitchToCode,
  isIncognito,
  onOpenLocalFolder,
  onImportZipFile,
  onFixWorkspaceBugs,
  currentWorkspace,
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [modeType, setModeType] = useState<'chat' | 'cowork'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSendMessage(text, {
      role: modeType === 'cowork' ? 'architect' : 'general',
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZipFile(file);
      e.target.value = '';
      setShowAttachMenu(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-hidden select-text relative">
      <input
        type="file"
        ref={zipInputRef}
        onChange={handleZipChange}
        accept=".zip"
        className="hidden"
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0EB] border border-[#F2DACF] flex items-center justify-center p-2.5 mb-5 shadow-xs">
              <VikranthLogo size={32} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-2">
              {isIncognito ? 'Incognito Mode' : 'What would you like to build?'}
            </h2>

            <p className="text-stone-500 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
              Vikranth AI writes clean production code, diagnoses errors across files, and executes live in your workspace preview.
            </p>

            {/* Centered Large Prompt Input Container */}
            <div className="w-full bg-white rounded-2xl border border-stone-200 shadow-sm p-3 sm:p-4 text-left focus-within:ring-2 focus-within:ring-stone-300 focus-within:border-stone-400 transition-all">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Vikranth AI to build an app, create features, or fix code..."
                rows={2}
                className="w-full resize-none border-none outline-none text-stone-900 placeholder:text-stone-400 text-sm sm:text-base bg-transparent"
              />

              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
                      title="Import local folder or ZIP"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {showAttachMenu && (
                      <div className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs text-stone-700">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Import Files
                        </div>
                        <button
                          onClick={() => {
                            setShowAttachMenu(false);
                            onOpenLocalFolder();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center space-x-2"
                        >
                          <HardDrive className="w-4 h-4 text-[#D45B38]" />
                          <div>
                            <span className="font-semibold block">Open Local Folder</span>
                            <span className="text-[10px] text-stone-400">Select any project folder</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            zipInputRef.current?.click();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center space-x-2"
                        >
                          <FileArchive className="w-4 h-4 text-amber-600" />
                          <div>
                            <span className="font-semibold block">Upload Project ZIP</span>
                            <span className="text-[10px] text-stone-400">Extract any .zip file</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-semibold text-stone-600">
                    <button
                      onClick={() => setModeType('chat')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        modeType === 'chat' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setModeType('cowork')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        modeType === 'cowork' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
                      }`}
                    >
                      Architect Mode
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Model Selector pill */}
                  <button
                    onClick={onOpenModelSelector}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1.5 rounded-xl border border-stone-200 transition-colors"
                  >
                    <span className="font-bold text-[#D45B38]">{selectedModel.premiumName}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500 font-medium">{effort}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!inputText.trim() || isLoading}
                    className="p-1.5 rounded-xl bg-stone-900 hover:bg-black text-white disabled:opacity-30 disabled:hover:bg-stone-900 transition-all shadow-2xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
              <button
                onClick={() => onSendMessage('Build a responsive web application with a sleek modern dashboard layout.')}
                className="text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 transition-all hover:border-stone-300 shadow-2xs flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Build Modern Dashboard App</span>
              </button>

              <button
                onClick={onFixWorkspaceBugs}
                className="text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 transition-all hover:border-stone-300 shadow-2xs flex items-center space-x-1.5"
              >
                <Wrench className="w-3.5 h-3.5 text-rose-600" />
                <span>Audit & Fix Workspace Bugs</span>
              </button>

              <button
                onClick={() => onSendMessage('Write a complete, responsive landing page with clean hero section, features grid, and dark mode.')}
                className="text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 transition-all hover:border-stone-300 shadow-2xs flex items-center space-x-1.5"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Generate Landing Page Code</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Chat Thread */
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.role === 'user' ? (
                  /* User message */
                  <div className="flex justify-end">
                    <div className="bg-[#EFECE6] text-stone-900 px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] text-sm font-medium shadow-2xs whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant / Agent Message */
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] border border-[#F2DACF] flex items-center justify-center p-1.5 shadow-2xs shrink-0 mt-0.5">
                      <VikranthLogo size={18} />
                    </div>

                    <div className="flex-1 space-y-3 overflow-hidden">
                      {/* Model & Agent Tag */}
                      <div className="flex items-center space-x-2 text-xs text-stone-400">
                        <span className="font-bold text-stone-700">Vikranth AI</span>
                        {msg.premiumName && (
                          <span className="bg-stone-200/70 text-stone-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                            {msg.premiumName}
                          </span>
                        )}
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Agent Steps Accordion */}
                      {msg.steps && msg.steps.length > 0 && (
                        <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                            <div className="flex items-center space-x-1.5">
                              <Cpu className="w-3.5 h-3.5 text-[#D45B38]" />
                              <span>Autonomous Agent Action Log</span>
                            </div>
                            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Completed
                            </span>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            {msg.steps.map((st) => (
                              <div key={st.id} className="flex items-center space-x-2 text-xs text-stone-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{st.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Artifact Card for Real Generated/Fixed Code */}
                      {msg.artifact && (
                        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-stone-300 transition-all">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
                              <FileCode className="w-5 h-5 text-[#D45B38]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm">
                                {msg.artifact.title}
                              </h4>
                              <p className="text-xs text-stone-500 font-medium">
                                Artifact • Only you • {Object.keys(msg.artifact.files).length} files
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={onSwitchToCode}
                              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors flex items-center space-x-1"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>View Code</span>
                            </button>
                            <button
                              onClick={() => onOpenArtifact(msg.artifact!)}
                              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#D45B38] hover:bg-[#B84928] text-white shadow-xs transition-colors flex items-center space-x-1"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Open</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                        {msg.content}
                      </div>

                      {/* Message Action Buttons */}
                      <div className="flex items-center space-x-2 pt-1 text-stone-400 text-xs">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1 hover:text-stone-700 rounded transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button className="p-1 hover:text-stone-700 rounded transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 hover:text-stone-700 rounded transition-colors">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSendMessage(messages[messages.length - 2]?.content || '')}
                          className="p-1 hover:text-stone-700 rounded transition-colors"
                          title="Retry"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] border border-[#F2DACF] flex items-center justify-center p-1.5 shadow-2xs shrink-0">
                  <VikranthLogo size={18} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-stone-500">
                    <span className="w-2 h-2 rounded-full bg-[#D45B38] animate-ping" />
                    <span>Vikranth AI ({selectedModel.premiumName}) is generating code...</span>
                  </div>
                  <div className="h-4 w-48 bg-stone-200/70 rounded-md animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Sticky Input Bar when messages exist */}
      {messages.length > 0 && (
        <div className="p-4 bg-[#FAF9F5]/90 backdrop-blur-xs border-t border-stone-200/80">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-3 focus-within:ring-2 focus-within:ring-stone-300 transition-all">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Vikranth AI to add features, fix bugs, or modify files..."
                rows={1}
                className="w-full resize-none border-none outline-none text-stone-900 placeholder:text-stone-400 text-sm bg-transparent"
              />

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenLocalFolder}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
                    title="Open Local Folder"
                  >
                    <HardDrive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => zipInputRef.current?.click()}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
                    title="Import ZIP"
                  >
                    <FileArchive className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                    {currentWorkspace.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenModelSelector}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg bg-stone-100 flex items-center space-x-1"
                  >
                    <span>{selectedModel.premiumName}</span>
                    <span className="text-stone-400 text-[10px]">{effort}</span>
                  </button>

                  <button
                    onClick={() => handleSubmit()}
                    disabled={!inputText.trim() || isLoading}
                    className="p-1.5 rounded-xl bg-stone-900 hover:bg-black text-white disabled:opacity-30 transition-all shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
