// Runtime-configurable API base URL utilities
// Uses localStorage and URL query param for flexible configuration

export const getApiBaseUrl = (): string => {
  const fromQuery = new URLSearchParams(window.location.search).get('apiBaseUrl');
  if (fromQuery) {
    try {
      const url = new URL(fromQuery);
      const str = url.toString();
      const normalized = str.endsWith('/') ? str.slice(0, -1) : str;
      localStorage.setItem('apiBaseUrl', normalized);
      return normalized;
    } catch {
      // ignore invalid URL in query
    }
  }
  const stored = localStorage.getItem('apiBaseUrl');
  if (stored) return stored;
  return 'http://localhost:5000/api';
};

export const setApiBaseUrl = (url: string) => {
  try {
    const u = new URL(url);
    const str = u.toString();
    const normalized = str.endsWith('/') ? str.slice(0, -1) : str;
    localStorage.setItem('apiBaseUrl', normalized);
  } catch {
    // keep as-is if invalid; caller should validate
    localStorage.setItem('apiBaseUrl', url);
  }
};
