import type { Request, Response } from 'express';
import { pool } from '../config/db.js';

interface CountRow {
  total: string;
}

interface AppointmentStatsRow {
  total: string;
  pending: string;
  completed: string;
  confirmed: string;
  cancelled: string;
}

interface InventoryStatsRow {
  total: string;
  low_stock: string;
}

interface RevenueRow {
  total: string | null;
}

export interface DashboardStats {
  patients: { total: number };
  appointments: {
    total: number;
    pending: number;
    completed: number;
    confirmed: number;
    cancelled: number;
  };
  inventory: { total: number; lowStock: number };
  budgets: { revenue: number };
}

export async function getDashboardStats(_request: Request, response: Response): Promise<void> {
  try {
    const [patientsResult, appointmentsResult, inventoryResult, revenueResult] = await Promise.all([
      pool.query<CountRow>('SELECT COUNT(*)::text AS total FROM patients'),
      pool.query<AppointmentStatsRow>(`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE LOWER(status) = 'pendiente')::text AS pending,
          COUNT(*) FILTER (WHERE LOWER(status) = 'completada')::text AS completed,
          COUNT(*) FILTER (WHERE LOWER(status) = 'confirmada')::text AS confirmed,
          COUNT(*) FILTER (WHERE LOWER(status) = 'cancelada')::text AS cancelled
        FROM appointments
      `),
      pool.query<InventoryStatsRow>(`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE stock <= min_stock)::text AS low_stock
        FROM inventory
      `),
      pool.query<RevenueRow>(`
        SELECT COALESCE(SUM(total), 0)::text AS total
        FROM budgets
        WHERE LOWER(status) IN ('aprobado', 'pagado')
      `),
    ]);

    const appointmentStats = appointmentsResult.rows[0];
    const inventoryStats = inventoryResult.rows[0];

    const stats: DashboardStats = {
      patients: { total: Number(patientsResult.rows[0].total) },
      appointments: {
        total: Number(appointmentStats.total),
        pending: Number(appointmentStats.pending),
        completed: Number(appointmentStats.completed),
        confirmed: Number(appointmentStats.confirmed),
        cancelled: Number(appointmentStats.cancelled),
      },
      inventory: {
        total: Number(inventoryStats.total),
        lowStock: Number(inventoryStats.low_stock),
      },
      budgets: { revenue: Number(revenueResult.rows[0].total ?? 0) },
    };

    response.json(stats);
  } catch (error: unknown) {
    console.error('Error fetching dashboard stats', error);
    response.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
}
