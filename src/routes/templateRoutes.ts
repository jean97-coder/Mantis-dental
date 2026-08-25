import { Router } from 'express';
import { createDocumentTemplate, createTreatmentPackage, deleteTreatmentPackage, getDocumentTemplates, getTreatmentPackages, updateTreatmentPackage } from '../controllers/templateController.js';

const router = Router();
router.get('/document-templates', getDocumentTemplates);
router.post('/document-templates', createDocumentTemplate);
router.get('/treatment-packages', getTreatmentPackages);
router.post('/treatment-packages', createTreatmentPackage);
router.put('/treatment-packages/:id', updateTreatmentPackage);
router.delete('/treatment-packages/:id', deleteTreatmentPackage);
export default router;
