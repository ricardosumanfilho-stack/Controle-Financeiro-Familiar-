import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  GroceryCategory,
  GroceryProduct,
  GroceryTrip,
  Person,
  ShoppingList,
  ShoppingListItem,
  StockItem,
} from '../../types';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearBR,
  getPersonBadgeColor,
} from '../../utils/formatters';
import {
  ShoppingCart,
  Plus,
  TrendingDown,
  Calendar,
  Store,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Search,
  Filter,
  Trash2,
  Edit2,
  Clock,
  Gift,
  Award,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

interface SupermarketViewProps {
  onOpenNewTripModal?: () => void;
}

type GroceryTab = 'resumo' | 'compras' | 'produtos' | 'listas' | 'comparacao' | 'estoque';

export const SupermarketView: React.FC<SupermarketViewProps> = () => {
  const {
    selectedMonth,
    groceryTrips,
    groceryPlan,
    shoppingLists,
    stockItems,
    cestaBasicaRecords,
    addGroceryTrip,
    deleteGroceryTrip,
    toggleRicardoWeek,
    toggleEllenGrocery,
    setGroceryPlanningMode,
    addShoppingList,
    updateShoppingList,
    deleteShoppingList,
    copyShoppingList,
    convertShoppingListToTrip,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    addCestaBasicaRecord,
    deleteCestaBasicaRecord,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<GroceryTab>('resumo');
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isCestaModalOpen, setIsCestaModalOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('Todas');
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Filter trips for selected month
  const monthTrips = useMemo(() => {
    return groceryTrips.filter((trip) => trip.date.startsWith(selectedMonth));
  }, [groceryTrips, selectedMonth]);

  // Contribution calculations
  const weeksCount = groceryPlan.totalWeeks || 4;
  const ricardoPlanned = groceryPlan.mode === 'opcao_b' ? 600 : (weeksCount === 5 ? 750 : 600);
  const ellenPlanned = 400;
  const totalPlanned = ricardoPlanned + ellenPlanned;

  const ricardoRealized = groceryPlan.ricardoWeeks.reduce(
    (sum, w) => sum + (w.completed ? (w.actualAmount || w.plannedAmount || 150) : 0),
    0
  );
  const ellenRealized = groceryPlan.ellenCompleted
    ? (groceryPlan.ellenActualAmount || 400)
    : 0;
  const totalRealized = ricardoRealized + ellenRealized;

  const totalSpent = monthTrips.reduce((sum, trip) => sum + trip.totalAmount, 0);
  const balanceRemaining = totalRealized - totalSpent;
  const tripsCount = monthTrips.length;
  const averagePerTrip = tripsCount > 0 ? totalSpent / tripsCount : 0;

  // Store usage analysis
  const storeUsageMap = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    monthTrips.forEach((t) => {
      const store = t.storeName || 'Outro';
      if (!map[store]) map[store] = { count: 0, total: 0 };
      map[store].count += 1;
      map[store].total += t.totalAmount;
    });
    return map;
  }, [monthTrips]);

  const mostUsedStore = useMemo(() => {
    let best = 'Nenhum';
    let max = -1;
    (Object.entries(storeUsageMap) as [string, { count: number; total: number }][]).forEach(([store, data]) => {
      if (data.count > max) {
        max = data.count;
        best = store;
      }
    });
    return best;
  }, [storeUsageMap]);

  // Savings calculations
  const totalPromoSavings = useMemo(() => {
    return monthTrips.reduce((sum, t) => sum + (t.promotionalSavings || 0), 0);
  }, [monthTrips]);

  const totalAppCpfSavings = useMemo(() => {
    return monthTrips.reduce((sum, t) => sum + (t.appOrCpfSavings || 0), 0);
  }, [monthTrips]);

  const totalStoreCardSavings = useMemo(() => {
    return monthTrips.reduce((sum, t) => sum + (t.storeCardSavings || 0), 0);
  }, [monthTrips]);

  const totalCombinedSavings = totalPromoSavings + totalAppCpfSavings + totalStoreCardSavings;

  // Flatten all products across all trips for catalog & price analysis
  const allProductsCatalog = useMemo(() => {
    const list: {
      id: string;
      name: string;
      category: string;
      unitPrice: number;
      totalPrice: number;
      quantity: number;
      unit: string;
      tripDate: string;
      storeName: string;
      isExtraordinary?: boolean;
      notes?: string;
    }[] = [];

    groceryTrips.forEach((trip) => {
      if (trip.products && trip.products.length > 0) {
        trip.products.forEach((p) => {
          list.push({
            id: p.id,
            name: p.name,
            category: p.category || 'Alimentos',
            unitPrice: p.unitPrice,
            totalPrice: p.totalPrice,
            quantity: p.quantity,
            unit: p.unit || 'un',
            tripDate: trip.date,
            storeName: trip.storeName,
            isExtraordinary: p.isExtraordinary || trip.isExtraordinary,
            notes: p.notes,
          });
        });
      }
    });

    return list;
  }, [groceryTrips]);

  // Price history and lowest price per unique product
  const productPriceStats = useMemo(() => {
    const stats: Record<
      string,
      {
        name: string;
        category: string;
        unit: string;
        lowestPrice: number;
        lowestStore: string;
        lastPrice: number;
        lastDate: string;
        lastStore: string;
        history: { date: string; store: string; price: number }[];
      }
    > = {};

    allProductsCatalog.forEach((p) => {
      const key = p.name.toLowerCase().trim();
      if (!stats[key]) {
        stats[key] = {
          name: p.name,
          category: p.category,
          unit: p.unit,
          lowestPrice: p.unitPrice,
          lowestStore: p.storeName,
          lastPrice: p.unitPrice,
          lastDate: p.tripDate,
          lastStore: p.storeName,
          history: [],
        };
      }

      stats[key].history.push({
        date: p.tripDate,
        store: p.storeName,
        price: p.unitPrice,
      });

      if (p.unitPrice > 0 && p.unitPrice < stats[key].lowestPrice) {
        stats[key].lowestPrice = p.unitPrice;
        stats[key].lowestStore = p.storeName;
      }

      if (p.tripDate >= stats[key].lastDate) {
        stats[key].lastDate = p.tripDate;
        stats[key].lastPrice = p.unitPrice;
        stats[key].lastStore = p.storeName;
      }
    });

    return Object.values(stats);
  }, [allProductsCatalog]);

  const filteredProducts = useMemo(() => {
    return allProductsCatalog.filter((p) => {
      const matchesCategory =
        productCategoryFilter === 'Todas' || p.category === productCategoryFilter;
      const matchesSearch =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.storeName.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allProductsCatalog, productCategoryFilter, productSearch]);

  // Form states for adding a new trip
  const [newTripData, setNewTripData] = useState<{
    date: string;
    storeName: string;
    person: Person;
    paymentMethod: any;
    isExtraordinary: boolean;
    promotionalSavings: number;
    appOrCpfSavings: number;
    storeCardSavings: number;
    notes: string;
    items: {
      name: string;
      category: GroceryCategory;
      quantity: number;
      unit: string;
      unitPrice: number;
      isExtraordinary?: boolean;
    }[];
  }>({
    date: new Date().toISOString().slice(0, 10),
    storeName: 'Assaí',
    person: 'Família',
    paymentMethod: 'debito',
    isExtraordinary: false,
    promotionalSavings: 0,
    appOrCpfSavings: 0,
    storeCardSavings: 0,
    notes: '',
    items: [{ name: '', category: 'Alimentos', quantity: 1, unit: 'un', unitPrice: 0 }],
  });

  // Form state for shopping list
  const [newListData, setNewListData] = useState<{
    name: string;
    type: 'semanal' | 'mensal';
    items: {
      product: string;
      quantity: number;
      unit: string;
      category: GroceryCategory;
      priority: 'Alta' | 'Média' | 'Baixa';
      preferredStore: string;
      estimatedPrice: number;
    }[];
  }>({
    name: 'Lista de Feira',
    type: 'semanal',
    items: [{ product: '', quantity: 1, unit: 'kg', category: 'Frutas, verduras e legumes', priority: 'Alta', preferredStore: 'Carrefour', estimatedPrice: 0 }],
  });

  // Form state for Stock Item
  const [newStockData, setNewStockData] = useState<{
    product: string;
    category: GroceryCategory;
    quantity: number;
    unit: string;
    estimatedDurationDays: number;
    store: string;
    lastPricePaid: number;
    notes: string;
  }>({
    product: '',
    category: 'Produtos para o pet',
    quantity: 1,
    unit: 'un',
    estimatedDurationDays: 30,
    store: 'Assaí',
    lastPricePaid: 0,
    notes: '',
  });

  // Form state for Cesta Básica
  const [newCestaData, setNewCestaData] = useState<{
    date: string;
    receivedBy: 'Ellen' | 'Ricardo';
    estimatedSavings: number;
    notes: string;
    itemsText: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    receivedBy: 'Ellen',
    estimatedSavings: 280,
    notes: 'Cesta básica mensal com arroz, feijão, óleo, café e farináceos',
    itemsText: 'Arroz Tipo 1 5kg (2un)\nFeijão Carioca 1kg (3un)\nÓleo de Soja 900ml (2un)\nCafé Moído 500g (2un)\nAçúcar 1kg (3un)\nMacarrão 500g (4un)\nExtrato de Tomate (4un)',
  });

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const products: GroceryProduct[] = newTripData.items
      .filter((i) => i.name.trim() !== '')
      .map((i) => ({
        id: 'gp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: i.name,
        category: i.category,
        quantity: Number(i.quantity) || 1,
        unit: i.unit || 'un',
        unitPrice: Number(i.unitPrice) || 0,
        totalPrice: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
        isExtraordinary: i.isExtraordinary || newTripData.isExtraordinary,
      }));

    const calculatedTotal = products.reduce((sum, p) => sum + p.totalPrice, 0);

    addGroceryTrip({
      date: newTripData.date,
      storeName: newTripData.storeName,
      totalAmount: calculatedTotal > 0 ? calculatedTotal : 0,
      person: newTripData.person,
      paymentMethod: newTripData.paymentMethod,
      isExtraordinary: newTripData.isExtraordinary,
      promotionalSavings: Number(newTripData.promotionalSavings) || 0,
      appOrCpfSavings: Number(newTripData.appOrCpfSavings) || 0,
      storeCardSavings: Number(newTripData.storeCardSavings) || 0,
      notes: newTripData.notes,
      products,
    });

    setIsTripModalOpen(false);
    // Reset form
    setNewTripData({
      date: new Date().toISOString().slice(0, 10),
      storeName: 'Assaí',
      person: 'Família',
      paymentMethod: 'debito',
      isExtraordinary: false,
      promotionalSavings: 0,
      appOrCpfSavings: 0,
      storeCardSavings: 0,
      notes: '',
      items: [{ name: '', category: 'Alimentos', quantity: 1, unit: 'un', unitPrice: 0 }],
    });
  };

  const handleSaveShoppingList = (e: React.FormEvent) => {
    e.preventDefault();
    const items: ShoppingListItem[] = newListData.items
      .filter((i) => i.product.trim() !== '')
      .map((i) => {
        const stats = productPriceStats.find((s) => s.name.toLowerCase() === i.product.toLowerCase().trim());
        return {
          id: 'sli-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          product: i.product,
          quantity: Number(i.quantity) || 1,
          unit: i.unit,
          category: i.category,
          priority: i.priority,
          preferredStore: i.preferredStore,
          estimatedPrice: Number(i.estimatedPrice) || 0,
          lowestHistoricalPrice: stats ? stats.lowestPrice : undefined,
          lastPricePaid: stats ? stats.lastPrice : undefined,
          completed: false,
        };
      });

    const estimatedTotal = items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

    addShoppingList({
      name: newListData.name,
      type: newListData.type,
      monthKey: selectedMonth,
      createdAt: new Date().toISOString().slice(0, 10),
      estimatedTotal,
      items,
    });

    setIsListModalOpen(false);
    setNewListData({
      name: 'Lista de Supermercado',
      type: 'semanal',
      items: [{ product: '', quantity: 1, unit: 'kg', category: 'Frutas, verduras e legumes', priority: 'Alta', preferredStore: 'Carrefour', estimatedPrice: 0 }],
    });
  };

  const handleSaveStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockData.product.trim()) return;

    const lastDate = new Date();
    const duration = Number(newStockData.estimatedDurationDays) || 30;
    const nextDate = new Date();
    nextDate.setDate(lastDate.getDate() + duration);

    addStockItem({
      product: newStockData.product,
      category: newStockData.category,
      lastPurchaseDate: lastDate.toISOString().slice(0, 10),
      quantity: Number(newStockData.quantity) || 1,
      unit: newStockData.unit,
      estimatedDurationDays: duration,
      nextPurchasePredictedDate: nextDate.toISOString().slice(0, 10),
      lastPricePaid: Number(newStockData.lastPricePaid) || 0,
      store: newStockData.store,
      status: 'suficiente',
      notes: newStockData.notes,
    });

    setIsStockModalOpen(false);
    setNewStockData({
      product: '',
      category: 'Produtos para o pet',
      quantity: 1,
      unit: 'un',
      estimatedDurationDays: 30,
      store: 'Assaí',
      lastPricePaid: 0,
      notes: '',
    });
  };

  const handleSaveCestaBasica = (e: React.FormEvent) => {
    e.preventDefault();
    const rawLines = newCestaData.itemsText.split('\n').filter((l) => l.trim() !== '');
    const items = rawLines.map((line) => {
      return {
        product: line.trim(),
        quantity: 1,
        unit: 'item',
        estimatedValue: 20,
      };
    });

    addCestaBasicaRecord({
      date: newCestaData.date,
      receivedBy: newCestaData.receivedBy,
      estimatedSavings: Number(newCestaData.estimatedSavings) || 280,
      notes: newCestaData.notes,
      items,
    });

    setIsCestaModalOpen(false);
  };

  const categoriesList: GroceryCategory[] = [
    'Alimentos',
    'Carnes e frango',
    'Bebidas',
    'Frutas, verduras e legumes',
    'Frios e laticínios',
    'Produtos de padaria',
    'Doces, biscoitos e sobremesas',
    'Produtos de limpeza',
    'Produtos de higiene',
    'Produtos para o pet',
    'Produtos da cesta básica',
    'Outros',
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Supermercado & Alimentação
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão completa de compras, listas inteligentes, estoque de reposição e comparativo de preços
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="new-shopping-list-btn"
            onClick={() => setIsListModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Lista</span>
          </button>

          <button
            id="new-grocery-trip-btn"
            onClick={() => setIsTripModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: 'resumo', label: 'Resumo do Mês', icon: PieIcon },
          { id: 'compras', label: 'Registro de Compras', icon: ShoppingBag },
          { id: 'produtos', label: 'Detalhamento de Produtos', icon: Tag },
          { id: 'listas', label: 'Listas de Compras', icon: CheckCircle2 },
          { id: 'comparacao', label: 'Comparação de Mercados', icon: Store },
          { id: 'estoque', label: 'Estoque & Cesta Básica', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`grocery-subtab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as GroceryTab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5A. RESUMO DO MÊS */}
      {activeSubTab === 'resumo' && (
        <div className="space-y-6">
          {/* Main Key Figures Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Disponível vs Gasto */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Disponível</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                  Planejado {formatCurrency(totalPlanned)}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalRealized)}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Total gasto:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            </div>

            {/* Saldo Restante */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Restante</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    balanceRemaining >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}
                >
                  {balanceRemaining >= 0 ? 'Dentro do saldo' : 'Excedido'}
                </span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  balanceRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(balanceRemaining)}
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalSpent > totalRealized ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, totalRealized > 0 ? (totalSpent / totalRealized) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Compras e Ticket Médio */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Compras Realizadas</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tripsCount} <span className="text-sm font-normal text-slate-500">visitas</span>
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Valor médio:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(averagePerTrip)}
                </span>
              </div>
            </div>

            {/* Economia Gerada (Promoções / CPF / Cartão) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Economia Total</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalCombinedSavings)}
              </p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>App / Cartão:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(totalAppCpfSavings + totalStoreCardSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Contributions Table & Planning Switch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ricardo's Weekly Contribution Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Contribuição Ricardo (Semanal)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Planejado: {formatCurrency(ricardoPlanned)} | Realizado: {formatCurrency(ricardoRealized)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px]">
                  <button
                    onClick={() => setGroceryPlanningMode('opcao_a')}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                      groceryPlan.mode !== 'opcao_b'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    R$ 150/sem
                  </button>
                  <button
                    onClick={() => setGroceryPlanningMode('opcao_b')}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                      groceryPlan.mode === 'opcao_b'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Fixar R$ 600
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {groceryPlan.ricardoWeeks.map((week) => (
                  <div
                    key={week.weekIndex}
                    onClick={() => toggleRicardoWeek(week.weekIndex)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      week.completed
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={week.completed}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {week.weekLabel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(week.plannedAmount || 150)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {week.completed ? 'Transferido' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ellen's Monthly Contribution Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    Contribuição Ellen (Mensal)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Planejado: {formatCurrency(ellenPlanned)} | Realizado: {formatCurrency(ellenRealized)}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold">
                  Valor fixo mensal
                </span>
              </div>

              <div
                onClick={toggleEllenGrocery}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  groceryPlan.ellenCompleted
                    ? 'bg-pink-50/60 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={groceryPlan.ellenCompleted}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-pink-600"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Aporte Único Mensal
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Transferência integral para custeio de compras do mês
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(ellenPlanned)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {groceryPlan.ellenCompleted ? 'Transferido' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Store & Savings Highlights */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Resumo de Inteligência de Compras:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mercado Mais Utilizado:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{mostUsedStore}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Menor Cesta Média:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">Assaí Atacadista</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5B. REGISTRO DE COMPRAS */}
      {activeSubTab === 'compras' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Histórico de Compras ({formatMonthYearBR(selectedMonth)})
            </h3>
            <button
              onClick={() => setIsTripModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Compra</span>
            </button>
          </div>

          {monthTrips.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhuma compra registrada em {formatMonthYearBR(selectedMonth)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Clique em "Registrar Compra" para detalhar seus itens de supermercado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthTrips.map((trip) => {
                const personColors = getPersonBadgeColor(trip.person);
                return (
                  <div
                    key={trip.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {trip.storeName}
                          </h4>
                          {trip.isExtraordinary && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                              Extraordinária
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{formatDateBR(trip.date)}</span>
                          <span>•</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${personColors.badge}`}>
                            {trip.person}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[10px] font-semibold text-slate-400">
                            {trip.paymentMethod}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(trip.totalAmount)}
                        </span>
                        <button
                          onClick={() => deleteGroceryTrip(trip.id)}
                          className="block ml-auto text-slate-400 hover:text-red-600 p-1 transition-colors mt-1"
                          title="Excluir compra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Products preview */}
                    {trip.products && trip.products.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Itens ({trip.products.length}):
                        </span>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
                          {trip.products.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                              <span>
                                {p.quantity}x {p.name}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatCurrency(p.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Savings notes */}
                    {((trip.promotionalSavings || 0) > 0 || (trip.appOrCpfSavings || 0) > 0) && (
                      <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Economia de {formatCurrency((trip.promotionalSavings || 0) + (trip.appOrCpfSavings || 0))} nesta compra
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5C. DETALHAMENTO DOS PRODUTOS */}
      {activeSubTab === 'produtos' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto ou mercado..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value="Todas">Todas as Categorias</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Items Table / Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Último Preço Unit.</th>
                    <th className="px-4 py-3">Menor Preço Histórico</th>
                    <th className="px-4 py-3">Mercado Vantajoso</th>
                    <th className="px-4 py-3">Última Compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productPriceStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {stat.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {stat.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(stat.lastPrice)} /{stat.unit || 'un'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(stat.lowestPrice)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                        {stat.lowestStore || 'Assaí'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDateBR(stat.lastDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5D. LISTA DE COMPRAS */}
      {activeSubTab === 'listas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Listas de Compras Inteligentes
              </h3>
              <p className="text-xs text-slate-500">
                Compare preços previstos com menores históricos e converta listas diretamente em compras realizadas
              </p>
            </div>
            <button
              onClick={() => setIsListModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Lista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shoppingLists.map((list) => {
              const completedCount = list.items.filter((i) => i.completed).length;
              const progressPct = list.items.length > 0 ? (completedCount / list.items.length) * 100 : 0;
              const totalEst = list.items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

              return (
                <div
                  key={list.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {list.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                          {list.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Criada em: {formatDateBR(list.createdAt)} • Total Previsto: <strong>{formatCurrency(totalEst)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyShoppingList(list.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Duplicar lista"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteShoppingList(list.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Progresso da compra</span>
                      <span>{completedCount} de {list.items.length} itens</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Item Rows */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {list.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          updateShoppingList(list.id, {
                            items: list.items.map((i) =>
                              i.id === item.id ? { ...i, completed: !i.completed } : i
                            ),
                          });
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          item.completed
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-400 line-through'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-emerald-600"
                          />
                          <span className="font-semibold">{item.product}</span>
                          <span className="text-[10px] text-slate-400">({item.quantity} {item.unit})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.preferredStore && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {item.preferredStore}
                            </span>
                          )}
                          <span className="font-bold">
                            {formatCurrency(item.estimatedPrice || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action: Convert to registered trip */}
                  <button
                    onClick={() => {
                      convertShoppingListToTrip(list.id, 'Assaí', 'Família', 'debito');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Finalizar & Converter em Compra Registrada</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5E. COMPARAÇÃO ENTRE MERCADOS */}
      {activeSubTab === 'comparacao' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Comparativo de Cesta & Categorias por Estabelecimento
            </h3>
            <p className="text-xs text-slate-500">
              Análise comparativa de onde compensa comprar cada categoria de produto com base no histórico familiar
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Assaí */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Assaí Atacadista</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    Melhor p/ Atacado
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Mais vantajoso para produtos de limpeza em quantidade, ração de pet, papelaria e embalagens econômicas.
                </p>
                <div className="text-xs space-y-1 text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span>Economia média estimada:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">12% a 18%</strong>
                  </div>
                </div>
              </div>

              {/* Carrefour */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Carrefour</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                    Melhor p/ Hortifruti
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Mais vantajoso para compras semanais de frutas, legumes, verduras e promoções exclusivas no App Meu Carrefour.
                </p>
                <div className="text-xs space-y-1 text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span>Desconto via App:</span>
                    <strong className="text-blue-600 dark:text-blue-400">Até 15% c/ CPF</strong>
                  </div>
                </div>
              </div>

              {/* Sonda / Outros */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Sonda & Mercados Locais</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                    Conveniência & Padaria
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Excelente para itens de reposição emergencial, frios fatiados na hora e produtos de padaria frescos.
                </p>
                <div className="text-xs space-y-1 text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span>Frequência sugerida:</span>
                    <strong className="text-purple-600 dark:text-purple-400">Emergencial</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5F. ESTOQUE & CESTA BÁSICA */}
      {activeSubTab === 'estoque' && (
        <div className="space-y-6">
          {/* Cesta Básica da Ellen Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200 dark:border-pink-900/50 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Cesta Básica Mensal (Ellen)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Alívio direto de despesas de mercearia, arroz, feijão, café e óleo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCestaModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors"
                >
                  + Registrar Cesta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-pink-100 dark:border-pink-950">
                <span className="text-slate-400 block text-[11px]">Economia Estimada no Mês:</span>
                <strong className="text-pink-600 dark:text-pink-400 text-sm">
                  {formatCurrency(cestaBasicaRecords.reduce((sum, c) => sum + c.estimatedSavings, 0))}
                </strong>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-pink-100 dark:border-pink-950">
                <span className="text-slate-400 block text-[11px]">Cestas Registradas:</span>
                <strong className="text-slate-800 dark:text-slate-200 text-sm">
                  {cestaBasicaRecords.length} pacote(s)
                </strong>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-pink-100 dark:border-pink-950">
                <span className="text-slate-400 block text-[11px]">Impacto no Orçamento:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                  Redução de até ~28% dos custos secos
                </strong>
              </div>
            </div>
          </div>

          {/* Stock Items with duration and next purchase prediction */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Itens com Periodicidade Longa (Estoque Preventivo)
                </h3>
                <p className="text-xs text-slate-500">
                  Previsão de reposição para ração pet, papel higiênico, sabão em pó e produtos de limpeza
                </p>
              </div>
              <button
                onClick={() => setIsStockModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockItems.map((item) => {
                const isLow = item.status === 'baixo';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs ${
                      isLow
                        ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {item.product}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isLow
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span>Duração média:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {item.estimatedDurationDays} dias
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Próxima compra prevista:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatDateBR(item.nextPurchasePredictedDate)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mercado recomendado:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {item.store || 'Assaí'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => {
                          const next = item.status === 'suficiente' ? 'baixo' : 'suficiente';
                          updateStockItem(item.id, { status: next });
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Alternar status
                      </button>
                      <button
                        onClick={() => deleteStockItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Excluir item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA COMPRA DE SUPERMERCADO */}
      {isTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Registrar Compra de Supermercado
              </h3>
              <button
                onClick={() => setIsTripModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={newTripData.date}
                    onChange={(e) => setNewTripData({ ...newTripData, date: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Mercado
                  </label>
                  <select
                    value={newTripData.storeName}
                    onChange={(e) => setNewTripData({ ...newTripData, storeName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Assaí">Assaí</option>
                    <option value="Carrefour">Carrefour</option>
                    <option value="Sonda">Sonda</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Responsável
                  </label>
                  <select
                    value={newTripData.person}
                    onChange={(e) => setNewTripData({ ...newTripData, person: e.target.value as Person })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Família">Família</option>
                    <option value="Ricardo">Ricardo</option>
                    <option value="Ellen">Ellen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={newTripData.paymentMethod}
                    onChange={(e) => setNewTripData({ ...newTripData, paymentMethod: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Economia Promoções (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTripData.promotionalSavings || ''}
                    onChange={(e) => setNewTripData({ ...newTripData, promotionalSavings: Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Economia App / Cartão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTripData.appOrCpfSavings || ''}
                    onChange={(e) => setNewTripData({ ...newTripData, appOrCpfSavings: Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Itens da Compra (Produtos Detalhados)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewTripData({
                        ...newTripData,
                        items: [
                          ...newTripData.items,
                          { name: '', category: 'Alimentos', quantity: 1, unit: 'un', unitPrice: 0 },
                        ],
                      })
                    }
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Adicionar Item
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {newTripData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 text-xs items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Nome do produto"
                          value={item.name}
                          onChange={(e) => {
                            const copy = [...newTripData.items];
                            copy[idx].name = e.target.value;
                            setNewTripData({ ...newTripData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div className="col-span-3">
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const copy = [...newTripData.items];
                            copy[idx].category = e.target.value as GroceryCategory;
                            setNewTripData({ ...newTripData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[11px]"
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...newTripData.items];
                            copy[idx].quantity = Number(e.target.value);
                            setNewTripData({ ...newTripData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Preço R$"
                          value={item.unitPrice || ''}
                          onChange={(e) => {
                            const copy = [...newTripData.items];
                            copy[idx].unitPrice = Number(e.target.value);
                            setNewTripData({ ...newTripData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        {newTripData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = newTripData.items.filter((_, i) => i !== idx);
                              setNewTripData({ ...newTripData, items: copy });
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="text-xs">
                  <span className="text-slate-500">Total Calculado: </span>
                  <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(
                      newTripData.items.reduce(
                        (sum, i) => sum + (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
                        0
                      )
                    )}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTripModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                  >
                    Salvar Compra
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA LISTA DE COMPRAS */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Criar Nova Lista de Compras
              </h3>
              <button
                onClick={() => setIsListModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShoppingList} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Nome da Lista
                  </label>
                  <input
                    type="text"
                    value={newListData.name}
                    onChange={(e) => setNewListData({ ...newListData, name: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Tipo de Lista
                  </label>
                  <select
                    value={newListData.type}
                    onChange={(e) => setNewListData({ ...newListData, type: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="semanal">Semanal (Hortifruti & Feira)</option>
                    <option value="mensal">Mensal (Atacado & Limpeza)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Itens da Lista
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewListData({
                        ...newListData,
                        items: [
                          ...newListData.items,
                          { product: '', quantity: 1, unit: 'kg', category: 'Frutas, verduras e legumes', priority: 'Alta', preferredStore: 'Carrefour', estimatedPrice: 0 },
                        ],
                      })
                    }
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Adicionar Item
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {newListData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 text-xs items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Produto"
                          value={item.product}
                          onChange={(e) => {
                            const copy = [...newListData.items];
                            copy[idx].product = e.target.value;
                            setNewListData({ ...newListData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...newListData.items];
                            copy[idx].quantity = Number(e.target.value);
                            setNewListData({ ...newListData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="col-span-4">
                        <select
                          value={item.preferredStore}
                          onChange={(e) => {
                            const copy = [...newListData.items];
                            copy[idx].preferredStore = e.target.value;
                            setNewListData({ ...newListData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        >
                          <option value="Assaí">Assaí</option>
                          <option value="Carrefour">Carrefour</option>
                          <option value="Sonda">Sonda</option>
                        </select>
                      </div>

                      <div className="col-span-1 text-right">
                        {newListData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = newListData.items.filter((_, i) => i !== idx);
                              setNewListData({ ...newListData, items: copy });
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsListModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  Salvar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ITEM DE ESTOQUE */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Novo Item de Estoque Periódico
              </h3>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Nome do Item
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ração Canina 10kg, Sabão OMO"
                  value={newStockData.product}
                  onChange={(e) => setNewStockData({ ...newStockData, product: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Categoria
                  </label>
                  <select
                    value={newStockData.category}
                    onChange={(e) => setNewStockData({ ...newStockData, category: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Duração Média (Dias)
                  </label>
                  <input
                    type="number"
                    value={newStockData.estimatedDurationDays}
                    onChange={(e) => setNewStockData({ ...newStockData, estimatedDurationDays: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CESTA BÁSICA */}
      {isCestaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Registrar Cesta Básica Mensal
              </h3>
              <button
                onClick={() => setIsCestaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCestaBasica} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Data de Recebimento
                  </label>
                  <input
                    type="date"
                    value={newCestaData.date}
                    onChange={(e) => setNewCestaData({ ...newCestaData, date: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Economia Estimada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCestaData.estimatedSavings}
                    onChange={(e) => setNewCestaData({ ...newCestaData, estimatedSavings: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Itens Recebidos (um por linha)
                </label>
                <textarea
                  rows={4}
                  value={newCestaData.itemsText}
                  onChange={(e) => setNewCestaData({ ...newCestaData, itemsText: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCestaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-xs transition-colors"
                >
                  Salvar Cesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
