import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { ViewMode, ModelInfo, ChatMessage, Artifact, ProjectWorkspace } from './types';
import { MODELS_LIST } from './data/models';
import { DEFAULT_PROJECTS } from './data/defaultProjects';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { CodeView } from './components/CodeView';
import { PreviewView } from './components/PreviewView';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { FirebaseDeployModal } from './components/FirebaseDeployModal';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { saveUserProfile, saveConversationToFirestore, loadUserConversationsFromFirestore } from './services/dbService';
import {
  openLocalFolderFromDisk,
  extractZipToWorkspace,
  saveFileToDiskHandle,
  DirectoryHandleStore,
  isFileSystemAccessSupported,
} from './utils/fileSystem';
import { fetchApi, safeParseJsonResponse, formatApiError } from './utils/api';

export default function App() {
  // Navigation & View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [splitView, setSplitView] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isFirebaseDeployOpen, setIsFirebaseDeployOpen] = useState<boolean>(false);

  // Auth & Cloud State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string>('chat-1');
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; timestamp: string }[]>([
    { id: 'chat-1', title: 'Current Workspace Session', timestamp: 'Today' },
  ]);

  // Model State
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(MODELS_LIST[0]);
  const [effort, setEffort] = useState<string>('Medium');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState<boolean>(false);

  // Incognito State
  const [isIncognito, setIsIncognito] = useState<boolean>(false);

  // Workspaces State
  const [workspaces, setWorkspaces] = useState<Record<string, ProjectWorkspace>>(DEFAULT_PROJECTS);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('starter');

  // Directory handles store for direct OS disk read/write
  const dirHandlesRef = useRef<Map<string, DirectoryHandleStore>>(new Map());

  // Preview Device State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Chat & Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const currentWorkspace = workspaces[activeWorkspaceId] || workspaces['starter'];
  const isDiskBacked = Boolean(dirHandlesRef.current.get(activeWorkspaceId));

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync Firebase Auth state & load user chats from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await saveUserProfile(user);
        const remoteChats = await loadUserConversationsFromFirestore(user.uid);
        if (remoteChats.length > 0) {
          setChatHistory(
            remoteChats.map((c) => ({
              id: c.id,
              title: c.title,
              timestamp: new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save current conversation to Firestore on update
  useEffect(() => {
    if (!isIncognito && currentUser?.uid && messages.length > 0) {
      saveConversationToFirestore(
        currentUser.uid,
        currentChatId,
        messages,
        messages[0]?.content.slice(0, 30) || 'Workspace Session',
        selectedModel.id
      );
    }
  }, [messages, currentUser, isIncognito, currentChatId, selectedModel.id]);

  // Auth Handlers
  const handleSignInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showNotification('Signed in with Google!');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showNotification('Signed out');
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to sign out');
    }
  };

  // Chat Management
  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    setCurrentChatId(newId);
    setMessages([]);
    setChatHistory((prev) => [{ id: newId, title: 'New Workspace Session', timestamp: 'Just now' }, ...prev]);
    showNotification('Started a fresh session');
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    setMessages([]);
    showNotification(`Switched to session`);
  };

  // Code Parsing Helper
  const extractCodeFiles = (text: string): Record<string, string> => {
    const files: Record<string, string> = {};
    const codeBlockRegex = /```(?:([a-zA-Z0-9_\-\.]+):([a-zA-Z0-9_\-\.\/]+)|([a-zA-Z0-9_\-\.]+))\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const explicitFilename = match[2];
      const langOrName = match[1] || match[3] || 'txt';
      const content = match[4];

      let filename = explicitFilename;
      if (!filename) {
        if (langOrName.includes('.')) {
          filename = langOrName;
        } else if (langOrName === 'html') {
          filename = 'index.html';
        } else if (langOrName === 'css') {
          filename = 'styles.css';
        } else if (langOrName === 'js' || langOrName === 'javascript') {
          filename = 'script.js';
        } else if (langOrName === 'json') {
          filename = 'data.json';
        } else {
          filename = `file_${Object.keys(files).length + 1}.${langOrName}`;
        }
      }

      files[filename] = content.trim();
    }

    return files;
  };

  // Workspace File Operations
  const handleSelectFile = (filename: string) => {
    setWorkspaces((prev) => ({
      ...prev,
      [activeWorkspaceId]: {
        ...prev[activeWorkspaceId],
        activeFile: filename,
      },
    }));
  };

  const handleUpdateFile = (filename: string, newContent: string) => {
    setWorkspaces((prev) => ({
      ...prev,
      [activeWorkspaceId]: {
        ...prev[activeWorkspaceId],
        files: {
          ...prev[activeWorkspaceId].files,
          [filename]: newContent,
        },
        lastModified: 'Just now',
      },
    }));
  };

  const handleAddFile = (filename: string) => {
    if (!filename.trim()) return;
    setWorkspaces((prev) => ({
      ...prev,
      [activeWorkspaceId]: {
        ...prev[activeWorkspaceId],
        files: {
          ...prev[activeWorkspaceId].files,
          [filename]: '',
        },
        activeFile: filename,
        lastModified: 'Just now',
      },
    }));
    showNotification(`Created file: ${filename}`);
  };

  const handleDeleteFile = (filename: string) => {
    setWorkspaces((prev) => {
      const currentFiles = { ...prev[activeWorkspaceId].files };
      delete currentFiles[filename];
      const remainingFiles = Object.keys(currentFiles);
      return {
        ...prev,
        [activeWorkspaceId]: {
          ...prev[activeWorkspaceId],
          files: currentFiles,
          activeFile: remainingFiles[0] || '',
          lastModified: 'Just now',
        },
      };
    });
    showNotification(`Deleted file: ${filename}`);
  };

  const handleAddFilesToWorkspace = (newFiles: Record<string, string>) => {
    setWorkspaces((prev) => ({
      ...prev,
      [activeWorkspaceId]: {
        ...prev[activeWorkspaceId],
        files: {
          ...prev[activeWorkspaceId].files,
          ...newFiles,
        },
        lastModified: 'Just now',
      },
    }));
  };

  // Export Project to ZIP
  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      const files = currentWorkspace.files;

      Object.entries(files).forEach(([name, content]) => {
        zip.file(name, content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentWorkspace.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification(`Downloaded ${currentWorkspace.name}.zip`);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to generate ZIP export');
    }
  };

  // Save active file back to local disk handle
  const handleSaveToDisk = async () => {
    const handleStore = dirHandlesRef.current.get(activeWorkspaceId);
    if (!handleStore) return;
    const activeFile = currentWorkspace.activeFile;
    const fileHandle = handleStore.files.get(activeFile);
    if (!fileHandle) {
      showNotification(`File not found in local directory: ${activeFile}`);
      return;
    }
    const content = currentWorkspace.files[activeFile] || '';
    const success = await saveFileToDiskHandle(fileHandle, content);
    if (success) {
      showNotification(`Saved ${activeFile} to local computer`);
    } else {
      showNotification(`Error saving ${activeFile} to disk`);
    }
  };

  // Open Real Computer Directory
  const handleOpenLocalFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      alert('The File System Access API is not supported in this browser. Please use Chrome, Edge, or upload a ZIP file.');
      return;
    }

    try {
      const result = await openLocalFolderFromDisk();
      if (!result) return;

      const ws = result.workspace;
      if (result.dirStore) {
        dirHandlesRef.current.set(ws.id, result.dirStore);
      }

      setWorkspaces((prev) => ({
        ...prev,
        [ws.id]: ws,
      }));

      setActiveWorkspaceId(ws.id);
      setViewMode('code');
      showNotification(`Opened local folder: ${ws.name} (${Object.keys(ws.files).length} files)`);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to open local folder');
    }
  };

  // Import ZIP archive into Workspace
  const handleImportZipFile = async (file: File) => {
    try {
      const ws = await extractZipToWorkspace(file);

      setWorkspaces((prev) => ({
        ...prev,
        [ws.id]: ws,
      }));

      setActiveWorkspaceId(ws.id);
      setViewMode('code');
      showNotification(`Imported ZIP: ${ws.name} (${Object.keys(ws.files).length} files)`);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to extract ZIP archive');
    }
  };

  // Autonomous Bug Fix / Audit Agent
  const handleFixWorkspaceBugs = async () => {
    const filesToFix = currentWorkspace.files;
    if (Object.keys(filesToFix).length === 0) {
      showNotification('No files in this workspace to fix.');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Audit and fix all bugs in workspace: ${currentWorkspace.name} (${Object.keys(filesToFix).join(', ')}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetchApi('/api/agent/fix-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesToFix,
          modelKey: selectedModel.id,
          instructions: 'Perform a full code audit on all files in this project. Fix all bugs, syntax errors, and layout issues. Return the full fixed code files.',
        }),
      });

      const { data, rawText } = await safeParseJsonResponse(res);

      if (!data) {
        throw new Error(rawText || 'Empty response received from server.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fix code.');
      }

      const reply = data.reply || '';
      const fixedFiles = extractCodeFiles(reply);

      if (Object.keys(fixedFiles).length > 0) {
        setWorkspaces((prev) => ({
          ...prev,
          [activeWorkspaceId]: {
            ...prev[activeWorkspaceId],
            files: {
              ...prev[activeWorkspaceId].files,
              ...fixedFiles,
            },
            lastModified: 'Just now (Fixed by AI)',
          },
        }));
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel.id,
        premiumName: data.premiumName || selectedModel.premiumName,
        steps: [
          { id: '1', title: `Analyzed ${Object.keys(filesToFix).length} workspace files`, status: 'completed' },
          { id: '2', title: 'Identified errors and applied code fixes', status: 'completed' },
          { id: '3', title: `Updated ${Object.keys(fixedFiles).length} project files in Code & Live Preview`, status: 'completed' },
        ],
        artifact: Object.keys(fixedFiles).length > 0 ? {
          id: `fixed_${Date.now()}`,
          title: `${currentWorkspace.name} (Patched)`,
          type: 'website',
          subtitle: 'Artifact • Only you',
          files: fixedFiles,
          mainFile: Object.keys(fixedFiles)[0] || 'index.html',
        } : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      showNotification('Bugs fixed! Check the Code and Live Preview.');
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: formatApiError(err),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Main Chat & Agent Message Dispatcher
  const handleSendMessage = async (text: string, options?: { role?: string }) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetchApi('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          modelKey: selectedModel.id,
          currentFiles: currentWorkspace.files,
          workspacePath: currentWorkspace.name,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          role: options?.role || 'general',
        }),
      });

      const { data, rawText } = await safeParseJsonResponse(res);

      if (!data) {
        throw new Error(rawText || 'Empty response received from server.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response.');
      }

      const generatedText = data.reply || '';
      const extracted = extractCodeFiles(generatedText);
      const hasCode = Object.keys(extracted).length > 0;

      if (hasCode) {
        setWorkspaces((prev) => {
          const current = prev[activeWorkspaceId] || prev['starter'];
          const updatedFiles = { ...(current ? current.files : {}), ...extracted };
          if (updatedFiles['note']) {
            delete updatedFiles['note'];
          }
          return {
            ...prev,
            [activeWorkspaceId]: {
              id: activeWorkspaceId,
              name: current?.name === 'Workspace' ? 'Generated Application' : current?.name || 'Generated Application',
              path: `Workspace: ${activeWorkspaceId}`,
              files: updatedFiles,
              activeFile: Object.keys(extracted)[0] || Object.keys(updatedFiles)[0] || '',
              lastModified: 'Just now',
            },
          };
        });
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generatedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel.id,
        premiumName: data.premiumName || selectedModel.premiumName,
        steps: hasCode ? [
          { id: '1', title: 'Analyzed prompt & workspace context', status: 'completed' },
          { id: '2', title: `Synthesized executable production code`, status: 'completed' },
          { id: '3', title: `Generated ${Object.keys(extracted).length} files ready in Code & Live Preview`, status: 'completed' },
        ] : undefined,
        artifact: hasCode ? {
          id: `artifact_${Date.now()}`,
          title: currentWorkspace.name === 'Workspace' ? 'Generated Application' : currentWorkspace.name,
          type: 'website',
          subtitle: 'Artifact • Only you',
          files: extracted,
          mainFile: Object.keys(extracted)[0] || 'index.html',
        } : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: formatApiError(err),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenArtifact = (artifact: Artifact) => {
    if (artifact.files) {
      setWorkspaces((prev) => {
        const current = prev[activeWorkspaceId] || prev['starter'];
        return {
          ...prev,
          [activeWorkspaceId]: {
            ...current,
            files: {
              ...current.files,
              ...artifact.files,
            },
            activeFile: artifact.mainFile || Object.keys(artifact.files)[0] || '',
            lastModified: 'Just now',
          },
        };
      });
    }
    setViewMode('preview');
    showNotification('Opened artifact in Live Preview');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9F5] text-stone-900 font-sans antialiased">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentWorkspaceId={activeWorkspaceId}
        workspaces={workspaces}
        onSelectWorkspace={(id) => {
          setActiveWorkspaceId(id);
          showNotification(`Switched to ${workspaces[id]?.name || 'Workspace'}`);
        }}
        onNewProject={() => {
          const newId = `project_${Date.now()}`;
          setWorkspaces((prev) => ({
            ...prev,
            [newId]: {
              id: newId,
              name: 'New Application',
              path: 'Custom Project',
              files: {
                'index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <title>New Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="card">\n    <h1>Hello from Vikranth AI</h1>\n    <p>Ask the agent to build any application!</p>\n  </div>\n</body>\n</html>`,
                'style.css': `body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }\n.card { background: #1e293b; padding: 2rem 3rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; }`,
              },
              activeFile: 'index.html',
              lastModified: 'Just created',
            },
          }));
          setActiveWorkspaceId(newId);
          setViewMode('code');
          showNotification('Created new workspace');
        }}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onOpenLocalFolder={handleOpenLocalFolder}
        onImportZipFile={handleImportZipFile}
        onFixWorkspaceBugs={handleFixWorkspaceBugs}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Modern Top Header */}
        <Header
          viewMode={viewMode}
          onChangeViewMode={(mode) => setViewMode(mode)}
          splitView={splitView}
          onToggleSplitView={() => setSplitView(!splitView)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedModel={selectedModel}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
          isIncognito={isIncognito}
          onToggleIncognito={() => {
            setIsIncognito(!isIncognito);
            showNotification(isIncognito ? 'Exited Incognito mode' : 'Switched to Incognito mode');
          }}
          onExportProject={handleExportZip}
          onOpenFirebaseDeploy={() => setIsFirebaseDeployOpen(true)}
          activeProjectName={currentWorkspace.name}
          previewDevice={previewDevice}
          onChangePreviewDevice={setPreviewDevice}
          currentUser={currentUser}
          onSignInWithGoogle={handleSignInWithGoogle}
          onSignOut={handleSignOut}
        />

        {/* Dynamic View Layout */}
        <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden">
          {splitView ? (
            /* Split View: Chat on Left, Code or Preview on Right */
            <>
              <div className="w-1/2 h-full border-r border-stone-200 flex flex-col">
                <ChatView
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onSelectModelById={(id) => {
                    const m = MODELS_LIST.find((x) => x.id === id);
                    if (m) setSelectedModel(m);
                  }}
                  effort={effort}
                  onOpenModelSelector={() => setIsModelSelectorOpen(true)}
                  onOpenArtifact={handleOpenArtifact}
                  onSwitchToCode={() => setViewMode('code')}
                  isIncognito={isIncognito}
                  onOpenLocalFolder={handleOpenLocalFolder}
                  onImportZipFile={handleImportZipFile}
                  onFixWorkspaceBugs={handleFixWorkspaceBugs}
                  currentWorkspace={currentWorkspace}
                />
              </div>
              <div className="w-1/2 h-full flex flex-col">
                {viewMode === 'code' ? (
                  <CodeView
                    workspace={currentWorkspace}
                    onUpdateFile={handleUpdateFile}
                    onSelectFile={handleSelectFile}
                    onAddFile={handleAddFile}
                    onDeleteFile={handleDeleteFile}
                    onExportZip={handleExportZip}
                    onOpenFirebaseDeploy={() => setIsFirebaseDeployOpen(true)}
                    onSaveToDisk={handleSaveToDisk}
                    isDiskBacked={isDiskBacked}
                    onAgentPrompt={(prompt) => handleSendMessage(`[Action on ${currentWorkspace.name}]: ${prompt}`)}
                  />
                ) : (
                  <PreviewView
                    workspace={currentWorkspace}
                    onSwitchToCode={() => setViewMode('code')}
                    onSwitchToChat={() => setViewMode('chat')}
                    onOpenFirebaseDeploy={() => setIsFirebaseDeployOpen(true)}
                    previewDevice={previewDevice}
                    onChangePreviewDevice={setPreviewDevice}
                  />
                )}
              </div>
            </>
          ) : (
            /* Single Full-Screen View */
            <>
              {viewMode === 'chat' && (
                <ChatView
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onSelectModelById={(id) => {
                    const m = MODELS_LIST.find((x) => x.id === id);
                    if (m) setSelectedModel(m);
                  }}
                  effort={effort}
                  onOpenModelSelector={() => setIsModelSelectorOpen(true)}
                  onOpenArtifact={handleOpenArtifact}
                  onSwitchToCode={() => setViewMode('code')}
                  isIncognito={isIncognito}
                  onOpenLocalFolder={handleOpenLocalFolder}
                  onImportZipFile={handleImportZipFile}
                  onFixWorkspaceBugs={handleFixWorkspaceBugs}
                  currentWorkspace={currentWorkspace}
                />
              )}

              {viewMode === 'code' && (
                <CodeView
                  workspace={currentWorkspace}
                  onUpdateFile={handleUpdateFile}
                  onSelectFile={handleSelectFile}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                  onExportZip={handleExportZip}
                  onOpenFirebaseDeploy={() => setIsFirebaseDeployOpen(true)}
                  onSaveToDisk={handleSaveToDisk}
                  isDiskBacked={isDiskBacked}
                  onAgentPrompt={(prompt) => handleSendMessage(`[Action on ${currentWorkspace.name}]: ${prompt}`)}
                />
              )}

              {viewMode === 'preview' && (
                <PreviewView
                  workspace={currentWorkspace}
                  onSwitchToCode={() => setViewMode('code')}
                  onSwitchToChat={() => setViewMode('chat')}
                  onOpenFirebaseDeploy={() => setIsFirebaseDeployOpen(true)}
                  previewDevice={previewDevice}
                  onChangePreviewDevice={setPreviewDevice}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Firebase Deploy Modal */}
      <FirebaseDeployModal
        isOpen={isFirebaseDeployOpen}
        onClose={() => setIsFirebaseDeployOpen(false)}
        workspace={currentWorkspace}
        onAddFilesToWorkspace={handleAddFilesToWorkspace}
        onNotify={showNotification}
      />

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={(model) => {
          setSelectedModel(model);
          showNotification(`Switched model to ${model.premiumName}`);
        }}
        effort={effort}
        onChangeEffort={setEffort}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {notification}
        </div>
      )}
    </div>
  );
}
