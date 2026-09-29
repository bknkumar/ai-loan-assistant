import { createAiDocumentOcrProvider } from "./document-ocr-provider.js";

export function createDocumentOcrProvider() {
  return createAiDocumentOcrProvider({ model: "sonnet", timeoutMs: 45000 });
}