import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware allowing cross-origin requests from all hosts
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Gemini SDK initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const MODEL_REGISTRY: Record<string, { originalName: string; premiumName: string; feel: string; category: string; description: string }> = {
  'gemini-3.8-flash': {
    originalName: 'Gemini 3.8 Flash',
    premiumName: 'Apex',
    feel: 'Flagship Intelligence',
    category: 'reasoning',
    description: 'Frontier multimodal flagship powerhouse combining deep thought with speed.',
  },
  'gemini-3.1-pro-preview': {
    originalName: 'Gemini 3.1 Pro',
    premiumName: 'Titan',
    feel: 'Heavyweight Reasoning',
    category: 'reasoning',
    description: 'Heavyweight reasoning and master-tier coding engine built for complex architectures.',
  },
  'gemini-3.1-flash-lite': {
    originalName: 'Gemini 3.1 Flash Lite',
    premiumName: 'Zephyr',
    feel: 'Ultra-Fast Lightweight',
    category: 'fast',
    description: 'Sub-second latency model optimized for instant code completion and snappy responses.',
  },
  'gemini-3.5-flash': {
    originalName: 'Gemini 3.5 Flash',
    premiumName: 'Vela',
    feel: 'Fast & Effortless',
    category: 'fast',
    description: 'Ultra-responsive intelligence designed for fluid, high-throughput daily interactions.',
  },
};

/**
 * Multi-model resilient executor with per-model timeout and automatic cascading fallback:
 * 1st: requested model (up to 25s)
 * 2nd: gemini-3.5-flash (massive capacity, ultra-stable workhorse)
 * 3rd: gemini-3.1-flash-lite (fast sub-second recovery)
 * 4th: gemini-flash-latest (latest stable general flash alias)
 */
async function generateWithModelFallback(
  preferredModel: string,
  contents: any,
  config?: any,
  timeoutMs = 25000
): Promise<{ text: string; modelUsed: string }> {
  let normalized = preferredModel || 'gemini-3.8-flash';
  if (!MODEL_REGISTRY[normalized]) {
    normalized = 'gemini-3.8-flash';
  }

  const candidateModels = [
    normalized,
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];
  const uniqueCandidates = [...new Set(candidateModels)];

  let lastError: any;
  for (let i = 0; i < uniqueCandidates.length; i++) {
    const modelToTry = uniqueCandidates[i];
    try {
      const attemptConfig: any = { ...(config || {}) };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on ${modelToTry}`)), timeoutMs)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: modelToTry,
          contents,
          config: attemptConfig,
        }),
        timeoutPromise,
      ]);

      return {
        text: response.text || '',
        modelUsed: modelToTry,
      };
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.statusCode || 0;
      const msg = (err.message || '').slice(0, 120);
      console.warn(`[Vikranth AI] Model ${modelToTry} attempt failed (${status || 'error'}): ${msg}. Trying next fallback candidate...`);
    }
  }

  throw lastError;
}

// 1. Get Models Registry
app.get('/api/models', (_req: Request, res: Response) => {
  res.json({ models: MODEL_REGISTRY });
});

// 2. Chat & Code Generation Dispatcher
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      modelKey = 'gemini-3.8-flash',
      currentFiles = {},
      workspacePath = '',
      history = [],
      role = 'general',
      customSystemInstruction,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let targetModel = modelKey;
    if (!MODEL_REGISTRY[targetModel]) {
      targetModel = 'gemini-3.8-flash';
    }

    // Build context with user workspace files if provided
    let filesContext = '';
    const fileEntries = Object.entries(currentFiles);
    if (fileEntries.length > 0) {
      filesContext = `\n\nCURRENT USER WORKSPACE FILES (${workspacePath || 'User Project'}):\n`;
      fileEntries.forEach(([filePath, content]) => {
        filesContext += `--- FILE: ${filePath} ---\n${content}\n--- END FILE ---\n\n`;
      });
    }

    let roleSystem = '';
    if (role === 'architect' || role === 'complex') {
      roleSystem = 'Role: You are Titan, an elite architectural AI engineer and deep reasoning agent specializing in complex algorithms, system design, and advanced software architecture.';
    } else if (role === 'fast') {
      roleSystem = 'Role: You are Zephyr, an ultra-low latency, snappy assistant providing instantaneous answers, quick code snippets, and rapid solutions.';
    } else {
      roleSystem = 'Role: You are Vela, an ultra-fast, intelligent, and versatile Gemini assistant designed for comprehensive productivity, coding, writing, and general tasks.';
    }

    const systemPrompt = `${customSystemInstruction || roleSystem}
You are Vikranth AI, an elite autonomous AI engineer and agent.
You inspect real code, diagnose actual bugs, and generate clean, fully functional production code.
When generating or modifying files:
1. Provide a concise, clear explanation of your steps.
2. Output real, complete, executable code in code blocks with the exact filename:
\`\`\`html:index.html
...
\`\`\`
or
\`\`\`javascript:app.js
...
\`\`\`
or
\`\`\`css:style.css
...
\`\`\`
Never output placeholders, truncated ellipsis, or fake dummy mockups. Produce real code ready for live execution in the preview.`;

    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-8).forEach((h: any) => {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: `${prompt}${filesContext}` }],
    });

    const config = {
      systemInstruction: systemPrompt,
    };

    const result = await generateWithModelFallback(targetModel, contents, config, 25000);

    const usedModel = result.modelUsed || targetModel;
    res.json({
      reply: result.text,
      modelUsed: usedModel,
      premiumName: MODEL_REGISTRY[usedModel]?.premiumName || 'Apex',
    });
  } catch (err: any) {
    console.error('[Vikranth AI] Chat error:', err);
    let cleanMessage = err.message || 'Internal server error';
    try {
      const parsed = JSON.parse(cleanMessage);
      if (parsed?.error?.message) {
        cleanMessage = parsed.error.message;
      }
    } catch {
      // not json
    }
    if (cleanMessage.includes('Timeout') || cleanMessage.includes('503') || cleanMessage.includes('demand')) {
      cleanMessage = 'The AI model is experiencing a high-demand spike. Please try sending your message again.';
    }
    res.status(500).json({ error: cleanMessage });
  }
});

