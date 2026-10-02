import JSZip from 'jszip';
import { ProjectWorkspace } from '../types';

// Real browser File System Access API support
export interface DirectoryHandleStore {
  handle: FileSystemDirectoryHandle;
  files: Map<string, FileSystemFileHandle>;
}

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// 1. Real Local Folder / Drive Picker
export async function openLocalFolderFromDisk(): Promise<{
  workspace: ProjectWorkspace;
  dirStore?: DirectoryHandleStore;
}> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Your browser does not support the File System Access API. Please use the ZIP or File Import button.');
  }

  // Real browser prompt asking user to select their folder or drive
  const dirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
  });

  const filesMap = new Map<string, FileSystemFileHandle>();
  const filesRecord: Record<string, string> = {};

  // Recursive reader
  async function readDirectory(handle: FileSystemDirectoryHandle, currentPath = '') {
    for await (const entry of (handle as any).values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.kind === 'file') {
        // Skip large binaries, .git, node_modules
        if (
          entry.name.startsWith('.') ||
          entryPath.includes('node_modules') ||
          entryPath.includes('.git')
        ) {
          continue;
        }

        const fileHandle = entry as FileSystemFileHandle;
        filesMap.set(entryPath, fileHandle);

        try {
          const file = await fileHandle.getFile();
          // Read text files
          if (
            file.type.startsWith('text/') ||
            /\.(html|htm|css|js|jsx|ts|tsx|json|py|txt|md|svg|xml|csv)$/i.test(file.name)
          ) {
            const text = await file.text();
            filesRecord[entryPath] = text;
          }
        } catch (err) {
          console.warn(`Could not read file ${entryPath}:`, err);
        }
      } else if (entry.kind === 'directory') {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          await readDirectory(entry as FileSystemDirectoryHandle, entryPath);
        }
      }
    }
  }

  await readDirectory(dirHandle);

  const folderName = dirHandle.name || 'Local Folder';
  const firstFile = Object.keys(filesRecord)[0] || 'index.html';

  const workspace: ProjectWorkspace = {
    id: `local_${Date.now()}`,
    name: folderName,
    path: `Local Drive: ${folderName}`,
    files: Object.keys(filesRecord).length > 0 ? filesRecord : {
      'index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <title>${folderName}</title>\n</head>\n<body>\n  <h1>${folderName}</h1>\n  <p>Folder opened successfully. Start editing files here.</p>\n</body>\n</html>`,
    },
    activeFile: firstFile,
    lastModified: new Date().toLocaleTimeString(),
  };

  return {
    workspace,
    dirStore: {
      handle: dirHandle,
      files: filesMap,
    },
  };
}

// 2. Real ZIP File Extractor (for petfeeder.zip or any user zip)
export async function extractZipToWorkspace(file: File): Promise<ProjectWorkspace> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const filesRecord: Record<string, string> = {};

  const entries = Object.keys(loadedZip.files);
  for (const filename of entries) {
    const zipEntry = loadedZip.files[filename];
    if (!zipEntry.dir && !filename.startsWith('__MACOSX') && !filename.includes('/.')) {
      // Determine if text readable
      try {
        const text = await zipEntry.async('string');
        filesRecord[filename] = text;
      } catch (err) {
        console.warn(`Could not extract ${filename} as text:`, err);
      }
    }
  }

  const cleanName = file.name.replace(/\.zip$/i, '');
  const firstFile = Object.keys(filesRecord).find((f) => f.endsWith('.html')) || Object.keys(filesRecord)[0] || 'index.html';

  return {
    id: `zip_${Date.now()}`,
    name: cleanName,
    path: `Imported Archive: ${file.name}`,
    files: filesRecord,
    activeFile: firstFile,
    lastModified: 'Just now',
  };
}

// 3. Save a file back to local disk handle
export async function saveFileToDiskHandle(
  fileHandle: FileSystemFileHandle,
  content: string
): Promise<boolean> {
  try {
    const writable = await (fileHandle as any).createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    console.error('Failed to write file to disk handle:', err);
    return false;
  }
}
