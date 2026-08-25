import type { Request, Response } from 'express';
import type { QueryResultRow } from 'pg';
import { pool } from '../config/db.js';

export type AppointmentStatus = 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

export interface Appointment extends QueryResultRow {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_date: string;
  status: AppointmentStatus;
  reason: string;
  created_at: string;
}

interface AppointmentInput {
  patient_id: number;
  appointment_date: string;
  status?: AppointmentStatus;
  reason: string;
}

interface StatusInput {
  status: AppointmentStatus;
}

const validStatuses: AppointmentStatus[] = ['Pendiente', 'Confirmada', 'Completada', 'Cancelada'];

export async function getAppointments(_request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query<Appointment>(
      `SELECT appointments.*, patients.name AS patient_name
       FROM appointments
       INNER JOIN patients ON patients.id = appointments.patient_id
       ORDER BY appointments.appointment_date ASC`,
    );
    response.json(result.rows);
  } catch (error: unknown) {
    console.error('Error fetching appointments', error);
    response.status(500).json({ error: 'Error al obtener las citas' });
  }
}

export async function createAppointment(
  request: Request<Record<string, never>, Appointment, AppointmentInput>,
  response: Response,
): Promise<void> {
  try {
    const { patient_id, appointment_date, status = 'Pendiente', reason } = request.body;

    if (!patient_id || !appointment_date || !reason || !validStatuses.includes(status)) {
      response.status(400).json({ error: 'Paciente, fecha, motivo y estado válido son obligatorios' });
      return;
    }

    const result = await pool.query<Appointment>(
      `INSERT INTO appointments (patient_id, appointment_date, status, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [patient_id, appointment_date, status, reason],
    );

    response.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error creating appointment', error);
    response.status(500).json({ error: 'Error al crear la cita' });
  }
}

export async function updateAppointmentStatus(
  request: Request<{ id: string }, Appointment, StatusInput>,
  response: Response,
): Promise<void> {
  try {
    const { status } = request.body;

    if (!validStatuses.includes(status)) {
      response.status(400).json({ error: 'Estado de cita no válido' });
      return;
    }

    const result = await pool.query<Appointment>(
      `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, request.params.id],
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: 'Cita no encontrada' });
      return;
    }

    response.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error updating appointment status', error);
    response.status(500).json({ error: 'Error al actualizar el estado de la cita' });
  }
}
