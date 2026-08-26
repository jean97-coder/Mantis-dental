import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export interface AuthUser { id: number; email: string; name: string; role: 'admin' | 'odontologo'; permissions: string[] }
declare global { namespace Express { interface Request { authUser?: AuthUser } } }
const secret = process.env.JWT_SECRET || 'mantis-dental-development-secret-change-me';

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) { response.status(401).json({ error: 'Autenticación requerida' }); return; }
    const payload = jwt.verify(header.slice(7), secret) as { id: number };
    const result = await pool.query<AuthUser & { module_id: string | null }>(`SELECT u.id, u.email, u.name, u.role, p.module_id FROM users u LEFT JOIN user_module_permissions p ON p.user_id=u.id WHERE u.id=$1`, [payload.id]);
    if (!result.rows[0]) { response.status(401).json({ error: 'Sesión no válida' }); return; }
    const first = result.rows[0];
    request.authUser = { id: first.id, email: first.email, name: first.name, role: first.role, permissions: result.rows.flatMap((row) => row.module_id ? [row.module_id] : []) };
    next();
  } catch { response.status(401).json({ error: 'Token inválido o expirado' }); }
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser || !roles.includes(request.authUser.role)) { response.status(403).json({ error: 'No tienes permisos para esta operación' }); return; }
    next();
  };
}

export function requireModule(moduleId: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (request.authUser?.role === 'admin' || request.authUser?.permissions.includes(moduleId)) { next(); return; }
    response.status(403).json({ error: 'Módulo no autorizado' });
  };
}

export { secret as jwtSecret };