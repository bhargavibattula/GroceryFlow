export type Language = 'en' | 'te';

export const translations = {
  en: {
    appName: 'FreshStock',
    tagline: 'Family Grocery Store Inventory & Dual-Pricing System',
    storeName: 'FreshStock Family Groceries',
    welcome: 'Welcome',
    ownerBadge: '👑 Owner (Father)',
    salesBadge: '🛒 Salesperson',
    bhargaviOwner: '👑 Bhargavi (Owner)',

    // Tabs
    tabDashboard: 'Home',
    tabInventory: 'Stock',
    tabSell: 'Sell',
    tabReports: 'Reports',
    tabSettings: 'Settings',

    // Customer Types
    retailCustomer: 'Retail Customer',
    resellerCustomer: 'Wholesale / Reseller',
    pricingMode: 'Pricing Mode',
    retail: 'Retail',
    reseller: 'Wholesale',

    // Stock Status
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    availableStock: 'Available Stock',
    threshold: 'Alert Level',

    // Pricing
    resellerPrice: 'Reseller',
    retailPrice: 'Retail',
    landedCost: 'Landed Cost',
    unitProfit: 'Unit Profit',
    method: 'Method',
    costPlus: 'Cost-Plus Markup',
    marginPercent: 'Gross Margin %',
    fixedPrice: 'Fixed Price',

    // Dashboard
    todaysSales: "Today's Gross Sales",
    todaysProfit: "Est. Gross Profit",
    inventoryValue: 'Inventory Value',
    totalItems: 'Total Products',
    quickSell: 'Quick Sell',
    bulkPurchase: 'Bulk Buy',
    addItem: 'Add Item',
    recentSales: 'Recent Sales',
    recentPurchases: 'Recent Bulk Purchases',
    topProducts: 'Popular Grocery Items',
    categories: 'Categories',
    exploreAll: 'View All',
    viewAll: 'View All',
    lowStockAlert: 'Products Running Low',
    lowStockAlertSub: 'Tap to check low stock and reorder',
    disclaimer: 'Gross profit estimate excludes store rent, employee wages, and taxes.',

    // Quick Sell / POS
    searchProduct: 'Search rice, dal, oil, biscuits...',
    addToBill: '+ Add to Bill',
    inBill: 'in bill',
    reviewBill: 'Review Bill',
    cart: 'Cart',
    total: 'Total',

    // Cart & Checkout
    checkoutTitle: 'Bill & Checkout',
    customerInfo: 'Customer Information',
    customerName: 'Customer Name',
    customerPhone: 'Phone (Optional)',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    upi: 'UPI',
    card: 'Card',
    split: 'Split',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    completeSale: 'Complete Sale',
    clearAll: 'Clear All',

    // Receipt
    saleConfirmed: 'Sale Confirmed!',
    saleNumber: 'Bill Number',
    printReceipt: 'Print',
    shareReceipt: 'Share Bill',
    newSale: 'Start New Sale',
    thankYou: 'Thank you for shopping with us! 🙏',

    // Buttons & Actions
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    demoAccounts: 'Demo Accounts (Single-Tap Fill)',
    language: 'Language',
  },
  te: {
    appName: 'ఫ్రెష్‌స్టాక్',
    tagline: 'కిరాణా దుకాణం ఇన్వెంటరీ & డ్యూయల్-ధరల వ్యవస్థ',
    storeName: 'ఫ్రెష్‌స్టాక్ ఫ్యామిలీ కిరాణా',
    welcome: 'స్వాగతం',
    ownerBadge: '👑 యజమాని (ఓనర్)',
    salesBadge: '🛒 సేల్స్‌పర్సన్',
    bhargaviOwner: '👑 భార్గవి (ఓనర్)',

    // Tabs
    tabDashboard: 'హోమ్',
    tabInventory: 'సరుకులు',
    tabSell: 'అమ్మకం',
    tabReports: 'రిపోర్టులు',
    tabSettings: 'సెట్టింగ్స్',

    // Customer Types
    retailCustomer: 'సాధారణ / రిటైల్ కస్టమర్',
    resellerCustomer: 'హోల్‌సేల్ / రీసెల్లర్',
    pricingMode: 'ధరల మోడ్',
    retail: 'రిటైల్',
    reseller: 'హోల్‌సేల్',

    // Stock Status
    inStock: 'స్టాక్ ఉంది',
    lowStock: 'తక్కువగా ఉంది ⚠️',
    outOfStock: 'స్టాక్ అయిపోయింది ❌',
    availableStock: 'మిగిలిన సరుకు',
    threshold: 'అలర్ట్ స్థాయి',

    // Pricing
    resellerPrice: 'హోల్‌సేల్ ధర',
    retailPrice: 'రిటైల్ ధర',
    landedCost: 'కొనుగోలు ధర (ల్యాండెడ్)',
    unitProfit: 'యూనిట్ లాభం',
    method: 'పద్ధతి',
    costPlus: 'కాస్ట్-ప్లస్ మార్కప్',
    marginPercent: 'గ్రాస్ మార్జిన్ %',
    fixedPrice: 'ఫిక్స్‌డ్ ధర',

    // Dashboard
    todaysSales: 'ఈరోజు మొత్తం అమ్మకాలు',
    todaysProfit: 'అంచనా గ్రాస్ లాభం',
    inventoryValue: 'షాప్ సరుకుల విలువ',
    totalItems: 'మొత్తం సరుకులు',
    quickSell: 'త్వరిత అమ్మకం',
    bulkPurchase: 'హోల్‌సేల్ కొనుగోలు',
    addItem: 'కొత్త సరుకు',
    recentSales: 'ఇటీవలి అమ్మకాలు',
    recentPurchases: 'ఇటీవలి హోల్‌సేల్ కొనుగోళ్లు',
    topProducts: 'ఎక్కువగా అమ్ముడయ్యే సరుకులు',
    categories: 'విభాగాలు',
    exploreAll: 'అన్నీ చూడండి',
    viewAll: 'అన్నీ చూడండి',
    lowStockAlert: 'సరుకులు అయిపోవస్తున్నాయి',
    lowStockAlertSub: 'స్టాక్ తనిఖీ చేసి ఆర్డర్ చేయడానికి ట్యాప్ చేయండి',
    disclaimer: 'షాపు అద్దె, కరెంట్ బిల్లు, ఉద్యోగుల జీతాలు మినహాయించి ఈ లాభం అంచనా వేయబడింది.',

    // Quick Sell / POS
    searchProduct: 'బియ్యం, పప్పు, నూనె, బిస్కెట్లు వెతకండి...',
    addToBill: '+ బిల్‌కి చేర్చు',
    inBill: 'బిల్‌లో ఉన్నాయి',
    reviewBill: 'బిల్లు చూడండి',
    cart: 'బుట్ట',
    total: 'మొత్తం',

    // Cart & Checkout
    checkoutTitle: 'బిల్లు & చెల్లింపు',
    customerInfo: 'కస్టమర్ వివరాలు',
    customerName: 'కస్టమర్ పేరు',
    customerPhone: 'ఫోన్ నంబర్ (ఐచ్ఛికం)',
    paymentMethod: 'చెల్లింపు విధానం',
    cash: 'నగదు (Cash)',
    upi: 'యూపీఐ (UPI)',
    card: 'కార్డ్ (Card)',
    split: 'స్ప్లిట్ (రెండు రకాలుగా)',
    subtotal: 'సబ్-టోటల్',
    discount: 'డిస్కౌంట్',
    grandTotal: 'మొత్తం బిల్లు',
    completeSale: 'సేల్ పూర్తి చేయండి',
    clearAll: 'అన్నీ తీసివేయి',

    // Receipt
    saleConfirmed: 'బిల్లు విజయవంతమైంది!',
    saleNumber: 'బిల్లు నంబర్',
    printReceipt: 'ప్రింట్',
    shareReceipt: 'రసీదు పంపండి',
    newSale: 'కొత్త సేల్ చేయండి',
    thankYou: 'మా దుకాణాన్ని సందర్శించినందుకు ధన్యవాదాలు! 🙏',

    // Buttons & Actions
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    confirm: 'ఖరారు చేయండి',
    delete: 'తొలగించు',
    edit: 'సవరించు',
    signIn: 'లాగిన్ అవ్వండి',
    signOut: 'లాగౌట్ అవ్వండి',
    demoAccounts: 'డెమో ఖాతాలు (ఒక్క ట్యాప్‌తో లాగిన్)',
    language: 'భాష (Language)',
  },
};
