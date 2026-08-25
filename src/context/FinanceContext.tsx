import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  ActiveTab,
  CestaBasicaRecord,
  Cofrinho,
  CofrinhoMovement,
  CreditCard,
  EmergencyFundContribution,
  EmergencyFundSettings,
  GroceryMonthPlan,
  GroceryProduct,
  GroceryTrip,
  InstallmentPurchase,
  InvestmentContribution,
  MonthSummary,
  PaymentMethod,
  Person,
  SalarySettings,
  ShoppingList,
  ShoppingListItem,
  StockItem,
  Transaction,
  GlobalCofrinhoSettings,
  MonthlyAporteStatus,
  HouseFundSettings,
  RenovationExpense,
  FutureRentSettings,
  MonthlyClosingChecklist,
  AppAlert,
} from '../types';
import {
  INITIAL_CARDS,
  INITIAL_CESTA_BASICA_RECORDS,
  INITIAL_COFRINHOS,
  INITIAL_COFRINHO_MOVEMENTS,
  INITIAL_EMERGENCY_FUND_CONTRIBUTIONS,
  INITIAL_EMERGENCY_SETTINGS,
  INITIAL_GLOBAL_COFRINHO_SETTINGS,
  INITIAL_GROCERY_PLAN,
  INITIAL_GROCERY_TRIPS,
  INITIAL_INSTALLMENTS,
  INITIAL_INVESTMENTS,
  INITIAL_SALARY_SETTINGS,
  INITIAL_SHOPPING_LISTS,
  INITIAL_STOCK_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_HOUSE_FUND_SETTINGS,
  INITIAL_RENOVATION_EXPENSES,
  INITIAL_FUTURE_RENT_SETTINGS,
  INITIAL_CLOSING_CHECKLISTS,
} from '../data/initialData';
import { addMonthsToKey, classifyIncomeCategory, getMonthKey, getWeeksInMonth } from '../utils/formatters';
import { calculateMonthlyYieldDetails, calculateAnnualRate } from '../utils/yieldCalculations';
import { exportFullWorkbookExcel } from '../utils/excelExport';

export interface CardInvoiceSummary {
  card: CreditCard;
  monthKey: string;
  totalAmount: number;
  limitGoal: number;
  isOverLimit: boolean;
  percentageUsed: number;
  items: {
    id: string;
    description: string;
    amount: number;
    person: Person;
    date: string;
    installmentInfo?: { current: number; total: number };
    isDemo?: boolean;
  }[];
}

interface FinanceContextType {
  // Navigation & Month
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Data
  transactions: Transaction[];
  cards: CreditCard[];
  cofrinhos: Cofrinho[];
  cofrinhoMovements: CofrinhoMovement[];
  installmentPurchases: InstallmentPurchase[];
  groceryTrips: GroceryTrip[];
  groceryPlan: GroceryMonthPlan;
  shoppingLists: ShoppingList[];
  stockItems: StockItem[];
  cestaBasicaRecords: CestaBasicaRecord[];
  salarySettings: SalarySettings;
  investmentContributions: InvestmentContribution[];
  emergencyContributions: EmergencyFundContribution[];
  emergencySettings: EmergencyFundSettings;
  globalCofrinhoSettings: GlobalCofrinhoSettings;
  houseFundSettings: HouseFundSettings;
  renovationExpenses: RenovationExpense[];
  futureRentSettings: FutureRentSettings;
  closingChecklists: MonthlyClosingChecklist[];
  alerts: AppAlert[];

  // Demo State
  hasDemoData: boolean;
  clearDemoData: () => void;
  restoreDemoData: () => void;

  // Transactions CRUD
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionPaid: (id: string) => void;

  // Cards & Installments CRUD
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  addInstallmentPurchase: (purchase: Omit<InstallmentPurchase, 'id'>) => void;
  updateInstallmentPurchase: (id: string, purchase: Partial<InstallmentPurchase>) => void;
  deleteInstallmentPurchase: (id: string) => void;
  earlyPayInstallment: (id: string, count?: number) => void;

  // Cofrinhos CRUD & Gestão Estrutural
  addCofrinho: (cofrinho: Omit<Cofrinho, 'id'>) => void;
  updateCofrinho: (id: string, cofrinho: Partial<Cofrinho>) => void;
  deleteCofrinho: (id: string) => void;
  addCofrinhoMovement: (
    movementOrId: string | Omit<CofrinhoMovement, 'id'>,
    optionalMovement?: Omit<CofrinhoMovement, 'id' | 'cofrinhoId'>
  ) => void;
  deleteCofrinhoMovement: (id: string) => void;
  transferBetweenCofrinhos: (
    fromCofrinhoId: string,
    toCofrinhoId: string,
    amount: number,
    person?: Person,
    notes?: string,
    subPurpose?: string
  ) => void;
  distributeExtraordinaryIncome: (params: {
    description: string;
    amount: number;
    person: Person;
    date: string;
    notes?: string;
  }) => {
    resAmount: number;
    casaAmount: number;
    lazerAmount: number;
    redirected: boolean;
    targetReservaCofId: string;
  };
  updateGlobalCofrinhoSettings: (settings: Partial<GlobalCofrinhoSettings>) => void;
  applyMonthlyYieldToAllCofrinhos: (monthKey: string) => void;
  setMonthlyAporteStatus: (person: 'Ricardo' | 'Ellen', status: MonthlyAporteStatus) => void;

  // Compra da Nova Casa & Cenários
  updateHouseFundSettings: (settings: Partial<HouseFundSettings>) => void;

  // Reforma e Futuro Aluguel CRUD
  addRenovationExpense: (expense: Omit<RenovationExpense, 'id'>) => void;
  updateRenovationExpense: (id: string, expense: Partial<RenovationExpense>) => void;
  deleteRenovationExpense: (id: string) => void;
  updateFutureRentSettings: (settings: Partial<FutureRentSettings>) => void;

  // Fechamento Mensal
  toggleClosingChecklistItem: (monthKey: string, itemId: string) => void;
  toggleMonthClosed: (monthKey: string) => void;
  updateClosingNotes: (monthKey: string, notes: string) => void;

  // Alertas & Notificações
  dismissAlert: (id: string) => void;

  // Grocery Planning & CRUD
  addGroceryTrip: (trip: Omit<GroceryTrip, 'id'>) => void;
  updateGroceryTrip: (id: string, trip: Partial<GroceryTrip>) => void;
  deleteGroceryTrip: (id: string) => void;
  setGroceryPlanningMode: (mode: 'opcao_a' | 'opcao_b') => void;
  toggleRicardoWeek: (weekIndex: number) => void;
  updateRicardoWeekAmount: (weekIndex: number, amount: number) => void;
  toggleEllenGrocery: () => void;
  updateEllenGroceryAmount: (amount: number) => void;
  groceryMonthlyGoal: number;
  setGroceryMonthlyGoal: (goal: number) => void;

  // Shopping Lists CRUD & Conversions
  addShoppingList: (list: Omit<ShoppingList, 'id'>) => void;
  updateShoppingList: (id: string, list: Partial<ShoppingList>) => void;
  deleteShoppingList: (id: string) => void;
  copyShoppingList: (id: string) => void;
  convertShoppingListToTrip: (
    listId: string,
    storeName: string,
    person: Person,
    paymentMethod: PaymentMethod
  ) => void;

