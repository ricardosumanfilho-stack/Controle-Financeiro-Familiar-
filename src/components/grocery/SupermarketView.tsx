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
  Target,
  Settings2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { EllenCestaBasicaModal } from './EllenCestaBasicaModal';
import { LiveMarketModal } from './LiveMarketModal';
import { ShoppingListEditModal } from './ShoppingListEditModal';
import { createCarrefourMasterShoppingList } from '../../data/carrefourMasterList';
import {
  analyzeStockItem,
  generateSmartShoppingListFromStock,
  generateShoppingListFromCestaBasica,
} from '../../utils/stockReplenishment';
import { CARREFOUR_CATALOG } from '../../data/carrefourCatalog';

interface SupermarketViewProps {
  onOpenNewTripModal?: () => void;
}

type GroceryTab = 'resumo' | 'compras' | 'produtos' | 'listas' | 'comparacao' | 'estoque';

export const SupermarketView: React.FC<SupermarketViewProps> = () => {
  const {
    selectedMonth,
    groceryTrips,
    groceryPlan,
    groceryMonthlyGoal,
    setGroceryMonthlyGoal,
    updateGroceryPlanSettings,
    person1Name,
    person2Name,
    shoppingLists,
    stockItems,
    cestaBasicaRecords,
    addGroceryTrip,
    deleteGroceryTrip,
    toggleRicardoWeek,
    updateRicardoWeekAmount,
    toggleEllenWeek,
    updateEllenWeekAmount,
    toggleEllenGrocery,
    updateEllenGroceryAmount,
    setGroceryPlanningMode,
    addShoppingList,
    updateShoppingList,
    deleteShoppingList,
    copyShoppingList,
    convertShoppingListToTrip,
    generateAutoShoppingListFromStock,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    addCestaBasicaRecord,
    deleteCestaBasicaRecord,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [activeSubTab, setActiveSubTab] = useState<GroceryTab>('resumo');
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingShoppingList, setEditingShoppingList] = useState<ShoppingList | null>(null);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isCestaModalOpen, setIsCestaModalOpen] = useState(false);
  const [isEllenCestaOpen, setIsEllenCestaOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('Todas');
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);

  // Live Market State
  const [liveMarketList, setLiveMarketList] = useState<ShoppingList | null>(null);
  const [isLiveMarketOpen, setIsLiveMarketOpen] = useState(false);
  const [personWeeklyTab, setPersonWeeklyTab] = useState<'Ricardo' | 'Ellen'>('Ricardo');

  // Goal configuration state
  const [tempGoals, setTempGoals] = useState({
    monthlyGoal: groceryMonthlyGoal || 1000,
    ricardoWeekly: groceryPlan.ricardoWeeklyPlanned || 150,
    ellenMonthly: groceryPlan.ellenMonthlyPlanned || 400,
    ellenWeekly: groceryPlan.ellenWeeklyPlanned || 80,
    ellenPlanningType: groceryPlan.ellenPlanningType || 'semanal',
    totalWeeks: groceryPlan.totalWeeks || 4,
  });

  // Filter trips for selected month
  const monthTrips = useMemo(() => {
    return groceryTrips.filter((trip) => trip.date.startsWith(selectedMonth));
  }, [groceryTrips, selectedMonth]);

  // Helper to compute week number from date
  const getWeekNumberFromDate = (dateStr: string, manualWeek?: number): number => {
    if (manualWeek && manualWeek >= 1 && manualWeek <= 5) return manualWeek;
    if (!dateStr) return 1;
    const day = parseInt(dateStr.slice(8, 10), 10);
    if (isNaN(day)) return 1;
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 28) return 4;
    return 5;
  };

  // Contribution and Month Total calculations
  const weeksCount = groceryPlan.totalWeeks || 4;
  const ricardoPlanned = groceryPlan.mode === 'opcao_b' ? 600 : ((groceryPlan.ricardoWeeklyPlanned || 150) * weeksCount);
  const ellenPlanned = groceryPlan.ellenMonthlyPlanned || 400;
  const totalPlanned = groceryMonthlyGoal || (ricardoPlanned + ellenPlanned);

  const ricardoRealized = groceryPlan.ricardoWeeks.reduce(
    (sum, w) => sum + (w.completed ? (w.actualAmount || w.plannedAmount || 150) : 0),
    0
  );
  const ellenRealized = groceryPlan.ellenCompleted
    ? (groceryPlan.ellenActualAmount || ellenPlanned)
    : 0;
  const totalRealized = ricardoRealized + ellenRealized;

  const totalSpent = monthTrips.reduce((sum, trip) => sum + trip.totalAmount, 0);
  const balanceRemaining = totalPlanned - totalSpent;
  const tripsCount = monthTrips.length;
  const averagePerTrip = tripsCount > 0 ? totalSpent / tripsCount : 0;

  // Dynamic Weekly Roll-over / Carry-over Analysis
  const weeklyAnalysis = useMemo(() => {
    const totalWeeks = groceryPlan.totalWeeks || 4;
    const baseWeekly = groceryPlan.ricardoWeeklyPlanned || 150;

    type WeekReport = {
      weekIndex: number;
      weekLabel: string;
      dateRange: string;
      baseGoal: number;
      carryOverIn: number;
      adjustedGoal: number;
      trips: GroceryTrip[];
      actualSpent: number;
      resultingBalance: number;
      accumulatedBudgetSoFar: number;
      accumulatedSpentSoFar: number;
      status: 'surplus' | 'deficit' | 'exact' | 'unspent';
    };

    const reports: WeekReport[] = [];
    let runningCarryOver = 0;
    let accumulatedBudget = 0;
    let accumulatedSpent = 0;

    const ranges = [
      'Dias 01 a 07',
      'Dias 08 a 14',
      'Dias 15 a 21',
      'Dias 22 a 28',
      'Dias 29 em diante',
    ];

    for (let w = 1; w <= totalWeeks; w++) {
      const planWeek = groceryPlan.ricardoWeeks?.find((rw) => rw.weekIndex === w);
      const baseGoal = planWeek?.plannedAmount || baseWeekly;
      const carryOverIn = runningCarryOver;
      const adjustedGoal = baseGoal + carryOverIn;

      // Trips for this week (semanal or default)
      const tripsThisWeek = monthTrips.filter((t) => {
        const isWeekly = t.tripType === 'semanal' || (!t.tripType && !t.isExtraordinary);
        if (!isWeekly) return false;
        const weekNum = t.weekNumber || getWeekNumberFromDate(t.date);
        return weekNum === w;
      });

      const actualSpent = tripsThisWeek.reduce((sum, t) => sum + t.totalAmount, 0);
      const resultingBalance = adjustedGoal - actualSpent;

      runningCarryOver = resultingBalance;
      accumulatedBudget += baseGoal;
      accumulatedSpent += actualSpent;

      let status: 'surplus' | 'deficit' | 'exact' | 'unspent' = 'exact';
      if (actualSpent === 0) {
        status = 'unspent';
      } else if (resultingBalance > 0) {
        status = 'surplus';
      } else if (resultingBalance < 0) {
        status = 'deficit';
      }

      reports.push({
        weekIndex: w,
        weekLabel: planWeek?.weekLabel || `Semana ${w}`,
        dateRange: ranges[w - 1] || `Semana ${w}`,
        baseGoal,
        carryOverIn,
        adjustedGoal,
        trips: tripsThisWeek,
        actualSpent,
        resultingBalance,
        accumulatedBudgetSoFar: accumulatedBudget,
        accumulatedSpentSoFar: accumulatedSpent,
        status,
      });
    }

    return {
      reports,
      finalCarryOver: runningCarryOver,
      totalWeeklySpent: accumulatedSpent,
      totalWeeklyBudget: accumulatedBudget,
    };
  }, [groceryPlan, monthTrips]);

  // Dynamic Weekly Analysis with Rollover / Carry-over for Ellen
  const ellenWeeklyAnalysis = useMemo(() => {
    const totalWeeks = groceryPlan.totalWeeks || 4;
    const baseWeekly = groceryPlan.ellenWeeklyPlanned || 80;

    type WeekReport = {
      weekIndex: number;
      weekLabel: string;
      dateRange: string;
      baseGoal: number;
      carryOverIn: number;
      adjustedGoal: number;
      trips: GroceryTrip[];
      actualSpent: number;
      resultingBalance: number;
      accumulatedBudgetSoFar: number;
      accumulatedSpentSoFar: number;
      status: 'surplus' | 'deficit' | 'exact' | 'unspent';
    };

    const reports: WeekReport[] = [];
    let runningCarryOver = 0;
    let accumulatedBudget = 0;
    let accumulatedSpent = 0;

    const ranges = [
      'Dias 01 a 07',
      'Dias 08 a 14',
      'Dias 15 a 21',
      'Dias 22 a 28',
      'Dias 29 em diante',
    ];

    for (let w = 1; w <= totalWeeks; w++) {
      const planWeek = groceryPlan.ellenWeeks?.find((ew) => ew.weekIndex === w);
      const baseGoal = planWeek?.plannedAmount || baseWeekly;
      const carryOverIn = runningCarryOver;
      const adjustedGoal = baseGoal + carryOverIn;

      // Trips for Ellen in this week
      const tripsThisWeek = monthTrips.filter((t) => {
        const isEllenTrip = t.person === 'Ellen';
        const isWeekly = t.tripType === 'semanal' || (!t.tripType && !t.isExtraordinary);
        if (!isWeekly || !isEllenTrip) return false;
        const weekNum = t.weekNumber || getWeekNumberFromDate(t.date);
        return weekNum === w;
      });

      const actualSpent = tripsThisWeek.reduce((sum, t) => sum + t.totalAmount, 0);
      const resultingBalance = adjustedGoal - actualSpent;

      runningCarryOver = resultingBalance;
      accumulatedBudget += baseGoal;
      accumulatedSpent += actualSpent;

      let status: 'surplus' | 'deficit' | 'exact' | 'unspent' = 'exact';
      if (actualSpent === 0) {
        status = 'unspent';
      } else if (resultingBalance > 0) {
        status = 'surplus';
      } else if (resultingBalance < 0) {
        status = 'deficit';
      }

      reports.push({
        weekIndex: w,
        weekLabel: planWeek?.weekLabel || `Semana ${w}`,
        dateRange: ranges[w - 1] || `Semana ${w}`,
        baseGoal,
        carryOverIn,
        adjustedGoal,
        trips: tripsThisWeek,
        actualSpent,
        resultingBalance,
        accumulatedBudgetSoFar: accumulatedBudget,
        accumulatedSpentSoFar: accumulatedSpent,
        status,
      });
    }

    return {
      reports,
      finalCarryOver: runningCarryOver,
      totalWeeklySpent: accumulatedSpent,
      totalWeeklyBudget: accumulatedBudget,
    };
  }, [groceryPlan, monthTrips]);

  // Monthly Abastecimento Trips
  const monthlyAbastecimentoTrips = useMemo(() => {
    return monthTrips.filter((t) => t.tripType === 'mensal');
  }, [monthTrips]);
  const monthlyAbastecimentoSpent = useMemo(() => {
    return monthlyAbastecimentoTrips.reduce((sum, t) => sum + t.totalAmount, 0);
  }, [monthlyAbastecimentoTrips]);

  // Extraordinary Trips
  const extraordinaryTrips = useMemo(() => {
    return monthTrips.filter((t) => t.tripType === 'extraordinaria' || t.isExtraordinary);
  }, [monthTrips]);
  const extraordinarySpent = useMemo(() => {
    return extraordinaryTrips.reduce((sum, t) => sum + t.totalAmount, 0);
  }, [extraordinaryTrips]);

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
    tripType: 'semanal' | 'mensal' | 'extraordinaria';
    weekNumber: number;
    manualTotalAmount: string;
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
    tripType: 'semanal',
    weekNumber: 1,
    manualTotalAmount: '',
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

  const handleSaveGoalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const mg = Number(tempGoals.monthlyGoal) || 1000;
    const rw = Number(tempGoals.ricardoWeekly) || 150;
    const em = Number(tempGoals.ellenMonthly) || 400;
    const tw = Number(tempGoals.totalWeeks) || 4;

    setGroceryMonthlyGoal(mg);
    updateGroceryPlanSettings({
      monthlyGoal: mg,
      ricardoWeeklyPlanned: rw,
      ellenMonthlyPlanned: em,
      totalWeeks: tw,
    });
    setIsGoalModalOpen(false);
  };

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
        isExtraordinary: i.isExtraordinary || newTripData.tripType === 'extraordinaria',
      }));

    const calculatedTotal = products.reduce((sum, p) => sum + p.totalPrice, 0);
    const manualNum = parseFloat(newTripData.manualTotalAmount.replace(',', '.'));
    const finalTotal = !isNaN(manualNum) && manualNum > 0 ? manualNum : calculatedTotal;

    if (finalTotal <= 0) {
      alert('Informe o valor real da compra ou detalhe os itens com preço.');
      return;
    }

    addGroceryTrip({
      date: newTripData.date,
      storeName: newTripData.storeName,
      totalAmount: finalTotal,
      person: newTripData.person,
      paymentMethod: newTripData.paymentMethod,
      tripType: newTripData.tripType,
      weekNumber: newTripData.tripType === 'semanal' ? newTripData.weekNumber : undefined,
      isExtraordinary: newTripData.tripType === 'extraordinaria',
      promotionalSavings: Number(newTripData.promotionalSavings) || 0,
      appOrCpfSavings: Number(newTripData.appOrCpfSavings) || 0,
      storeCardSavings: Number(newTripData.storeCardSavings) || 0,
      notes: newTripData.notes,
      products: products.length > 0 ? products : undefined,
    });

    setIsTripModalOpen(false);
    // Reset form
    const today = new Date().toISOString().slice(0, 10);
    setNewTripData({
      date: today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`,
      storeName: 'Assaí',
      person: 'Família',
      paymentMethod: 'debito',
      tripType: 'semanal',
      weekNumber: getWeekNumberFromDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`),
      manualTotalAmount: '',
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

  const handleSaveEditedShoppingList = (listData: {
    id?: string;
    name: string;
    type: 'semanal' | 'mensal' | 'reposicao' | 'personalizada';
    monthKey: string;
    items: ShoppingListItem[];
    estimatedTotal: number;
  }) => {
    if (listData.id) {
      updateShoppingList(listData.id, {
        name: listData.name,
        type: listData.type,
        items: listData.items,
        estimatedTotal: listData.estimatedTotal,
      });
    } else {
      addShoppingList({
        name: listData.name,
        type: listData.type,
        monthKey: listData.monthKey || selectedMonth,
        createdAt: new Date().toISOString().slice(0, 10),
        items: listData.items,
        estimatedTotal: listData.estimatedTotal,
      });
    }
    setIsEditListModalOpen(false);
    setEditingShoppingList(null);
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
          {/* Header & Goal Settings Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/40">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Planejamento & Acompanhamento de Metas ({formatMonthYearBR(selectedMonth)})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Metas semanais ajustadas dinamicamente com acúmulo de sobras e compensação de estouros entre as semanas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTempGoals({
                    monthlyGoal: groceryMonthlyGoal || 1000,
                    ricardoWeekly: groceryPlan.ricardoWeeklyPlanned || 150,
                    ellenMonthly: groceryPlan.ellenMonthlyPlanned || 400,
                    totalWeeks: groceryPlan.totalWeeks || 4,
                  });
                  setIsGoalModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Configurar Metas</span>
              </button>
              <button
                onClick={() => setIsTripModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Compra</span>
              </button>
            </div>
          </div>

          {/* Main Key Figures Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Meta Total */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Meta Total do Mês</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Planejado
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalPlanned)}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Gasto real acumulado:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            </div>

            {/* Saldo Restante no Mês */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Restante do Mês</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    balanceRemaining >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}
                >
                  {balanceRemaining >= 0 ? 'Dentro da Meta' : 'Meta Estourada'}
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
                    totalSpent > totalPlanned ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Compras Realizadas */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Compras Realizadas</span>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tripsCount} <span className="text-sm font-normal text-slate-500">visitas</span>
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Média por compra:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(averagePerTrip)}
                </span>
              </div>
            </div>

            {/* Economia Gerada */}
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

          {/* QUADRO DINÂMICO DE METAS SEMANAIS COM ACÚMULO E ROLAGEM */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Controle Semanal com Saldo Rolado
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {personWeeklyTab === 'Ricardo'
                    ? `Meta base de ${formatCurrency(groceryPlan.ricardoWeeklyPlanned || 150)}/sem (${p1}). Sobras ou estouros acumulam automaticamente.`
                    : `Meta base de ${formatCurrency(groceryPlan.ellenWeeklyPlanned || 80)}/sem (${p2}). Sobras ou estouros acumulam automaticamente.`}
                </p>
              </div>

              {/* Persona Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPersonWeeklyTab('Ricardo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    personWeeklyTab === 'Ricardo'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {p1} ({formatCurrency(weeklyAnalysis.totalWeeklySpent)} / {formatCurrency(weeklyAnalysis.totalWeeklyBudget)})
                </button>
                <button
                  type="button"
                  onClick={() => setPersonWeeklyTab('Ellen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    personWeeklyTab === 'Ellen'
                      ? 'bg-pink-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {p2} ({formatCurrency(ellenWeeklyAnalysis.totalWeeklySpent)} / {formatCurrency(ellenWeeklyAnalysis.totalWeeklyBudget)})
                </button>
              </div>
            </div>

            {/* Weekly Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(personWeeklyTab === 'Ricardo' ? weeklyAnalysis.reports : ellenWeeklyAnalysis.reports).map((report) => {
                const hasTrips = report.trips.length > 0;
                const isOver = report.resultingBalance < 0;
                const isSurplus = report.resultingBalance > 0 && hasTrips;
                const isUnspent = !hasTrips;
                const currentPerson = personWeeklyTab;

                return (
                  <div
                    key={report.weekIndex}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isOver
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                        : isSurplus
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                        : isUnspent
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {report.weekLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {report.dateRange}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isOver
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : isSurplus
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : isUnspent
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {isOver
                          ? 'Estouro'
                          : isSurplus
                          ? 'Economia'
                          : isUnspent
                          ? 'Acumulando'
                          : 'Na Meta'}
                      </span>
                    </div>

                    {/* Breakdown Math */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Meta Base:</span>
                        <span className="font-medium">{formatCurrency(report.baseGoal)}</span>
                      </div>

                      {report.weekIndex > 1 && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Saldo Semana Anterior:</span>
                          <span
                            className={`font-semibold ${
                              report.carryOverIn >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {report.carryOverIn >= 0 ? '+' : ''}
                            {formatCurrency(report.carryOverIn)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-700 dark:text-slate-200 font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Meta Ajustada:</span>
                        <span className={currentPerson === 'Ellen' ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}>
                          {formatCurrency(report.adjustedGoal)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">Gasto Real:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(report.actualSpent)}
                        </span>
                      </div>
                    </div>

                    {/* Resulting Rollover Banner */}
                    <div
                      className={`p-2 rounded-xl text-[11px] font-medium ${
                        isOver
                          ? 'bg-red-100/70 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                          : isSurplus
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : isUnspent
                          ? 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-blue-100/70 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {report.weekIndex < (groceryPlan.totalWeeks || 4) ? (
                        <span>
                          {isOver && `Déficit de ${formatCurrency(Math.abs(report.resultingBalance))} descontado da Semana ${report.weekIndex + 1}.`}
                          {isSurplus && `Sobra de ${formatCurrency(report.resultingBalance)} transferida para a Semana ${report.weekIndex + 1}.`}
                          {isUnspent && `Sem compras: +${formatCurrency(report.resultingBalance)} acumulados para a Semana ${report.weekIndex + 1}.`}
                          {!isOver && !isSurplus && !isUnspent && `Meta atingida exatamente. Saldo zerado para a próxima semana.`}
                        </span>
                      ) : (
                        <span>
                          {isOver && `Saldo final do mês com déficit de ${formatCurrency(Math.abs(report.resultingBalance))}.`}
                          {isSurplus && `Saldo final do mês com economia de ${formatCurrency(report.resultingBalance)}!`}
                          {isUnspent && `Sem compras nesta última semana.`}
                          {!isOver && !isSurplus && !isUnspent && `Fechamento exato na meta.`}
                        </span>
                      )}
                    </div>

                    {/* Quick Trip List for this week */}
                    {hasTrips ? (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {report.trips.length} compra(s) registrada(s):
                        </span>
                        {report.trips.map((t) => (
                          <div key={t.id} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="truncate max-w-[120px]">{t.storeName} ({formatDateBR(t.date).slice(0, 5)})</span>
                            <span className="font-semibold">{formatCurrency(t.totalAmount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const date = `${selectedMonth}-${String(Math.min(28, (report.weekIndex - 1) * 7 + 3)).padStart(2, '0')}`;
                          setNewTripData({
                            ...newTripData,
                            date,
                            person: currentPerson,
                            tripType: 'semanal',
                            weekNumber: report.weekIndex,
                          });
                          setIsTripModalOpen(true);
                        }}
                        className={`w-full py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-800 border rounded-xl transition-colors text-center block ${
                          currentPerson === 'Ellen'
                            ? 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 border-pink-200 dark:border-pink-900'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        + Registrar Compra ({currentPerson})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Abastecimento Mensal & Compras Extraordinárias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ellen's Monthly Abastecimento & Cesta Básica Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    Planejamento de Supermercado ({p2})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {groceryPlan.ellenPlanningType === 'semanal'
                      ? `Modo Semanal: ${groceryPlan.totalWeeks || 4} semanas x ${formatCurrency(groceryPlan.ellenWeeklyPlanned || 80)} = ${formatCurrency(ellenPlanned)}`
                      : `Aporte Mensal Fixo: ${formatCurrency(ellenPlanned)} | Realizado: ${formatCurrency(monthlyAbastecimentoSpent)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEllenCestaOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 rounded-xl transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Cesta Básica</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={groceryPlan.ellenCompleted}
                      onChange={toggleEllenGrocery}
                      className="w-4 h-4 rounded text-pink-600"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Status do Orçamento da {p2}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {groceryPlan.ellenCompleted ? 'Aporte / compras concluídas no mês' : 'Em andamento no mês'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(ellenPlanned)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Gasto real Ellen: {formatCurrency(ellenWeeklyAnalysis.totalWeeklySpent + monthlyAbastecimentoSpent)}
                    </span>
                  </div>
                </div>

                {monthlyAbastecimentoTrips.length > 0 && (
                  <div className="pt-2 border-t border-pink-200/60 dark:border-pink-900/40 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Compras mensais vinculadas ({monthlyAbastecimentoTrips.length}):
                    </span>
                    {monthlyAbastecimentoTrips.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                        <span>{t.storeName} ({formatDateBR(t.date)})</span>
                        <span className="font-semibold">{formatCurrency(t.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compras Extraordinárias & Destaques de Economia */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Compras Extraordinárias & Estoque
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compras fora da rotina ou reposições de grande porte
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  {formatCurrency(extraordinarySpent)} gasto
                </span>
              </div>

              {extraordinaryTrips.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  Nenhuma compra extraordinária registrada neste mês.
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {extraordinaryTrips.map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{t.storeName}</span>
                        <span className="text-[10px] text-slate-400 block">{formatDateBR(t.date)} • {t.person}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(t.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Store & Savings Highlights */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mercado Mais Frequente:</span>
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
                          {trip.tripType === 'semanal' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">
                              Semanal (Semana {trip.weekNumber || getWeekNumberFromDate(trip.date)})
                            </span>
                          )}
                          {trip.tripType === 'mensal' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 font-semibold">
                              Mensal (Abastecimento)
                            </span>
                          )}
                          {(trip.isExtraordinary || trip.tripType === 'extraordinaria') && (
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Listas de Compras Inteligentes
              </h3>
              <p className="text-xs text-slate-500">
                Copie o modelo padrão, mude o supermercado, edite preços previstos e remova itens com 1 clique
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const master = createCarrefourMasterShoppingList(
                    'LISTA DE COMPRAS - CARREFOUR',
                    'Carrefour',
                    selectedMonth
                  );
                  addShoppingList(master);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 rounded-xl transition-colors shadow-xs"
                title="Cria lista padrão completa com os 128 itens do Carrefour"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>+ Modelo Carrefour (Master)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const items = generateShoppingListFromCestaBasica();
                  const total = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
                  addShoppingList({
                    name: `Cesta Básica ${p2} (${formatMonthYearBR(selectedMonth)})`,
                    type: 'reposicao',
                    monthKey: selectedMonth,
                    createdAt: new Date().toISOString().slice(0, 10),
                    estimatedTotal: total,
                    items,
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 rounded-xl transition-colors"
                title="Cria lista já preenchida com os itens da Cesta Básica da Ellen"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>+ Lista Cesta Ellen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  generateAutoShoppingListFromStock();
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-xl transition-colors"
                title="Gera lista com base nos itens de estoque que precisam de reposição"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reposição Estoque</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingShoppingList(null);
                  setIsEditListModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nova Lista Personalizada</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shoppingLists.map((list) => {
              const completedCount = list.items.filter((i) => i.completed).length;
              const progressPct = list.items.length > 0 ? (completedCount / list.items.length) * 100 : 0;
              const totalEst = list.items.reduce((sum, i) => sum + (i.estimatedPrice || (i.quantity * (i.lastPricePaid || 0)) || 0), 0);

              return (
                <div
                  key={list.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {list.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase shrink-0">
                          {list.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Criada em: {formatDateBR(list.createdAt)} • {list.items.length} itens • Total Previsto: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(totalEst)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingShoppingList(list);
                          setIsEditListModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar lista, mudar mercado, alterar preços e produtos"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyShoppingList(list.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Duplicar lista"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToDelete(list);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Excluir lista de compras"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Progresso da compra</span>
                      <span>{completedCount} de {list.items.length} itens marcados</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Item Rows with direct price edit & delete */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {list.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                          item.completed
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40 text-slate-400 line-through'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {/* Item toggle & title */}
                        <div
                          onClick={() => {
                            updateShoppingList(list.id, {
                              items: list.items.map((i) =>
                                i.id === item.id ? { ...i, completed: !i.completed } : i
                              ),
                            });
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                          />
                          <span className="font-semibold truncate">{item.product}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({item.quantity} {item.unit})
                          </span>
                          {item.categoryGroup && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hidden sm:inline shrink-0">
                              {item.categoryGroup}
                            </span>
                          )}
                          {item.source === 'cesta_basica' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold shrink-0">
                              📦 Cesta
                            </span>
                          )}
                          {item.source === 'reposicao_estoque' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                              🔄 Estoque
                            </span>
                          )}
                        </div>

                        {/* Store badge, Price & 1-Click Remove */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.preferredStore && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {item.preferredStore}
                            </span>
                          )}
                          <span className="font-bold text-xs">
                            {formatCurrency(item.actualPricePaid || item.estimatedPrice || (item.quantity * (item.lastPricePaid || 0)) || 0)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedItems = list.items.filter((i) => i.id !== item.id);
                              const newEst = updatedItems.reduce(
                                (sum, i) => sum + (i.estimatedPrice || (i.quantity * (i.lastPricePaid || 0)) || 0),
                                0
                              );
                              updateShoppingList(list.id, {
                                items: updatedItems,
                                estimatedTotal: newEst,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Remover este produto da lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLiveMarketList(list);
                        setIsLiveMarketOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="Abrir Modo Mercado Ao Vivo em tela cheia / modal"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Modo Mercado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const origin = window.location.origin;
                        const path = window.location.pathname;
                        const url = `${origin}${path}?mode=live-market&listId=${encodeURIComponent(list.id)}`;
                        window.open(url, 'LiveMarketAppWindow', 'width=480,height=860,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors"
                      title="Abre em janela popup dedicada para celular no supermercado"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Nova Janela</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShoppingList(list);
                        setIsEditListModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Editar mercado, preços e produtos desta lista"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Lista</span>
                    </button>
                  </div>
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
                    Cesta Básica Mensal ({p2})
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Alívio direto de despesas de mercearia, arroz, feijão, café, óleo e itens essenciais
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const items = generateShoppingListFromCestaBasica();
                    const total = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
                    addShoppingList({
                      name: `Cesta Básica ${p2} (${formatMonthYearBR(selectedMonth)})`,
                      type: 'reposicao',
                      monthKey: selectedMonth,
                      createdAt: new Date().toISOString().slice(0, 10),
                      estimatedTotal: total,
                      items,
                    });
                    setActiveSubTab('listas');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 rounded-xl hover:bg-pink-50 transition-colors flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Gerar Lista da Cesta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEllenCestaOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Preencher Cesta ({p2})</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Balanço & Reposição de Estoque Preventivo
                </h3>
                <p className="text-xs text-slate-500">
                  Compara compras passadas e frequência de uso para estimar exatamente quando comprar novamente
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    generateAutoShoppingListFromStock();
                    setActiveSubTab('listas');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-xl transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Lista de Reposição</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Item</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockItems.map((item) => {
                const analysis = analyzeStockItem(item, groceryTrips);
                const isUrgent = analysis.urgencyLevel === 'alta';
                const isMedium = analysis.urgencyLevel === 'media';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs ${
                      isUrgent
                        ? 'border-red-300 dark:border-red-800/80 ring-1 ring-red-400/30'
                        : isMedium
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
                          isUrgent
                            ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                            : isMedium
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {isUrgent ? 'Repor Já' : isMedium ? 'Repor Próx. Compra' : 'Estoque OK'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span>Dias restantes estimados:</span>
                        <strong className={`font-bold ${isUrgent ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}`}>
                          ~{analysis.daysRemaining} dias
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Consumo estimado:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          ~{analysis.weeklyConsumptionRate.toFixed(1)} {item.unit}/sem
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Próxima compra prevista:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatDateBR(analysis.projectedRunoutDate)}
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
                        type="button"
                        onClick={() => {
                          const next = item.status === 'suficiente' ? 'baixo' : 'suficiente';
                          updateStockItem(item.id, { status: next });
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Alternar status ({item.status})
                      </button>
                      <button
                        type="button"
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
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Registrar Compra de Supermercado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informe o valor real da compra e o tipo (semanal com rolagem, abastecimento mensal ou extraordinária).
                </p>
              </div>
              <button
                onClick={() => setIsTripModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-4">
              {/* Trip Type and Week Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tipo de Compra & Meta Associada
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewTripData({ ...newTripData, tripType: 'semanal', isExtraordinary: false })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newTripData.tripType === 'semanal'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Compra Semanal</span>
                      {newTripData.tripType === 'semanal' && <span className="text-blue-600 text-xs">●</span>}
                    </div>
                    <span className="text-[10px] font-normal opacity-80 block mt-0.5">
                      Compensa na meta semanal com rolagem
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTripData({ ...newTripData, tripType: 'mensal', isExtraordinary: false })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newTripData.tripType === 'mensal'
                        ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-400 dark:border-pink-600 text-pink-900 dark:text-pink-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Abastecimento Mensal</span>
                      {newTripData.tripType === 'mensal' && <span className="text-pink-600 text-xs">●</span>}
                    </div>
                    <span className="text-[10px] font-normal opacity-80 block mt-0.5">
                      Grande compra mensal (Ellen)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTripData({ ...newTripData, tripType: 'extraordinaria', isExtraordinary: true })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newTripData.tripType === 'extraordinaria'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Extraordinária</span>
                      {newTripData.tripType === 'extraordinaria' && <span className="text-amber-600 text-xs">●</span>}
                    </div>
                    <span className="text-[10px] font-normal opacity-80 block mt-0.5">
                      Reposição pontual / festa
                    </span>
                  </button>
                </div>

                {newTripData.tripType === 'semanal' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      Competência da Semana:
                    </label>
                    <select
                      value={newTripData.weekNumber}
                      onChange={(e) => setNewTripData({ ...newTripData, weekNumber: Number(e.target.value) })}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-xs font-bold"
                    >
                      <option value={1}>Semana 1 (Dias 01 a 07)</option>
                      <option value={2}>Semana 2 (Dias 08 a 14)</option>
                      <option value={3}>Semana 3 (Dias 15 a 21)</option>
                      <option value={4}>Semana 4 (Dias 22 a 28)</option>
                      {groceryPlan.totalWeeks === 5 && <option value={5}>Semana 5 (Dias 29 em diante)</option>}
                    </select>
                  </div>
                )}
              </div>

              {/* Basic Trip Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={newTripData.date}
                    onChange={(e) => {
                      const d = e.target.value;
                      const calculatedWeek = getWeekNumberFromDate(d);
                      setNewTripData({
                        ...newTripData,
                        date: d,
                        weekNumber: newTripData.tripType === 'semanal' ? calculatedWeek : newTripData.weekNumber,
                      });
                    }}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Mercado / Estabelecimento
                  </label>
                  <input
                    type="text"
                    list="grocery-stores-list"
                    value={newTripData.storeName}
                    onChange={(e) => setNewTripData({ ...newTripData, storeName: e.target.value })}
                    placeholder="Ex: Assaí, Carrefour, Feira..."
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    required
                  />
                  <datalist id="grocery-stores-list">
                    <option value="Assaí" />
                    <option value="Carrefour" />
                    <option value="Sonda" />
                    <option value="Pão de Açúcar" />
                    <option value="Feira Livre" />
                    <option value="Hortifruti" />
                    <option value="Atacadão" />
                  </datalist>
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
                    <option value="Ricardo">{p1}</option>
                    <option value="Ellen">{p2}</option>
                  </select>
                </div>
              </div>

              {/* Direct Amount & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                    Valor Real Total Gasto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={
                      newTripData.items.filter((i) => i.name.trim()).length > 0
                        ? formatCurrency(
                            newTripData.items.reduce(
                              (sum, i) => sum + (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
                              0
                            )
                          )
                        : '0,00'
                    }
                    value={newTripData.manualTotalAmount}
                    onChange={(e) => setNewTripData({ ...newTripData, manualTotalAmount: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Digite o valor da nota ou use os itens abaixo
                  </span>
                </div>

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
                    Economia Promoções / App (R$)
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
              </div>

              {/* Optional Items Section */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Itens Detalhados (Opcional)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Adicione itens para histórico de preços e comparação entre mercados
                    </span>
                  </div>
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

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
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
                          step="any"
                          min="0.001"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...newTripData.items];
                            const val = parseFloat(e.target.value.replace(',', '.'));
                            copy[idx].quantity = isNaN(val) ? 1 : val;
                            setNewTripData({ ...newTripData, items: copy });
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Preço R$"
                          value={item.unitPrice || ''}
                          onChange={(e) => {
                            const copy = [...newTripData.items];
                            const val = parseFloat(e.target.value.replace(',', '.'));
                            copy[idx].unitPrice = isNaN(val) ? 0 : Number(val.toFixed(2));
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
                  <span className="text-slate-500">Valor Final: </span>
                  <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(
                      parseFloat(newTripData.manualTotalAmount.replace(',', '.')) ||
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

      {/* MODAL: CRIAR / EDITAR / COPIAR LISTA DE COMPRAS */}
      {isEditListModalOpen && (
        <ShoppingListEditModal
          isOpen={isEditListModalOpen}
          onClose={() => {
            setIsEditListModalOpen(false);
            setEditingShoppingList(null);
          }}
          onSave={handleSaveEditedShoppingList}
          initialList={editingShoppingList}
          selectedMonth={selectedMonth}
        />
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
      {/* MODAL: CONFIGURAR METAS DO SUPERMERCADO */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Configurar Metas de Supermercado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajuste o orçamento mensal e os valores semanais para {formatMonthYearBR(selectedMonth)}.
                </p>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                    Meta Total Mensal de Supermercado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempGoals.monthlyGoal}
                    onChange={(e) => setTempGoals({ ...tempGoals, monthlyGoal: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Teto máximo do orçamento do mês
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
                      Meta Semanal Base ({p1}) (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempGoals.ricardoWeekly}
                      onChange={(e) => setTempGoals({ ...tempGoals, ricardoWeekly: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Valor por semana (ex: R$ 150)
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
                      Aporte Mensal ({p2}) (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempGoals.ellenMonthly}
                      onChange={(e) => setTempGoals({ ...tempGoals, ellenMonthly: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Abastecimento mensal
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
                    Número de Semanas do Mês
                  </label>
                  <select
                    value={tempGoals.totalWeeks}
                    onChange={(e) => setTempGoals({ ...tempGoals, totalWeeks: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value={4}>4 Semanas (Padrão)</option>
                    <option value={5}>5 Semanas (Meses longos)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs">
                <p className="font-semibold mb-1">💡 Como funciona a rolagem semanal:</p>
                <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
                  Se você gastar a mais ou a menos em uma semana (ex: gastou R$ 330 numa meta de R$ 150), o saldo restante acumula ou desconta automaticamente na meta da semana seguinte!
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateGroceryPlanSettings({
                      monthlyGoal: Number(tempGoals.monthlyGoal),
                      ricardoWeeklyPlanned: Number(tempGoals.ricardoWeekly),
                      ellenMonthlyPlanned: Number(tempGoals.ellenMonthly),
                      totalWeeks: Number(tempGoals.totalWeeks),
                    });
                    setIsGoalModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  Salvar Metas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Market Mode Modal */}
      {isLiveMarketOpen && liveMarketList && (
        <LiveMarketModal
          isOpen={isLiveMarketOpen}
          onClose={() => {
            setIsLiveMarketOpen(false);
            setLiveMarketList(null);
          }}
          list={liveMarketList}
          onUpdateList={(updatedItems) => {
            if (liveMarketList) {
              updateShoppingList(liveMarketList.id, { items: updatedItems });
              setLiveMarketList({ ...liveMarketList, items: updatedItems });
            }
          }}
          onFinalizeTrip={({ listId, storeName, totalAmount, person, paymentMethod, tripType, weekNumber, savingsAmount, items }) => {
            convertShoppingListToTrip(listId, storeName, person, paymentMethod, totalAmount, tripType, weekNumber, savingsAmount, items);
            setIsLiveMarketOpen(false);
            setLiveMarketList(null);
          }}
        />
      )}

      {/* Ellen Cesta Básica Modal */}
      {isEllenCestaOpen && (
        <EllenCestaBasicaModal
          isOpen={isEllenCestaOpen}
          onClose={() => setIsEllenCestaOpen(false)}
          onSave={(record) => {
            addCestaBasicaRecord(record);
            setIsEllenCestaOpen(false);
          }}
        />
      )}

      {/* Delete Shopping List Confirmation Modal */}
      {listToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Excluir Lista de Compras?</h4>
                <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tem certeza que deseja excluir permanentemente a lista <strong>{listToDelete.name}</strong> ({listToDelete.items.length} itens cadastrados)?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteShoppingList(listToDelete.id);
                  setListToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
              >
                Sim, Excluir Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
