import { db } from "hatchable";
export const access = "member";
export const methods = ["POST"];
export default async function (req, res) {
  const name = String(req.body?.customerName || "").trim();
  if (!name) return res.status(400).json({ error: "Customer name is required" });
  const { rows } = await db.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 13) AS INTEGER)),0)+1 AS next_no FROM applications WHERE application_number LIKE 'APP-2026-%'`, []);
  const next = Number(rows[0]?.next_no || 1);
  const number = `APP-2026-${String(next).padStart(6,"0")}`;
  const inserted = await db.query(`INSERT INTO applications (user_id, application_number, customer_name) VALUES ($1,$2,$3) RETURNING id, application_number, customer_name, loan_amount, status`, [req.member.id, number, name]);
  const app = inserted.rows[0];
  await db.query(`INSERT INTO conversation_messages (application_id, role, content) VALUES ($1,'assistant',$2)`, [app.id, "Application created. Tell me about the customer and the loan they need."]);
  res.status(201).json({ application: app });
}