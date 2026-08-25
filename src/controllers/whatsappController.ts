import type { Request, Response } from 'express';
import { pool } from '../config/db.js';

type Sender = 'user' | 'bot' | 'patient';
interface MessageInput { patient_phone: string; patient_name?: string; message: string; sender?: Sender }

function cleanPhone(value: unknown) { return String(value ?? '').replace(/[^0-9+]/g, '').slice(0, 40); }

async function saveMessage(input: MessageInput) {
  const result = await pool.query(
    `INSERT INTO whatsapp_messages (patient_phone, patient_name, message, sender)
     VALUES ($1, $2, $3, $4) RETURNING id, patient_phone, patient_name, message, sender, timestamp`,
    [cleanPhone(input.patient_phone), input.patient_name?.trim() || '', input.message.trim(), input.sender ?? 'bot'],
  );
  return result.rows[0];
}

async function sendCloudMessage(phone: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } }),
  });
  if (!response.ok) console.error('WhatsApp Cloud API error', await response.text());
}

async function freeSlots() {
  const result = await pool.query<{ appointment_date: string }>(
    `SELECT appointment_date FROM appointments
     WHERE appointment_date >= NOW() AND appointment_date < NOW() + INTERVAL '14 days'
     AND status <> 'Cancelada' ORDER BY appointment_date`,
  );
  const occupied = new Set(result.rows.map((row) => new Date(row.appointment_date).toISOString().slice(0, 16)));
  const slots: string[] = [];
  for (let day = 1; day <= 14 && slots.length < 5; day += 1) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    if ([0, 6].includes(date.getDay())) continue;
    for (const hour of [9, 10, 11, 15, 16, 17]) {
      date.setHours(hour, 0, 0, 0);
      const key = date.toISOString().slice(0, 16);
      if (!occupied.has(key)) slots.push(date.toISOString());
      if (slots.length >= 5) break;
    }
  }
  return slots;
}

async function assistantReply(phone: string, text: string) {
  const slots = await freeSlots();
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.2, messages: [
          { role: 'system', content: `Eres la recepcionista virtual de Mantis Dental. Responde en español, con amabilidad y brevedad. Horarios disponibles reales: ${slots.map((slot) => new Date(slot).toLocaleString('es-ES')).join(', ') || 'No hay horarios próximos'}. No inventes disponibilidad.` },
          { role: 'user', content: `Paciente ${phone}: ${text}` },
        ] }),
      });
      if (response.ok) {
        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (error) { console.error('OpenAI WhatsApp request failed', error); }
  }
  if (/hola|buenas|información/i.test(text)) return 'Hola, soy el asistente de Mantis Dental. Puedo ayudarte a reservar una cita. Escribe "horarios" para consultar disponibilidad.';
  if (/horario|disponib|cita|agenda/i.test(text)) return slots.length ? `Estos son los próximos horarios disponibles: ${slots.map((slot) => new Date(slot).toLocaleString('es-ES')).join(' | ')}. Indícame cuál prefieres.` : 'En este momento no hay horarios disponibles en los próximos 14 días.';
  return 'Gracias por escribir a Mantis Dental. Para agendar, indícame qué día prefieres o escribe "horarios" para ver opciones disponibles.';
}

async function bookConfirmedAppointment(phone: string, text: string) {
  const match = text.match(/(?:confirmo|confirmar|reservar)[^0-9]*(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/i);
  if (!match) return null;
  const appointmentDate = `${match[1]}T${match[2].padStart(2, '0')}:${match[3]}:00`;
  const patientResult = await pool.query<{ id: number }>(
    `SELECT id FROM patients WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g') LIMIT 1`,
    [phone],
  );
  if (!patientResult.rows[0]) return 'He recibido tu confirmación, pero necesitamos registrar tu número como paciente antes de crear la cita.';
  const conflict = await pool.query('SELECT 1 FROM appointments WHERE appointment_date = $1 AND status <> $2 LIMIT 1', [appointmentDate, 'Cancelada']);
  if (conflict.rowCount) return 'Ese horario acaba de ocuparse. Escribe "horarios" para consultar otras opciones.';
  await pool.query('INSERT INTO appointments (patient_id, appointment_date, status, reason) VALUES ($1, $2, $3, $4)', [patientResult.rows[0].id, appointmentDate, 'Confirmada', 'Cita agendada por WhatsApp']);
  return `Cita confirmada para ${new Date(appointmentDate).toLocaleString('es-ES')}. Te esperamos en Mantis Dental.`;
}

export async function getChats(_request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query(`SELECT DISTINCT ON (patient_phone) patient_phone, patient_name, message, sender, timestamp FROM whatsapp_messages ORDER BY patient_phone, timestamp DESC`);
    response.json(result.rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  } catch (error: unknown) { console.error('WhatsApp chats error', error); response.status(500).json({ error: error instanceof Error ? error.message : 'No se pudieron cargar los chats' }); }
}

export async function getMessages(request: Request<{ phone: string }>, response: Response): Promise<void> {
  try { const result = await pool.query('SELECT id, patient_phone, patient_name, message, sender, timestamp FROM whatsapp_messages WHERE patient_phone=$1 ORDER BY timestamp ASC', [cleanPhone(request.params.phone)]); response.json(result.rows); }
  catch (error: unknown) { console.error('WhatsApp messages error', error); response.status(500).json({ error: error instanceof Error ? error.message : 'No se pudieron cargar los mensajes' }); }
}

export async function sendManualMessage(request: Request<Record<string, never>, unknown, MessageInput>, response: Response): Promise<void> {
  try { const { patient_phone, patient_name = '', message } = request.body; if (!cleanPhone(patient_phone) || !message?.trim()) { response.status(400).json({ error: 'Teléfono y mensaje son obligatorios' }); return; } const saved = await saveMessage({ patient_phone, patient_name, message, sender: 'user' }); await sendCloudMessage(cleanPhone(patient_phone), message.trim()); response.status(201).json(saved); }
  catch (error: unknown) { console.error('WhatsApp manual message error', error); response.status(500).json({ error: error instanceof Error ? error.message : 'No se pudo enviar el mensaje' }); }
}

export async function receiveWebhook(request: Request, response: Response): Promise<void> {
  try {
    const entry = request.body?.entry?.[0]?.changes?.[0]?.value;
    const incoming = entry?.messages?.[0];
    if (!incoming?.from || incoming.type !== 'text') { response.sendStatus(200); return; }
    const phone = cleanPhone(incoming.from);
    const name = entry.contacts?.[0]?.profile?.name || phone;
    const text = String(incoming.text?.body || '').trim();
    await saveMessage({ patient_phone: phone, patient_name: name, message: text, sender: 'patient' });
    const reply = await bookConfirmedAppointment(phone, text) ?? await assistantReply(phone, text);
    await saveMessage({ patient_phone: phone, patient_name: name, message: reply, sender: 'bot' });
    await sendCloudMessage(phone, reply);
    response.status(200).json({ ok: true, reply });
  } catch (error: unknown) { console.error('WhatsApp webhook error', error); response.status(500).json({ error: error instanceof Error ? error.message : 'Error procesando webhook' }); }
}

export function verifyWebhook(request: Request, response: Response): void {
  const mode = request.query['hub.mode']; 
  const token = request.query['hub.verify_token']; 
  const challenge = request.query['hub.challenge'];
  
  // Token fijo configurado directamente aquí
  const VERIFY_TOKEN = 'mantis_secret_123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) { 
    response.status(200).send(challenge); 
    return; 
  }
  response.sendStatus(403);
}