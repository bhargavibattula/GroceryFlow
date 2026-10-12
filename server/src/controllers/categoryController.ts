import { Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { AuthenticatedRequest } from '../middleware/auth';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export async function getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const categories = await Category.find({ storeId, active: true }).sort({ name: 1 });
  res.json({ success: true, data: categories });
}

export async function createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { name, description } = req.body;

  const existing = await Category.findOne({ storeId, name: name.trim() });
  if (existing) {
    res.status(400).json({ success: false, message: `Category "${name}" already exists.` });
    return;
  }

  const cat = await Category.create({
    storeId,
    name: name.trim(),
    description: description || '',
    active: true,
  });

  res.status(201).json({ success: true, data: cat });
}
