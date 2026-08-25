import { Router } from 'express';
import { getDashboardStats } from '../controllers/reportController.js';

const reportRouter = Router();

reportRouter.get('/', getDashboardStats);

export default reportRouter;
