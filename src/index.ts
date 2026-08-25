import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { initializeDatabase, pool } from './config/db.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import clinicalRecordRoutes from './routes/clinicalRecordRoutes.js';
import colleagueRoutes from './routes/colleagueRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    response.json({
      status: 'ok',
      service: 'mantis-dental-api',
      timestamp: result.rows[0].now,
    });
  } catch (error: unknown) {
    console.error('Health check failed:', error);
    response.status(500).json({
      status: 'error',
      service: 'mantis-dental-api',
      message: 'Database connection failed',
    });
  }
});

app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/clinical-records', clinicalRecordRoutes);
app.use('/api/colleagues', colleagueRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/templates', templateRoutes);

// Chivato de depuración para interceptar cualquier petición que llegue a WhatsApp
app.use('/api/whatsapp', (req, _res, next) => {
  console.log("🚨 ¡LLEGÓ ALGO A WHATSAPP ROUTE!", req.method, req.path, JSON.stringify(req.body));
  next();
}, whatsappRoutes);

// Usamos la variable de entorno PORT del archivo .env, o el puerto 4001 por defecto
const PORT = process.env.PORT || 4001;

async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    const server = app.listen(PORT, () => {
      console.log(`Mantis Dental API listening on port ${PORT}`);
    });

    server.on('error', (error) => {
      console.error('Mantis Dental API failed to start:', error);
    });
  } catch (error: unknown) {
    console.error('Mantis Dental API failed to initialize:', error);
    await pool.end();
    process.exitCode = 1;
  }
}

void startServer();