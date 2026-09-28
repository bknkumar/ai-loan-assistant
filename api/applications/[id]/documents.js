import { db, storage } from "hatchable";
export const access = "user";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  const { rows: apps } = await db.query(`SELECT id FROM applications WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (!apps.length) return res.status(404).json({ error: "Application not found" });

  if (req.method === "GET") {
    const { rows } = await db.query(`SELECT id, document_type, file_name, mime_type, file_size, status, created_at FROM application_documents WHERE application_id=$1 ORDER BY created_at DESC`, [req.params.id]);
    return res.json({ documents: rows });
  }

  const { documentType, fileName, mimeType, fileSize, content } = req.body || {};
  const allowed = ["identity_proof", "address_proof", "income_proof"];
  if (!allowed.includes(documentType) || !fileName || !mimeType || !Number.isFinite(Number(fileSize)) || !content) {
    return res.status(400).json({ error: "Invalid document request" });
  }
  if (Number(fileSize) > 5 * 1024 * 1024) return res.status(413).json({ error: "Document must be 5 MB or smaller" });
  if (!/^image\/(png|jpeg|jpg)$|^application\/pdf$/i.test(mimeType)) return res.status(415).json({ error: "Only PDF, JPG, and PNG files are supported" });

  const storageKey = `applications/${req.params.id}/documents/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const raw = String(content).replace(/^data:[^;]+;base64,/, "");
  const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  await storage.put(storageKey, bytes, mimeType);
  const { rows } = await db.query(`INSERT INTO application_documents (application_id, document_type, file_name, mime_type, file_size, storage_key, status) VALUES ($1,$2,$3,$4,$5,$6,'UPLOADED') RETURNING id, document_type, file_name, mime_type, file_size, status, created_at`, [req.params.id, documentType, fileName, mimeType, Number(fileSize), storageKey]);
  res.status(201).json({ document: rows[0] });
}