import type { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { pool } from '../config/db.js';

type PatientParams = { patientId: string };
type IdParams = { id: string };
type PatientImageParams = { patientId: string; imageId: string };

async function getPatientId(request: Request<PatientParams>): Promise<number> {
  return Number(request.params.patientId);
}

async function persistBase64Image(imageUrl: string, patientId: number, title: string): Promise<string> {
  if (!imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('La imagen no tiene un formato válido para guardarse');
  }

  const [, mimeType, base64Data] = match;
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('gif') ? 'gif' : 'bin';
  const sanitizedTitle = (title || 'imagen').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const uploadFolder = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadFolder, { recursive: true });

  const fileName = `patient-${patientId}-${Date.now()}-${sanitizedTitle}.${extension}`;
  const filePath = path.join(uploadFolder, fileName);
  await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

  return `/uploads/${fileName}`;
}

export async function getHistorySheet(request: Request<PatientParams>, response: Response): Promise<void> {
  try { const result = await pool.query('SELECT * FROM medical_history_sheets WHERE patient_id = $1', [await getPatientId(request)]); response.json(result.rows[0] ?? null); }
  catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo cargar la ficha clínica' }); }
}
export async function saveHistorySheet(request: Request<PatientParams>, response: Response): Promise<void> {
  try { const { establishment = 'Mantis Dental', consultation_reason = '', current_illness = '', personal_history = {}, family_history = {}, vital_signs = {}, stomatognathic_exam = {} } = request.body; const result = await pool.query(`INSERT INTO medical_history_sheets (patient_id, establishment, consultation_reason, current_illness, personal_history, family_history, vital_signs, stomatognathic_exam) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (patient_id) DO UPDATE SET establishment=$2, consultation_reason=$3, current_illness=$4, personal_history=$5, family_history=$6, vital_signs=$7, stomatognathic_exam=$8, updated_at=NOW() RETURNING *`, [await getPatientId(request), establishment, consultation_reason, current_illness, personal_history, family_history, vital_signs, stomatognathic_exam]); response.json(result.rows[0]); }
  catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo guardar la ficha clínica' }); }
}
export async function getOdontogram(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('SELECT * FROM odontogram_records WHERE patient_id=$1 ORDER BY tooth_number', [await getPatientId(request)]); response.json(result.rows); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo cargar el odontograma' }); } }
export async function saveOdontogram(request: Request<PatientParams>, response: Response): Promise<void> { try { const { tooth_number, surfaces = {}, recession = 0, mobility = 'Sin movilidad', condition = 'sano', notes = '' } = request.body; const result = await pool.query(`INSERT INTO odontogram_records (patient_id,tooth_number,surfaces,recession,mobility,condition,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (patient_id,tooth_number) DO UPDATE SET surfaces=$3,recession=$4,mobility=$5,condition=$6,notes=$7,updated_at=NOW() RETURNING *`, [await getPatientId(request), tooth_number, surfaces, recession, mobility, condition, notes]); response.json(result.rows[0]); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo guardar la pieza dental' }); } }
export async function getNotes(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('SELECT * FROM medical_notes WHERE patient_id=$1 ORDER BY created_at DESC', [await getPatientId(request)]); response.json(result.rows); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudieron cargar las notas' }); } }
export async function createNote(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('INSERT INTO medical_notes (patient_id,note) VALUES ($1,$2) RETURNING *', [await getPatientId(request), request.body.note]); response.status(201).json(result.rows[0]); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo guardar la nota' }); } }
export async function getDiagnoses(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('SELECT * FROM diagnoses WHERE patient_id=$1 ORDER BY created_at DESC', [await getPatientId(request)]); response.json(result.rows); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudieron cargar los diagnósticos' }); } }
export async function createDiagnosis(request: Request<PatientParams>, response: Response): Promise<void> { try { const { cie10_code, description, patient_age = null } = request.body; const result = await pool.query('INSERT INTO diagnoses (patient_id,cie10_code,description,patient_age) VALUES ($1,$2,$3,$4) RETURNING *', [await getPatientId(request), cie10_code, description, patient_age]); response.status(201).json(result.rows[0]); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo guardar el diagnóstico' }); } }
export async function createDiagnosisBatch(request: Request<PatientParams>, response: Response): Promise<void> {
  try {
    const patientId = await getPatientId(request);
    const { diagnoses = [] } = request.body;

    if (!Array.isArray(diagnoses) || diagnoses.length === 0) {
      response.status(400).json({ error: 'Debes seleccionar al menos un diagnóstico para guardar' });
      return;
    }

    const savedDiagnoses = [] as Array<Record<string, unknown>>;
    for (const diagnosis of diagnoses) {
      const { cie10_code, description, patient_age = null } = diagnosis;
      const result = await pool.query(
        'INSERT INTO diagnoses (patient_id,cie10_code,description,patient_age) VALUES ($1,$2,$3,$4) RETURNING *',
        [patientId, cie10_code, description, patient_age],
      );
      savedDiagnoses.push(result.rows[0]);
    }

    response.status(201).json(savedDiagnoses);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'No se pudo guardar el lote de diagnósticos' });
  }
}
export async function createPrescription(request: Request<PatientParams>, response: Response): Promise<void> { try { const { medications = [], instructions = '' } = request.body; const result = await pool.query('INSERT INTO prescriptions (patient_id,medications,instructions) VALUES ($1,$2,$3) RETURNING *', [await getPatientId(request), medications, instructions]); response.status(201).json(result.rows[0]); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo guardar la receta' }); } }
export async function getPrescriptions(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('SELECT * FROM prescriptions WHERE patient_id=$1 ORDER BY created_at DESC', [await getPatientId(request)]); response.json(result.rows); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudieron cargar las recetas' }); } }
export async function createDocument(request: Request<PatientParams>, response: Response): Promise<void> { try { const { document_type, title, content } = request.body; const result = await pool.query('INSERT INTO medical_documents (patient_id,document_type,title,content) VALUES ($1,$2,$3,$4) RETURNING *', [await getPatientId(request), document_type, title, content]); response.status(201).json(result.rows[0]); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo guardar el documento' }); } }
export async function getDocuments(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('SELECT * FROM medical_documents WHERE patient_id=$1 ORDER BY created_at DESC', [await getPatientId(request)]); response.json(result.rows); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudieron cargar los documentos' }); } }
export async function deleteDocument(request: Request<{ patientId: string; documentId: string }>, response: Response): Promise<void> {
  try {
    const patientId = Number(request.params.patientId);
    const documentId = Number(request.params.documentId);
    const result = await pool.query('DELETE FROM medical_documents WHERE id = $1 AND patient_id = $2 RETURNING *', [documentId, patientId]);

    if (result.rowCount === 0) {
      response.status(404).json({ error: 'El documento no existe o no pertenece a este paciente' });
      return;
    }

    response.status(204).send();
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'No se pudo eliminar el documento' });
  }
}
export async function createImage(request: Request<PatientParams>, response: Response): Promise<void> {
  try {
    const patientId = await getPatientId(request);
    const { title, image_url, image_type = 'clinical' } = request.body;

    if (!title || !image_url) {
      response.status(400).json({ error: 'El archivo y el título son obligatorios' });
      return;
    }

    const savedPath = typeof image_url === 'string' && image_url.startsWith('data:')
      ? await persistBase64Image(image_url, patientId, title)
      : image_url;

    const result = await pool.query(
      'INSERT INTO patient_images (patient_id,title,image_url,image_type) VALUES ($1,$2,$3,$4) RETURNING *',
      [patientId, title, savedPath, image_type],
    );

    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'No se pudo guardar la imagen' });
  }
}
export async function getImages(request: Request<PatientParams>, response: Response): Promise<void> { try { const result = await pool.query('SELECT * FROM patient_images WHERE patient_id=$1 ORDER BY created_at DESC', [await getPatientId(request)]); response.json(result.rows); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudieron cargar las imágenes' }); } }
export async function deleteImage(request: Request<PatientImageParams>, response: Response): Promise<void> {
  try {
    const patientId = Number(request.params.patientId);
    const imageId = Number(request.params.imageId);
    const result = await pool.query('SELECT * FROM patient_images WHERE id=$1 AND patient_id=$2', [imageId, patientId]);

    if (result.rowCount === 0) {
      response.status(404).json({ error: 'La imagen no existe o no pertenece a este paciente' });
      return;
    }

    const image = result.rows[0];
    if (typeof image.image_url === 'string' && image.image_url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), image.image_url.replace(/^\/+/, ''));
      await fs.rm(filePath, { force: true });
    }

    await pool.query('DELETE FROM patient_images WHERE id=$1 AND patient_id=$2', [imageId, patientId]);
    response.status(204).send();
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'No se pudo eliminar la imagen' });
  }
}
export async function deleteClinicalRecord(request: Request<IdParams>, response: Response): Promise<void> { try { await pool.query('DELETE FROM medical_notes WHERE id=$1', [request.params.id]); response.status(204).send(); } catch (error) { console.error(error); response.status(500).json({ error: 'No se pudo eliminar el registro' }); } }
