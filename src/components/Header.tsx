import React, { useState } from 'react';
import { ViewMode, ModelInfo } from '../types';
import { VikranthLogo } from './VikranthLogo';
import { User } from 'firebase/auth';
import {
  MessageSquare,
  Code2,
  PlayCircle,
  Columns,
  Download,
  ShieldCheck,
  EyeOff,
  Menu,
  Monitor,
  Tablet,
  Smartphone,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  splitView: boolean;
  onToggleSplitView: () => void;
  onToggleSidebar: () => void;
  selectedModel: ModelInfo;
  onOpenModelSelector: () => void;
  isIncognito: boolean;
  onToggleIncognito: () => void;
  onExportProject: () => void;
  onOpenFirebaseDeploy: () => void;
  activeProjectName: string;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onChangePreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onChangeViewMode,
  splitView,
  onToggleSplitView,
  onToggleSidebar,
  isIncognito,
  onToggleIncognito,
  onExportProject,
  onOpenFirebaseDeploy,
  activeProjectName,
  previewDevice,
  onChangePreviewDevice,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-14 border-b border-[#E8E6E0] bg-[#FAF9F5] px-3 sm:px-5 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Sidebar toggle + Logo + Project name */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FAF0EB] border border-[#F2DACF] flex items-center justify-center p-1">
            <VikranthLogo size={18} />
          </div>
          <span className="font-extrabold text-stone-900 tracking-tight text-base hidden sm:inline">
            Vikranth AI
          </span>
        </div>

        <div className="h-4 w-[1px] bg-stone-300 hidden md:block" />

        {/* Project Breadcrumb */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-stone-600 font-medium">
          <span className="text-stone-400">Workspace /</span>
          <span className="font-semibold text-stone-800 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs truncate max-w-[130px]">
            {activeProjectName}
          </span>
        </div>
      </div>

      {/* Center: The Core Workspace View Modes */}
      <div className="flex items-center bg-[#EFECE6] p-1 rounded-xl border border-[#E0DCD4] shadow-2xs">
        <button
          onClick={() => onChangeViewMode('chat')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'chat' && !splitView
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#D45B38]" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => onChangeViewMode('code')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'code' && !splitView
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Code</span>
        </button>

        <button
          onClick={() => onChangeViewMode('preview')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'preview' && !splitView
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Preview</span>
        </button>

        {/* Split View Toggle */}
        <button
          onClick={onToggleSplitView}
          className={`hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ml-1 border-l border-stone-300 pl-2 ${
            splitView
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Split View (Chat + Code/Preview)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
      </div>

      {/* Right: Auth, Deploy, Export */}
      <div className="flex items-center space-x-2">
        {/* Device Switcher (shown in Preview mode or split view) */}
        {(viewMode === 'preview' || splitView) && (
          <div className="hidden sm:flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => onChangePreviewDevice('desktop')}
              className={`p-1 rounded-md ${
                previewDevice === 'desktop'
                  ? 'bg-stone-200 text-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangePreviewDevice('tablet')}
              className={`p-1 rounded-md ${
                previewDevice === 'tablet'
                  ? 'bg-stone-200 text-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangePreviewDevice('mobile')}
              className={`p-1 rounded-md ${
                previewDevice === 'mobile'
                  ? 'bg-stone-200 text-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Incognito Toggle */}
        <button
          onClick={onToggleIncognito}
          className={`p-2 rounded-xl border text-xs transition-colors hidden sm:block ${
            isIncognito
              ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-2xs'
              : 'bg-white border-stone-200 text-stone-500 hover:text-stone-900'
          }`}
          title={isIncognito ? 'Incognito Mode Active' : 'Enable Incognito'}
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Firebase Deploy */}
        <button
          onClick={onOpenFirebaseDeploy}
          className="flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-2xs transition-all active:scale-95 border border-amber-600/30"
          title="Deploy to Firebase Hosting"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="hidden sm:inline">Deploy</span>
        </button>

        {/* Google Sign-in / Firebase Auth */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-1.5 p-1 rounded-full border border-stone-300 bg-white hover:border-stone-400 transition-colors"
              title={currentUser.displayName || currentUser.email || 'User Account'}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 text-xs text-stone-800 space-y-2">
                <div className="border-b border-stone-100 pb-2">
                  <div className="font-bold truncate">{currentUser.displayName || 'Google User'}</div>
                  <div className="text-[11px] text-stone-500 truncate">{currentUser.email}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Firebase Auth & Firestore Synced</span>
                  </div>
                </div>
                {onSignOut && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center space-x-2 text-red-600 hover:bg-red-50 p-2 rounded-lg text-left font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          onSignInWithGoogle && (
            <button
              onClick={onSignInWithGoogle}
              className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 shadow-2xs transition-all active:scale-95"
              title="Sign in with Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )
        )}

        {/* Export ZIP */}
        <button
          onClick={onExportProject}
          className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-[#D45B38] hover:bg-[#B84928] text-white shadow-2xs transition-all active:scale-95"
          title="Download Current Project as ZIP"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export ZIP</span>
        </button>
      </div>
    </header>
  );
};
