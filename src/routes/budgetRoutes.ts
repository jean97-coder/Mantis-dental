import { Router } from 'express';
import {
  createBudget,
  getBudgets,
  updateBudgetStatus,
} from '../controllers/budgetController.js';

const budgetRouter = Router();

budgetRouter.get('/', getBudgets);
budgetRouter.post('/', createBudget);
budgetRouter.patch('/:id/status', updateBudgetStatus);

export default budgetRouter;
