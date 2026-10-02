import { ModelInfo } from '../types';

export const CATEGORIES = [
  { id: 'all', label: 'All Models' },
  { id: 'reasoning', label: 'Reasoning & Architecture' },
  { id: 'fast', label: 'Fast & Lightweight' },
];

export const MODELS_LIST: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    originalName: 'Gemini 3.8 Flash',
    premiumName: 'Apex',
    feel: 'Flagship Intelligence',
    category: 'reasoning',
    description: 'Frontier multimodal flagship powerhouse combining deep thought, code mastery, and high throughput.',
    badge: 'Flagship Intelligence',
    effortSupported: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    originalName: 'Gemini 3.1 Pro',
    premiumName: 'Titan',
    feel: 'Heavyweight Reasoning',
    category: 'reasoning',
    description: 'Heavyweight reasoning and master-tier coding engine built for complex architectures and autonomous tasks.',
    badge: 'Heavyweight Reasoning',
    effortSupported: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    originalName: 'Gemini 3.1 Flash Lite',
    premiumName: 'Zephyr',
    feel: 'Ultra-Fast Lightweight',
    category: 'fast',
    description: 'Sub-second latency model optimized for instant code completion, quick queries, and snappy assistance.',
    badge: 'Ultra-Fast Lightweight',
    effortSupported: false,
  },
  {
    id: 'gemini-3.5-flash',
    originalName: 'Gemini 3.5 Flash',
    premiumName: 'Vela',
    feel: 'Fast & Effortless',
    category: 'fast',
    description: 'Ultra-responsive intelligence designed for fluid, high-throughput daily interactions.',
    badge: 'Fast & Effortless',
    effortSupported: false,
  },
];
