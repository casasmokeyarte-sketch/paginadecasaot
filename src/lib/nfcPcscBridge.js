const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8765';

const bridgeUrl = () => (
  import.meta.env.VITE_NFC_BRIDGE_URL?.replace(/\/$/, '') || DEFAULT_BRIDGE_URL
);

const requestBridge = async (path, timeoutMs) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${bridgeUrl()}${path}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `El conector NFC respondió ${response.status}.`);
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Tiempo agotado esperando el lector NFC.');
    }
    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con el lector local. Abre primero Iniciar-Lector-NFC.cmd en este PC.'
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};

export const checkPcscReader = () => requestBridge('/health', 4000);

export const readPcscUid = (waitMs = 20000) => (
  requestBridge(`/read?timeout=${Math.max(3000, Math.min(waitMs, 30000))}`, waitMs + 3000)
);
