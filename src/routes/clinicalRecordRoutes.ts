import { Router } from 'express';
import {
  createDiagnosis,
  createDiagnosisBatch,
  createDocument,
  createImage,
  createNote,
  createPrescription,
  deleteDocument,
  deleteClinicalRecord,
  deleteImage,
  getDiagnoses,
  getDocuments,
  getHistorySheet,
  getImages,
  getNotes,
  getOdontogram,
  getOdontogramHistory,
  getHealthAssessment,
  getPrescriptions,
  saveHistorySheet,
  saveOdontogram,
  saveHealthAssessment,
} from '../controllers/clinicalRecordController.js';

const router = Router();
router.get('/patient/:patientId/history-sheet', getHistorySheet);
router.put('/patient/:patientId/history-sheet', saveHistorySheet);
router.get('/patient/:patientId/odontogram', getOdontogram);
router.put('/patient/:patientId/odontogram', saveOdontogram);
router.get('/patient/:patientId/odontogram/history', getOdontogramHistory);
router.get('/patient/:patientId/health-assessment', getHealthAssessment);
router.put('/patient/:patientId/health-assessment', saveHealthAssessment);
router.get('/patient/:patientId/notes', getNotes);
router.post('/patient/:patientId/notes', createNote);
router.delete('/notes/:id', deleteClinicalRecord);
router.get('/patient/:patientId/diagnoses', getDiagnoses);
router.post('/patient/:patientId/diagnoses', createDiagnosis);
router.post('/patient/:patientId/diagnoses/batch', createDiagnosisBatch);
router.get('/patient/:patientId/prescriptions', getPrescriptions);
router.post('/patient/:patientId/prescriptions', createPrescription);
router.get('/patient/:patientId/documents', getDocuments);
router.post('/patient/:patientId/documents', createDocument);
router.delete('/patient/:patientId/documents/:documentId', deleteDocument);
router.get('/patient/:patientId/images', getImages);
router.post('/patient/:patientId/images', createImage);
router.delete('/patient/:patientId/images/:imageId', deleteImage);

export default router;
