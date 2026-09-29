import { createHttpDocumentOcrProvider } from "./document-ocr-provider.js";

export function createDocumentOcrProvider() {
  const url = process.env.DOCUMENT_OCR_URL;
  if (!url) return null;
  return createHttpDocumentOcrProvider({
    url,
    apiKey: process.env.DOCUMENT_OCR_API_KEY || "",
    timeoutMs: process.env.DOCUMENT_OCR_TIMEOUT_MS || 30000
  });
}