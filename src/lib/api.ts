import { getApiBaseUrl, setApiBaseUrl } from './config';

const base = () => getApiBaseUrl();

export const healthApi = {
  check: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${base()}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};

export const voiceApi = {
  processVoice: async (audioBlob: Blob, language: string, location?: string, season?: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_query.webm');
    formData.append('language', language);
    if (location) formData.append('location', location);
    if (season) formData.append('season', season);

    const res = await fetch(`${base()}/voice/process`, { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Voice API error');
    return data;
  },

  processText: async (query: string, language: string, location?: string, season?: string) => {
    const res = await fetch(`${base()}/voice/text-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language, location: location || 'India', season: season || 'current' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Text API error');
    return data;
  },

  getSupportedLanguages: async () => {
    const res = await fetch(`${base()}/voice/languages`);
    return res.json();
  },

  getSampleQuestions: async (language: string): Promise<string[]> => {
    const res = await fetch(`${base()}/voice/sample-questions?language=${encodeURIComponent(language)}`);
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data.questions) ? data.questions : [];
  },
};

export const diseaseApi = {
  predict: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${base()}/predict`, { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Prediction failed');
    return data;
  },
};

export { getApiBaseUrl, setApiBaseUrl };
