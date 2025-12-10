export type ModelName = 'haiku' | 'sonnet' | 'opus';

export const MODEL_IDS: Record<ModelName, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-opus-4-5-20251101'
} as const;

export function getModelId(modelName: ModelName): string {
  return MODEL_IDS[modelName];
}

export function isValidModelName(name: string): name is ModelName {
  return name in MODEL_IDS;
}
