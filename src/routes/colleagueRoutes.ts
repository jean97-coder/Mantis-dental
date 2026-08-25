import { Router } from 'express';
import {
  createColleague,
  deleteColleague,
  getColleagues,
  updateColleague,
} from '../controllers/colleagueController.js';

const colleagueRouter = Router();

colleagueRouter.get('/', getColleagues);
colleagueRouter.post('/', createColleague);
colleagueRouter.put('/:id', updateColleague);
colleagueRouter.delete('/:id', deleteColleague);

export default colleagueRouter;
