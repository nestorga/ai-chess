export type ModelName = 'haiku' | 'sonnet' | 'opus' | 'gemini-3' | 'gemini-flash' | 'gpt-5.2';

export const MODEL_IDS: Record<ModelName, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-opus-4-5-20251101',
  'gemini-3': 'gemini-3-pro-preview',
  'gemini-flash': 'gemini-flash-latest',
  'gpt-5.2': 'gpt-5.2',
} as const;

export function getModelId(modelName: ModelName): string {
  return MODEL_IDS[modelName];
}

export function isValidModelName(name: string): name is ModelName {
  return name in MODEL_IDS;
}
