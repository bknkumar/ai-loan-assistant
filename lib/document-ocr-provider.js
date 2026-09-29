export function createHttpDocumentOcrProvider({ url, apiKey, timeoutMs = 30000 }) {
  if (!url) return null;
  const timeout = Math.max(1000, Number(timeoutMs) || 30000);

  return {
    async extract({ mimeType, image }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const headers = { "Content-Type": "application/json" };
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ mimeType, image }),
          signal: controller.signal
        });
        if (!response.ok) {
          return { ok: false, code: "OCR_PROVIDER_ERROR", status: response.status };
        }
        const data = await response.json().catch(() => null);
        if (!data || typeof data.text !== "string") {
          return { ok: false, code: "OCR_INVALID_RESPONSE" };
        }
        return {
          ok: true,
          text: data.text,
          fields: data.fields && typeof data.fields === "object" ? data.fields : null
        };
      } catch (error) {
        if (error?.name === "AbortError") return { ok: false, code: "OCR_TIMEOUT" };
        return { ok: false, code: "OCR_NETWORK_ERROR" };
      } finally {
        clearTimeout(timer);
      }
    }
  };
}