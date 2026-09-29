import { db, ai } from "hatchable";
export const access = "member";
export const methods = ["POST"];
export default async function (req, res) {
  const text = String(req.body?.message || "").trim();
  if (!text) return res.status(400).json({ error: "Message is required" });
  const { rows: apps } = await db.query(`SELECT id, application_number, customer_name, loan_amount, status FROM applications WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (!apps.length) return res.status(404).json({ error: "Application not found" });
  const app = apps[0];
  await db.query(`INSERT INTO conversation_messages (application_id, role, content) VALUES ($1,'user',$2)`, [app.id, text]);

  // Persist the core facts the DSA provides in natural language so the application
  // remains structured even when the agent leaves the conversation and returns later.
  const mobile = text.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/)?.[0]?.replace(/\D/g, '').slice(-10) || null;
  const amountMatch = text.match(/(?:₹|rs\.?\s*)?([0-9]+(?:\.[0-9]+)?)\s*(crore|cr|lakh|lac|l|thousand|k)\b/i);
  let amount = null;
  if (amountMatch) {
    const n = Number(amountMatch[1]);
    const unit = amountMatch[2].toLowerCase();
    const multiplier = unit.startsWith('crore') || unit === 'cr' ? 10000000 : unit.startsWith('l') ? 100000 : unit === 'thousand' || unit === 'k' ? 1000 : 1;
    amount = Math.round(n * multiplier);
  }
  const businessMatch = text.match(/(?:runs?|owns?|operates?|has)\s+(?:an?\s+)?(.+?)(?:\.|$)/i);
  const business = businessMatch?.[1]?.trim() || null;
  const updates = [];
  const params = [];
  if (mobile) { params.push(mobile); updates.push(`mobile=$${params.length}`); }
  if (amount) { params.push(amount); updates.push(`loan_amount=$${params.length}`); }
  if (business) { params.push(business); updates.push(`business_description=$${params.length}`); }
  if (updates.length) {
    params.push(app.id);
    await db.query(`UPDATE applications SET ${updates.join(', ')}, updated_at=now() WHERE id=$${params.length}`, params);
  }
  const { rows: currentRows } = await db.query(`SELECT customer_name, mobile, business_description, loan_amount, status FROM applications WHERE id=$1`, [app.id]);
  const current = currentRows[0];
  const coreReady = Boolean(current?.customer_name && current?.mobile && current?.business_description && current?.loan_amount);
  if (coreReady && current.status === 'DRAFT') {
    await db.query(`UPDATE applications SET status='READY_FOR_ELIGIBILITY', updated_at=now() WHERE id=$1`, [app.id]);
    current.status = 'READY_FOR_ELIGIBILITY';
  }
  const { rows: history } = await db.query(`SELECT role, content FROM conversation_messages WHERE application_id=$1 ORDER BY created_at ASC`, [app.id]);
  const { rows: documentRows } = await db.query(`SELECT document_type, status, processing_code, extracted_fields FROM application_documents WHERE application_id=$1 ORDER BY created_at ASC`, [app.id]);
  const extracted = documentRows.filter(d => d.extracted_fields && typeof d.extracted_fields === 'object').map(d => ({ documentType: d.document_type, status: d.status, fields: d.extracted_fields }));
  const documentContext = extracted.length ? ` Verified document extraction: ${JSON.stringify(extracted)}.` : '';
  const context = `Authoritative application data: customer=${current?.customer_name || 'missing'}, mobile=${current?.mobile || 'missing'}, business=${current?.business_description || 'missing'}, requested loan=${current?.loan_amount || 'missing'}, status=${current?.status || 'DRAFT'}.${documentContext}`;
  const result = await ai.generateText({ model: "sonnet", purpose: "loan_application_demo", system: `You are an AI assistant for DSA agents handling secured business-loan applications. ${context} Collect missing customer name, business, mobile number and requested loan amount. Never promise approval or eligibility. Be concise and ask only for the next missing information. When all four are present, say the application is ready for eligibility assessment and ask whether to submit. If the agent confirms submission, say the demo eligibility check has passed and that required identity and address documents are now needed.`, messages: history.map(m => ({ role: m.role, content: m.content })), maxSteps: 2 });
  const answer = result.text || "I’m ready for the next application detail.";
  await db.query(`INSERT INTO conversation_messages (application_id, role, content) VALUES ($1,'assistant',$2)`, [app.id, answer]);
  res.json({ message: { role: "assistant", content: answer } });
}