import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';

const appointmentRouter = Router();

appointmentRouter.get('/', getAppointments);
appointmentRouter.post('/', createAppointment);
appointmentRouter.patch('/:id/status', updateAppointmentStatus);

export default appointmentRouter;
