import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];

export default async function (req, res) {
  const { rows: apps } = await db.query(`SELECT id, customer_name, loan_amount, status FROM applications WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (!apps.length) return res.status(404).json({ error: "Application not found" });
  const app = apps[0];
  const { rows: docs } = await db.query(`SELECT document_type FROM application_documents WHERE application_id=$1`, [app.id]);
  const types = new Set(docs.map(d => d.document_type));
  const missing = ["identity_proof", "address_proof"].filter(type => !types.has(type));
  if (!app.customer_name || !app.loan_amount || missing.length) {
    return res.status(422).json({ status: "NOT_READY", missing: [!app.customer_name ? "customer_name" : null, !app.loan_amount ? "loan_amount" : null, ...missing].filter(Boolean) });
  }
  await db.query(`UPDATE applications SET status='ELIGIBILITY_CHECKED', updated_at=now() WHERE id=$1`, [app.id]);
  res.json({ status: "ELIGIBILITY_CHECKED", result: "PASSED", message: "Eligibility check passed. Required documents are now ready for verification." });
}