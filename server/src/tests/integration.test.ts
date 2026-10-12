import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { runSeed } from '../scripts/seed';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';

let ownerToken: string;
let salesToken: string;
let riceProductId: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await runSeed();

  // Login as Owner
  const ownerRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'owner', password: 'password123' });
  expect(ownerRes.status).toBe(200);
  ownerToken = ownerRes.body.token;

  // Login as Salesperson
  const salesRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'sales', password: 'password123' });
  expect(salesRes.status).toBe(200);
  salesToken = salesRes.body.token;

  // Get rice product id
  const prodRes = await request(app)
    .get('/api/products?search=RICE-SONA-01')
    .set('Authorization', `Bearer ${ownerToken}`);
  expect(prodRes.body.data.length).toBeGreaterThan(0);
  riceProductId = prodRes.body.data[0]._id;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Role-Based Authorization & Privacy', () => {
  it('allows owner to see cost basis, but hides cost basis from salesperson', async () => {
    const ownerView = await request(app)
      .get(`/api/products/${riceProductId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerView.status).toBe(200);
    expect(ownerView.body.data.currentCostBasis).toBeDefined();

    const salesView = await request(app)
      .get(`/api/products/${riceProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(salesView.status).toBe(200);
    expect(salesView.body.data.currentCostBasis).toBeUndefined();
  });

  it('prohibits salesperson from updating prices or creating bulk purchases', async () => {
    const priceUpdate = await request(app)
      .patch(`/api/products/${riceProductId}/pricing`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ method: 'FIXED', manualRetailPrice: 100 });
    expect(priceUpdate.status).toBe(403);

    const purchaseRes = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ invoiceNumber: 'TEST-INV', lineItems: [] });
    expect(purchaseRes.status).toBe(403);
  });
});

describe('Dual Pricing & Price History', () => {
  it('updates dual prices and writes an immutable price history record', async () => {
    const updateRes = await request(app)
      .patch(`/api/products/${riceProductId}/pricing`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        method: 'COST_PLUS_MARKUP',
        resellerMarkupPercent: 18,
        retailMarkupPercent: 32,
        reason: 'Transportation tariff hike',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.resellerPrice).toBeGreaterThan(50);

    // Verify history recorded
    const historyRes = await request(app)
      .get(`/api/products/${riceProductId}/price-history`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBeGreaterThan(0);
    expect(historyRes.body.data[0].reason).toBe('Transportation tariff hike');
  });
});

describe('Sales & Stock Deduction', () => {
  it('allows salesperson to complete a sale with reseller pricing and deducts stock', async () => {
    const beforeProduct = await Product.findById(riceProductId);
    const initialQty = beforeProduct!.availableQuantity;

    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerType: 'RESELLER',
        customerName: 'Kalyan Traders',
        lineItems: [
          {
            productId: riceProductId,
            quantity: 20, // 20 kg
            sellingUnit: 'kg',
            conversionFactor: 1,
          },
        ],
        paymentDetails: { method: 'CASH' },
      });

    expect(saleRes.status).toBe(201);
    expect(saleRes.body.data.saleNumber).toMatch(/^FS-/);

    const afterProduct = await Product.findById(riceProductId);
    expect(afterProduct!.availableQuantity).toBe(initialQty - 20);
  });

  it('prevents overselling when requested quantity exceeds available stock', async () => {
    const product = await Product.findById(riceProductId);
    const excessQuantity = product!.availableQuantity + 1000;

    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerType: 'RETAIL',
        lineItems: [
          {
            productId: riceProductId,
            quantity: excessQuantity,
            sellingUnit: 'kg',
            conversionFactor: 1,
          },
        ],
        paymentDetails: { method: 'CASH' },
      });

    expect(saleRes.status).toBe(400);
    expect(saleRes.body.message).toContain('Insufficient stock');
  });

  it('is idempotent when idempotencyKey is supplied', async () => {
    const key = 'idem-unique-key-999';
    const payload = {
      customerType: 'RETAIL',
      lineItems: [
        {
          productId: riceProductId,
          quantity: 2,
          sellingUnit: 'kg',
          conversionFactor: 1,
        },
      ],
      paymentDetails: { method: 'CASH' },
      idempotencyKey: key,
    };

    const first = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${salesToken}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${salesToken}`)
      .send(payload);
    expect(second.status).toBe(201);
    expect(second.body.data._id).toBe(first.body.data._id);
  });
});

describe('Sales Returns & Stock Restocking', () => {
  it('processes return with restocked quantity increasing stock', async () => {
    // 1. Create a sale of 5 kg
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerType: 'RETAIL',
        lineItems: [{ productId: riceProductId, quantity: 5, sellingUnit: 'kg', conversionFactor: 1 }],
        paymentDetails: { method: 'CASH' },
      });
    const saleId = saleRes.body.data._id;

    const midProduct = await Product.findById(riceProductId);
    const stockAfterSale = midProduct!.availableQuantity;

    // 2. Return 3 kg (2 restocked, 1 damaged)
    const returnRes = await request(app)
      .post(`/api/sales/${saleId}/returns`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        items: [
          {
            productId: riceProductId,
            returnedQuantity: 3,
            restockedQuantity: 2,
            damagedQuantity: 1,
            reason: 'Customer bought excess',
          },
        ],
        paymentMethod: 'CASH',
      });

    expect(returnRes.status).toBe(201);

    // 3. Stock should increase by only restocked amount (+2)
    const finalProduct = await Product.findById(riceProductId);
    expect(finalProduct!.availableQuantity).toBe(stockAfterSale + 2);
  });
});
