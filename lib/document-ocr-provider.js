import { ai } from "hatchable";

function parseJsonObject(text) {
  if (typeof text !== "string") return null;
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  try {
    const value = JSON.parse(cleaned);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export function createAiDocumentOcrProvider({ model = "sonnet", timeoutMs = 45000 } = {}) {
  return {
    async extract({ mimeType, image }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.max(5000, Number(timeoutMs) || 45000));
      try {
        const result = await ai.generateText({
          model,
          purpose: "document_ocr_demo",
          system: "You extract information from uploaded business-loan documents. Read only what is visible. Never invent values. Return strict JSON with keys text and fields. fields may contain only fullName, mobile, email, address, documentNumber, dateOfBirth, businessName, income. Use empty strings for fields that are not visible. For text, provide a concise transcription of visible document text.",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: `Extract the visible information from this ${mimeType} document. Return JSON only.` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${image}` } }
            ]
          }],
          maxSteps: 1
        });
        const parsed = parseJsonObject(result?.text || "");
        if (!parsed || typeof parsed.text !== "string" || !parsed.fields || typeof parsed.fields !== "object") {
          return { ok: false, code: "OCR_INVALID_RESPONSE" };
        }
        return { ok: true, text: parsed.text, fields: parsed.fields };
      } catch (error) {
        if (error?.name === "AbortError") return { ok: false, code: "OCR_TIMEOUT" };
        return { ok: false, code: "OCR_PROVIDER_ERROR" };
      } finally {
        clearTimeout(timer);
      }
    }
  };
}