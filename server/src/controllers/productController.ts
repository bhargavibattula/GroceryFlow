import { Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { PriceHistory } from '../models/PriceHistory';
import { AuthenticatedRequest } from '../middleware/auth';
import { previewPriceCalculation } from '../services/pricingService';
import { logAudit } from '../services/auditService';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  baseUnit: z.string().min(1, 'Base unit is required'),
  sellingUnits: z
    .array(
      z.object({
        unitName: z.string().min(1),
        conversionFactor: z.number().positive(),
      })
    )
    .optional(),
  lowStockThreshold: z.number().min(0).default(10),
  initialCostBasis: z.number().min(0).default(0),
  initialQuantity: z.number().min(0).default(0),
  pricingConfiguration: z
    .object({
      method: z.enum(['FIXED', 'COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN']).default('COST_PLUS_MARKUP'),
      resellerMarkupPercent: z.number().min(0).default(10),
      retailMarkupPercent: z.number().min(0).default(25),
      resellerMarginPercent: z.number().min(0).max(99).default(10),
      retailMarginPercent: z.number().min(0).max(99).default(20),
      minSellingPrice: z.number().min(0).optional(),
    })
    .default({
      method: 'COST_PLUS_MARKUP',
      resellerMarkupPercent: 10,
      retailMarkupPercent: 25,
      resellerMarginPercent: 10,
      retailMarginPercent: 20,
    }),
  manualResellerPrice: z.number().min(0).optional(),
  manualRetailPrice: z.number().min(0).optional(),
});

export async function getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_costs');

  const { search, categoryId, lowStock, outOfStock, active = 'true', page = '1', limit = '50' } = req.query;

  const query: any = { storeId };

  if (active === 'true') {
    query.active = true;
  } else if (active === 'false') {
    query.active = false;
  }

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (search) {
    const s = String(search).trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { sku: { $regex: s, $options: 'i' } },
      { barcode: { $regex: s, $options: 'i' } },
      { brand: { $regex: s, $options: 'i' } },
    ];
  }

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
    query.availableQuantity = { $gt: 0 };
  }

  if (outOfStock === 'true') {
    query.availableQuantity = { $lte: 0 };
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('categoryId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  // Strip cost basis if user is not authorized
  const sanitized = products.map((p) => {
    if (!isOwner) {
      const { currentCostBasis, ...rest } = p;
      return rest;
    }
    return p;
  });

  res.json({
    success: true,
    data: sanitized,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_costs');

  const product = await Product.findOne({ _id: req.params.id, storeId })
    .populate('categoryId', 'name')
    .lean();

  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  if (!isOwner) {
    const { currentCostBasis, ...rest } = product;
    res.json({ success: true, data: rest });
    return;
  }

  res.json({ success: true, data: product });
}

export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const body = req.body;

  // Check unique SKU
  const existing = await Product.findOne({ storeId, sku: body.sku.trim() });
  if (existing) {
    res.status(400).json({ success: false, message: `Product with SKU "${body.sku}" already exists.` });
    return;
  }

  // Calculate initial prices based on method and cost basis
  const costBasis = Number(body.initialCostBasis || 0);
  const preview = previewPriceCalculation({
    costBasis,
    method: body.pricingConfiguration.method,
    resellerMarkupPercent: body.pricingConfiguration.resellerMarkupPercent,
    retailMarkupPercent: body.pricingConfiguration.retailMarkupPercent,
    resellerMarginPercent: body.pricingConfiguration.resellerMarginPercent,
    retailMarginPercent: body.pricingConfiguration.retailMarginPercent,
    manualResellerPrice: body.manualResellerPrice,
    manualRetailPrice: body.manualRetailPrice,
    minSellingPrice: body.pricingConfiguration.minSellingPrice,
  });

  const product = await Product.create({
    storeId,
    sku: body.sku.trim(),
    name: body.name.trim(),
    brand: body.brand?.trim() || '',
    barcode: body.barcode?.trim() || '',
    categoryId: body.categoryId || undefined,
    description: body.description || '',
    imageUrl: body.imageUrl || '',
    baseUnit: body.baseUnit,
    sellingUnits: body.sellingUnits || [],
    lowStockThreshold: body.lowStockThreshold,
    availableQuantity: body.initialQuantity || 0,
    currentCostBasis: costBasis,
    pricingConfiguration: body.pricingConfiguration,
    resellerPrice: preview.reseller.price,
    retailPrice: preview.retail.price,
    active: true,
  });

  await logAudit({
    storeId,
    userId: req.auth!.userId,
    userNameSnapshot: req.user?.name,
    action: 'CREATE_PRODUCT',
    entityType: 'Product',
    entityId: product._id,
    relevantChanges: { name: product.name, sku: product.sku },
  });

  res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const product = await Product.findOne({ _id: req.params.id, storeId });

  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const allowedUpdates = [
    'name',
    'brand',
    'barcode',
    'categoryId',
    'description',
    'imageUrl',
    'baseUnit',
    'sellingUnits',
    'lowStockThreshold',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      (product as any)[field] = req.body[field];
    }
  });

  await product.save();

  await logAudit({
    storeId,
    userId: req.auth!.userId,
    userNameSnapshot: req.user?.name,
    action: 'UPDATE_PRODUCT',
    entityType: 'Product',
    entityId: product._id,
    relevantChanges: req.body,
  });

  res.json({ success: true, data: product });
}

export async function toggleArchiveProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const product = await Product.findOne({ _id: req.params.id, storeId });

  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  product.active = !product.active;
  await product.save();

  await logAudit({
    storeId,
    userId: req.auth!.userId,
    userNameSnapshot: req.user?.name,
    action: product.active ? 'RESTORE_PRODUCT' : 'ARCHIVE_PRODUCT',
    entityType: 'Product',
    entityId: product._id,
  });

  res.json({
    success: true,
    data: product,
    message: product.active ? 'Product restored.' : 'Product archived.',
  });
}

export async function getProductPriceHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_costs');

  const history = await PriceHistory.find({ storeId, productId: req.params.id })
    .populate('changedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const sanitized = history.map((h) => {
    if (!isOwner) {
      const { oldCostBasis, newCostBasis, ...rest } = h;
      return rest;
    }
    return h;
  });

  res.json({ success: true, data: sanitized });
}
