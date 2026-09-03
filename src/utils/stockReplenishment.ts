import { StockItem, ShoppingListItem, GroceryTrip, GroceryCategory, ShoppingList } from '../types';
import { CARREFOUR_CATALOG, CatalogProduct } from '../data/carrefourCatalog';

export interface StockAnalysisResult {
  item: StockItem;
  daysSinceLastPurchase: number;
  daysRemaining: number;
  calculatedStatus: 'esgotado' | 'baixo' | 'suficiente';
  urgencyLevel: 'alta' | 'media' | 'baixa';
  nextPredictedDate: string;
  projectedRunoutDate: string;
  weeklyConsumptionRate: number;
  isUrgent: boolean;
  historyIntervalDays: number;
  estimatedPrice: number;
}

export function analyzeStockItem(
  item: StockItem,
  groceryTrips: GroceryTrip[] = [],
  referenceDate: string = new Date().toISOString().slice(0, 10)
): StockAnalysisResult {
  const refDateObj = new Date(referenceDate);
  const lastPurchaseObj = new Date(item.lastPurchaseDate || referenceDate);
  const diffTime = refDateObj.getTime() - lastPurchaseObj.getTime();
  const daysSinceLastPurchase = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate historical interval from previous trips matching this product
  const tripsWithProduct = (groceryTrips || [])
    .filter((trip) =>
      trip.items?.some(
        (p) =>
          p.name.toLowerCase().includes(item.product.toLowerCase()) ||
          item.product.toLowerCase().includes(p.name.toLowerCase())
      )
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let historyInterval = item.estimatedDurationDays || 30;
  if (tripsWithProduct.length >= 2) {
    let totalIntervalDays = 0;
    for (let i = 1; i < tripsWithProduct.length; i++) {
      const d1 = new Date(tripsWithProduct[i - 1].date).getTime();
      const d2 = new Date(tripsWithProduct[i].date).getTime();
      totalIntervalDays += Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }
    const avg = Math.round(totalIntervalDays / (tripsWithProduct.length - 1));
    if (avg > 0) {
      historyInterval = avg;
    }
  }

  const durationDays = item.estimatedDurationDays || historyInterval || 30;
  const daysRemaining = Math.max(0, durationDays - daysSinceLastPurchase);

  let calculatedStatus: 'esgotado' | 'baixo' | 'suficiente' = 'suficiente';
  let urgencyLevel: 'alta' | 'media' | 'baixa' = 'baixa';

  if (daysRemaining <= 0 || item.quantity <= 0 || item.status === 'baixo') {
    calculatedStatus = item.quantity <= 0 ? 'esgotado' : 'baixo';
    urgencyLevel = 'alta';
  } else if (daysRemaining <= 7) {
    calculatedStatus = 'baixo';
    urgencyLevel = 'media';
  }

  // Predicted next purchase date
  const nextPredictedObj = new Date(lastPurchaseObj.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const nextPredictedDate = nextPredictedObj.toISOString().slice(0, 10);

  // Weekly consumption rate
  const weeklyConsumptionRate = durationDays > 0 ? (item.quantity || 1) / (durationDays / 7) : 1;

  // Match price from catalog or last paid
  const catalogMatch = CARREFOUR_CATALOG.find(
    (c) =>
      c.name.toLowerCase() === item.product.toLowerCase() ||
      item.product.toLowerCase().includes(c.name.toLowerCase())
  );
  const estimatedPrice = item.lastPricePaid || catalogMatch?.estimatedPrice || 10.0;

  return {
    item: {
      ...item,
      status: calculatedStatus,
      nextPurchasePredictedDate: nextPredictedDate,
      purchaseHistoryIntervalDays: historyInterval,
    },
    daysSinceLastPurchase,
    daysRemaining,
    calculatedStatus,
    urgencyLevel,
    nextPredictedDate,
    projectedRunoutDate: nextPredictedDate,
    weeklyConsumptionRate,
    isUrgent: urgencyLevel === 'alta',
    historyIntervalDays: historyInterval,
    estimatedPrice,
  };
}

/**
 * Generates pre-filled shopping list items based on Ellen's standard monthly Cesta Básica
 */
export function generateShoppingListFromCestaBasica(): ShoppingListItem[] {
  const defaultCestaItems: Array<{
    product: string;
    quantity: number;
    unit: string;
    category: GroceryCategory;
    estimatedPrice: number;
  }> = [
    { product: 'Arroz Tipo 1 (5kg)', quantity: 2, unit: 'pct', category: 'Alimentos', estimatedPrice: 32.90 },
    { product: 'Feijão Carioca (1kg)', quantity: 3, unit: 'kg', category: 'Alimentos', estimatedPrice: 7.80 },
    { product: 'Óleo de Soja (900ml)', quantity: 4, unit: 'un', category: 'Alimentos', estimatedPrice: 6.50 },
    { product: 'Açúcar Refinado (1kg)', quantity: 3, unit: 'kg', category: 'Alimentos', estimatedPrice: 4.20 },
    { product: 'Café Torrado e Moído (500g)', quantity: 2, unit: 'pct', category: 'Alimentos', estimatedPrice: 18.50 },
    { product: 'Macarrão Espaguete / Sêmola (500g)', quantity: 3, unit: 'pct', category: 'Alimentos', estimatedPrice: 3.80 },
    { product: 'Molho de Tomate (340g)', quantity: 4, unit: 'sache', category: 'Alimentos', estimatedPrice: 2.20 },
    { product: 'Farinha de Trigo (1kg)', quantity: 2, unit: 'kg', category: 'Alimentos', estimatedPrice: 4.50 },
    { product: 'Leite Integral UHT (1L)', quantity: 6, unit: 'L', category: 'Alimentos', estimatedPrice: 4.80 },
    { product: 'Biscoito Cream Cracker (400g)', quantity: 2, unit: 'pct', category: 'Alimentos', estimatedPrice: 5.20 },
    { product: 'Sal Refinado (1kg)', quantity: 1, unit: 'kg', category: 'Alimentos', estimatedPrice: 2.50 },
  ];

  return defaultCestaItems.map((c, idx) => ({
    id: `sli-cesta-${Date.now()}-${idx}`,
    product: c.product,
    quantity: c.quantity,
    unit: c.unit,
    category: c.category,
    priority: 'Alta',
    preferredStore: 'Cesta Básica Mensal',
    estimatedPrice: c.estimatedPrice * c.quantity,
    actualPrice: c.estimatedPrice * c.quantity,
    completed: false,
    isFromCestaBasica: true,
    source: 'cesta_basica',
    notes: 'Item fornecido via Cesta Básica Mensal da Ellen (alívio no orçamento de mercearia)',
  }));
}

export function generateSmartShoppingListFromStock(
  stockItems: StockItem[],
  groceryTrips: GroceryTrip[] = [],
  monthKey: string = new Date().toISOString().slice(0, 7)
): Omit<ShoppingList, 'id'> {
  const analyzed = stockItems.map((item) => analyzeStockItem(item, groceryTrips));
  
  // Filter items needing replenishment (esgotado or baixo)
  const itemsNeedingRestock = analyzed.filter(
    (res) => res.calculatedStatus === 'esgotado' || res.calculatedStatus === 'baixo' || res.urgencyLevel === 'alta'
  );

  const shoppingItems: ShoppingListItem[] = itemsNeedingRestock.map((res, idx) => {
    const isEsgotado = res.calculatedStatus === 'esgotado';
    return {
      id: 'sli-auto-' + Date.now() + '-' + idx,
      product: res.item.product,
      quantity: res.item.quantity && res.item.quantity > 0 ? 1 : 1,
      unit: res.item.unit || 'un',
      category: res.item.category || 'Alimentos',
      categoryGroup: res.item.categoryGroup,
      priority: isEsgotado ? 'Alta' : 'Média',
      preferredStore: res.item.store || 'Assaí',
      lastPricePaid: res.item.lastPricePaid,
      estimatedPrice: res.estimatedPrice,
      actualPrice: res.estimatedPrice,
      completed: false,
      isFromCestaBasica: res.item.isFromCestaBasica,
      source: 'reposicao_estoque',
      notes: isEsgotado
        ? 'Estoque esgotado! Reposição prioritária calculada.'
        : `Estoque baixo (~${res.daysRemaining} dias restantes calculados).`,
    };
  });

  const estimatedTotal = shoppingItems.reduce((sum, item) => sum + item.estimatedPrice, 0);

  return {
    name: `Reposição Inteligente de Estoque (${itemsNeedingRestock.length} itens)`,
    type: 'reposicao',
    monthKey,
    createdAt: new Date().toISOString().slice(0, 10),
    estimatedTotal,
    items: shoppingItems,
    isDemo: false,
  };
}
