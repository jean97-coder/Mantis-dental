import { Router } from 'express';
import {
  getChats,
  getMessages,
  receiveWebhook,
  sendManualMessage,
  verifyWebhook,
} from '../controllers/whatsappController.js';

const router = Router();
router.get('/webhook', verifyWebhook);
router.post('/webhook', receiveWebhook);
router.get('/chats', getChats);
router.get('/chats/:phone/messages', getMessages);
router.post('/messages', sendManualMessage);

export default router;