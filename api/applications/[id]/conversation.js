import { db } from "hatchable";
export const access = "member";
export const methods = ["GET"];
export default async function (req, res) {
  const { rows: apps } = await db.query(`SELECT id, application_number, customer_name, mobile, business_description, loan_amount, loan_purpose, status FROM applications WHERE id=$1 AND user_id=$2`, [req.params.id, req.member.id]);
  if (!apps.length) return res.status(404).json({ error: "Application not found" });
  const { rows: messages } = await db.query(`SELECT id, role, content, created_at FROM conversation_messages WHERE application_id=$1 ORDER BY created_at ASC`, [req.params.id]);
  res.json({ application: apps[0], messages });
}