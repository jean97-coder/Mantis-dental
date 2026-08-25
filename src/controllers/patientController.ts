import type { Request, Response } from 'express';
import type { QueryResultRow } from 'pg';
import { pool } from '../config/db.js';

export interface Patient extends QueryResultRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string | null;
  medical_history: string | null;
  created_at: string;
}

export interface PatientInput {
  name: string;
  email: string;
  phone: string;
  dni: string;
  address?: string;
  medical_history?: string;
}

export async function getPatients(_request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query<Patient>('SELECT * FROM patients ORDER BY created_at DESC');
    response.json(result.rows);
  } catch (error: unknown) {
    console.error('Error fetching patients', error);
    response.status(500).json({ error: 'Error al obtener los pacientes' });
  }
}

export async function createPatient(
  request: Request<Record<string, never>, Patient, PatientInput>,
  response: Response,
): Promise<void> {
  try {
    const { name, email, phone, dni, address = '', medical_history = '' } = request.body;

    if (!name || !email || !phone || !dni) {
      response.status(400).json({ error: 'Nombre, correo, teléfono y DNI son obligatorios' });
      return;
    }

    const result = await pool.query<Patient>(
      `INSERT INTO patients (name, email, phone, dni, address, medical_history)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone, dni, address, medical_history],
    );

    response.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error creating patient', error);
    response.status(500).json({ error: 'Error al crear el paciente' });
  }
}
