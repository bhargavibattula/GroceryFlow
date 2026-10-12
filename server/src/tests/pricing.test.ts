import { describe, it, expect } from 'vitest';
import {
  calculateCostPlusPrice,
  calculateTargetMarginPrice,
  evaluateFixedPrice,
  allocatePurchaseExpenses,
} from '../utils/pricing';
import { roundMoney, formatINR } from '../utils/money';

describe('Pricing Engine Calculations', () => {
  it('calculates cost-plus markup correctly', () => {
    // Unit cost = ₹100, Markup = 20% -> Price = ₹120, Profit = ₹20, Gross margin = 16.67%
    const res = calculateCostPlusPrice(100, 20);
    expect(res.price).toBe(120);
    expect(res.grossProfitPerUnit).toBe(20);
    expect(res.grossMarginPercent).toBe(16.67);
    expect(res.markupPercent).toBe(20);
  });

  it('calculates target gross margin price correctly', () => {
    // Unit cost = ₹80, Target Margin = 20% -> Price = 80 / (1 - 0.20) = ₹100
    const res = calculateTargetMarginPrice(80, 20);
    expect(res.price).toBe(100);
    expect(res.grossProfitPerUnit).toBe(20);
    expect(res.grossMarginPercent).toBe(20);
    expect(res.markupPercent).toBe(25);
  });

  it('strictly rejects gross margins >= 100%', () => {
    expect(() => calculateTargetMarginPrice(100, 100)).toThrow(
      'Target gross margin must be strictly less than 100%'
    );
    expect(() => calculateTargetMarginPrice(100, 105)).toThrow(
      'Target gross margin must be strictly less than 100%'
    );
  });

  it('rejects negative costs or margins', () => {
    expect(() => calculateCostPlusPrice(-10, 15)).toThrow();
    expect(() => calculateTargetMarginPrice(50, -5)).toThrow();
  });

  it('evaluates fixed price metrics accurately', () => {
    const res = evaluateFixedPrice(50, 65);
    expect(res.price).toBe(65);
    expect(res.grossProfitPerUnit).toBe(15);
    expect(res.grossMarginPercent).toBe(23.08);
    expect(res.markupPercent).toBe(30);
  });
});

describe('Bulk Purchase Expense Allocation', () => {
  it('proportionally allocates freight expenses across line items', () => {
    // Item 1: 10 bags of Rice @ ₹1000 = ₹10,000 (each bag 50kg -> 500kg)
    // Item 2: 5 bags of Sugar @ ₹2000 = ₹10,000 (each bag 50kg -> 250kg)
    // Subtotal = ₹20,000. Shared Freight = ₹2,000.
    // Item 1 proportion: 50% -> gets ₹1,000 freight -> Net cost = ₹11,000 -> Landed cost = 11000/500 = ₹22/kg
    // Item 2 proportion: 50% -> gets ₹1,000 freight -> Net cost = ₹11,000 -> Landed cost = 11000/250 = ₹44/kg
    const items = [
      { productId: 'p1', quantity: 10, conversionFactor: 50, unitPrice: 1000 },
      { productId: 'p2', quantity: 5, conversionFactor: 50, unitPrice: 2000 },
    ];

    const result = allocatePurchaseExpenses(items, 2000, 0);

    expect(result.subtotal).toBe(20000);
    expect(result.grandTotal).toBe(22000);
    expect(result.allocatedLines[0].allocatedExpenses).toBe(1000);
    expect(result.allocatedLines[1].allocatedExpenses).toBe(1000);
    expect(result.allocatedLines[0].landedCostPerBaseUnit).toBe(22);
    expect(result.allocatedLines[1].landedCostPerBaseUnit).toBe(44);
  });

  it('handles line discounts and additional expenses combined', () => {
    const items = [
      { productId: 'p1', quantity: 2, conversionFactor: 1, unitPrice: 500, lineDiscount: 50 },
    ];
    // Subtotal = 1000, Discount = 50, Freight = 100 -> Grand total = 1050
    const res = allocatePurchaseExpenses(items, 100, 0);
    expect(res.grandTotal).toBe(1050);
    expect(res.allocatedLines[0].landedCostPerBaseUnit).toBe(525);
  });
});

describe('Money and Indian Rupee Formatting', () => {
  it('avoids floating point rounding drift', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(19.999)).toBe(20);
  });

  it('formats Indian numbering system with ₹ symbol correctly', () => {
    expect(formatINR(1250)).toBe('₹1,250.00');
    expect(formatINR(100000)).toBe('₹1,00,000.00');
    expect(formatINR(1534200.5)).toBe('₹15,34,200.50');
  });
});
