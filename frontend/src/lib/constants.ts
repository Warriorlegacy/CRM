export const STAGES = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'yellow' },
  { value: 'follow-up', label: 'Follow-up', color: 'orange' },
  { value: 'negotiation', label: 'Negotiation', color: 'purple' },
  { value: 'proposal', label: 'Proposal', color: 'cyan' },
  { value: 'won', label: 'Won', color: 'green' },
  { value: 'lost', label: 'Lost', color: 'red' },
] as const;

export type StageValue = (typeof STAGES)[number]['value'];

export const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', color: 'green' },
  { value: 'instagram', label: 'Instagram', color: 'purple' },
] as const;

export type ChannelValue = (typeof CHANNELS)[number]['value'];

export const LEAD_TEMPERATURES = [
  { min: 0, max: 20, label: 'Cold', color: 'blue' },
  { min: 21, max: 50, label: 'Warm', color: 'yellow' },
  { min: 51, max: 80, label: 'Hot', color: 'orange' },
  { min: 81, max: 100, label: 'Burning', color: 'red' },
] as const;

export const FOLLOWUP_STATUSES = ['pending', 'completed', 'cancelled'] as const;

export const CONVERSATION_STATUSES = ['open', 'closed', 'archived'] as const;

export const MESSAGE_TYPES = ['text', 'image', 'document', 'audio', 'video', 'location', 'sticker'] as const;

export const TEMPLATE_CATEGORIES = ['marketing', 'utility', 'authentication'] as const;

export const AI_PROVIDERS = [
  '__custom__',
  'openai',
  'openrouter',
  'groq',
  'cerebras',
  'mistral',
  'nvidia_nim',
  'xai',
  'gemini',
  'cohere',
] as const;

export type AiProviderValue = (typeof AI_PROVIDERS)[number];

// ─── Color Maps (Tailwind classes for stage/temperature rendering) ──

export const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  'follow-up': 'bg-orange-500/20 text-orange-400',
  followup: 'bg-yellow-500/20 text-yellow-400',
  negotiation: 'bg-purple-500/20 text-purple-400',
  proposal: 'bg-cyan-500/20 text-cyan-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
};

export const STAGE_DOT_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  'follow-up': 'bg-orange-500',
  followup: 'bg-yellow-500',
  negotiation: 'bg-purple-500',
  proposal: 'bg-cyan-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

export const LEAD_TEMP_COLORS: Record<string, string> = {
  Cold: 'bg-blue-500/20 text-blue-400',
  Warm: 'bg-yellow-500/20 text-yellow-400',
  Hot: 'bg-orange-500/20 text-orange-400',
  Burning: 'bg-red-500/20 text-red-400',
};
