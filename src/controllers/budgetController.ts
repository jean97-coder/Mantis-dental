import type { Request, Response } from 'express';
import type { PoolClient, QueryResultRow } from 'pg';
import { pool } from '../config/db.js';

export type BudgetStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Pagado';

export interface BudgetItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
}

export interface Budget extends QueryResultRow {
  id: number;
  patient_id: number;
  patient_name: string;
  notes: string | null;
  status: BudgetStatus;
  total: number;
  subtotal: number;
  discount_type: 'none' | 'percent' | 'fixed';
  discount_value: number;
  created_at: string;
  items: BudgetItem[];
}

interface BudgetInputItem {
  name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount?: number;
}

interface BudgetInput {
  patient_id: number;
  notes?: string;
  status?: BudgetStatus;
  items: BudgetInputItem[];
  discount_type?: 'none' | 'percent' | 'fixed';
  discount_value?: number;
}

interface StatusInput {
  status: BudgetStatus;
}

const validStatuses: BudgetStatus[] = ['Pendiente', 'Aprobado', 'Rechazado', 'Pagado'];

const budgetQuery = `
  SELECT b.*, p.name AS patient_name,
    COALESCE(
      json_agg(
        json_build_object(
          'id', bi.id,
          'name', COALESCE(bi.name, bi.description),
          'description', bi.description,
          'quantity', bi.quantity,
          'unit_price', bi.unit_price,
          'line_discount', bi.line_discount
        ) ORDER BY bi.id
      ) FILTER (WHERE bi.id IS NOT NULL), '[]'
    ) AS items
  FROM budgets b
  INNER JOIN patients p ON p.id = b.patient_id
  LEFT JOIN budget_items bi ON bi.budget_id = b.id
  GROUP BY b.id, p.name
  ORDER BY b.created_at DESC
`;

export async function getBudgets(_request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query<Budget>(budgetQuery);
    response.json(result.rows);
  } catch (error: unknown) {
    console.error('Error fetching budgets', error);
    response.status(500).json({ error: 'Error al obtener los presupuestos' });
  }
}

export async function createBudget(
  request: Request<Record<string, never>, Budget, BudgetInput>,
  response: Response,
): Promise<void> {
  let client: PoolClient | undefined;

  try {
    const { patient_id, notes = '', status = 'Pendiente', items, discount_type = 'none', discount_value = 0 } = request.body;

    if (!patient_id || !items?.length || !validStatuses.includes(status)) {
      response.status(400).json({ error: 'Paciente, estado válido y al menos un ítem son obligatorios' });
      return;
    }

    if (items.some((item) => !(item.name || item.description)?.trim() || item.quantity <= 0 || item.unit_price < 0 || (item.line_discount ?? 0) < 0)) {
      response.status(400).json({ error: 'Los datos de los ítems no son válidos' });
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const lineDiscount = items.reduce((sum, item) => Math.min(item.quantity * item.unit_price, item.line_discount ?? 0) + sum, 0);
    const globalDiscount = discount_type === 'percent' ? (subtotal - lineDiscount) * Math.min(100, Math.max(0, discount_value)) / 100 : discount_type === 'fixed' ? Math.min(subtotal - lineDiscount, Math.max(0, discount_value)) : 0;
    const discount = lineDiscount + globalDiscount;
    const total = subtotal - discount;
    client = await pool.connect();
    await client.query('BEGIN');

    const budgetResult = await client.query<Budget>(
      `INSERT INTO budgets (patient_id, notes, status, subtotal, discount_type, discount_value, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, notes, status, subtotal, discount_type, discount_value, total],
    );
    const budget = budgetResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO budget_items (budget_id, name, description, quantity, unit_price, line_discount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [budget.id, item.name || item.description, item.description, item.quantity, item.unit_price, Math.min(item.quantity * item.unit_price, item.line_discount ?? 0)],
      );
    }

    await client.query('COMMIT');
    response.status(201).json({ ...budget, items, subtotal, discount_type, discount_value, total });
  } catch (error: unknown) {
    if (client) await client.query('ROLLBACK');
    console.error('Error creating budget', error);
    response.status(500).json({ error: 'Error al crear el presupuesto' });
  } finally {
    client?.release();
  }
}

export async function updateBudgetStatus(
  request: Request<{ id: string }, Budget, StatusInput>,
  response: Response,
): Promise<void> {
  try {
    const { status } = request.body;
    if (!validStatuses.includes(status)) {
      response.status(400).json({ error: 'Estado de presupuesto no válido' });
      return;
    }

    const result = await pool.query<Budget>(
      'UPDATE budgets SET status = $1 WHERE id = $2 RETURNING *',
      [status, request.params.id],
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: 'Presupuesto no encontrado' });
      return;
    }

    response.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error updating budget status', error);
    response.status(500).json({ error: 'Error al actualizar el estado' });
  }
}
