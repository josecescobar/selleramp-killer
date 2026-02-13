export interface MockResult {
  product: {
    asin: string;
    title: string;
    brand: string;
    category: string;
    upc?: string;
    rating: number;
    reviewCount: number;
    imageUrl?: string;
  };
  quickInfo: {
    eligible: boolean;
    alertCount: number;
    bsr: { rank: number; percentage: number; category: string };
    estSales: number;
    maxCost: number;
    costPrice: number;
    salePrice: number;
    profit: number;
    roi: number;
  };
  alerts: Array<{
    label: string;
    value: string;
    status: 'safe' | 'warn' | 'danger' | 'neutral';
  }>;
  offers: Array<{
    id: string;
    seller: string;
    fulfillment: 'FBA' | 'SFP' | 'FBM';
    stock: number;
    price: number;
    profit: number;
    roi: number;
  }>;
  profitCalc: {
    costPrice: number;
    salePrice: number;
    profit: number;
    roi: number;
    maxCost: number;
    totalFees: number;
    discount: number;
    profitMargin: number;
    breakevenPrice: number;
    estPayout: number;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const KNOWN_PRODUCTS: Record<
  string,
  { title: string; brand: string; category: string; upc?: string }
> = {
  B08XYZ1234: {
    title: "Nike Air Max 90 Essential White/Black - Men's Size 10",
    brand: 'Nike',
    category: 'Clothing, Shoes & Jewelry',
    upc: '194501234567',
  },
  B0CP8KDT4G: {
    title: "Jordan Big Kid's 4 Retro SE Craft Medium Olive/Pale Vanilla (FB9928 200) - 3.5",
    brand: 'Jordan',
    category: 'Clothing, Shoes & Jewelry',
    upc: '196969273644',
  },
  B0CTP1YRWZ: {
    title: 'LEGO Star Wars Millennium Falcon 75375 Building Set',
    brand: 'LEGO',
    category: 'Toys & Games',
    upc: '673419388924',
  },
  B0D1XD1ZV3: {
    title: 'Apple AirPods Pro (2nd Generation) USB-C',
    brand: 'Apple',
    category: 'Electronics',
    upc: '195949052453',
  },
  B0BX5DG18G: {
    title: 'Stanley Quencher H2.0 FlowState Tumbler 40oz',
    brand: 'Stanley',
    category: 'Kitchen & Dining',
    upc: '191091994567',
  },
  B07QRY7SG9: {
    title: "Nike Women's Shox R4 Sneaker, White Metallic Silver Max Orange",
    brand: 'Nike',
    category: 'Clothing, Shoes & Jewelry',
    upc: '192499227331',
  },
  B0C7TYR9RN: {
    title: 'Dyson V15 Detect Extra Cordless Vacuum Cleaner',
    brand: 'Dyson',
    category: 'Home & Kitchen',
  },
  B09XS7JWHH: {
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    category: 'Electronics',
    upc: '027242923782',
  },
};

const TITLES = [
  'Premium Wireless Bluetooth Earbuds with Charging Case',
  'Stainless Steel Insulated Water Bottle 32oz',
  'Organic Green Tea Matcha Powder 100g',
  'LED Desk Lamp with USB Charging Port',
  'Resistance Bands Set for Exercise',
  'Portable Phone Charger Power Bank 10000mAh',
  'Memory Foam Neck Pillow for Travel',
  'Cast Iron Skillet Pre-Seasoned 12 Inch',
];

const BRANDS = [
  'AmazonBasics',
  'Anker',
  'Samsung',
  'Logitech',
  'JBL',
  'Bose',
  'Under Armour',
  'Hydro Flask',
];

const CATEGORIES = [
  'Electronics',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Health & Household',
  'Toys & Games',
  'Clothing, Shoes & Jewelry',
  'Kitchen & Dining',
  'Office Products',
];

const SELLERS = [
  'Amazon.com',
  'TechDeals Pro',
  'BestValue Store',
  'PrimeSeller',
  'MegaDeals',
  'TopBrands Direct',
  'ValueMart',
  'FastShip Goods',
  'Daily Essentials',
  'SmartBuy Central',
];

export function generateMockResult(query: string): MockResult {
  const q = query.toUpperCase().trim();
  const hash = hashString(q);
  const rand = seededRandom(hash);

  const known = KNOWN_PRODUCTS[q];
  const title = known?.title ?? TITLES[hash % TITLES.length];
  const brand = known?.brand ?? BRANDS[hash % BRANDS.length];
  const category = known?.category ?? CATEGORIES[hash % CATEGORIES.length];
  const upc = known?.upc ?? (rand() > 0.3 ? String(100000000000 + Math.floor(rand() * 899999999999)) : undefined);
  const asin = /^B0[A-Z0-9]{8}$/.test(q) ? q : `B0${q.replace(/[^A-Z0-9]/g, '').slice(0, 8).padEnd(8, 'X')}`;

  const rating = 3.5 + rand() * 1.5;
  const reviewCount = Math.floor(50 + rand() * 15000);

  const salePrice = Math.floor(15 + rand() * 180) + 0.99;
  const costPrice = Math.round(salePrice * (0.3 + rand() * 0.35) * 100) / 100;
  const totalFees = Math.round(salePrice * (0.28 + rand() * 0.07) * 100) / 100;
  const profit = Math.round((salePrice - costPrice - totalFees) * 100) / 100;
  const roi = Math.round((profit / costPrice) * 100);
  const maxCost = Math.round((salePrice - totalFees) * 100) / 100;
  const breakevenPrice = Math.round((costPrice + totalFees) * 100) / 100;
  const profitMargin = Math.round((profit / salePrice) * 100);
  const estPayout = Math.round((salePrice - totalFees) * 100) / 100;

  const bsrRank = Math.floor(500 + rand() * 200000);
  const bsrPercentage = Math.round((bsrRank / 2000000) * 100 * 10) / 10;
  const estSales = Math.max(1, Math.floor(300 - bsrRank / 800));

  const eligible = rand() > 0.2;
  const alertCount = Math.floor(rand() * 3);

  const alertDefs: Array<{ label: string; value: string; status: 'safe' | 'warn' | 'danger' | 'neutral' }> = [
    { label: 'Eligibility', value: eligible ? 'Eligible' : 'Not Eligible', status: eligible ? 'safe' : 'danger' },
    { label: 'Hazmat', value: rand() > 0.15 ? 'No' : 'Yes', status: rand() > 0.15 ? 'safe' : 'danger' },
    { label: 'Dangerous Goods', value: 'No', status: 'safe' },
    { label: 'Buy Box', value: rand() > 0.4 ? 'FBA' : 'Amazon', status: rand() > 0.4 ? 'safe' : 'warn' },
    { label: 'Private Label', value: rand() > 0.7 ? 'Yes' : 'No', status: rand() > 0.7 ? 'warn' : 'safe' },
    { label: 'IP Complaint', value: rand() > 0.9 ? 'Yes' : 'No', status: rand() > 0.9 ? 'danger' : 'safe' },
    { label: 'Size Tier', value: rand() > 0.5 ? 'Standard' : 'Oversize', status: rand() > 0.5 ? 'safe' : 'warn' },
    { label: 'Meltable', value: 'No', status: 'safe' },
    { label: 'Variations', value: Math.floor(1 + rand() * 8).toString(), status: 'neutral' },
  ];

  const offerCount = 3 + Math.floor(rand() * 8);
  const offers = Array.from({ length: offerCount }, (_, i) => {
    const isFBA = rand() > 0.35;
    const isSFP = !isFBA && rand() > 0.5;
    const fulfillment: 'FBA' | 'SFP' | 'FBM' = isFBA ? 'FBA' : isSFP ? 'SFP' : 'FBM';
    const oPrice = Math.round((salePrice * (0.85 + rand() * 0.3)) * 100) / 100;
    const oProfit = Math.round((oPrice - costPrice - totalFees) * 100) / 100;
    const oRoi = costPrice > 0 ? Math.round((oProfit / costPrice) * 100) : 0;
    return {
      id: String(i + 1),
      seller: i === 0 && rand() > 0.5 ? 'Amazon.com' : SELLERS[Math.floor(rand() * SELLERS.length)],
      fulfillment,
      stock: Math.floor(1 + rand() * 50),
      price: oPrice,
      profit: oProfit,
      roi: oRoi,
    };
  });

  return {
    product: {
      asin,
      title,
      brand,
      category,
      upc,
      rating: Math.round(rating * 10) / 10,
      reviewCount,
    },
    quickInfo: {
      eligible,
      alertCount,
      bsr: { rank: bsrRank, percentage: bsrPercentage, category },
      estSales,
      maxCost,
      costPrice,
      salePrice,
      profit,
      roi,
    },
    alerts: alertDefs,
    offers,
    profitCalc: {
      costPrice,
      salePrice,
      profit,
      roi,
      maxCost,
      totalFees,
      discount: 0,
      profitMargin,
      breakevenPrice,
      estPayout,
    },
  };
}