  // Stock Items CRUD
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  updateStockItem: (id: string, item: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;

  // Cesta Basica CRUD
  addCestaBasicaRecord: (record: Omit<CestaBasicaRecord, 'id'>) => void;
  deleteCestaBasicaRecord: (id: string) => void;

  // Salary & Budget Settings
  updateSalarySettings: (settings: Partial<SalarySettings>) => void;

  // Investments & Emergency
  addInvestmentContribution: (inv: Omit<InvestmentContribution, 'id'>) => void;
  deleteInvestmentContribution: (id: string) => void;
  addEmergencyContribution: (efc: Omit<EmergencyFundContribution, 'id'>) => void;
  deleteEmergencyContribution: (id: string) => void;
  updateEmergencySettings: (settings: Partial<EmergencyFundSettings>) => void;

  // Summaries & Calculations
  currentMonthSummary: MonthSummary;
  getCardInvoicesForMonth: (monthKey: string) => CardInvoiceSummary[];
  cumulativeBalance: number;
  totalEmergencyFund: number;
  renovationCreditTotal: number;
  renovationCredit: number;

  // Export & Import
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => boolean;
  exportTransactionsCSV: () => void;
  exportGroceryCSV: () => void;
  exportExcelFull: () => void;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'fin_family_transactions_v2',
  CARDS: 'fin_family_cards_v2',
  COFRINHOS: 'fin_family_cofrinhos_v2',
  COFRINHO_MOVEMENTS: 'fin_family_cof_movements_v2',
  INSTALLMENTS: 'fin_family_installments_v2',
  GROCERY: 'fin_family_grocery_v2',
  GROCERY_PLAN: 'fin_family_grocery_plan_v2',
  SHOPPING_LISTS: 'fin_family_shopping_lists_v2',
  STOCK_ITEMS: 'fin_family_stock_items_v2',
  CESTA_BASICA: 'fin_family_cesta_basica_v2',
  SALARY_SETTINGS: 'fin_family_salary_settings_v2',
  INVESTMENTS: 'fin_family_investments_v2',
  EMERGENCY: 'fin_family_emergency_v2',
  EMERGENCY_SETTINGS: 'fin_family_emergency_settings_v2',
  GLOBAL_COFRINHO_SETTINGS: 'fin_family_global_cofrinhos_v2',
  HOUSE_FUND_SETTINGS: 'fin_family_house_fund_settings_v2',
  RENOVATION_EXPENSES: 'fin_family_renov_expenses_v2',
  FUTURE_RENT_SETTINGS: 'fin_family_future_rent_v2',
  CLOSING_CHECKLISTS: 'fin_family_closing_checklists_v2',
  DISMISSED_ALERTS: 'fin_family_dismissed_alerts_v2',
  SELECTED_MONTH: 'fin_family_selected_month_v2',
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
    return saved || '2026-08';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [cofrinhos, setCofrinhos] = useState<Cofrinho[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COFRINHOS);
    return saved ? JSON.parse(saved) : INITIAL_COFRINHOS;
  });

  const [cofrinhoMovements, setCofrinhoMovements] = useState<CofrinhoMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COFRINHO_MOVEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_COFRINHO_MOVEMENTS;
  });

  const [globalCofrinhoSettings, setGlobalCofrinhoSettings] = useState<GlobalCofrinhoSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_GLOBAL_COFRINHO_SETTINGS;
  });

  const [houseFundSettings, setHouseFundSettings] = useState<HouseFundSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOUSE_FUND_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_HOUSE_FUND_SETTINGS;
  });

  const [renovationExpenses, setRenovationExpenses] = useState<RenovationExpense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RENOVATION_EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_RENOVATION_EXPENSES;
  });

  const [futureRentSettings, setFutureRentSettings] = useState<FutureRentSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FUTURE_RENT_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_FUTURE_RENT_SETTINGS;
  });

  const [closingChecklists, setClosingChecklists] = useState<MonthlyClosingChecklist[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLOSING_CHECKLISTS);
    return saved ? JSON.parse(saved) : INITIAL_CLOSING_CHECKLISTS;
  });

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISMISSED_ALERTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [installmentPurchases, setInstallmentPurchases] = useState<InstallmentPurchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
    return saved ? JSON.parse(saved) : INITIAL_INSTALLMENTS;
  });

  const [groceryTrips, setGroceryTrips] = useState<GroceryTrip[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROCERY);
    return saved ? JSON.parse(saved) : INITIAL_GROCERY_TRIPS;
  });

  const [groceryPlan, setGroceryPlan] = useState<GroceryMonthPlan>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROCERY_PLAN);
    return saved ? JSON.parse(saved) : INITIAL_GROCERY_PLAN;
  });

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_LISTS);
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING_LISTS;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
  });

  const [cestaBasicaRecords, setCestaBasicaRecords] = useState<CestaBasicaRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CESTA_BASICA);
    return saved ? JSON.parse(saved) : INITIAL_CESTA_BASICA_RECORDS;
  });

  const [salarySettings, setSalarySettings] = useState<SalarySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALARY_SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SALARY_SETTINGS;
  });

  const [investmentContributions, setInvestmentContributions] = useState<InvestmentContribution[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
  });

  const [emergencyContributions, setEmergencyContributions] = useState<EmergencyFundContribution[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMERGENCY);
    return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_FUND_CONTRIBUTIONS;
  });

  const [emergencySettings, setEmergencySettings] = useState<EmergencyFundSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMERGENCY_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          monthlyLivingCost: parsed.monthlyLivingCost || 6900,
        };
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EMERGENCY_SETTINGS;
  });

  const [groceryMonthlyGoal, setGroceryMonthlyGoal] = useState<number>(1000);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COFRINHOS, JSON.stringify(cofrinhos));
  }, [cofrinhos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COFRINHO_MOVEMENTS, JSON.stringify(cofrinhoMovements));
  }, [cofrinhoMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installmentPurchases));
  }, [installmentPurchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROCERY, JSON.stringify(groceryTrips));
  }, [groceryTrips]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROCERY_PLAN, JSON.stringify(groceryPlan));
  }, [groceryPlan]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(shoppingLists));
  }, [shoppingLists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CESTA_BASICA, JSON.stringify(cestaBasicaRecords));
  }, [cestaBasicaRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALARY_SETTINGS, JSON.stringify(salarySettings));
  }, [salarySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investmentContributions));
  }, [investmentContributions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(emergencyContributions));
  }, [emergencyContributions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_SETTINGS, JSON.stringify(emergencySettings));
  }, [emergencySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS, JSON.stringify(globalCofrinhoSettings));
  }, [globalCofrinhoSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOUSE_FUND_SETTINGS, JSON.stringify(houseFundSettings));
  }, [houseFundSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RENOVATION_EXPENSES, JSON.stringify(renovationExpenses));
  }, [renovationExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FUTURE_RENT_SETTINGS, JSON.stringify(futureRentSettings));
  }, [futureRentSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLOSING_CHECKLISTS, JSON.stringify(closingChecklists));
  }, [closingChecklists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_ALERTS, JSON.stringify(dismissedAlertIds));
  }, [dismissedAlertIds]);

  // Adjust grocery plan whenever selectedMonth changes if not configured
  useEffect(() => {
    const weeksCount = getWeeksInMonth(selectedMonth);
    setGroceryPlan((prev) => {
      if (prev.monthKey === selectedMonth && prev.ricardoWeeks.length === weeksCount) {
        return prev;
      }
      const isOptionB = prev.mode === 'opcao_b';
      const weeklyAmount = isOptionB && weeksCount === 5 ? 120 : 150;
      
      const weeks = Array.from({ length: weeksCount }, (_, idx) => ({
        weekIndex: idx + 1,
        weekLabel: `Semana ${idx + 1}`,
        plannedAmount: weeklyAmount,
        actualAmount: weeklyAmount,
        completed: idx < 3,
      }));

      return {
        monthKey: selectedMonth,
        mode: prev.mode || 'opcao_a',
        totalWeeks: weeksCount,
        ricardoWeeklyPlanned: weeklyAmount,
        ricardoWeeks: weeks,
        ellenMonthlyPlanned: 400,
        ellenActualAmount: 400,
        ellenCompleted: true,
      };
    });
  }, [selectedMonth]);

  // Demo status check
  const hasDemoData = useMemo(() => {
    return (
      transactions.some((t) => t.isDemo) ||
      cards.some((c) => c.isDemo) ||
      cofrinhos.some((cof) => cof.isDemo) ||
      installmentPurchases.some((i) => i.isDemo) ||
      groceryTrips.some((g) => g.isDemo) ||
      investmentContributions.some((inv) => inv.isDemo) ||
      emergencyContributions.some((e) => e.isDemo) ||
      renovationExpenses.some((r) => r.isDemo)
    );
  }, [transactions, cards, cofrinhos, installmentPurchases, groceryTrips, investmentContributions, emergencyContributions, renovationExpenses]);

  const clearDemoData = () => {
    setTransactions((prev) => prev.filter((t) => !t.isDemo));
    setCards((prev) => prev.filter((c) => !c.isDemo));
    setCofrinhos((prev) => prev.filter((cof) => !cof.isDemo));
    setCofrinhoMovements((prev) => prev.filter((cm) => !cm.isDemo));
    setInstallmentPurchases((prev) => prev.filter((i) => !i.isDemo));
    setGroceryTrips((prev) => prev.filter((g) => !g.isDemo));
    setShoppingLists((prev) => prev.filter((l) => !l.isDemo));
    setStockItems((prev) => prev.filter((s) => !s.isDemo));
    setCestaBasicaRecords((prev) => prev.filter((c) => !c.isDemo));
    setInvestmentContributions((prev) => prev.filter((inv) => !inv.isDemo));
    setEmergencyContributions((prev) => prev.filter((e) => !e.isDemo));
    setRenovationExpenses((prev) => prev.filter((r) => !r.isDemo));
  };

  const restoreDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCards(INITIAL_CARDS);
    setCofrinhos(INITIAL_COFRINHOS);
    setCofrinhoMovements(INITIAL_COFRINHO_MOVEMENTS);
    setInstallmentPurchases(INITIAL_INSTALLMENTS);
    setGroceryTrips(INITIAL_GROCERY_TRIPS);
    setGroceryPlan(INITIAL_GROCERY_PLAN);
    setShoppingLists(INITIAL_SHOPPING_LISTS);
    setStockItems(INITIAL_STOCK_ITEMS);
    setCestaBasicaRecords(INITIAL_CESTA_BASICA_RECORDS);
    setSalarySettings(INITIAL_SALARY_SETTINGS);
    setInvestmentContributions(INITIAL_INVESTMENTS);
    setEmergencyContributions(INITIAL_EMERGENCY_FUND_CONTRIBUTIONS);
    setEmergencySettings(INITIAL_EMERGENCY_SETTINGS);
    setGlobalCofrinhoSettings(INITIAL_GLOBAL_COFRINHO_SETTINGS);
    setHouseFundSettings(INITIAL_HOUSE_FUND_SETTINGS);
    setRenovationExpenses(INITIAL_RENOVATION_EXPENSES);
    setFutureRentSettings(INITIAL_FUTURE_RENT_SETTINGS);
    setClosingChecklists(INITIAL_CLOSING_CHECKLISTS);
    setDismissedAlertIds([]);
    setSelectedMonth('2026-08');
  };

  // Transactions CRUD
  const addTransaction = (tx: Omit<Transaction, 'id'>): Transaction => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated, isDemo: false } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTransactionPaid = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, paid: !t.paid } : t))
    );
  };

  // Cards CRUD
  const addCard = (card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...card,
      id: 'card-' + Date.now(),
    };
    setCards((prev) => [...prev, newCard]);
  };

  const updateCard = (id: string, updated: Partial<CreditCard>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated, isDemo: false } : c))
    );
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  // Installments CRUD
  const addInstallmentPurchase = (purchase: Omit<InstallmentPurchase, 'id'>) => {
    const purchaseId = 'inst-' + Date.now();
    const newPurchase: InstallmentPurchase = {
      ...purchase,
      id: purchaseId,
    };
    setInstallmentPurchases((prev) => [newPurchase, ...prev]);

    const newTxs: Transaction[] = [];
    for (let i = 0; i < purchase.totalInstallments; i++) {
      const monthForInst = addMonthsToKey(purchase.firstInstallmentMonth, i);
      const card = cards.find((c) => c.id === purchase.cardId);
      const dueDay = card ? String(card.dueDay).padStart(2, '0') : '20';
      const dateStr = `${monthForInst}-${dueDay}`;

      newTxs.push({
        id: `tx-inst-${purchaseId}-${i + 1}`,
        description: `${purchase.description} (Parc. ${i + 1}/${purchase.totalInstallments})`,
        amount: purchase.installmentAmount,
        type: 'despesa',
        category: purchase.category || 'Cartões',
        person: purchase.person,
        date: dateStr,
        competenceMonth: monthForInst,
        paid: false,
        isRecurring: false,
        paymentMethod: 'credito',
        cardId: purchase.cardId,
        installmentInfo: {
          current: i + 1,
          total: purchase.totalInstallments,
          purchaseId: purchaseId,
        },
      });
    }

    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const deleteInstallmentPurchase = (id: string) => {
    setInstallmentPurchases((prev) => prev.filter((i) => i.id !== id));
    setTransactions((prev) =>
      prev.filter((t) => t.installmentInfo?.purchaseId !== id)
    );
  };

  const updateInstallmentPurchase = (id: string, updated: Partial<InstallmentPurchase>) => {
    setInstallmentPurchases((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updated, isDemo: false } : inst))
    );
  };

  const earlyPayInstallment = (id: string, count: number = 1) => {
    setInstallmentPurchases((prev) =>
      prev.map((inst) => {
        if (inst.id === id) {
          const newRemaining = Math.max(0, inst.remainingInstallments - count);
          const newCurrent = Math.min(inst.totalInstallments, inst.currentInstallment + count);
          return {
            ...inst,
            remainingInstallments: newRemaining,
            currentInstallment: newCurrent,
            isDemo: false,
          };
        }
        return inst;
      })
    );
    // Mark future transaction as paid
    setTransactions((prev) => {
      let marked = 0;
      return prev.map((t) => {
        if (t.installmentInfo?.purchaseId === id && !t.paid && marked < count) {
          marked++;
          return { ...t, paid: true, notes: (t.notes ? t.notes + ' - ' : '') + 'Parcela antecipada' };
        }
        return t;
      });
    });
  };

  // Cofrinhos CRUD
  const addCofrinho = (cofrinho: Omit<Cofrinho, 'id'>) => {
    const newCof: Cofrinho = {
      ...cofrinho,
      id: 'cof-' + Date.now(),
    };
    setCofrinhos((prev) => [...prev, newCof]);
  };

  const updateCofrinho = (id: string, updated: Partial<Cofrinho>) => {
    setCofrinhos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated, isDemo: false } : c))
    );
  };

  const deleteCofrinho = (id: string) => {
    setCofrinhos((prev) => prev.filter((c) => c.id !== id));
    setCofrinhoMovements((prev) => prev.filter((m) => m.cofrinhoId !== id));
  };

  const addCofrinhoMovement = (
    movementOrId: string | Omit<CofrinhoMovement, 'id'>,
    optionalMovement?: Omit<CofrinhoMovement, 'id' | 'cofrinhoId'>
  ) => {
    const movement: Omit<CofrinhoMovement, 'id'> =
      typeof movementOrId === 'string' && optionalMovement
        ? { ...optionalMovement, cofrinhoId: movementOrId }
        : (movementOrId as Omit<CofrinhoMovement, 'id'>);

    const newMovement: CofrinhoMovement = {
      ...movement,
      id: 'cm-' + Date.now(),
    };
    setCofrinhoMovements((prev) => [newMovement, ...prev]);

    // Update target cofrinho balance
    setCofrinhos((prev) =>
      prev.map((c) => {
        if (c.id === movement.cofrinhoId) {
          const delta =
            movement.type === 'retirada'
              ? -movement.amount
              : movement.amount;
          const newYield =
            movement.type === 'rendimento'
              ? c.monthlyYield + movement.amount
              : c.monthlyYield;
          const newAccYield =
            movement.type === 'rendimento'
              ? c.accumulatedYield + movement.amount
              : c.accumulatedYield;
          return {
            ...c,
            currentBalance: Math.max(0, c.currentBalance + delta),
            monthlyYield: newYield,
            accumulatedYield: newAccYield,
            isDemo: false,
          };
        }
        return c;
      })
    );
  };

  const deleteCofrinhoMovement = (id: string) => {
    const mov = cofrinhoMovements.find((m) => m.id === id);
    if (mov) {
      setCofrinhos((prev) =>
        prev.map((c) => {
          if (c.id === mov.cofrinhoId) {
            const delta = mov.type === 'retirada' ? mov.amount : -mov.amount;
            return {
              ...c,
              currentBalance: Math.max(0, c.currentBalance + delta),
            };
          }
          return c;
        })
      );
    }
    setCofrinhoMovements((prev) => prev.filter((m) => m.id !== id));
  };

  const updateGlobalCofrinhoSettings = (settings: Partial<GlobalCofrinhoSettings>) => {
    setGlobalCofrinhoSettings((prev) => ({ ...prev, ...settings }));
  };

  // Transferência interna entre cofrinhos (Ex: Casa & Manutenção -> Compra da Nova Casa)
  const transferBetweenCofrinhos = (
    fromCofrinhoId: string,
    toCofrinhoId: string,
    amount: number,
    person: Person = 'Família',
    notes?: string,
    subPurpose?: string
  ) => {
    if (fromCofrinhoId === toCofrinhoId || amount <= 0) return;
    const source = cofrinhos.find((c) => c.id === fromCofrinhoId);
    const target = cofrinhos.find((c) => c.id === toCofrinhoId);
    const today = new Date().toISOString().slice(0, 10);

    // Retirada no Cofrinho de Origem
    addCofrinhoMovement({
      cofrinhoId: fromCofrinhoId,
      date: today,
      type: 'retirada',
      amount,
      person,
      destinationCofrinhoId: toCofrinhoId,
      notes: notes || `Transferência enviada para: ${target?.name || toCofrinhoId}`,
    });

    // Aporte no Cofrinho de Destino
    addCofrinhoMovement({
      cofrinhoId: toCofrinhoId,
      date: today,
      type: 'aporte',
      amount,
      person,
      destinationCofrinhoId: fromCofrinhoId,
      subPurpose,
      notes: notes || `Transferência recebida de: ${source?.name || fromCofrinhoId}`,
    });
  };

  // Distribuição Automática de Renda Extraordinária (70% Reserva, 20% Casa e Manutenção, 10% Lazer)
  // Se a meta da reserva (R$ 55.200) já estiver atingida, os 70% são redirecionados automaticamente para "Compra da Nova Casa"
  const distributeExtraordinaryIncome = ({
    description,
    amount,
    person,
    date,
    notes,
  }: {
    description: string;
    amount: number;
    person: Person;
    date: string;
    notes?: string;
  }) => {
    // 1. Criar lançamento de receita extraordinária
    const tx = addTransaction({
      description,
      amount,
      type: 'receita',
      category: 'Renda extra',
      person,
      date,
      competenceMonth: getMonthKey(date),
      paid: true,
      isRecurring: false,
      paymentMethod: 'pix',
      notes: notes || 'Renda extraordinária distribuída conforme regra 70/20/10',
    });

    // 2. Percentuais da regra
    const resPct = (globalCofrinhoSettings.extraordinaryReservaPercentage || 70) / 100;
    const casaPct = (globalCofrinhoSettings.extraordinaryCasaManutencaoPercentage || 20) / 100;
    const lazerPct = (globalCofrinhoSettings.extraordinaryLazerPercentage || 10) / 100;

    const resAmount = Math.round(amount * resPct * 100) / 100;
    const casaAmount = Math.round(amount * casaPct * 100) / 100;
    const lazerAmount = Math.round((amount - resAmount - casaAmount) * 100) / 100;

    // Verificar se a reserva de emergência atingiu a meta total
    const resCof = cofrinhos.find((c) => c.type === 'reserva');
    const currentEmergency = resCof ? resCof.currentBalance : totalEmergencyFund;
    const isEmergencyCompleted = currentEmergency >= emergencySettings.targetAmount;

    const targetReservaCofId =
      isEmergencyCompleted && globalCofrinhoSettings.redirectAfterEmergencyMet
        ? globalCofrinhoSettings.redirectTargetCofrinhoId || 'cof-casa'
        : 'cof-reserva';

    // Aporte 70% (ou redirecionado)
    if (resAmount > 0) {
      addCofrinhoMovement({
        cofrinhoId: targetReservaCofId,
        date,
        type: 'aporte',
        amount: resAmount,
        person,
        isExtraordinaryShare: true,
        notes:
          isEmergencyCompleted && targetReservaCofId !== 'cof-reserva'
            ? `70% de "${description}" - Redirecionado p/ Compra da Casa (Meta da Reserva 100% atingida)`
            : `70% de "${description}" - Destinação Reserva de Emergência`,
      });

      if (targetReservaCofId === 'cof-reserva') {
        addEmergencyContribution({
          person,
          amount: resAmount,
          date,
          institution: 'Renda Extraordinária',
          isExtraordinary: true,
          notes: `70% de ${description}`,
        });
      }
    }

    // Aporte 20% Casa e Manutenção
    if (casaAmount > 0) {
      addCofrinhoMovement({
        cofrinhoId: 'cof-manutencao',
        date,
        type: 'aporte',
        amount: casaAmount,
        person,
        isExtraordinaryShare: true,
        subPurpose: 'manutencao_casa',
        notes: `20% de "${description}" - Destinação Cofrinho Casa e Manutenção`,
      });
    }

    // Aporte 10% Lazer
    if (lazerAmount > 0) {
      addCofrinhoMovement({
        cofrinhoId: 'cof-lazer',
        date,
        type: 'aporte',
        amount: lazerAmount,
        person,
        isExtraordinaryShare: true,
        subPurpose: 'passeios',
        notes: `10% de "${description}" - Destinação Cofrinho Lazer`,
      });
    }

    return {
      resAmount,
      casaAmount,
      lazerAmount,
      redirected: isEmergencyCompleted && targetReservaCofId !== 'cof-reserva',
      targetReservaCofId,
    };
  };

  // Aplica cálculo de rendimento mensal para todos os cofrinhos
  const applyMonthlyYieldToAllCofrinhos = (monthKey: string) => {
    const today = `${monthKey}-01`;
    setCofrinhos((prev) =>
      prev.map((c) => {
        const annualRate = calculateAnnualRate(
          globalCofrinhoSettings.cdiAnnualRate,
          c.yieldType,
          c.cdiPercentage || 100,
          c.customAnnualRate || 0
        );

        if (annualRate <= 0) return c;

        const taxRate = c.yieldType === 'fixed_annual' && c.applicationType.toLowerCase().includes('lci')
          ? 0
          : globalCofrinhoSettings.defaultIncomeTaxRate || 15;

        const yieldDetails = calculateMonthlyYieldDetails(
          c.currentBalance,
          annualRate,
          0,
          0,
          taxRate
        );

        if (yieldDetails.netYield > 0) {
          // Registrar movimentação de rendimento
          addCofrinhoMovement({
            cofrinhoId: c.id,
            date: today,
            type: 'rendimento',
            amount: Math.round(yieldDetails.netYield * 100) / 100,
            grossAmount: Math.round(yieldDetails.grossYield * 100) / 100,
            taxAmount: Math.round(yieldDetails.taxAndFees * 100) / 100,
            person: 'Família',
            notes: `Rendimento automático de ${c.yieldType === 'cdi_100' ? '100% CDI' : `${annualRate.toFixed(2)}% a.a.`}`,
          });

          return {
            ...c,
            monthlyYield: Math.round(yieldDetails.netYield * 100) / 100,
            accumulatedYield: Math.round((c.accumulatedYield + yieldDetails.netYield) * 100) / 100,
            grossYield: Math.round(yieldDetails.grossYield * 100) / 100,
            taxAndFees: Math.round(yieldDetails.taxAndFees * 100) / 100,
            isDemo: false,
          };
        }

        return c;
      })
    );
  };

  // Status do Aporte Mensal da Reserva (Ricardo R$ 500 / Ellen R$ 500)
  const setMonthlyAporteStatus = (person: 'Ricardo' | 'Ellen', status: MonthlyAporteStatus) => {
    setEmergencySettings((prev) => {
      const updated = {
        ...prev,
        [person === 'Ricardo' ? 'ricardoStatus' : 'ellenStatus']: status,
      };
      return updated;
    });
  };

  // Grocery CRUD & Planning
  const addGroceryTrip = (trip: Omit<GroceryTrip, 'id'>) => {
    const tripId = 'groc-' + Date.now();
    const newTrip: GroceryTrip = {
      ...trip,
      id: tripId,
    };
    setGroceryTrips((prev) => [newTrip, ...prev]);

    const newTx: Transaction = {
      id: 'tx-groc-' + tripId,
      description: `Supermercado - ${trip.storeName}`,
      amount: trip.totalAmount,
      type: 'despesa',
      category: 'Supermercado',
      person: trip.person,
      date: trip.date,
      competenceMonth: getMonthKey(trip.date),
      paid: true,
      isRecurring: true,
      paymentMethod: trip.paymentMethod,
      groceryTripId: tripId,
      notes: trip.notes,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateGroceryTrip = (id: string, updated: Partial<GroceryTrip>) => {
    setGroceryTrips((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updated, isDemo: false } : g))
    );
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.groceryTripId === id) {
          return {
            ...t,
            description: updated.storeName ? `Supermercado - ${updated.storeName}` : t.description,
            amount: updated.totalAmount !== undefined ? updated.totalAmount : t.amount,
            date: updated.date || t.date,
            person: updated.person || t.person,
            paymentMethod: updated.paymentMethod || t.paymentMethod,
            notes: updated.notes !== undefined ? updated.notes : t.notes,
            isDemo: false,
          };
        }
        return t;
      })
    );
  };

  const deleteGroceryTrip = (id: string) => {
    setGroceryTrips((prev) => prev.filter((g) => g.id !== id));
    setTransactions((prev) => prev.filter((t) => t.groceryTripId !== id));
  };

  const setGroceryPlanningMode = (mode: 'opcao_a' | 'opcao_b') => {
    setGroceryPlan((prev) => {
      const weeksCount = prev.totalWeeks || 4;
      const isOptionB = mode === 'opcao_b';
      const weeklyAmount = isOptionB && weeksCount === 5 ? 120 : 150;
      return {
        ...prev,
        mode,
        ricardoWeeklyPlanned: weeklyAmount,
        ricardoWeeks: prev.ricardoWeeks.map((w) => ({
          ...w,
          plannedAmount: weeklyAmount,
          actualAmount: w.completed ? weeklyAmount : w.actualAmount,
        })),
      };
    });
  };

  const toggleRicardoWeek = (weekIndex: number) => {
    setGroceryPlan((prev) => ({
      ...prev,
      ricardoWeeks: prev.ricardoWeeks.map((w) => {
        if (w.weekIndex === weekIndex) {
          const nextCompleted = !w.completed;
          return {
            ...w,
            completed: nextCompleted,
            actualAmount: nextCompleted ? (w.actualAmount || w.plannedAmount || 150) : 0,
          };
        }
        return w;
      }),
    }));
  };

  const updateRicardoWeekAmount = (weekIndex: number, amount: number) => {
    setGroceryPlan((prev) => ({
      ...prev,
      ricardoWeeks: prev.ricardoWeeks.map((w) =>
        w.weekIndex === weekIndex
          ? { ...w, actualAmount: amount, completed: amount > 0 }
          : w
      ),
    }));
  };

  const toggleEllenGrocery = () => {
    setGroceryPlan((prev) => {
      const nextCompleted = !prev.ellenCompleted;
      return {
        ...prev,
        ellenCompleted: nextCompleted,
        ellenActualAmount: nextCompleted ? (prev.ellenActualAmount || 400) : 0,
      };
    });
  };

  const updateEllenGroceryAmount = (amount: number) => {
    setGroceryPlan((prev) => ({
      ...prev,
      ellenActualAmount: amount,
      ellenCompleted: amount > 0,
    }));
  };

  // Shopping Lists CRUD & Conversions
  const addShoppingList = (list: Omit<ShoppingList, 'id'>) => {
    const newList: ShoppingList = {
      ...list,
      id: 'list-' + Date.now(),
    };
    setShoppingLists((prev) => [newList, ...prev]);
  };

  const updateShoppingList = (id: string, updated: Partial<ShoppingList>) => {
    setShoppingLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updated, isDemo: false } : l))
    );
  };

  const deleteShoppingList = (id: string) => {
    setShoppingLists((prev) => prev.filter((l) => l.id !== id));
  };

  const copyShoppingList = (id: string) => {
    const original = shoppingLists.find((l) => l.id === id);
    if (!original) return;
    const copied: ShoppingList = {
      ...original,
      id: 'list-' + Date.now(),
      name: `${original.name} (Cópia)`,
      createdAt: new Date().toISOString().slice(0, 10),
      isDemo: false,
      items: original.items.map((item) => ({
        ...item,
        id: 'sli-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        completed: false,
        actualPricePaid: undefined,
      })),
    };
    setShoppingLists((prev) => [copied, ...prev]);
  };

  const convertShoppingListToTrip = (
    listId: string,
    storeName: string,
    person: Person,
    paymentMethod: PaymentMethod
  ) => {
    const list = shoppingLists.find((l) => l.id === listId);
    if (!list) return;

    const completedItems = list.items.filter((i) => i.completed || (i.actualPricePaid && i.actualPricePaid > 0));
    const itemsToConvert = completedItems.length > 0 ? completedItems : list.items;
    
    const products: GroceryProduct[] = itemsToConvert.map((item) => {
      const unitPrice = item.actualPricePaid && item.quantity ? item.actualPricePaid / item.quantity : (item.lastPricePaid || 0);
      const total = item.actualPricePaid || (unitPrice * item.quantity);
      return {
        id: 'gp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: item.product,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice,
        totalPrice: total,
        isPromotional: false,
        notes: item.notes,
      };
    });

    const totalAmount = products.reduce((sum, p) => sum + p.totalPrice, 0);
    const today = new Date().toISOString().slice(0, 10);

    addGroceryTrip({
      date: today,
      storeName: storeName || 'Supermercado',
      totalAmount: totalAmount > 0 ? totalAmount : (list.estimatedTotal || 0),
      person: person || 'Família',
      paymentMethod: paymentMethod || 'debito',
      isExtraordinary: false,
      notes: `Compra gerada a partir da lista: ${list.name}`,
      items: products,
      products,
    });
  };

  // Stock Items CRUD
  const addStockItem = (item: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...item,
      id: 'stk-' + Date.now(),
    };
    setStockItems((prev) => [newItem, ...prev]);
  };

  const updateStockItem = (id: string, updated: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated, isDemo: false } : s))
    );
  };

  const deleteStockItem = (id: string) => {
    setStockItems((prev) => prev.filter((s) => s.id !== id));
  };

  // Cesta Basica CRUD
  const addCestaBasicaRecord = (record: Omit<CestaBasicaRecord, 'id'>) => {
    const newRecord: CestaBasicaRecord = {
      ...record,
      id: 'cesta-' + Date.now(),
    };
    setCestaBasicaRecords((prev) => [newRecord, ...prev]);

    // Optional: automatically add stock items from cesta basica
    if (record.items && record.items.length > 0) {
      record.items.forEach((item) => {
        addStockItem({
          product: item.product,
          category: 'Produtos da cesta básica',
          lastPurchaseDate: record.date,
          quantity: item.quantity,
          unit: item.unit,
          estimatedDurationDays: 30,
          nextPurchasePredictedDate: record.date,
          lastPricePaid: 0,
          store: 'Cesta Básica Ellen',
          status: 'suficiente',
          isFromCestaBasica: true,
          notes: 'Recebido na cesta de Ellen',
        });
      });
    }
  };

  const deleteCestaBasicaRecord = (id: string) => {
    setCestaBasicaRecords((prev) => prev.filter((c) => c.id !== id));
  };

  // Salary Settings CRUD
  const updateSalarySettings = (settings: Partial<SalarySettings>) => {
    setSalarySettings((prev) => {
      const updated = { ...prev, ...settings };
      const ricardoTotal = (updated.ricardoAdvance || 0) + (updated.ricardoMainPayment || 0) || updated.ricardoNetSalary || 5300;
      const ellenTotal = updated.ellenSalary || 1600;
      const totalFamilySalary = ricardoTotal + ellenTotal;
      const autoTargetAmount = totalFamilySalary * 8;

      setEmergencySettings((prevEmerg) => ({
        ...prevEmerg,
        familySalaryIncome: totalFamilySalary,
        monthlyLivingCost: totalFamilySalary,
        targetAmount: autoTargetAmount,
      }));

      setCofrinhos((prevCofs) =>
        prevCofs.map((c) =>
          c.id === 'cof-reserva' || c.type === 'reserva'
            ? { ...c, targetAmount: autoTargetAmount }
            : c
        )
      );

      return updated;
    });
  };

  // Investments & Emergency
  const addInvestmentContribution = (inv: Omit<InvestmentContribution, 'id'>) => {
    const newInv: InvestmentContribution = {
      ...inv,
      id: 'inv-' + Date.now(),
    };
    setInvestmentContributions((prev) => [newInv, ...prev]);

    const newTx: Transaction = {
      id: 'tx-inv-' + newInv.id,
      description: `Investimento Mensal - ${inv.person} (${inv.targetAsset})`,
      amount: inv.amount,
      type: 'investimento',
      category: 'Investimentos',
      person: inv.person,
      date: inv.date,
      competenceMonth: getMonthKey(inv.date),
      paid: true,
      isRecurring: true,
      paymentMethod: 'transferencia',
      notes: inv.notes,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteInvestmentContribution = (id: string) => {
    setInvestmentContributions((prev) => prev.filter((inv) => inv.id !== id));
    setTransactions((prev) => prev.filter((t) => t.id !== 'tx-inv-' + id));
  };

  const addEmergencyContribution = (efc: Omit<EmergencyFundContribution, 'id'>) => {
    const newEfc: EmergencyFundContribution = {
      ...efc,
      id: 'efc-' + Date.now(),
    };
    setEmergencyContributions((prev) => [newEfc, ...prev]);

    // Add to Cofrinho Reserva as well
    addCofrinhoMovement({
      cofrinhoId: 'cof-reserva',
      date: efc.date,
      type: 'aporte',
      amount: efc.amount,
      person: efc.person,
      notes: efc.notes || `Aporte Reserva de Emergência (${efc.institution})`,
    });
  };

  const deleteEmergencyContribution = (id: string) => {
    setEmergencyContributions((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEmergencySettings = (updated: Partial<EmergencyFundSettings>) => {
    setEmergencySettings((prev) => ({ ...prev, ...updated }));
  };

  // Total Emergency Fund Balance
  const totalEmergencyFund = useMemo(() => {
    const resCof = cofrinhos.find((c) => c.type === 'reserva');
    if (resCof) return resCof.currentBalance;
    return emergencyContributions.reduce((acc, e) => acc + e.amount, 0);
  }, [cofrinhos, emergencyContributions]);

  // Credit Card Invoices per Month
  const getCardInvoicesForMonth = useCallback((monthKey: string): CardInvoiceSummary[] => {
    return cards.map((card) => {
      const cardTxs = transactions.filter((t) => {
        if (t.cardId !== card.id) return false;
        return (t.competenceMonth || getMonthKey(t.date)) === monthKey;
      });

      const totalAmount = cardTxs.reduce((sum, t) => sum + t.amount, 0);
      const limitGoal = card.monthlyLimitGoal || 500; // Meta padrão R$ 500
      const isOverLimit = totalAmount > limitGoal;
      const percentageUsed = limitGoal > 0 ? (totalAmount / limitGoal) * 100 : 0;

      return {
        card,
        monthKey,
        totalAmount,
        limitGoal,
        isOverLimit,
        percentageUsed,
        items: cardTxs.map((t) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          person: t.person,
          date: t.date,
          installmentInfo: t.installmentInfo,
          isDemo: t.isDemo,
        })),
      };
    });
  }, [cards, transactions]);

  // Current Month Calculations & Summaries
  const currentMonthSummary = useMemo<MonthSummary>(() => {
    const monthTxs = transactions.filter(
      (t) => (t.competenceMonth || getMonthKey(t.date)) === selectedMonth
    );

    let recurringIncome = 0;
    let extraordinaryIncome = 0;
    let reimbursementIncome = 0;
    let totalExpense = 0;
    let recurringExpense = 0;
    let extraordinaryExpense = 0;
    let totalInvested = 0;

    const incomeByPerson: Record<Person, number> = { Ricardo: 0, Ellen: 0, Família: 0 };
    const expenseByPerson: Record<Person, number> = { Ricardo: 0, Ellen: 0, Família: 0 };

    monthTxs.forEach((t) => {
      // Transferências internas NÃO são receitas nem despesas
      if (t.type === 'transferencia') {
        return;
      }

      if (t.type === 'receita' || t.type === 'rendimento') {
        const { isSalaryRecurring, isReimbursement } = classifyIncomeCategory(t.category);
        if (isSalaryRecurring || t.isRecurring) {
          recurringIncome += t.amount;
        } else if (isReimbursement) {
          reimbursementIncome += t.amount;
        } else {
          extraordinaryIncome += t.amount;
        }
        incomeByPerson[t.person] += t.amount;
      } else if (t.type === 'despesa') {
        totalExpense += t.amount;
        if (t.isRecurring) {
          recurringExpense += t.amount;
        } else {
          extraordinaryExpense += t.amount;
        }
        expenseByPerson[t.person] += t.amount;
      } else if (t.type === 'investimento') {
        totalInvested += t.amount;
        expenseByPerson[t.person] += t.amount;
      }
    });

    const totalIncome = recurringIncome + extraordinaryIncome + reimbursementIncome;
    const availableBalance = totalIncome - totalExpense - totalInvested;

    // Faturas de Cartão de Ricardo e Ellen
    let ricardoInvoiceTotal = 0;
    let ellenInvoiceTotal = 0;
    cards.forEach((card) => {
      const cardTxs = monthTxs.filter((t) => t.cardId === card.id);
      const cardTotal = cardTxs.reduce((sum, t) => sum + t.amount, 0);
      if (card.person === 'Ricardo') ricardoInvoiceTotal += cardTotal;
      else if (card.person === 'Ellen') ellenInvoiceTotal += cardTotal;
    });

    // Supermercado
    const weeksCount = groceryPlan.totalWeeks || getWeeksInMonth(selectedMonth);
    const ricardoPlanned = groceryPlan.mode === 'opcao_b'
      ? 600
      : (weeksCount === 5 ? 750 : 600);
    const ellenPlanned = 400;
    const groceryPlanned = ricardoPlanned + ellenPlanned;

    const ricardoTransferred = groceryPlan.ricardoWeeks.reduce(
      (sum, w) => sum + (w.completed ? (w.actualAmount || w.plannedAmount || 150) : 0),
      0
    );
    const ellenTransferred = groceryPlan.ellenCompleted
      ? (groceryPlan.ellenActualAmount || 400)
      : 0;
    const groceryTransferred = ricardoTransferred + ellenTransferred;

    const groceryActualSpent = groceryTrips
      .filter((g) => getMonthKey(g.date) === selectedMonth)
      .reduce((sum, g) => sum + g.totalAmount, 0);

    const groceryAvailableBalance = groceryTransferred - groceryActualSpent;

    // Cofrinhos acumulados
    const houseCof = cofrinhos.find((c) => c.type === 'casa');
    const maintCof = cofrinhos.find((c) => c.type === 'manutencao');
    const leisureCof = cofrinhos.find((c) => c.type === 'lazer');
    const rentCof = cofrinhos.find((c) => c.type === 'aluguel_futuro');

    const cofrinhoMonthlyYield = cofrinhos.reduce((sum, c) => sum + (c.monthlyYield || 0), 0);
    const cofrinhoAccumulatedYield = cofrinhos.reduce((sum, c) => sum + (c.accumulatedYield || 0), 0);

    const emergencyTarget = 55200; // 8 meses da renda familiar recorrente (R$ 6.900)
    const emergencyPercentage = Math.min(100, (totalEmergencyFund / emergencyTarget) * 100);

    // Investimentos do mês por pessoa
    const investmentRicardo = investmentContributions
      .filter((inv) => inv.date.startsWith(selectedMonth) && inv.person === 'Ricardo')
      .reduce((sum, inv) => sum + inv.amount, 0) ||
      monthTxs
        .filter((t) => t.type === 'investimento' && t.person === 'Ricardo')
        .reduce((sum, t) => sum + t.amount, 0);

    const investmentEllen = investmentContributions
      .filter((inv) => inv.date.startsWith(selectedMonth) && inv.person === 'Ellen')
      .reduce((sum, inv) => sum + inv.amount, 0) ||
      monthTxs
        .filter((t) => t.type === 'investimento' && t.person === 'Ellen')
        .reduce((sum, t) => sum + t.amount, 0);

    const renoTotal = renovationExpenses.reduce((sum, r) => sum + r.acceptedAmount, 0);
    const renoComp = renovationExpenses.reduce((sum, r) => sum + r.alreadyCompensatedAmount, 0);

    return {
      monthKey: selectedMonth,
      recurringIncome,
      extraordinaryIncome,
      totalIncome,
      reimbursementIncome,
      totalExpense,
      recurringExpense,
      extraordinaryExpense,
      totalInvested,
      availableBalance,
      balance: totalIncome - totalExpense,
      cumulativeBalance: 0,
      emergencyFundCurrent: totalEmergencyFund,
      emergencyFundTarget: emergencyTarget,
      emergencyFundPercentage: emergencyPercentage,
      houseFundAccumulated: houseCof ? houseCof.currentBalance : 0,
      maintenanceFundAccumulated: maintCof ? maintCof.currentBalance : 0,
      leisureFundAccumulated: leisureCof ? leisureCof.currentBalance : 0,
      futureRentAccumulated: rentCof ? rentCof.currentBalance : 0,
      renovationCreditAvailable: renoTotal - renoComp,
      renovationCreditTotal: renoTotal,
      renovationCreditWithdrawn: renoComp,
      investmentRicardo,
      investmentEllen,
      ricardoInvoiceTotal,
      ellenInvoiceTotal,
      groceryGoal: groceryPlanned,
      groceryTotal: groceryActualSpent,
      groceryPlanned,
      groceryTransferred,
      groceryActualSpent,
      groceryAvailableBalance,
      cofrinhoMonthlyYield,
      cofrinhoAccumulatedYield,
      incomeByPerson,
      expenseByPerson,
    };
  }, [
    transactions,
    selectedMonth,
    cards,
    groceryPlan,
    groceryTrips,
    cofrinhos,
    totalEmergencyFund,
    investmentContributions,
    renovationExpenses,
  ]);

  // Compra da Nova Casa & Cenários
  const updateHouseFundSettings = (settings: Partial<HouseFundSettings>) => {
    setHouseFundSettings((prev) => ({ ...prev, ...settings }));
  };

  // Reforma e Futuro Aluguel CRUD
  const addRenovationExpense = (expense: Omit<RenovationExpense, 'id'>) => {
    const newExp: RenovationExpense = {
      ...expense,
      id: 'renov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    };
    setRenovationExpenses((prev) => [newExp, ...prev]);
  };

  const updateRenovationExpense = (id: string, expense: Partial<RenovationExpense>) => {
    setRenovationExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...expense, isDemo: false } : r))
    );
  };

  const deleteRenovationExpense = (id: string) => {
    setRenovationExpenses((prev) => prev.filter((r) => r.id !== id));
  };

  const updateFutureRentSettings = (settings: Partial<FutureRentSettings>) => {
    setFutureRentSettings((prev) => ({ ...prev, ...settings }));
  };

  // Fechamento Mensal
  const toggleClosingChecklistItem = (monthKey: string, itemId: string) => {
    setClosingChecklists((prev) => {
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        const initialChecks = INITIAL_CLOSING_CHECKLISTS[0]?.checkedItems || {};
        return [
          ...prev,
          {
            monthKey,
            isClosed: false,
            checkedItems: {
              ...initialChecks,
              [itemId]: !initialChecks[itemId],
            },
          },
        ];
      }
      return prev.map((c) => {
        if (c.monthKey !== monthKey) return c;
        return {
          ...c,
          checkedItems: {
            ...c.checkedItems,
            [itemId]: !c.checkedItems[itemId],
          },
        };
      });
    });
  };

  const toggleMonthClosed = (monthKey: string) => {
    setClosingChecklists((prev) => {
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        const initialChecks = INITIAL_CLOSING_CHECKLISTS[0]?.checkedItems || {};
        return [
          ...prev,
          {
            monthKey,
            isClosed: true,
            closedAt: new Date().toISOString(),
            checkedItems: initialChecks,
          },
        ];
      }
      return prev.map((c) => {
        if (c.monthKey !== monthKey) return c;
        const nextClosed = !c.isClosed;
        return {
          ...c,
          isClosed: nextClosed,
          closedAt: nextClosed ? new Date().toISOString() : undefined,
        };
      });
    });
  };

  const updateClosingNotes = (monthKey: string, notes: string) => {
    setClosingChecklists((prev) => {
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        const initialChecks = INITIAL_CLOSING_CHECKLISTS[0]?.checkedItems || {};
        return [
          ...prev,
          {
            monthKey,
            isClosed: false,
            notes,
            checkedItems: initialChecks,
          },
        ];
      }
      return prev.map((c) => (c.monthKey === monthKey ? { ...c, notes } : c));
    });
  };

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => [...prev, id]);
  };

  // Cálculos de Reforma & Compensação
  const renovationCreditTotal = useMemo(() => {
    return renovationExpenses.reduce((sum, r) => sum + r.acceptedAmount, 0);
  }, [renovationExpenses]);

  const renovationCreditCompensated = useMemo(() => {
    return renovationExpenses.reduce((sum, r) => sum + r.alreadyCompensatedAmount, 0);
  }, [renovationExpenses]);

  const renovationCreditAvailable = renovationCreditTotal - renovationCreditCompensated;

  // Motor de Alertas e Regras Automáticas
  const alerts: AppAlert[] = useMemo(() => {
    const list: AppAlert[] = [];

    // 1. Faturas de cartão
    const invoiceSummaries = getCardInvoicesForMonth(selectedMonth);
    invoiceSummaries.forEach((inv) => {
      if (inv.totalAmount > inv.limitGoal) {
        list.push({
          id: `alert-invoice-over-${inv.card.id}-${selectedMonth}`,
          type: 'danger',
          category: 'cartao',
          title: `Fatura Excedida: ${inv.card.name} (${inv.card.person})`,
          message: `A fatura de ${inv.card.person} está em R$ ${inv.totalAmount.toFixed(2)}, ultrapassando a meta de R$ ${inv.limitGoal.toFixed(2)} por R$ ${(inv.totalAmount - inv.limitGoal).toFixed(2)}.`,
          actionLabel: 'Ver Cartões',
          actionTab: 'cards',
        });
      } else if (inv.totalAmount >= inv.limitGoal * 0.85) {
        list.push({
          id: `alert-invoice-warn-${inv.card.id}-${selectedMonth}`,
          type: 'warning',
          category: 'cartao',
          title: `Atenção na Fatura: ${inv.card.name} (${inv.card.person})`,
          message: `Fatura atingiu ${inv.percentageUsed.toFixed(0)}% da meta de R$ ${inv.limitGoal.toFixed(2)}. Restam R$ ${(inv.limitGoal - inv.totalAmount).toFixed(2)}.`,
          actionLabel: 'Ver Cartões',
          actionTab: 'cards',
        });
      }
    });

    // 2. Aportes Mensais na Reserva / Investimentos (Meta R$ 500 cada)
    const ricardoAporte = investmentContributions
      .filter((inv) => inv.date.startsWith(selectedMonth) && inv.person === 'Ricardo')
      .reduce((sum, inv) => sum + inv.amount, 0);
    if (ricardoAporte < 500) {
      list.push({
        id: `alert-aporte-ricardo-${selectedMonth}`,
        type: 'warning',
        category: 'reserva',
        title: 'Aporte Mensal Pendente: Ricardo (R$ 500,00)',
        message: `Ricardo aportou R$ ${ricardoAporte.toFixed(2)} de R$ 500,00 previstos neste mês.`,
        actionLabel: 'Ver Metas',
        actionTab: 'goals',
      });
    }

    const ellenAporte = investmentContributions
      .filter((inv) => inv.date.startsWith(selectedMonth) && inv.person === 'Ellen')
      .reduce((sum, inv) => sum + inv.amount, 0);
    if (ellenAporte < 500) {
      list.push({
        id: `alert-aporte-ellen-${selectedMonth}`,
        type: 'warning',
        category: 'reserva',
        title: 'Aporte Mensal Pendente: Ellen (R$ 500,00)',
        message: `Ellen aportou R$ ${ellenAporte.toFixed(2)} de R$ 500,00 previstos neste mês.`,
        actionLabel: 'Ver Metas',
        actionTab: 'goals',
      });
    }

    // 3. Supermercado (Meta R$ 1.000)
    const monthTrips = groceryTrips.filter((g) => g.date.startsWith(selectedMonth));
    const grocerySpent = monthTrips.reduce((sum, g) => sum + g.totalAmount, 0);
    const groceryGoal = groceryPlan.ricardoWeeklyPlanned * groceryPlan.totalWeeks + groceryPlan.ellenMonthlyPlanned;
    if (grocerySpent > groceryGoal) {
      list.push({
        id: `alert-grocery-over-${selectedMonth}`,
        type: 'danger',
        category: 'supermercado',
        title: 'Meta de Supermercado Excedida',
        message: `Total gasto em compras (R$ ${grocerySpent.toFixed(2)}) ultrapassou a meta de R$ ${groceryGoal.toFixed(2)}.`,
        actionLabel: 'Ver Supermercado',
        actionTab: 'grocery',
      });
    }

    // 4. Saldo do Mês Negativo
    const monthTxs = transactions.filter((t) => (t.competenceMonth || getMonthKey(t.date)) === selectedMonth);
    const inc = monthTxs.filter((t) => t.type === 'receita' || t.type === 'rendimento').reduce((sum, t) => sum + t.amount, 0);
    const exp = monthTxs.filter((t) => t.type === 'despesa' || t.type === 'investimento').reduce((sum, t) => sum + t.amount, 0);
    if (inc - exp < 0) {
      list.push({
        id: `alert-negative-balance-${selectedMonth}`,
        type: 'danger',
        category: 'geral',
        title: 'Saldo Mensal Negativo',
        message: `As despesas e aportes superam as receitas deste mês em R$ ${(exp - inc).toFixed(2)}.`,
        actionLabel: 'Ver Painel',
        actionTab: 'dashboard',
      });
    }

    // 5. Reserva de Emergência Concluída vs Redirecionamento
    const currentReserva = totalEmergencyFund;
    const targetReserva = emergencySettings.targetAmount;
    if (currentReserva >= targetReserva) {
      list.push({
        id: 'alert-reserva-concluida',
        type: 'success',
        category: 'reserva',
        title: 'Meta de Reserva de Emergência 100% Concluída!',
        message: `Parabéns! A reserva de 8 meses (R$ ${targetReserva.toLocaleString('pt-BR')}) foi atingida. Os 70% extras e aportes fixos podem ser redirecionados integralmente para a Compra da Nova Casa.`,
        actionLabel: 'Ver Casa Própria',
        actionTab: 'house',
      });
    }

    // 6. Parcelas prestes a terminar
    installmentPurchases
      .filter((inst) => inst.status === 'active' && inst.totalInstallments - inst.currentInstallment <= 2)
      .forEach((inst) => {
        const rem = inst.totalInstallments - inst.currentInstallment + 1;
        list.push({
          id: `alert-parcela-fin-${inst.id}`,
          type: 'info',
          category: 'parcela',
          title: `Parcela Quase Quitada: ${inst.description}`,
          message: `Restam apenas ${rem} parcelas de R$ ${inst.installmentAmount.toFixed(2)} (${inst.person}). Liberará R$ ${inst.installmentAmount.toFixed(2)} no orçamento mensal em breve.`,
          actionLabel: 'Ver Cartões',
          actionTab: 'cards',
        });
      });

    // 7. Créditos de Reforma a Compensar
    if (renovationCreditAvailable > 0) {
      list.push({
        id: 'alert-renov-credit-avail',
        type: 'info',
        category: 'reforma',
        title: `Crédito de Reforma Acumulado: R$ ${renovationCreditAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        message: `Total aceito pelo proprietário para compensação futura no aluguel a partir de Jan/2027.`,
        actionLabel: 'Ver Reforma',
        actionTab: 'renovation',
      });
    }

    return list.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [
    selectedMonth,
    transactions,
    cards,
    investmentContributions,
    groceryTrips,
    groceryPlan,
    totalEmergencyFund,
    emergencySettings,
    installmentPurchases,
    renovationCreditAvailable,
    dismissedAlertIds,
  ]);

  // Exportação Completa Excel (.xlsx)
  const exportExcelFull = () => {
    exportFullWorkbookExcel({
      monthKey: selectedMonth,
      summary: currentMonthSummary,
      transactions,
      cards,
      cofrinhos,
      groceryTrips,
      renovationExpenses,
      futureRent: futureRentSettings,
    });
  };

  // Total Cumulative Balance (all recorded history excluding internal transfers)
  const cumulativeBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'transferencia') return acc;
      if (t.type === 'receita' || t.type === 'rendimento') return acc + t.amount;
      return acc - t.amount;
    }, 0);
  }, [transactions]);

  // Export / Import
  const exportBackupJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      appVersion: '2.1.0',
      transactions,
      cards,
      cofrinhos,
      cofrinhoMovements,
      installmentPurchases,
      groceryTrips,
      groceryPlan,
      shoppingLists,
      stockItems,
      cestaBasicaRecords,
      salarySettings,
      investmentContributions,
      emergencyContributions,
      emergencySettings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestao_familiar_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        setTransactions(parsed.transactions);
      }
      if (parsed.cards && Array.isArray(parsed.cards)) {
        setCards(parsed.cards);
      }
      if (parsed.cofrinhos && Array.isArray(parsed.cofrinhos)) {
        setCofrinhos(parsed.cofrinhos);
      }
      if (parsed.cofrinhoMovements && Array.isArray(parsed.cofrinhoMovements)) {
        setCofrinhoMovements(parsed.cofrinhoMovements);
      }
      if (parsed.installmentPurchases && Array.isArray(parsed.installmentPurchases)) {
        setInstallmentPurchases(parsed.installmentPurchases);
      }
      if (parsed.groceryTrips && Array.isArray(parsed.groceryTrips)) {
        setGroceryTrips(parsed.groceryTrips);
      }
      if (parsed.groceryPlan) {
        setGroceryPlan(parsed.groceryPlan);
      }
      if (parsed.shoppingLists && Array.isArray(parsed.shoppingLists)) {
        setShoppingLists(parsed.shoppingLists);
      }
      if (parsed.stockItems && Array.isArray(parsed.stockItems)) {
        setStockItems(parsed.stockItems);
      }
      if (parsed.cestaBasicaRecords && Array.isArray(parsed.cestaBasicaRecords)) {
        setCestaBasicaRecords(parsed.cestaBasicaRecords);
      }
      if (parsed.salarySettings) {
        setSalarySettings(parsed.salarySettings);
      }
      if (parsed.investmentContributions && Array.isArray(parsed.investmentContributions)) {
        setInvestmentContributions(parsed.investmentContributions);
      }
      if (parsed.emergencyContributions && Array.isArray(parsed.emergencyContributions)) {
        setEmergencyContributions(parsed.emergencyContributions);
      }
      if (parsed.emergencySettings) {
        setEmergencySettings(parsed.emergencySettings);
      }
      return true;
    } catch (e) {
      console.error('Falha ao importar backup JSON:', e);
      return false;
    }
  };

  const exportTransactionsCSV = () => {
    const headers = [
      'ID',
      'Data',
      'Competência',
      'Descrição',
      'Tipo',
      'Categoria',
      'Subcategoria',
      'Responsável',
      'Valor',
      'Recorrente',
      'Status',
      'Método Pagamento',
      'Conta / Cofrinho',
      'Observações',
    ];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.competenceMonth || getMonthKey(t.date),
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.category,
      t.subcategory || '',
      t.person,
      t.amount.toFixed(2).replace('.', ','),
      t.isRecurring ? 'Sim' : 'Não',
      t.paid ? 'Pago' : 'Pendente',
      t.paymentMethod,
      t.accountOrPot || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lancamentos_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportGroceryCSV = () => {
    const headers = ['ID', 'Data', 'Estabelecimento', 'Responsável', 'Valor', 'Método Pagamento', 'Observações'];
    const rows = groceryTrips.map((g) => [
      g.id,
      g.date,
      `"${g.storeName.replace(/"/g, '""')}"`,
      g.person,
      g.totalAmount.toFixed(2).replace('.', ','),
      g.paymentMethod,
      `"${(g.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supermercado_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        transactions,
        cards,
        cofrinhos,
        cofrinhoMovements,
        installmentPurchases,
        groceryTrips,
        groceryPlan,
        shoppingLists,
        stockItems,
        cestaBasicaRecords,
        salarySettings,
        investmentContributions,
        emergencyContributions,
        emergencySettings,
        globalCofrinhoSettings,
        houseFundSettings,
        renovationExpenses,
        futureRentSettings,
        closingChecklists,
        alerts,
        hasDemoData,
        clearDemoData,
        restoreDemoData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionPaid,
        addCard,
        updateCard,
        deleteCard,
        addInstallmentPurchase,
        updateInstallmentPurchase,
        deleteInstallmentPurchase,
        earlyPayInstallment,
        addCofrinho,
        updateCofrinho,
        deleteCofrinho,
        addCofrinhoMovement,
        deleteCofrinhoMovement,
        transferBetweenCofrinhos,
        distributeExtraordinaryIncome,
        updateGlobalCofrinhoSettings,
        applyMonthlyYieldToAllCofrinhos,
        setMonthlyAporteStatus,
        updateHouseFundSettings,
        addRenovationExpense,
        updateRenovationExpense,
        deleteRenovationExpense,
        updateFutureRentSettings,
        toggleClosingChecklistItem,
        toggleMonthClosed,
        updateClosingNotes,
        dismissAlert,
        addGroceryTrip,
        updateGroceryTrip,
        deleteGroceryTrip,
        setGroceryPlanningMode,
        toggleRicardoWeek,
        updateRicardoWeekAmount,
        toggleEllenGrocery,
        updateEllenGroceryAmount,
        groceryMonthlyGoal,
        setGroceryMonthlyGoal,
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
        updateSalarySettings,
        addInvestmentContribution,
        deleteInvestmentContribution,
        addEmergencyContribution,
        deleteEmergencyContribution,
        updateEmergencySettings,
        currentMonthSummary,
        getCardInvoicesForMonth,
        cumulativeBalance,
        totalEmergencyFund,
        renovationCreditTotal,
        renovationCredit: renovationCreditTotal,
        exportBackupJSON,
        importBackupJSON,
        exportTransactionsCSV,
        exportGroceryCSV,
        exportExcelFull,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de um FinanceProvider');
  }
  return context;
};

