import 'dotenv/config';
import dns from 'node:dns';
import pg from 'pg';
import type { PoolClient } from 'pg';
import { URL } from 'url';

// Fuerza de manera absoluta que Node.js resuelva primero las IPs de tipo IPv4
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

let poolConfig: any = {
  ssl: { rejectUnauthorized: false },
  family: 4,
};

if (process.env.DATABASE_URL) {
  try {
    const connectionUrl = new URL(process.env.DATABASE_URL);
    poolConfig.user = decodeURIComponent(connectionUrl.username);
    poolConfig.password = decodeURIComponent(connectionUrl.password);
    poolConfig.host = connectionUrl.hostname;
    poolConfig.database = connectionUrl.pathname.slice(1);
    poolConfig.port = Number(connectionUrl.port || 6543);
  } catch (e) {
    console.error('Error parseando DATABASE_URL:', e);
  }
}

export const pool = new Pool(poolConfig);

const defaultDocumentTemplates = [
  {
    name: 'Certificado de Asistencia',
    description: 'Certifica la asistencia del paciente a la consulta.',
    content:
      'CERTIFICADO DE ASISTENCIA\n\nEl presente documento certifica que {{nombre}} asistió a su consulta odontológica el día {{fecha}}.\n\nSe recomienda que el paciente continúe con su tratamiento indicado y siga las recomendaciones del profesional.\n\nAtentamente,\nMantis Dental',
  },
  {
    name: 'Constancia de Reposo',
    description: 'Constancia médica con período de reposo personalizable.',
    content:
      'CONSTANCIA DE REPOSO\n\nPor medio de la presente, se hace constar que {{nombre}} fue evaluado en consulta odontológica el {{fecha}} y requiere reposo por {{dias}} días, por indicación de este centro.\n\nSe extiende la presente constancia para los fines pertinentes.\n\nAtentamente,\nMantis Dental',
  },
  {
    name: 'Permiso Médico',
    description: 'Permiso médico para ausencia laboral o académica.',
    content:
      'PERMISO MÉDICO\n\nSe autoriza a {{nombre}} la licencia por motivos odontológicos el día {{fecha}}, por un período de {{dias}} días.\n\nSe entrega este documento con fines de justificación.\n\nAtentamente,\nMantis Dental',
  },
  {
    name: 'Informe Odontológico',
    description: 'Informe clínico resumido del tratamiento y evaluación.',
    content:
      'INFORME ODONTOLÓGICO\n\nPaciente: {{nombre}}\nFecha: {{fecha}}\n\nSe realizó la evaluación clínica correspondiente y se observa la necesidad de continuar con el plan de tratamiento indicado.\n\nSe recomienda seguimiento y control en citas programadas.\n\nAtentamente,\nMantis Dental',
  },
];

