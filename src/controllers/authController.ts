import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { jwtSecret } from '../middleware/auth.js';

export async function login(request: Request, response: Response): Promise<void> {
  try {
    const { email, password } = request.body;
    const result = await pool.query(`SELECT u.id, u.email, u.name, u.role, u.password_hash, COALESCE(array_agg(p.module_id) FILTER (WHERE p.module_id IS NOT NULL), '{}') AS permissions FROM users u LEFT JOIN user_module_permissions p ON p.user_id=u.id WHERE lower(u.email)=lower($1) GROUP BY u.id`, [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) { response.status(401).json({ error: 'Correo o contraseña incorrectos' }); return; }
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '8h' });
    response.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions } });
  } catch (error: unknown) { console.error('Login error', error); response.status(500).json({ error: 'No se pudo iniciar sesión' }); }
}

export async function getUsers(_request: Request, response: Response): Promise<void> {
  try { const result = await pool.query(`SELECT u.id, u.email, u.name, u.role, COALESCE(array_agg(p.module_id) FILTER (WHERE p.module_id IS NOT NULL), '{}') AS permissions FROM users u LEFT JOIN user_module_permissions p ON p.user_id=u.id GROUP BY u.id ORDER BY u.name`); response.json(result.rows); }
  catch (error: unknown) { console.error('Users error', error); response.status(500).json({ error: 'No se pudieron cargar los usuarios' }); }
}

export async function updatePermissions(request: Request<{ id: string }, unknown, { permissions?: string[] }>, response: Response): Promise<void> {
  const client = await pool.connect();
  try { const permissions = Array.isArray(request.body.permissions) ? request.body.permissions : []; await client.query('BEGIN'); await client.query('DELETE FROM user_module_permissions WHERE user_id=$1', [request.params.id]); for (const moduleId of permissions) await client.query('INSERT INTO user_module_permissions (user_id,module_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [request.params.id, moduleId]); await client.query('COMMIT'); response.json({ id: Number(request.params.id), permissions }); }
  catch (error: unknown) { await client.query('ROLLBACK'); console.error('Permissions error', error); response.status(500).json({ error: 'No se pudieron guardar los permisos' }); } finally { client.release(); }
}

export async function createUser(request: Request, response: Response): Promise<void> {
  try {
    const { email, password, name, role = 'odontologo' } = request.body;
    if (!email?.trim() || !password || !name?.trim() || !['admin', 'odontologo'].includes(role)) { response.status(400).json({ error: 'Nombre, correo, contraseña y rol válido son obligatorios' }); return; }
    const passwordHash = await bcrypt.hash(String(password), 12);
    const result = await pool.query('INSERT INTO users (email,password_hash,name,role) VALUES ($1,$2,$3,$4) RETURNING id,email,name,role', [email.trim().toLowerCase(), passwordHash, name.trim(), role]);
    response.status(201).json({ ...result.rows[0], permissions: [] });
  } catch (error: unknown) { console.error('Create user error', error); response.status(500).json({ error: error instanceof Error && error.message.includes('users_email_key') ? 'El correo ya está registrado' : 'No se pudo crear el usuario' }); }
}