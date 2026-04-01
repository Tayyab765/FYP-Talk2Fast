/**
 * In dev, if VITE_API_BASE_URL is unset, use same-origin `/api` so Vite can proxy
 * to the gateway (see vite.config.js). Avoids CORS and mixed port issues.
 * For production builds, set VITE_API_BASE_URL to your public gateway URL.
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (import.meta.env.DEV && (raw === undefined || raw === '')) {
    return ''
  }
  return String(raw || 'http://localhost:5000').replace(/\/+$/, '')
}