export async function initializeDatabase(): Promise<void> {
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(4815162342)');
    await client.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      dni VARCHAR(50) NOT NULL UNIQUE,
      address TEXT DEFAULT '',
      medical_history TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS colleagues (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(150) NOT NULL,
      specialty VARCHAR(120) NOT NULL,
      phone VARCHAR(50) NOT NULL DEFAULT '',
      email VARCHAR(150) NOT NULL DEFAULT '',
      professional_license VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
      price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
      supplier VARCHAR(150) NOT NULL,
      entry_date DATE,
      expiration_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      appointment_date TIMESTAMPTZ NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id SERIAL PRIMARY KEY,
      patient_phone VARCHAR(40) NOT NULL,
      patient_name VARCHAR(150) NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'bot', 'patient')),
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_timestamp_idx
      ON whatsapp_messages (patient_phone, timestamp DESC);

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      notes TEXT DEFAULT '',
      status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
      subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
      discount_type VARCHAR(10) NOT NULL DEFAULT 'none',
      discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
      total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'none';
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS budget_items (
      id SERIAL PRIMARY KEY,
      budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      name VARCHAR(180),
      description TEXT NOT NULL,
      quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
      line_discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (line_discount >= 0)
    );
    ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS name VARCHAR(180);
    ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS line_discount NUMERIC(12,2) NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS medical_records (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      tooth_number INTEGER NOT NULL CHECK (tooth_number > 0),
      diagnosis TEXT NOT NULL,
      treatment_plan TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS colleague_id INTEGER REFERENCES colleagues(id) ON DELETE SET NULL;
    ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS session_number INTEGER NOT NULL DEFAULT 1 CHECK (session_number > 0);
    ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS total_sessions INTEGER NOT NULL DEFAULT 1 CHECK (total_sessions > 0);
    ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS progress_status VARCHAR(30) NOT NULL DEFAULT 'Planificado';

    CREATE TABLE IF NOT EXISTS medical_history_sheets (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
      establishment VARCHAR(180) NOT NULL DEFAULT 'Mantis Dental', consultation_reason TEXT DEFAULT '', current_illness TEXT DEFAULT '',
      personal_history JSONB NOT NULL DEFAULT '{}'::jsonb, family_history JSONB NOT NULL DEFAULT '{}'::jsonb,
      vital_signs JSONB NOT NULL DEFAULT '{}'::jsonb, stomatognathic_exam JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS odontogram_records (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE, tooth_number INTEGER NOT NULL,
      surfaces JSONB NOT NULL DEFAULT '{}'::jsonb, recession NUMERIC(5,2) NOT NULL DEFAULT 0,
      mobility VARCHAR(30) NOT NULL DEFAULT 'Sin movilidad', condition VARCHAR(40) NOT NULL DEFAULT 'sano', notes TEXT DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (patient_id, tooth_number)
    );
    CREATE TABLE IF NOT EXISTS medical_notes (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      note TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS diagnoses (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      cie10_code VARCHAR(20) NOT NULL, description VARCHAR(250) NOT NULL, patient_age INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS prescriptions (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      medications JSONB NOT NULL DEFAULT '[]'::jsonb, instructions TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS medical_documents (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      document_type VARCHAR(80) NOT NULL, title VARCHAR(180) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS patient_images (
      id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      title VARCHAR(180) NOT NULL, image_url TEXT NOT NULL, image_type VARCHAR(40) NOT NULL DEFAULT 'clinical', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS document_templates (
      id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, description TEXT DEFAULT '',
      content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS treatment_packages (
      id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, description TEXT DEFAULT '',
      items JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS entry_date DATE;
    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS expiration_date DATE;
    `);

    await client.query(`
      INSERT INTO document_templates (name, description, content)
      SELECT template.name, template.description, template.content
      FROM (
        VALUES
          ($1, $2, $3),
          ($4, $5, $6),
          ($7, $8, $9),
          ($10, $11, $12)
      ) AS template(name, description, content)
      WHERE NOT EXISTS (
        SELECT 1 FROM document_templates dt WHERE dt.name = template.name
      );
    `, [
      defaultDocumentTemplates[0].name,
      defaultDocumentTemplates[0].description,
      defaultDocumentTemplates[0].content,
      defaultDocumentTemplates[1].name,
      defaultDocumentTemplates[1].description,
      defaultDocumentTemplates[1].content,
      defaultDocumentTemplates[2].name,
      defaultDocumentTemplates[2].description,
      defaultDocumentTemplates[2].content,
      defaultDocumentTemplates[3].name,
      defaultDocumentTemplates[3].description,
      defaultDocumentTemplates[3].content,
    ]);

    await client.query('COMMIT');
    console.log('Database schema verified');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    client?.release();
  }
}

void pool
  .query('SELECT NOW()')
  .then((result) => {
    console.log('PostgreSQL connection verified:', result.rows[0]);
  })
  .catch((error: unknown) => {
    console.error('PostgreSQL connection failed:', error);
  });

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});