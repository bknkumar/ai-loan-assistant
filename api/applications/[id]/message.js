import { db, ai } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function (req, res) {
  const text = String(req.body?.message || "").trim();
  if (!text) return res.status(400).json({ error: "Message is required" });
  const { rows: apps } = await db.query(`SELECT id, application_number, customer_name, loan_amount, status FROM applications WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (!apps.length) return res.status(404).json({ error: "Application not found" });
  const app = apps[0];
  await db.query(`INSERT INTO conversation_messages (application_id, role, content) VALUES ($1,'user',$2)`, [app.id, text]);
  const { rows: history } = await db.query(`SELECT role, content FROM conversation_messages WHERE application_id=$1 ORDER BY created_at ASC`, [app.id]);
  const result = await ai.generateText({ model: "sonnet", purpose: "loan_application_demo", system: "You are an AI assistant for DSA agents handling secured business-loan applications. Collect customer name, business, mobile number and requested loan amount. Never promise approval or eligibility. Be concise and ask for the next missing information. If all four are present, say the application is ready for eligibility assessment and ask whether to submit.", messages: history.map(m => ({ role: m.role, content: m.content })), maxSteps: 2 });
  const answer = result.text || "I’m ready for the next application detail.";
  await db.query(`INSERT INTO conversation_messages (application_id, role, content) VALUES ($1,'assistant',$2)`, [app.id, answer]);
  res.json({ message: { role: "assistant", content: answer } });
}