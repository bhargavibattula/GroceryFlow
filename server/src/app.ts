import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import pricingRoutes from './routes/pricingRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import saleRoutes from './routes/saleRoutes';
import returnRoutes from './routes/returnRoutes';
import supplierRoutes from './routes/supplierRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import khataRoutes from './routes/khataRoutes';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FreshStock Inventory & Dual-Pricing API',
    timestamp: new Date().toISOString(),
  });
});

// Swagger OpenAPI documentation spec
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'FreshStock API',
    version: '1.0.0',
    description: 'Grocery Store Inventory, Bulk Purchases & Dual-Pricing Management API',
  },
  servers: [{ url: '/api', description: 'Default API Prefix' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'API Health check',
        responses: { '200': { description: 'Service is healthy' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user & issue JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { identifier: { type: 'string' }, password: { type: 'string' } },
                required: ['identifier', 'password'],
              },
            },
          },
        },
        responses: { '200': { description: 'Authenticated with token & role' } },
      },
    },
    '/products': {
      get: { summary: 'List products with filters', responses: { '200': { description: 'Product list' } } },
      post: { summary: 'Create new product with dual pricing', responses: { '201': { description: 'Product created' } } },
    },
    '/purchases': {
      get: { summary: 'List bulk purchases', responses: { '200': { description: 'Purchases' } } },
      post: { summary: 'Record bulk purchase with landed costs', responses: { '201': { description: 'Purchase recorded' } } },
    },
    '/sales': {
      get: { summary: 'List sales history', responses: { '200': { description: 'Sales list' } } },
      post: { summary: 'Process POS sale with dual pricing & stock deduction', responses: { '201': { description: 'Sale completed' } } },
    },
    '/dashboard/summary': {
      get: { summary: 'Owner & Salesperson dashboard metrics', responses: { '200': { description: 'Metrics summary' } } },
    },
  },
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products', pricingRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api', returnRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/khata', khataRoutes);

// Centralized error handler
app.use(errorHandler);
