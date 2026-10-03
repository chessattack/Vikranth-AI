import { generateWithModelFallback, MODEL_REGISTRY } from './_ai';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      prompt,
      modelKey = 'gemini-3.8-flash',
      currentFiles = {},
      workspacePath = '',
      history = [],
      role = 'general',
      customSystemInstruction,
    } = body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let targetModel = modelKey;
    if (!MODEL_REGISTRY[targetModel]) {
      targetModel = 'gemini-3.8-flash';
    }

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

    return res.status(200).json({
      reply: result.text,
      modelUsed: usedModel,
      premiumName: MODEL_REGISTRY[usedModel]?.premiumName || 'Apex',
    });
  } catch (err: any) {
    console.error('[Vercel API /chat error]:', err);
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
    return res.status(500).json({ error: cleanMessage });
  }
}
