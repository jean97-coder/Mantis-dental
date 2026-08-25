import type { Request, Response } from 'express';
import type { QueryResultRow } from 'pg';
import { pool } from '../config/db.js';

export interface InventoryProduct extends QueryResultRow {
  id: number;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier: string;
  entry_date: string | null;
  expiration_date: string | null;
  created_at: string;
}

interface ProductInput {
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier: string;
  entry_date?: string | null;
  expiration_date?: string | null;
}

interface StockInput {
  stock: number;
}

function normalizeDate(dateValue: string | null | undefined): string | null {
  if (dateValue === undefined || dateValue === null || String(dateValue).trim() === '') {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('La fecha ingresada no es válida');
  }

  return parsed.toISOString().slice(0, 10);
}

export async function getInventory(_request: Request, response: Response): Promise<void> {
  try {
    const result = await pool.query<InventoryProduct>(
      'SELECT * FROM inventory ORDER BY created_at DESC',
    );
    response.json(result.rows);
  } catch (error: unknown) {
    console.error('Error fetching inventory', error);
    response.status(500).json({ error: 'Error al obtener el inventario' });
  }
}

export async function createProduct(
  request: Request<Record<string, never>, InventoryProduct, ProductInput>,
  response: Response,
): Promise<void> {
  try {
    const { name, category, stock, min_stock, price, supplier, entry_date, expiration_date } = request.body;

    if (!name || !category || !supplier || stock < 0 || min_stock < 0 || price < 0) {
      response.status(400).json({ error: 'Los datos del producto no son válidos' });
      return;
    }

    const normalizedEntryDate = normalizeDate(entry_date);
    const normalizedExpirationDate = normalizeDate(expiration_date);

    const result = await pool.query<InventoryProduct>(
      `INSERT INTO inventory (name, category, stock, min_stock, price, supplier, entry_date, expiration_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, stock, min_stock, price, supplier, normalizedEntryDate, normalizedExpirationDate],
    );

    response.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error creating inventory product', error);
    response.status(500).json({
      error: error instanceof Error && error.message.includes('La fecha ingresada')
        ? error.message
        : 'Error al crear el producto',
    });
  }
}

export async function updateStock(
  request: Request<{ id: string }, InventoryProduct, StockInput>,
  response: Response,
): Promise<void> {
  try {
    const { stock } = request.body;

    if (!Number.isInteger(stock) || stock < 0) {
      response.status(400).json({ error: 'El stock debe ser un entero mayor o igual a cero' });
      return;
    }

    const result = await pool.query<InventoryProduct>(
      'UPDATE inventory SET stock = $1 WHERE id = $2 RETURNING *',
      [stock, request.params.id],
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    response.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error updating inventory stock', error);
    response.status(500).json({ error: 'Error al actualizar el stock' });
  }
}
