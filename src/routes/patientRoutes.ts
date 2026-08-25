import { Router } from 'express';
import { createPatient, getPatients } from '../controllers/patientController.js';

const patientRouter = Router();

patientRouter.get('/', getPatients);
patientRouter.post('/', createPatient);

export default patientRouter;
