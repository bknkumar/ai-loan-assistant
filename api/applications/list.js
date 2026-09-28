import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function (req, res) {
  const { rows } = await db.query(`SELECT id, application_number, customer_name, loan_amount, status, created_at, updated_at FROM applications WHERE user_id = $1 ORDER BY updated_at DESC`, [req.user.id]);
  res.json({ applications: rows });
}