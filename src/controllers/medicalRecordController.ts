import type { Request, Response } from 'express';
import type { QueryResultRow } from 'pg';
import { pool } from '../config/db.js';

export interface MedicalRecord extends QueryResultRow {
  id: number;
  patient_id: number;
  patient_name: string;
  tooth_number: number;
  diagnosis: string;
  treatment_plan: string;
  notes: string | null;
  created_at: string;
  colleague_id: number | null;
  colleague_name: string | null;
  colleague_specialty: string | null;
  session_number: number;
  total_sessions: number;
  progress_status: string;
}

interface MedicalRecordInput {
  patient_id: number;
  tooth_number: number;
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  colleague_id?: number | null;
  session_number?: number;
  total_sessions?: number;
  progress_status?: string;
}

const medicalRecordQuery = `
  SELECT medical_records.*, patients.name AS patient_name,
    colleagues.full_name AS colleague_name, colleagues.specialty AS colleague_specialty
  FROM medical_records
  INNER JOIN patients ON patients.id = medical_records.patient_id
  LEFT JOIN colleagues ON colleagues.id = medical_records.colleague_id
`;

export async function getMedicalRecordsByPatient(
  request: Request<{ patientId?: string }>,
  response: Response,
): Promise<void> {
  try {
    const patientId = request.params.patientId;
    const values: string[] = [];
    const filter = patientId ? ' WHERE medical_records.patient_id = $1' : '';
    if (patientId) values.push(patientId);

    const result = await pool.query<MedicalRecord>(
      `${medicalRecordQuery}${filter} ORDER BY medical_records.created_at DESC`,
      values,
    );
    response.json(result.rows);
  } catch (error: unknown) {
    console.error('Error fetching medical records', error);
    response.status(500).json({ error: 'Error al obtener el historial clínico' });
  }
}

export async function createMedicalRecord(
  request: Request<Record<string, never>, MedicalRecord, MedicalRecordInput>,
  response: Response,
): Promise<void> {
  try {
    const { patient_id, tooth_number, diagnosis, treatment_plan, notes = '', colleague_id = null, session_number = 1, total_sessions = 1, progress_status = 'Planificado' } = request.body;

    if (!patient_id || !Number.isInteger(tooth_number) || tooth_number <= 0 || !diagnosis || !treatment_plan) {
      response.status(400).json({ error: 'Paciente, pieza, diagnóstico y plan de tratamiento son obligatorios' });
      return;
    }

    const result = await pool.query<MedicalRecord>(
      `INSERT INTO medical_records (patient_id, tooth_number, diagnosis, treatment_plan, notes, colleague_id, session_number, total_sessions, progress_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [patient_id, tooth_number, diagnosis, treatment_plan, notes, colleague_id, session_number, total_sessions, progress_status],
    );

    response.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error creating medical record', error);
    response.status(500).json({ error: 'Error al crear el registro clínico' });
  }
}
