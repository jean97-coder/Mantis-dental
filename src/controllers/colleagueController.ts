import type { Request, Response } from 'express';
import { pool } from '../config/db.js';

interface ColleagueInput {
  full_name: string;
  specialty: string;
  phone?: string;
  email?: string;
  professional_license: string;
}

export async function getColleagues(_request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM colleagues ORDER BY full_name ASC');
    response.json(result.rows);
  } catch (error: unknown) {
    console.error('Error fetching colleagues', error);
    response.status(500).json({ error: 'No se pudieron obtener los colegas' });
  }
}

export async function createColleague(
  request: Request<Record<string, never>, unknown, ColleagueInput>,
  response: Response,
): Promise<void> {
  const { full_name, specialty, phone = '', email = '', professional_license } = request.body;
  if (!full_name?.trim() || !specialty?.trim() || !professional_license?.trim()) {
    response.status(400).json({ error: 'Nombre, especialidad y licencia son obligatorios' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO colleagues (full_name, specialty, phone, email, professional_license)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [full_name.trim(), specialty.trim(), phone.trim(), email.trim(), professional_license.trim()],
    );
    response.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error creating colleague', error);
    response.status(500).json({ error: 'No se pudo crear el colega' });
  }
}

export async function updateColleague(
  request: Request<{ id: string }, unknown, ColleagueInput>,
  response: Response,
): Promise<void> {
  const { full_name, specialty, phone = '', email = '', professional_license } = request.body;
  if (!full_name?.trim() || !specialty?.trim() || !professional_license?.trim()) {
    response.status(400).json({ error: 'Nombre, especialidad y licencia son obligatorios' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE colleagues SET full_name=$1, specialty=$2, phone=$3, email=$4, professional_license=$5
       WHERE id=$6 RETURNING *`,
      [full_name.trim(), specialty.trim(), phone.trim(), email.trim(), professional_license.trim(), request.params.id],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: 'Colega no encontrado' });
      return;
    }
    response.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error updating colleague', error);
    response.status(500).json({ error: 'No se pudo actualizar el colega' });
  }
}

export async function deleteColleague(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM colleagues WHERE id=$1', [request.params.id]);
    if (result.rowCount === 0) {
      response.status(404).json({ error: 'Colega no encontrado' });
      return;
    }
    response.status(204).send();
  } catch (error: unknown) {
    console.error('Error deleting colleague', error);
    response.status(500).json({ error: 'No se pudo eliminar el colega' });
  }
}
