import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { Product } from '../models/Product';
import { Purchase } from '../models/Purchase';
import { InventoryBatch } from '../models/InventoryBatch';
import { InventoryMovement } from '../models/InventoryMovement';
import { Sale } from '../models/Sale';
import { generateSaleNumber } from '../services/salesService';

export async function runSeed() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Clearing existing collections...');
  await Store.deleteMany({});
  await User.deleteMany({});
  await Category.deleteMany({});
  await Supplier.deleteMany({});
  await Product.deleteMany({});
  await Purchase.deleteMany({});
  await InventoryBatch.deleteMany({});
  await InventoryMovement.deleteMany({});
  await Sale.deleteMany({});

  console.log('[Seed] Creating Store...');
  const store = await Store.create({
    name: 'FreshStock Family Groceries',
    address: 'Main Bazaar Road, Near Gandhi Chowk',
    phone: '+91 98765 43210',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    pricingDefaults: {
      defaultPricingMethod: 'COST_PLUS_MARKUP',
      resellerMarkupPercent: 12,
      retailMarkupPercent: 25,
      resellerMarginPercent: 10,
      retailMarginPercent: 20,
    },
    settings: {
      lowStockAlertsEnabled: true,
      requireAdjustmentReason: true,
      preventOverselling: true,
    },
  });

  console.log('[Seed] Creating Users (Owner & Salesperson)...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const owner = await User.create({
    storeId: store._id,
    name: 'Ramakrishna Battula',
    email: 'owner@freshstock.com',
    username: 'owner',
    passwordHash,
    role: 'OWNER',
    permissions: ['all'],
    active: true,
  });

  const salesperson = await User.create({
    storeId: store._id,
    name: 'Bhargavi Battula',
    email: 'sales@freshstock.com',
    username: 'sales',
    passwordHash,
    role: 'SALESPERSON',
    permissions: ['process_sales', 'view_inventory', 'view_sales_history'],
    active: true,
  });

  console.log('[Seed] Creating Categories...');
  const [catGrains, catDals, catOils, catSugar, catSnacks, catCare, catBev] = await Promise.all([
    Category.create({ storeId: store._id, name: 'Grains & Rice', description: 'Rice, wheat, millets' }),
    Category.create({ storeId: store._id, name: 'Dals & Pulses', description: 'Toor, moong, chana dals' }),
    Category.create({ storeId: store._id, name: 'Oils & Ghee', description: 'Edible oils and ghee' }),
    Category.create({ storeId: store._id, name: 'Spices & Sugar', description: 'Sugar, jaggery, salt' }),
    Category.create({ storeId: store._id, name: 'Snacks & Biscuits', description: 'Packaged bakery items' }),
    Category.create({ storeId: store._id, name: 'Personal & Home Care', description: 'Soaps, detergents' }),
    Category.create({ storeId: store._id, name: 'Beverages', description: 'Tea powder, coffee' }),
  ]);

  console.log('[Seed] Creating Suppliers...');
  const [suppKrishna, suppVijaya, suppMetro] = await Promise.all([
    Supplier.create({
      storeId: store._id,
      name: 'Sri Krishna Traders',
      phone: '+91 94401 11223',
      address: 'APMC Market Yard, Yard No. 4',
      notes: 'Wholesale grains & sugar supplier',
    }),
    Supplier.create({
      storeId: store._id,
      name: 'Vijaya Agro Mills',
      phone: '+91 94402 33445',
      address: 'Industrial Area, Phase 2',
      notes: 'Direct mill for sunflower and groundnut oils',
    }),
    Supplier.create({
      storeId: store._id,
      name: 'Metro Wholesale Distributors',
      phone: '+91 94403 55667',
      address: 'Ring Road Commercial Hub',
      notes: 'Packaged FMCG, biscuits, soaps & tea',
    }),
  ]);

  console.log('[Seed] Creating Core Grocery Products...');
  const productsData = [
    {
      sku: 'RICE-SONA-01',
      name: 'Sona Masoori Rice (Raw)',
      brand: 'Kurnool Special',
      categoryId: catGrains._id,
      baseUnit: 'kg',
      sellingUnits: [
        { unitName: '25kg Bag', conversionFactor: 25 },
        { unitName: '50kg Bag', conversionFactor: 50 },
      ],
      lowStockThreshold: 100,
      availableQuantity: 450,
      currentCostBasis: 48,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 15,
        retailMarkupPercent: 28,
        resellerMarginPercent: 13,
        retailMarginPercent: 22,
        minSellingPrice: 50,
      },
      resellerPrice: 55.2,
      retailPrice: 61.44,
    },
    {
      sku: 'DAL-TOOR-01',
      name: 'Toor Dal (Premium Fatka)',
      brand: 'Desi Choice',
      categoryId: catDals._id,
      baseUnit: 'kg',
      sellingUnits: [
        { unitName: '1kg Packet', conversionFactor: 1 },
        { unitName: '30kg Bag', conversionFactor: 30 },
      ],
      lowStockThreshold: 40,
      availableQuantity: 180,
      currentCostBasis: 135,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 10,
        retailMarkupPercent: 22,
        resellerMarginPercent: 9,
        retailMarginPercent: 18,
        minSellingPrice: 140,
      },
      resellerPrice: 148.5,
      retailPrice: 164.7,
    },
    {
      sku: 'SUGAR-M30-01',
      name: 'Sugar (M-30 Crystal)',
      brand: 'Madhur Special',
      categoryId: catSugar._id,
      baseUnit: 'kg',
      sellingUnits: [
        { unitName: '1kg Packet', conversionFactor: 1 },
        { unitName: '50kg Bag', conversionFactor: 50 },
      ],
      lowStockThreshold: 80,
      availableQuantity: 320,
      currentCostBasis: 38,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 10,
        retailMarkupPercent: 20,
        resellerMarginPercent: 9,
        retailMarginPercent: 16,
        minSellingPrice: 40,
      },
      resellerPrice: 41.8,
      retailPrice: 45.6,
    },
    {
      sku: 'OIL-SUN-01',
      name: 'Freedom Sunflower Oil',
      brand: 'Freedom',
      categoryId: catOils._id,
      baseUnit: 'litre',
      sellingUnits: [
        { unitName: '1L Pouch', conversionFactor: 1 },
        { unitName: '15L Tin', conversionFactor: 15 },
      ],
      lowStockThreshold: 50,
      availableQuantity: 240,
      currentCostBasis: 110,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 10,
        retailMarkupPercent: 23,
        resellerMarginPercent: 9,
        retailMarginPercent: 18,
        minSellingPrice: 115,
      },
      resellerPrice: 121,
      retailPrice: 135.3,
    },
    {
      sku: 'FLOUR-ATTA-01',
      name: 'Chakki Fresh Whole Wheat Atta',
      brand: 'Aashirvaad',
      categoryId: catGrains._id,
      baseUnit: 'kg',
      sellingUnits: [
        { unitName: '5kg Bag', conversionFactor: 5 },
        { unitName: '10kg Bag', conversionFactor: 10 },
      ],
      lowStockThreshold: 50,
      availableQuantity: 200,
      currentCostBasis: 34,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 15,
        retailMarkupPercent: 30,
        resellerMarginPercent: 13,
        retailMarginPercent: 23,
        minSellingPrice: 38,
      },
      resellerPrice: 39.1,
      retailPrice: 44.2,
    },
    {
      sku: 'SNK-PARLEG-01',
      name: 'Parle-G Glucose Biscuits',
      brand: 'Parle',
      categoryId: catSnacks._id,
      baseUnit: 'packet',
      sellingUnits: [{ unitName: 'Carton (24 Pkts)', conversionFactor: 24 }],
      lowStockThreshold: 100,
      availableQuantity: 480,
      currentCostBasis: 8.5,
      pricingConfiguration: {
        method: 'FIXED' as const,
        resellerMarkupPercent: 11.7,
        retailMarkupPercent: 17.6,
        resellerMarginPercent: 10,
        retailMarginPercent: 15,
      },
      resellerPrice: 9.5,
      retailPrice: 10.0,
    },
    {
      sku: 'CARE-SOAP-01',
      name: 'Medimix Ayurvedic Soap (125g)',
      brand: 'Medimix',
      categoryId: catCare._id,
      baseUnit: 'piece',
      sellingUnits: [{ unitName: 'Pack of 3', conversionFactor: 3 }],
      lowStockThreshold: 30,
      availableQuantity: 15, // Low stock demo!
      currentCostBasis: 32,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 12.5,
        retailMarkupPercent: 31.25,
        resellerMarginPercent: 11,
        retailMarginPercent: 23,
      },
      resellerPrice: 36,
      retailPrice: 42,
    },
    {
      sku: 'BEV-TEA-01',
      name: 'Tata Tea Gold Leaf (500g)',
      brand: 'Tata',
      categoryId: catBev._id,
      baseUnit: 'packet',
      sellingUnits: [{ unitName: 'Carton (12 Pkts)', conversionFactor: 12 }],
      lowStockThreshold: 20,
      availableQuantity: 65,
      currentCostBasis: 230,
      pricingConfiguration: {
        method: 'COST_PLUS_MARKUP' as const,
        resellerMarkupPercent: 10.87,
        retailMarkupPercent: 21.74,
        resellerMarginPercent: 9.8,
        retailMarginPercent: 17.8,
      },
      resellerPrice: 255,
      retailPrice: 280,
    },
  ];

  const createdProducts = [];
  for (const item of productsData) {
    const prod = await Product.create({
      storeId: store._id,
      ...item,
      active: true,
    });
    createdProducts.push(prod);

    // Create initial inventory batch
    await InventoryBatch.create({
      storeId: store._id,
      productId: prod._id,
      originalQuantity: prod.availableQuantity,
      remainingQuantity: prod.availableQuantity,
      unitCost: prod.currentCostBasis,
      receivedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days ago
      supplierId: suppKrishna._id,
    });

    // Create initial movement
    await InventoryMovement.create({
      storeId: store._id,
      productId: prod._id,
      quantityDelta: prod.availableQuantity,
      movementType: 'PURCHASE_RECEIPT',
      referenceType: 'Purchase',
      reason: 'Initial Opening Stock',
      unitCostBasis: prod.currentCostBasis,
      resultingQuantity: prod.availableQuantity,
      createdBy: owner._id,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    });
  }

  console.log('[Seed] Creating Sample Bulk Purchase with allocated transport...');
  const purchase1 = await Purchase.create({
    storeId: store._id,
    supplierId: suppKrishna._id,
    supplierNameSnapshot: suppKrishna.name,
    invoiceNumber: 'INV-SKT-8891',
    purchasedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    lineItems: [
      {
        productId: createdProducts[0]._id, // Rice
        productNameSnapshot: createdProducts[0].name,
        quantity: 10, // 10 bags of 50kg = 500kg
        purchaseUnit: '50kg Bag',
        conversionFactor: 50,
        baseQuantity: 500,
        unitPurchaseCost: 2350,
        lineDiscount: 500,
        allocatedExpenses: 600,
        landedCostPerBaseUnit: 47.2,
        netLineCost: 23600,
      },
      {
        productId: createdProducts[2]._id, // Sugar
        productNameSnapshot: createdProducts[2].name,
        quantity: 8, // 8 bags of 50kg = 400kg
        purchaseUnit: '50kg Bag',
        conversionFactor: 50,
        baseQuantity: 400,
        unitPurchaseCost: 1850,
        lineDiscount: 300,
        allocatedExpenses: 400,
        landedCostPerBaseUnit: 37.25,
        netLineCost: 14900,
      },
    ],
    subtotal: 38300,
    discountTotal: 800,
    additionalCosts: {
      transportation: 800,
      loading: 200,
      other: 0,
      notes: 'Tempo freight from APMC yard',
    },
    grandTotal: 38500,
    paymentStatus: 'PAID',
    status: 'RECEIVED',
    createdBy: owner._id,
    notes: 'Bulk stock arrival for month opening',
  });

  console.log('[Seed] Creating Sample Sales (Reseller & Retail)...');
  const saleNum1 = await generateSaleNumber(store._id.toString());
  await Sale.create({
    storeId: store._id,
    saleNumber: saleNum1,
    customerType: 'RESELLER',
    customerName: 'Balaji Kirana & General Store',
    customerPhone: '+91 98480 12345',
    lineItems: [
      {
        productId: createdProducts[0]._id,
        productNameSnapshot: createdProducts[0].name,
        quantity: 50,
        sellingUnit: 'kg',
        conversionFactor: 1,
        unitPrice: 55.2,
        discount: 60,
        lineTotal: 2700,
        unitCostBasis: 48,
        priceType: 'RESELLER',
      },
      {
        productId: createdProducts[3]._id,
        productNameSnapshot: createdProducts[3].name,
        quantity: 15,
        sellingUnit: 'litre',
        conversionFactor: 1,
        unitPrice: 121,
        discount: 15,
        lineTotal: 1800,
        unitCostBasis: 110,
        priceType: 'RESELLER',
      },
    ],
    subtotal: 4575,
    discountTotal: 75,
    taxTotal: 0,
    total: 4500,
    totalCostBasis: 50 * 48 + 15 * 110, // 2400 + 1650 = 4050
    estimatedGrossProfit: 450,
    paymentStatus: 'PAID',
    paymentDetails: {
      method: 'UPI',
      upiReference: 'UPI/20261012/882194',
      digitalAmount: 4500,
    },
    status: 'COMPLETED',
    createdBy: salesperson._id,
    createdAt: new Date(),
  });

  console.log('========================================================');
  console.log('✅ FRESHSTOCK DATABASE SEEDED SUCCESSFULLY!');
  console.log('--------------------------------------------------------');
  console.log('Store: FreshStock Family Groceries');
  console.log('Credentials:');
  console.log('  👑 OWNER:       username: "owner"   password: "password123"');
  console.log('  🛒 SALESPERSON: username: "sales"   password: "password123"');
  console.log('Products created: 8 core grocery items (Rice, Dal, Sugar, Oil, etc.)');
  console.log('========================================================');
}

// Allow direct execution: `node dist/scripts/seed.js` or `ts-node src/scripts/seed.ts`
if (require.main === module) {
  runSeed()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Error]:', err);
      await disconnectDB();
      process.exit(1);
    });
}
