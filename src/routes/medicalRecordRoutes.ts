import { Router } from 'express';
import {
  createMedicalRecord,
  getMedicalRecordsByPatient,
} from '../controllers/medicalRecordController.js';

const medicalRecordRouter = Router();

medicalRecordRouter.get('/', getMedicalRecordsByPatient);
medicalRecordRouter.get('/patient/:patientId', getMedicalRecordsByPatient);
medicalRecordRouter.post('/', createMedicalRecord);

export default medicalRecordRouter;
