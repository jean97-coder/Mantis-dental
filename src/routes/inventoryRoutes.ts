import { Router } from 'express';
import { createProduct, getInventory, updateStock } from '../controllers/inventoryController.js';

const inventoryRouter = Router();

inventoryRouter.get('/', getInventory);
inventoryRouter.post('/', createProduct);
inventoryRouter.put('/:id/stock', updateStock);

export default inventoryRouter;
