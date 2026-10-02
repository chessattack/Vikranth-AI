import React, { useState, useEffect, useMemo } from 'react';
import { ProjectWorkspace } from '../types';
import {
  RotateCcw,
  ExternalLink,
  Code2,
  MessageSquare,
  Maximize2,
  Minimize2,
  Smartphone,
  Tablet,
  Monitor,
  AlertTriangle,
  CheckCircle,
  UploadCloud,
} from 'lucide-react';

interface PreviewViewProps {
  workspace: ProjectWorkspace;
  onSwitchToCode: () => void;
  onSwitchToChat: () => void;
  onOpenFirebaseDeploy?: () => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onChangePreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  workspace,
  onSwitchToCode,
  onSwitchToChat,
  onOpenFirebaseDeploy,
  previewDevice,
  onChangePreviewDevice,
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasPreviewableCode = useMemo(() => {
    return Object.keys(workspace.files).some(
      (f) =>
        f.endsWith('.html') ||
        f.endsWith('.htm') ||
        (workspace.files[f] &&
          (workspace.files[f].includes('<!DOCTYPE html>') || workspace.files[f].includes('<html')))
    );
  }, [workspace.files]);

  // Compile bundle for iframe
  const srcDoc = useMemo(() => {
    const htmlFileKey = Object.keys(workspace.files).find(
      (f) => f.endsWith('.html') || f.endsWith('.htm')
    );
    const html = htmlFileKey ? workspace.files[htmlFileKey] : '';
    const css = workspace.files['style.css'] || workspace.files['App.css'] || '';
    const js = workspace.files['app.js'] || workspace.files['main.js'] || '';

    // Inject CSS & JS into HTML if not already bundled
    let bundled = html;

    if (css) {
      bundled = bundled.replace(
        '</head>',
        `<style>\n${css}\n</style>\n</head>`
      );
    }

    if (js) {
      bundled = bundled.replace(
        '</body>',
        `<script>\n${js}\n</script>\n</body>`
      );
    }

    return bundled;
  }, [workspace.files, reloadKey]);

  const handleOpenNewTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getContainerWidth = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px] h-[667px] shadow-2xl rounded-3xl border-8 border-stone-800 my-auto';
      case 'tablet':
        return 'w-[768px] h-[90%] shadow-2xl rounded-2xl border-4 border-stone-700 my-auto';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-[#F3F1EC] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black/90 p-4' : 'h-full'
      }`}
    >
      {/* Top Bar (matching Claude preview screenshot 4) */}
      <div className="h-12 bg-white border-b border-stone-200 px-4 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm text-stone-900 truncate max-w-[200px]">
              {workspace.name}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-stone-100 rounded-full text-xs text-stone-500 font-mono">
            <span>localhost:3000/{workspace.id}</span>
          </div>
        </div>

        {/* Center: Device size switcher */}
        <div className="hidden md:flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
          <button
            onClick={() => onChangePreviewDevice('desktop')}
            className={`p-1.5 rounded-lg transition-all ${
              previewDevice === 'desktop'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Desktop (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangePreviewDevice('tablet')}
            className={`p-1.5 rounded-lg transition-all ${
              previewDevice === 'tablet'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangePreviewDevice('mobile')}
            className={`p-1.5 rounded-lg transition-all ${
              previewDevice === 'mobile'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100"
            title="Reload Preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenNewTab}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div className="h-4 w-[1px] bg-stone-200 mx-1" />

          {onOpenFirebaseDeploy && (
            <button
              onClick={onOpenFirebaseDeploy}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-2xs"
              title="Deploy preview to Firebase Hosting (vikranth-ai-web)"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Deploy</span>
            </button>
          )}

          <button
            onClick={onSwitchToCode}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={onSwitchToChat}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAF0EB] text-[#B84928] hover:bg-[#F5E4DC] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      {hasPreviewableCode ? (
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto">
          <div className={`transition-all duration-300 relative overflow-hidden bg-white ${getContainerWidth()}`}>
            <iframe
              key={reloadKey}
              title="Live Preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF0EB] text-[#D45B38] flex items-center justify-center font-bold text-xl mb-4">
              V
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Import code or generate code</h3>
            <p className="text-xs text-stone-500 mb-6">
              There is no web code loaded in this workspace yet. Open a drive folder, import a ZIP archive, or ask Vikranth AI to build an application.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={onSwitchToChat}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Go to Chat
              </button>
              <button
                onClick={onSwitchToCode}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Open Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
