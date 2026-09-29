export function normalizeExtractedFields(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return null;
  const allowed = ["fullName", "mobile", "email", "address", "documentNumber", "dateOfBirth", "businessName", "income"];
  const out = {};
  for (const key of allowed) {
    if (typeof fields[key] === "string" && fields[key].trim()) out[key] = fields[key].trim();
  }
  return Object.keys(out).length ? out : null;
}

export function validateExtractedFields(fields, documentType) {
  const errors = [];
  if (!fields) return { valid: false, errors: ["No structured fields were extracted"] };
  if (documentType === "identity_proof" && !fields.fullName && !fields.documentNumber) errors.push("Identity document name or document number was not extracted");
  if (documentType === "address_proof" && !fields.address) errors.push("Address was not extracted");
  return { valid: errors.length === 0, errors };
}