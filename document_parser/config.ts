// API key is only available server-side — never expose this to the client.
// Access via getApiKey() so the module doesn't throw at import time.
export function getApiKey(): string {
  const key = process.env.MEGALLM_API_KEY;
  if (!key) {
    throw new Error('MEGALLM_API_KEY is missing from environment variables');
  }
  return key;
}

export const MEGA_LLM_CONFIG = {
  baseURL: 'https://ai.megallm.io/v1',
  model: 'deepseek-ai/deepseek-v3.1',
  maxTokens: 4096,
  temperature: 0.1,
};
