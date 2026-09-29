import { db } from "hatchable";
export const access = "member";
export const methods = ["GET"];
export default async function (req, res) {
  const { rows } = await db.query(`SELECT id, application_number, customer_name, mobile, business_description, loan_amount, loan_purpose, status, created_at, updated_at FROM applications WHERE user_id = $1 ORDER BY updated_at DESC`, [req.member.id]);
  res.json({ applications: rows });
}