import type { Request, Response } from 'express';
import { pool } from '../config/db.js';

export async function getDocumentTemplates(_request: Request, response: Response): Promise<void> {
  try { const result = await pool.query('SELECT * FROM document_templates ORDER BY created_at DESC'); response.json(result.rows); }
  catch (error) { console.error('Error fetching document templates', error); response.status(500).json({ error: 'No se pudieron cargar las plantillas' }); }
}

export async function createDocumentTemplate(request: Request, response: Response): Promise<void> {
  try { const { name, description = '', content } = request.body; if (!name || !content) { response.status(400).json({ error: 'Nombre y texto de plantilla son obligatorios' }); return; } const result = await pool.query('INSERT INTO document_templates (name, description, content) VALUES ($1,$2,$3) RETURNING *', [name, description, content]); response.status(201).json(result.rows[0]); }
  catch (error) { console.error('Error creating document template', error); response.status(500).json({ error: 'No se pudo guardar la plantilla' }); }
}

export async function getTreatmentPackages(_request: Request, response: Response): Promise<void> {
  try { const result = await pool.query('SELECT * FROM treatment_packages ORDER BY created_at DESC'); response.json(result.rows); }
  catch (error) { console.error('Error fetching treatment packages', error); response.status(500).json({ error: 'No se pudieron cargar los paquetes' }); }
}

export async function createTreatmentPackage(request: Request, response: Response): Promise<void> {
  try { const { name, description = '', items = [] } = request.body; const price = Number(items?.[0]?.unit_price); if (!name?.trim() || !description?.trim() || !Array.isArray(items) || items.length === 0 || !Number.isFinite(price) || price < 0) { response.status(400).json({ error: 'Nombre, descripción y costo válido son obligatorios' }); return; } const result = await pool.query('INSERT INTO treatment_packages (name, description, items) VALUES ($1,$2,$3::jsonb) RETURNING *', [name.trim(), description.trim(), JSON.stringify(items)]); response.status(201).json(result.rows[0]); }
  catch (error: unknown) { console.error('Error creating treatment package', error); response.status(500).json({ error: error instanceof Error ? error.message : 'No se pudo guardar el paquete' }); }
}

export async function updateTreatmentPackage(request: Request, response: Response): Promise<void> {
  try {
    const { name, description = '', items = [] } = request.body;
    const price = Number(items?.[0]?.unit_price);
    if (!name?.trim() || !description?.trim() || !Array.isArray(items) || items.length === 0 || !Number.isFinite(price) || price < 0) {
      response.status(400).json({ error: 'Nombre y al menos un ítem son obligatorios' });
      return;
    }
    const result = await pool.query(
      'UPDATE treatment_packages SET name=$1, description=$2, items=$3::jsonb WHERE id=$4 RETURNING *',
      [name.trim(), description.trim(), JSON.stringify(items), request.params.id],
    );
    if (result.rowCount === 0) { response.status(404).json({ error: 'Ítem de catálogo no encontrado' }); return; }
    response.json(result.rows[0]);
  } catch (error: unknown) { console.error('Error updating treatment package', error); response.status(500).json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el ítem' }); }
}

export async function deleteTreatmentPackage(request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM treatment_packages WHERE id=$1', [request.params.id]);
    if (result.rowCount === 0) { response.status(404).json({ error: 'Ítem de catálogo no encontrado' }); return; }
    response.status(204).send();
  } catch (error: unknown) { console.error('Error deleting treatment package', error); response.status(500).json({ error: error instanceof Error ? error.message : 'No se pudo eliminar el ítem' }); }
}
