import React, { useState } from 'react';
import {
  X,
  Globe,
  UploadCloud,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  FileCode2,
  FolderArchive,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ProjectWorkspace } from '../types';
import { firebaseConfig } from '../firebase';
import JSZip from 'jszip';

interface FirebaseDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: ProjectWorkspace;
  onAddFilesToWorkspace: (files: Record<string, string>) => void;
  onNotify: (msg: string) => void;
}

export const FirebaseDeployModal: React.FC<FirebaseDeployModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onAddFilesToWorkspace,
  onNotify,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'cli' | 'github'>('quick');

  if (!isOpen) return null;

  const projectId = firebaseConfig.projectId;
  const liveUrl1 = `https://${projectId}.web.app`;
  const liveUrl2 = `https://${projectId}.firebaseapp.com`;

  const firebaseJsonContent = JSON.stringify(
    {
      hosting: {
        public: "dist",
        ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      },
    },
    null,
    2
  );

  const firebasercContent = JSON.stringify(
    {
      projects: {
        default: projectId,
      },
    },
    null,
    2
  );

  const githubWorkflowContent = `name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '\${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '\${{ secrets.FIREBASE_SERVICE_ACCOUNT_${projectId.toUpperCase().replace(/-/g, '_')} }}'
          channelId: live
          projectId: ${projectId}
`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    onNotify('Copied to clipboard!');
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleInjectHostingFiles = () => {
    setIsInjecting(true);
    onAddFilesToWorkspace({
      'firebase.json': firebaseJsonContent,
      '.firebaserc': firebasercContent,
    });
    setTimeout(() => {
      setIsInjecting(false);
      onNotify('Added firebase.json and .firebaserc to workspace!');
    }, 400);
  };

  const handleDownloadDeployZip = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();

      // Add all workspace files
      Object.entries(workspace.files).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      // Ensure firebase.json and .firebaserc are present
      if (!workspace.files['firebase.json']) {
        zip.file('firebase.json', firebaseJsonContent);
      }
      if (!workspace.files['.firebaserc']) {
        zip.file('.firebaserc', firebasercContent);
      }

      // Add a quick deploy README
      zip.file(
        'DEPLOY_README.md',
        `# Deploy Vikranth AI to Firebase Hosting: ${projectId}

This package is configured for instant deployment to Firebase Hosting.

## 1. Quick Deploy Steps:
\`\`\`bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to your Firebase account
firebase login

# 3. Build the production bundle
npm run build

# 4. Deploy the dist folder to Firebase Hosting
firebase deploy --only hosting
\`\`\`

## Live URL after deployment:
- ${liveUrl1}
- ${liveUrl2}
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectId}-firebase-hosting.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onNotify(`Downloaded ${projectId}-firebase-hosting.zip!`);
    } catch (e: any) {
      console.error(e);
      onNotify('Failed to create deployment zip.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-stone-900 text-base">Firebase Hosting & Deployment</h3>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Configured</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">Project: {projectId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-stone-100 px-6 bg-white">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'quick'
                ? 'border-amber-500 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            1-Click Workspace Setup
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cli'
                ? 'border-amber-500 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Firebase CLI Deploy
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-amber-500 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            GitHub Actions CI/CD
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Live Hosting Domains Box */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900 mb-1">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Target Live URL</span>
              </div>
              <a
                href={liveUrl1}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-amber-700 hover:underline flex items-center space-x-1"
              >
                <span>{liveUrl1}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="text-[11px] text-amber-800/80 mt-0.5">
                Secondary: <span className="font-mono">{liveUrl2}</span>
              </div>
            </div>

            <a
              href={liveUrl1}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0"
            >
              <span>Visit Live URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Inject files */}
                <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-300 transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm mb-1.5">
                      <FileCode2 className="w-4 h-4 text-amber-600" />
                      <span>Inject Hosting Config</span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                      Adds authentic <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">firebase.json</code> and <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">.firebaserc</code> directly into your code editor workspace.
                    </p>
                  </div>
                  <button
                    onClick={handleInjectHostingFiles}
                    disabled={isInjecting}
                    className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isInjecting ? 'Adding...' : 'Add Config to Workspace'}</span>
                  </button>
                </div>

                {/* 2. Download package */}
                <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-300 transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm mb-1.5">
                      <FolderArchive className="w-4 h-4 text-amber-600" />
                      <span>Download Deploy ZIP</span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                      Downloads all current workspace files packaged with complete Firebase Hosting configuration ready for one-command deploy.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadDeployZip}
                    disabled={isExporting}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Bundling...' : 'Download Hosting ZIP'}</span>
                  </button>
                </div>
              </div>

              {/* Quick CLI 1-liner */}
              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-200 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Build & Deploy Command</span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `npm run build && npx firebase-tools deploy --only hosting --project ${projectId}`,
                        '1line'
                      )
                    }
                    className="text-stone-300 hover:text-white flex items-center space-x-1"
                  >
                    {copiedCmd === '1line' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === '1line' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-black/50 p-2.5 rounded-xl overflow-x-auto text-emerald-400 select-all">
                  npm run build &amp;&amp; npx firebase-tools deploy --only hosting --project {projectId}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-3 font-mono text-xs">
              <p className="text-xs font-sans text-stone-600">
                Run these standard steps in your project folder to publish directly to <span className="font-semibold text-stone-900">{projectId}</span>:
              </p>

              <div className="space-y-2">
                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 select-none mr-2">1.</span>
                    <span className="text-amber-300">npm install -g firebase-tools</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('npm install -g firebase-tools', 'step1')}
                    className="p-1 hover:text-white text-stone-400"
                  >
                    {copiedCmd === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 select-none mr-2">2.</span>
                    <span className="text-amber-300">firebase login</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('firebase login', 'step2')}
                    className="p-1 hover:text-white text-stone-400"
                  >
                    {copiedCmd === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 select-none mr-2">3.</span>
                    <span className="text-amber-300">firebase use {projectId}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`firebase use ${projectId}`, 'step3')}
                    className="p-1 hover:text-white text-stone-400"
                  >
                    {copiedCmd === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 select-none mr-2">4.</span>
                    <span className="text-cyan-300 font-semibold">npm run build</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('npm run build', 'step4_build')}
                    className="p-1 hover:text-white text-stone-400"
                  >
                    {copiedCmd === 'step4_build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-stone-900 text-stone-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 select-none mr-2">5.</span>
                    <span className="text-emerald-400 font-bold">firebase deploy --only hosting</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('firebase deploy --only hosting', 'step4')}
                    className="p-1 hover:text-white text-stone-400"
                  >
                    {copiedCmd === 'step4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">
                  CI/CD Workflow file (<code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">.github/workflows/firebase-hosting.yml</code>):
                </span>
                <button
                  onClick={() => copyToClipboard(githubWorkflowContent, 'gh')}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
                >
                  {copiedCmd === 'gh' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd === 'gh' ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-stone-900 text-stone-200 rounded-2xl text-[11px] font-mono leading-5 overflow-x-auto max-h-52">
                {githubWorkflowContent}
              </pre>

              <button
                onClick={() => {
                  onAddFilesToWorkspace({
                    '.github/workflows/firebase-hosting.yml': githubWorkflowContent,
                  });
                  onNotify('Added GitHub Actions Firebase workflow to workspace!');
                }}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Add Workflow File to Workspace
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/50 text-xs text-stone-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Firebase SDK v11 Connected</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
