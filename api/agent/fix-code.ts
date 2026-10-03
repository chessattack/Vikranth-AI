import { generateWithModelFallback, MODEL_REGISTRY } from '../_ai';

export default async function handler(req: any, res: any) {
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
    const { files, instructions, modelKey = 'gemini-3.1-pro-preview' } = body;

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
    return res.status(200).json({
      reply: result.text,
      modelUsed: usedModel,
      premiumName: MODEL_REGISTRY[usedModel]?.premiumName || 'Apex',
    });
  } catch (err: any) {
    console.error('[Vercel API /agent/fix-code error]:', err);
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
    return res.status(500).json({ error: cleanMessage });
  }
}
