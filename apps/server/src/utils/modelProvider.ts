import { appConfig } from '../config.js';
import type { ModelProvider } from '@ai-chat/shared';

export const modelProviderDefaults: Record<ModelProvider, { label: string; baseURL: string; model: string }> = {
  deepseek: {
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
  },
  zhipu: {
    label: '智谱',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-5.2',
  },
};

export function resolveModelProvider(provider?: string): ModelProvider {
  if (provider === 'zhipu' || provider === 'deepseek') return provider;
  return appConfig.defaultModelProvider;
}

export function resolveModelBaseURL(provider?: string, baseURL?: string): string {
  if (baseURL && baseURL.trim()) return baseURL.trim().replace(/\/+$/, '');

  const resolvedProvider = resolveModelProvider(provider || appConfig.defaultModelProvider);
  if (provider) return modelProviderDefaults[resolvedProvider].baseURL;

  return appConfig.defaultModelBaseUrl.replace(/\/+$/, '');
}

export function resolveModelName(provider?: string, model?: string): string {
  if (model && model.trim()) return model.trim();

  const resolvedProvider = resolveModelProvider(provider || appConfig.defaultModelProvider);
  if (provider) return modelProviderDefaults[resolvedProvider].model;

  return appConfig.defaultModel;
}

export function buildChatCompletionsUrl(baseURL: string): string {
  const normalized = baseURL.replace(/\/+$/, '');
  if (/\/(?:v1|v4)$/.test(normalized) || /\/paas\/v\d+$/.test(normalized)) {
    return `${normalized}/chat/completions`;
  }

  return `${normalized}/v1/chat/completions`;
}
