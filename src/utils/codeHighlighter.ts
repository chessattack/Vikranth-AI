import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';

export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html':
    case 'htm':
    case 'svg':
    case 'xml':
      return 'markup';
    case 'css':
      return 'css';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'json':
      return 'json';
    case 'py':
      return 'python';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'md':
      return 'markdown';
    default:
      if (filename.toLowerCase() === 'note') return 'none';
      return 'javascript';
  }
};

export const getLanguageDisplayName = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html':
    case 'htm':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'js':
      return 'JavaScript';
    case 'ts':
      return 'TypeScript';
    case 'jsx':
      return 'React JSX';
    case 'tsx':
      return 'React TSX';
    case 'json':
      return 'JSON';
    case 'py':
      return 'Python';
    case 'sh':
    case 'bash':
      return 'Shell Script';
    case 'sql':
      return 'SQL';
    case 'md':
      return 'Markdown';
    default:
      return filename.toUpperCase();
  }
};

export const highlightCode = (code: string, filename: string): string => {
  const lang = getLanguageFromFilename(filename);
  if (lang === 'none' || !Prism.languages[lang]) {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  try {
    return Prism.highlight(code, Prism.languages[lang], lang);
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};