// 3. Autonomous Bug Fix / Code Refactor Agent
app.post('/api/agent/fix-code', async (req: Request, res: Response) => {
  try {
    const { files, instructions, modelKey = 'gemini-3.1-pro-preview' } = req.body;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'No files provided to analyze.' });
    }

    let targetModel = modelKey || 'gemini-3.8-flash';
    if (!MODEL_REGISTRY[targetModel]) {
      targetModel = 'gemini-3.8-flash';
    }

    let filesPayload = 'HERE ARE THE ACTUAL USER FILES TO ANALYZE AND FIX:\n\n';
    Object.entries(files).forEach(([name, content]) => {
      filesPayload += `### FILE: ${name}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    });

    const agentPrompt = `${instructions || 'Please analyze all the code files above, detect all bugs, errors, layout issues, or syntax mistakes, fix them completely, and return the corrected files.'}

CRITICAL: Return each fixed file in full with its filename tag like:
\`\`\`html:index.html
(full fixed file content)
\`\`\`
or
\`\`\`javascript:app.js
(full fixed file content)
\`\`\`
Also provide a concise list of bugs found and what you fixed.`;

    const fixConfig = {
      systemInstruction: 'You are Vikranth AI Autonomous Debugger & Code Repair Agent. You inspect real code, diagnose errors, and rewrite files cleanly with 100% complete, working code.',
    };

    const result = await generateWithModelFallback(
      targetModel,
      [{ role: 'user', parts: [{ text: `${filesPayload}\n\n${agentPrompt}` }] }],
      fixConfig,
      30000
    );

    const usedModel = result.modelUsed || targetModel;
    res.json({
      reply: result.text,
      modelUsed: usedModel,
      premiumName: MODEL_REGISTRY[usedModel]?.premiumName || 'Apex',
    });
  } catch (err: any) {
    console.error('[Vikranth AI] Fix code error:', err);
    let cleanMessage = err.message || 'Agent failed to fix code.';
    try {
      const parsed = JSON.parse(cleanMessage);
      if (parsed?.error?.message) {
        cleanMessage = parsed.error.message;
      }
    } catch {
      // not json
    }
    if (cleanMessage.includes('Timeout') || cleanMessage.includes('503') || cleanMessage.includes('demand')) {
      cleanMessage = 'The AI model is experiencing a high-demand spike. Please try sending your request again.';
    }
    res.status(500).json({ error: cleanMessage });
  }
});

// CRITICAL: Explicit JSON 404 for ANY unmatched /api/* route so it NEVER falls through to index.html!
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Full-stack Vite dev middleware or production static serving
async function startServer() {
  const server = http.createServer(app);
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const numericPort = Number(PORT) || 3000;
  server.listen(numericPort, () => {
    console.log(`[Vikranth AI] Server running on port ${numericPort}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
