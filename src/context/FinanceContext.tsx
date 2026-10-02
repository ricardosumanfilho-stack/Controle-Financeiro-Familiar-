import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
  ActiveTab,
  AutoSaveStatus,
  CardSubscription,
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
  INITIAL_CARD_SUBSCRIPTIONS,
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
import { addMonthsToKey, calculateCardCompetenceMonth, classifyIncomeCategory, getMonthKey, getWeeksInMonth } from '../utils/formatters';
import { calculateMonthlyYieldDetails, calculateAnnualRate } from '../utils/yieldCalculations';
import { exportFullWorkbookExcel } from '../utils/excelExport';
import { generateSmartShoppingListFromStock } from '../utils/stockReplenishment';
import { createCarrefourMasterShoppingList } from '../data/carrefourMasterList';
import {
  isSupabaseConfigured,
  pushLocalDataToSupabase,
  pullDataFromSupabase,
  deleteItemFromSupabase,
  getSupabaseCredentials,
  SUPABASE_STORAGE_KEYS,
} from '../services/supabase';
import {
  VaultSnapshot,
  saveVaultSnapshot,
  getRestorePoints,
  scanForRecoverableData,
} from '../utils/vaultPersistence';

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
    isCardSubscription?: boolean;
    subscriptionId?: string;
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
  cardSubscriptions: CardSubscription[];
  cofrinhos: Cofrinho[];
  cofrinhoMovements: CofrinhoMovement[];
  installmentPurchases: InstallmentPurchase[];
  groceryTrips: GroceryTrip[];
  groceryPlan: GroceryMonthPlan;
  shoppingLists: ShoppingList[];
  stockItems: StockItem[];
  cestaBasicaRecords: CestaBasicaRecord[];
  salarySettings: SalarySettings;
  person1Name: string;
  person2Name: string;
  customCategories: {
    despesa: string[];
    receita: string[];
  };
  addCustomCategory: (type: 'despesa' | 'receita', category: string) => void;
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

  // Cards & Installments & Subscriptions CRUD
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  addInstallmentPurchase: (purchase: Omit<InstallmentPurchase, 'id'>) => void;
  updateInstallmentPurchase: (id: string, purchase: Partial<InstallmentPurchase>) => void;
  deleteInstallmentPurchase: (id: string) => void;
  deleteInstallmentFromMonth: (purchaseId: string, fromCurrentInstallment: number) => void;
  earlyPayInstallment: (id: string, count?: number) => void;

  // Assinaturas Recorrentes no Cartão
  addCardSubscription: (subscription: Omit<CardSubscription, 'id'>) => void;
  updateCardSubscription: (id: string, subscription: Partial<CardSubscription>) => void;
  deleteCardSubscription: (id: string) => void;

  // Cofrinhos CRUD & Gestão Estrutural
  addCofrinho: (cofrinho: Omit<Cofrinho, 'id'>) => void;
  updateCofrinho: (id: string, cofrinho: Partial<Cofrinho>) => void;
  adjustCofrinhoBalance: (id: string, newCurrentBalance: number, newInitialBalance?: number) => void;
  recalculateCofrinhoBalancesFromMovements: () => void;
  resetAllCofrinhosToZero: () => void;
  deleteCofrinho: (id: string) => void;
  addCofrinhoMovement: (
    movementOrId: string | Omit<CofrinhoMovement, 'id'>,
    optionalMovement?: Omit<CofrinhoMovement, 'id' | 'cofrinhoId'>
  ) => CofrinhoMovement;
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
  uncheckAllClosingChecklistItems: (monthKey: string) => void;
  checkAllClosingChecklistItems: (monthKey: string) => void;
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
  toggleEllenWeek: (weekIndex: number) => void;
  updateEllenWeekAmount: (weekIndex: number, amount: number) => void;
  toggleEllenGrocery: () => void;
  updateEllenGroceryAmount: (amount: number) => void;
  groceryMonthlyGoal: number;
  setGroceryMonthlyGoal: (goal: number) => void;
  updateGroceryPlanSettings: (settings: Partial<GroceryMonthPlan>) => void;

  // Shopping Lists CRUD & Conversions
  addShoppingList: (list: Omit<ShoppingList, 'id'>) => void;
  updateShoppingList: (id: string, list: Partial<ShoppingList>) => void;
  deleteShoppingList: (id: string) => void;
  copyShoppingList: (id: string) => void;
  generateAutoShoppingListFromStock: () => void;
  convertShoppingListToTrip: (
    listId: string,
    storeName: string,
    person: Person,
    paymentMethod: PaymentMethod,
    totalAmount?: number,
    tripType?: 'semanal' | 'mensal' | 'extraordinaria',
    weekNumber?: number,
    savingsAmount?: number,
    customItems?: ShoppingListItem[]
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
  ricardoEmergencyFund: number;
  ellenEmergencyFund: number;
  renovationCreditTotal: number;
  renovationCredit: number;

  // Theme
  theme: 'light' | 'dark';
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Auto-save, Vault & Cloud Sync status
  saveStatus: AutoSaveStatus;
  lastSavedTime: string | null;
  lastSavedTimestamp: number | null;
  forceSaveNow: () => void;
  purgeWeekOldData: () => void;

  // Vault Permanente & Pontos de Restauração
  restorePoints: VaultSnapshot[];
  recoverableSnapshot: VaultSnapshot | null;
  recoveryBannerDismissed: boolean;
  restoreFromSnapshot: (snap: VaultSnapshot) => boolean;
  createManualRestorePoint: (label?: string) => Promise<boolean>;
  dismissRecoveryBanner: () => void;

  // Supabase Timer-based Sync & GitHub Integration
  isSupabaseConnected: boolean;
  supabaseAutoSyncEnabled: boolean;
  setSupabaseAutoSyncEnabled: (enabled: boolean) => void;
  supabaseSyncInterval: number; // Intervalo em segundos (ex: 30, 60, 120, 300)
  setSupabaseSyncInterval: (seconds: number) => void;
  supabaseNextSyncSeconds: number;
  supabaseLastSyncTime: string | null;
  supabaseSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  supabaseSyncError: string | null;
  syncWithSupabase: (direction?: 'both' | 'pull' | 'push') => Promise<{ success: boolean; message: string }>;
  reconnectSupabase: () => void;

  // Export & Import
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => boolean;
  exportTransactionsCSV: () => void;
  exportGroceryCSV: () => void;
  exportExcelFull: () => void;
}

export const STORAGE_KEYS = {
  THEME: 'fin_family_theme',
  TRANSACTIONS: 'fin_family_transactions_v2',
  CARDS: 'fin_family_cards_v2',
  CARD_SUBSCRIPTIONS: 'fin_family_card_subscriptions_v2',
  COFRINHOS: 'fin_family_cofrinhos_v2',
  COFRINHO_MOVEMENTS: 'fin_family_cof_movements_v2',
  INSTALLMENTS: 'fin_family_installments_v2',
  GROCERY: 'fin_family_grocery_v2',
  GROCERY_PLAN: 'fin_family_grocery_plan_v2',
  GROCERY_PLANS_BY_MONTH: 'fin_family_grocery_plans_by_month_v2',
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
  CUSTOM_CATEGORIES: 'fin_family_custom_categories_v2',
  ACTIVE_TAB: 'fin_family_active_tab_v2',
  LAST_SAVED_TIMESTAMP: 'fin_family_last_saved_timestamp_v2',
};

export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

export const KEYS_TO_PURGE_ON_EXPIRY = [
  STORAGE_KEYS.TRANSACTIONS,
  STORAGE_KEYS.CARDS,
  STORAGE_KEYS.CARD_SUBSCRIPTIONS,
  STORAGE_KEYS.COFRINHOS,
  STORAGE_KEYS.COFRINHO_MOVEMENTS,
  STORAGE_KEYS.INSTALLMENTS,
  STORAGE_KEYS.GROCERY,
  STORAGE_KEYS.GROCERY_PLAN,
  STORAGE_KEYS.GROCERY_PLANS_BY_MONTH,
  STORAGE_KEYS.SHOPPING_LISTS,
  STORAGE_KEYS.STOCK_ITEMS,
  STORAGE_KEYS.CESTA_BASICA,
  STORAGE_KEYS.SALARY_SETTINGS,
  STORAGE_KEYS.INVESTMENTS,
  STORAGE_KEYS.EMERGENCY,
  STORAGE_KEYS.EMERGENCY_SETTINGS,
  STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS,
  STORAGE_KEYS.HOUSE_FUND_SETTINGS,
  STORAGE_KEYS.RENOVATION_EXPENSES,
  STORAGE_KEYS.FUTURE_RENT_SETTINGS,
  STORAGE_KEYS.CLOSING_CHECKLISTS,
  STORAGE_KEYS.DISMISSED_ALERTS,
  STORAGE_KEYS.CUSTOM_CATEGORIES,
  STORAGE_KEYS.SELECTED_MONTH,
  STORAGE_KEYS.ACTIVE_TAB,
];

// POLÍTICA DE SEGURANÇA: Dados financeiros do usuário NUNCA são apagados automaticamente.
// Desativado permanentemente qualquer expiração por decurso de tempo.
export const checkAndPurgeExpiredSavedData = (): boolean => {
  return false;
};

export function safeStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) return defaultValue;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch {
    return defaultValue;
  }
}

export const safeStorageSet = (key: string, value: any) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    if (key !== STORAGE_KEYS.LAST_SAVED_TIMESTAMP) {
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED_TIMESTAMP, Date.now().toString());
    }
  } catch (err) {
    console.error(`Erro ao salvar automaticamente no localStorage (${key}):`, err);
  }
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) as ActiveTab;
      if (
        saved &&
        [
          'dashboard',
          'transactions',
          'cards',
          'grocery',
          'budget',
          'goals',
          'house',
          'renovation',
          'closing',
          'alerts',
          'settings',
        ].includes(saved)
      ) {
        return saved;
      }
    } catch {}
    return 'dashboard';
  });

  const setActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab);
    safeStorageSet(STORAGE_KEYS.ACTIVE_TAB, tab);
  }, []);

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (e) {
      console.error('Failed to sync theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const isDarkMode = theme === 'dark';

  const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
    return saved || '2026-08';
  });

  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(month);
    safeStorageSet(STORAGE_KEYS.SELECTED_MONTH, month);
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!saved) return INITIAL_TRANSACTIONS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        return parsed.map((t, idx) => {
          if (!t.id || seen.has(t.id)) {
            const uniqueId = `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            seen.add(uniqueId);
            return { ...t, id: uniqueId };
          }
          seen.add(t.id);
          return t;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (!saved) return INITIAL_CARDS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        return parsed.map((c, idx) => {
          if (!c.id || seen.has(c.id)) {
            const uniqueId = `card-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            seen.add(uniqueId);
            return { ...c, id: uniqueId };
          }
          seen.add(c.id);
          return c;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CARDS;
  });

  const [cardSubscriptions, setCardSubscriptions] = useState<CardSubscription[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARD_SUBSCRIPTIONS);
    if (!saved) return INITIAL_CARD_SUBSCRIPTIONS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        return parsed.map((s, idx) => {
          const subName = s.name || s.description || 'Assinatura';
          const subDesc = s.description || s.name || 'Assinatura';
          if (!s.id || seen.has(s.id)) {
            const uniqueId = `sub-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            seen.add(uniqueId);
            return { ...s, id: uniqueId, name: subName, description: subDesc };
          }
          seen.add(s.id);
          return { ...s, name: subName, description: subDesc };
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CARD_SUBSCRIPTIONS;
  });

  const [cofrinhos, setCofrinhos] = useState<Cofrinho[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COFRINHOS);
    if (!saved) return INITIAL_COFRINHOS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Garantir que a Reserva de Emergência da Ellen exista e que a do Ricardo esteja personalizada
        const hasEllenReserva = parsed.some((c) => c.id === 'cof-reserva-ellen');
        if (!hasEllenReserva) {
          const ellenReserva = INITIAL_COFRINHOS.find((c) => c.id === 'cof-reserva-ellen');
          if (ellenReserva) {
            const updated = parsed.map((c: Cofrinho) => {
              if (c.id === 'cof-reserva' && (c.name.includes('Ricardo & Ellen') || c.person === 'Família')) {
                return {
                  ...c,
                  name: 'Reserva de Emergência - Ricardo',
                  person: 'Ricardo',
                  targetAmount: c.targetAmount === 55200 ? 42400 : c.targetAmount,
                };
              }
              return c;
            });
            return [...updated, ellenReserva];
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COFRINHOS;
  });

  const [cofrinhoMovements, setCofrinhoMovements] = useState<CofrinhoMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COFRINHO_MOVEMENTS);
    if (!saved) return INITIAL_COFRINHO_MOVEMENTS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COFRINHO_MOVEMENTS;
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

  const [groceryPlansByMonth, setGroceryPlansByMonth] = useState<Record<string, GroceryMonthPlan>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch {}
    const single = localStorage.getItem(STORAGE_KEYS.GROCERY_PLAN);
    if (single) {
      try {
        const parsedSingle = JSON.parse(single);
        if (parsedSingle?.monthKey) {
          return { [parsedSingle.monthKey]: parsedSingle };
        }
      } catch {}
    }
    return { '2026-08': INITIAL_GROCERY_PLAN };
  });

  const [groceryPlan, setGroceryPlan] = useState<GroceryMonthPlan>(() => {
    const savedMonth = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH) || '2026-08';
    try {
      const savedMap = localStorage.getItem(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH);
      if (savedMap) {
        const parsedMap = JSON.parse(savedMap);
        if (parsedMap[savedMonth]) return parsedMap[savedMonth];
      }
      const single = localStorage.getItem(STORAGE_KEYS.GROCERY_PLAN);
      if (single) {
        const parsed = JSON.parse(single);
        if (parsed?.monthKey === savedMonth) return parsed;
      }
    } catch {}
    return INITIAL_GROCERY_PLAN;
  });

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_LISTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SHOPPING_LISTS;
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

  const [customCategories, setCustomCategories] = useState<{ despesa: string[]; receita: string[] }>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    return saved ? JSON.parse(saved) : { despesa: [], receita: [] };
  });

  const addCustomCategory = (type: 'despesa' | 'receita', category: string) => {
    const clean = category.trim();
    if (!clean) return;
    setCustomCategories((prev) => {
      const list = prev[type] || [];
      if (list.includes(clean)) return prev;
      const updated = { ...prev, [type]: [...list, clean] };
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(updated));
      return updated;
    });
  };

  const person1Name = salarySettings.person1Name || 'Ricardo';
  const person2Name = salarySettings.person2Name || 'Ellen';

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

  // Auto-save & cloud sync state
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('saved');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_SAVED_TIMESTAMP);
      if (raw) {
        const parsed = Number(raw);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED_TIMESTAMP, now.toString());
    } catch {}
    return now;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_SAVED_TIMESTAMP);
      if (raw) {
        const parsed = Number(raw);
        if (!isNaN(parsed) && parsed > 0) {
          const d = new Date(parsed);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `${day}/${month} ${time}`;
        }
      }
    } catch {}
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const [recoverableSnapshot, setRecoverableSnapshot] = useState<VaultSnapshot | null>(null);
  const [restorePoints, setRestorePoints] = useState<VaultSnapshot[]>([]);
  const [recoveryBannerDismissed, setRecoveryBannerDismissed] = useState(false);

  const dismissRecoveryBanner = useCallback(() => {
    setRecoveryBannerDismissed(true);
  }, []);

  const notifySaved = useCallback((isCloud = false) => {
    const now = Date.now();
    setSaveStatus(isCloud ? 'synced_cloud' : 'saved');
    setLastSavedTimestamp(now);
    const d = new Date(now);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(`${day}/${month} ${time}`);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED_TIMESTAMP, now.toString());
    } catch {}
  }, []);

  // Refs to guarantee 100% synchronous data flushing before unload
  const activeTabRef = useRef(activeTab);
  const selectedMonthRef = useRef(selectedMonth);
  const transactionsRef = useRef(transactions);
  const cardsRef = useRef(cards);
  const cardSubscriptionsRef = useRef(cardSubscriptions);
  const cofrinhosRef = useRef(cofrinhos);
  const cofrinhoMovementsRef = useRef(cofrinhoMovements);
  const installmentPurchasesRef = useRef(installmentPurchases);
  const groceryTripsRef = useRef(groceryTrips);
  const groceryPlanRef = useRef(groceryPlan);
  const groceryPlansByMonthRef = useRef(groceryPlansByMonth);
  const shoppingListsRef = useRef(shoppingLists);
  const stockItemsRef = useRef(stockItems);
  const cestaBasicaRecordsRef = useRef(cestaBasicaRecords);
  const salarySettingsRef = useRef(salarySettings);
  const investmentContributionsRef = useRef(investmentContributions);
  const emergencyContributionsRef = useRef(emergencyContributions);
  const emergencySettingsRef = useRef(emergencySettings);
  const globalCofrinhoSettingsRef = useRef(globalCofrinhoSettings);
  const houseFundSettingsRef = useRef(houseFundSettings);
  const renovationExpensesRef = useRef(renovationExpenses);
  const futureRentSettingsRef = useRef(futureRentSettings);
  const closingChecklistsRef = useRef(closingChecklists);
  const dismissedAlertIdsRef = useRef(dismissedAlertIds);
  const customCategoriesRef = useRef(customCategories);

  // Keep refs in sync
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { selectedMonthRef.current = selectedMonth; }, [selectedMonth]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);
  useEffect(() => { cardSubscriptionsRef.current = cardSubscriptions; }, [cardSubscriptions]);
  useEffect(() => { cofrinhosRef.current = cofrinhos; }, [cofrinhos]);
  useEffect(() => { cofrinhoMovementsRef.current = cofrinhoMovements; }, [cofrinhoMovements]);
  useEffect(() => { installmentPurchasesRef.current = installmentPurchases; }, [installmentPurchases]);
  useEffect(() => { groceryTripsRef.current = groceryTrips; }, [groceryTrips]);
  useEffect(() => { groceryPlanRef.current = groceryPlan; }, [groceryPlan]);
  useEffect(() => { groceryPlansByMonthRef.current = groceryPlansByMonth; }, [groceryPlansByMonth]);
  useEffect(() => { shoppingListsRef.current = shoppingLists; }, [shoppingLists]);
  useEffect(() => { stockItemsRef.current = stockItems; }, [stockItems]);
  useEffect(() => { cestaBasicaRecordsRef.current = cestaBasicaRecords; }, [cestaBasicaRecords]);
  useEffect(() => { salarySettingsRef.current = salarySettings; }, [salarySettings]);
  useEffect(() => { investmentContributionsRef.current = investmentContributions; }, [investmentContributions]);
  useEffect(() => { emergencyContributionsRef.current = emergencyContributions; }, [emergencyContributions]);
  useEffect(() => { emergencySettingsRef.current = emergencySettings; }, [emergencySettings]);
  useEffect(() => { globalCofrinhoSettingsRef.current = globalCofrinhoSettings; }, [globalCofrinhoSettings]);
  useEffect(() => { houseFundSettingsRef.current = houseFundSettings; }, [houseFundSettings]);
  useEffect(() => { renovationExpensesRef.current = renovationExpenses; }, [renovationExpenses]);
  useEffect(() => { futureRentSettingsRef.current = futureRentSettings; }, [futureRentSettings]);
  useEffect(() => { closingChecklistsRef.current = closingChecklists; }, [closingChecklists]);
  useEffect(() => { dismissedAlertIdsRef.current = dismissedAlertIds; }, [dismissedAlertIds]);
  useEffect(() => { customCategoriesRef.current = customCategories; }, [customCategories]);

  // Synchronous flush before page unload or reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      safeStorageSet(STORAGE_KEYS.ACTIVE_TAB, activeTabRef.current);
      safeStorageSet(STORAGE_KEYS.SELECTED_MONTH, selectedMonthRef.current);
      safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
      safeStorageSet(STORAGE_KEYS.CARDS, cardsRef.current);
      safeStorageSet(STORAGE_KEYS.CARD_SUBSCRIPTIONS, cardSubscriptionsRef.current);
      safeStorageSet(STORAGE_KEYS.COFRINHOS, cofrinhosRef.current);
      safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, cofrinhoMovementsRef.current);
      safeStorageSet(STORAGE_KEYS.INSTALLMENTS, installmentPurchasesRef.current);
      safeStorageSet(STORAGE_KEYS.GROCERY, groceryTripsRef.current);
      safeStorageSet(STORAGE_KEYS.GROCERY_PLAN, groceryPlanRef.current);
      safeStorageSet(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH, groceryPlansByMonthRef.current);
      safeStorageSet(STORAGE_KEYS.SHOPPING_LISTS, shoppingListsRef.current);
      safeStorageSet(STORAGE_KEYS.STOCK_ITEMS, stockItemsRef.current);
      safeStorageSet(STORAGE_KEYS.CESTA_BASICA, cestaBasicaRecordsRef.current);
      safeStorageSet(STORAGE_KEYS.SALARY_SETTINGS, salarySettingsRef.current);
      safeStorageSet(STORAGE_KEYS.INVESTMENTS, investmentContributionsRef.current);
      safeStorageSet(STORAGE_KEYS.EMERGENCY, emergencyContributionsRef.current);
      safeStorageSet(STORAGE_KEYS.EMERGENCY_SETTINGS, emergencySettingsRef.current);
      safeStorageSet(STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS, globalCofrinhoSettingsRef.current);
      safeStorageSet(STORAGE_KEYS.HOUSE_FUND_SETTINGS, houseFundSettingsRef.current);
      safeStorageSet(STORAGE_KEYS.RENOVATION_EXPENSES, renovationExpensesRef.current);
      safeStorageSet(STORAGE_KEYS.FUTURE_RENT_SETTINGS, futureRentSettingsRef.current);
      safeStorageSet(STORAGE_KEYS.CLOSING_CHECKLISTS, closingChecklistsRef.current);
      safeStorageSet(STORAGE_KEYS.DISMISSED_ALERTS, dismissedAlertIdsRef.current);
      safeStorageSet(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategoriesRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const forceSaveNow = useCallback(() => {
    setSaveStatus('saving');
    safeStorageSet(STORAGE_KEYS.ACTIVE_TAB, activeTabRef.current);
    safeStorageSet(STORAGE_KEYS.SELECTED_MONTH, selectedMonthRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
    safeStorageSet(STORAGE_KEYS.CARDS, cardsRef.current);
    safeStorageSet(STORAGE_KEYS.CARD_SUBSCRIPTIONS, cardSubscriptionsRef.current);
    safeStorageSet(STORAGE_KEYS.COFRINHOS, cofrinhosRef.current);
    safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, cofrinhoMovementsRef.current);
    safeStorageSet(STORAGE_KEYS.INSTALLMENTS, installmentPurchasesRef.current);
    safeStorageSet(STORAGE_KEYS.GROCERY, groceryTripsRef.current);
    safeStorageSet(STORAGE_KEYS.GROCERY_PLAN, groceryPlanRef.current);
    safeStorageSet(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH, groceryPlansByMonthRef.current);
    safeStorageSet(STORAGE_KEYS.SHOPPING_LISTS, shoppingListsRef.current);
    safeStorageSet(STORAGE_KEYS.STOCK_ITEMS, stockItemsRef.current);
    safeStorageSet(STORAGE_KEYS.CESTA_BASICA, cestaBasicaRecordsRef.current);
    safeStorageSet(STORAGE_KEYS.SALARY_SETTINGS, salarySettingsRef.current);
    safeStorageSet(STORAGE_KEYS.INVESTMENTS, investmentContributionsRef.current);
    safeStorageSet(STORAGE_KEYS.EMERGENCY, emergencyContributionsRef.current);
    safeStorageSet(STORAGE_KEYS.EMERGENCY_SETTINGS, emergencySettingsRef.current);
    safeStorageSet(STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS, globalCofrinhoSettingsRef.current);
    safeStorageSet(STORAGE_KEYS.HOUSE_FUND_SETTINGS, houseFundSettingsRef.current);
    safeStorageSet(STORAGE_KEYS.RENOVATION_EXPENSES, renovationExpensesRef.current);
    safeStorageSet(STORAGE_KEYS.FUTURE_RENT_SETTINGS, futureRentSettingsRef.current);
    safeStorageSet(STORAGE_KEYS.CLOSING_CHECKLISTS, closingChecklistsRef.current);
    safeStorageSet(STORAGE_KEYS.DISMISSED_ALERTS, dismissedAlertIdsRef.current);
    safeStorageSet(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategoriesRef.current);

    // Salva simultaneamente no cofre permanente (IndexedDB + espelho redundante)
    saveVaultSnapshot(
      {
        transactions: transactionsRef.current,
        cards: cardsRef.current,
        cardSubscriptions: cardSubscriptionsRef.current,
        cofrinhos: cofrinhosRef.current,
        cofrinhoMovements: cofrinhoMovementsRef.current,
        installmentPurchases: installmentPurchasesRef.current,
        groceryTrips: groceryTripsRef.current,
        groceryPlan: groceryPlanRef.current,
        groceryPlansByMonth: groceryPlansByMonthRef.current,
        shoppingLists: shoppingListsRef.current,
        stockItems: stockItemsRef.current,
        cestaBasicaRecords: cestaBasicaRecordsRef.current,
        salarySettings: salarySettingsRef.current,
        investmentContributions: investmentContributionsRef.current,
        emergencyContributions: emergencyContributionsRef.current,
        emergencySettings: emergencySettingsRef.current,
        globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
        houseFundSettings: houseFundSettingsRef.current,
        renovationExpenses: renovationExpensesRef.current,
        futureRentSettings: futureRentSettingsRef.current,
        closingChecklists: closingChecklistsRef.current,
        dismissedAlertIds: dismissedAlertIdsRef.current,
        customCategories: customCategoriesRef.current,
      },
      'Salvamento Manual'
    );

    notifySaved(isSupabaseConfigured());
  }, [notifySaved]);

  const createManualRestorePoint = useCallback(async (label?: string) => {
    const success = await saveVaultSnapshot(
      {
        transactions: transactionsRef.current,
        cards: cardsRef.current,
        cardSubscriptions: cardSubscriptionsRef.current,
        cofrinhos: cofrinhosRef.current,
        cofrinhoMovements: cofrinhoMovementsRef.current,
        installmentPurchases: installmentPurchasesRef.current,
        groceryTrips: groceryTripsRef.current,
        groceryPlan: groceryPlanRef.current,
        groceryPlansByMonth: groceryPlansByMonthRef.current,
        shoppingLists: shoppingListsRef.current,
        stockItems: stockItemsRef.current,
        cestaBasicaRecords: cestaBasicaRecordsRef.current,
        salarySettings: salarySettingsRef.current,
        investmentContributions: investmentContributionsRef.current,
        emergencyContributions: emergencyContributionsRef.current,
        emergencySettings: emergencySettingsRef.current,
        globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
        houseFundSettings: houseFundSettingsRef.current,
        renovationExpenses: renovationExpensesRef.current,
        futureRentSettings: futureRentSettingsRef.current,
        closingChecklists: closingChecklistsRef.current,
        dismissedAlertIds: dismissedAlertIdsRef.current,
        customCategories: customCategoriesRef.current,
      },
      label || 'Ponto Manual Criado pelo Usuário'
    );
    const updated = await getRestorePoints();
    setRestorePoints(updated);
    return success;
  }, []);

  const purgeWeekOldData = useCallback(() => {
    // Antes de qualquer limpeza manual, salva um ponto de segurança no cofre permanente
    saveVaultSnapshot(
      {
        transactions: transactionsRef.current,
        cards: cardsRef.current,
        cardSubscriptions: cardSubscriptionsRef.current,
        cofrinhos: cofrinhosRef.current,
        cofrinhoMovements: cofrinhoMovementsRef.current,
        installmentPurchases: installmentPurchasesRef.current,
        groceryTrips: groceryTripsRef.current,
        groceryPlan: groceryPlanRef.current,
        groceryPlansByMonth: groceryPlansByMonthRef.current,
        shoppingLists: shoppingListsRef.current,
        stockItems: stockItemsRef.current,
        cestaBasicaRecords: cestaBasicaRecordsRef.current,
        salarySettings: salarySettingsRef.current,
        investmentContributions: investmentContributionsRef.current,
        emergencyContributions: emergencyContributionsRef.current,
        emergencySettings: emergencySettingsRef.current,
        globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
        houseFundSettings: houseFundSettingsRef.current,
        renovationExpenses: renovationExpensesRef.current,
        futureRentSettings: futureRentSettingsRef.current,
        closingChecklists: closingChecklistsRef.current,
        dismissedAlertIds: dismissedAlertIdsRef.current,
        customCategories: customCategoriesRef.current,
      },
      'Backup de Segurança Pré-Limpeza'
    );

    KEYS_TO_PURGE_ON_EXPIRY.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED_TIMESTAMP, now.toString());
    } catch {}

    setTransactions([]);
    setCards(INITIAL_CARDS);
    setCardSubscriptions(INITIAL_CARD_SUBSCRIPTIONS);
    setCofrinhos(INITIAL_COFRINHOS);
    setCofrinhoMovements([]);
    setInstallmentPurchases([]);
    setGroceryTrips([]);
    setGroceryPlan(INITIAL_GROCERY_PLAN);
    setGroceryPlansByMonth({ '2026-08': INITIAL_GROCERY_PLAN });
    setShoppingLists([]);
    setStockItems(INITIAL_STOCK_ITEMS);
    setCestaBasicaRecords([]);
    setSalarySettings(INITIAL_SALARY_SETTINGS);
    setInvestmentContributions([]);
    setEmergencyContributions([]);
    setEmergencySettings(INITIAL_EMERGENCY_SETTINGS);
    setGlobalCofrinhoSettings(INITIAL_GLOBAL_COFRINHO_SETTINGS);
    setHouseFundSettings(INITIAL_HOUSE_FUND_SETTINGS);
    setRenovationExpenses([]);
    setFutureRentSettings(INITIAL_FUTURE_RENT_SETTINGS);
    setClosingChecklists([]);
    setDismissedAlertIds([]);
    setCustomCategories([]);
    setSelectedMonthState('2026-08');
    setActiveTabState('dashboard');

    setLastSavedTimestamp(now);
    notifySaved(false);
  }, [notifySaved]);

  // Escaneia pontos de recuperação no cofre permanente no carregamento
  useEffect(() => {
    const checkRecovery = async () => {
      try {
        const points = await getRestorePoints();
        setRestorePoints(points);

        const recoverable = await scanForRecoverableData();
        if (recoverable && recoverable.data) {
          const snapTxCount =
            recoverable.transactionsCount ||
            (Array.isArray(recoverable.data.transactions) ? recoverable.data.transactions.length : 0);
          const currentTxCount = transactionsRef.current.length;
          // Se o backup tem dados e difere do estado atual, disponibiliza aviso de recuperação
          if (snapTxCount > 0 && snapTxCount !== currentTxCount) {
            setRecoverableSnapshot(recoverable);
          }
        }
      } catch (e) {
        console.warn('[FinanceContext] Erro ao escanear pontos de recuperação:', e);
      }
    };
    checkRecovery();
  }, []);

  // Salva snapshots de segurança no cofre perpétuo (IndexedDB + LocalStorage) a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (transactionsRef.current.length > 0 || cardsRef.current.length > 0) {
        saveVaultSnapshot({
          transactions: transactionsRef.current,
          cards: cardsRef.current,
          cardSubscriptions: cardSubscriptionsRef.current,
          cofrinhos: cofrinhosRef.current,
          cofrinhoMovements: cofrinhoMovementsRef.current,
          installmentPurchases: installmentPurchasesRef.current,
          groceryTrips: groceryTripsRef.current,
          groceryPlan: groceryPlanRef.current,
          groceryPlansByMonth: groceryPlansByMonthRef.current,
          shoppingLists: shoppingListsRef.current,
          stockItems: stockItemsRef.current,
          cestaBasicaRecords: cestaBasicaRecordsRef.current,
          salarySettings: salarySettingsRef.current,
          investmentContributions: investmentContributionsRef.current,
          emergencyContributions: emergencyContributionsRef.current,
          emergencySettings: emergencySettingsRef.current,
          globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
          houseFundSettings: houseFundSettingsRef.current,
          renovationExpenses: renovationExpensesRef.current,
          futureRentSettings: futureRentSettingsRef.current,
          closingChecklists: closingChecklistsRef.current,
          dismissedAlertIds: dismissedAlertIdsRef.current,
          customCategories: customCategoriesRef.current,
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.SELECTED_MONTH, selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CARDS, cards);
  }, [cards]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CARD_SUBSCRIPTIONS, cardSubscriptions);
  }, [cardSubscriptions]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.COFRINHOS, cofrinhos);
  }, [cofrinhos]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, cofrinhoMovements);
  }, [cofrinhoMovements]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.INSTALLMENTS, installmentPurchases);
  }, [installmentPurchases]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.GROCERY, groceryTrips);
  }, [groceryTrips]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.GROCERY_PLAN, groceryPlan);
    if (groceryPlan.monthKey) {
      setGroceryPlansByMonth((prev) => {
        const updated = { ...prev, [groceryPlan.monthKey]: groceryPlan };
        safeStorageSet(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH, updated);
        return updated;
      });
    }
  }, [groceryPlan]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.SHOPPING_LISTS, shoppingLists);
  }, [shoppingLists]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.STOCK_ITEMS, stockItems);
  }, [stockItems]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CESTA_BASICA, cestaBasicaRecords);
  }, [cestaBasicaRecords]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.SALARY_SETTINGS, salarySettings);
  }, [salarySettings]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.INVESTMENTS, investmentContributions);
  }, [investmentContributions]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.EMERGENCY, emergencyContributions);
  }, [emergencyContributions]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.EMERGENCY_SETTINGS, emergencySettings);
  }, [emergencySettings]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS, globalCofrinhoSettings);
  }, [globalCofrinhoSettings]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.HOUSE_FUND_SETTINGS, houseFundSettings);
  }, [houseFundSettings]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.RENOVATION_EXPENSES, renovationExpenses);
  }, [renovationExpenses]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.FUTURE_RENT_SETTINGS, futureRentSettings);
  }, [futureRentSettings]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CLOSING_CHECKLISTS, closingChecklists);
  }, [closingChecklists]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.DISMISSED_ALERTS, dismissedAlertIds);
  }, [dismissedAlertIds]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategories);
  }, [customCategories]);

  // Adjust grocery plan whenever selectedMonth changes
  useEffect(() => {
    const weeksCount = getWeeksInMonth(selectedMonth);
    const existingPlan = groceryPlansByMonth[selectedMonth];
    if (existingPlan) {
      if (groceryPlan.monthKey !== selectedMonth) {
        setGroceryPlan(existingPlan);
      }
      return;
    }

    const isOptionB = groceryPlan.mode === 'opcao_b';
    const weeklyAmount = isOptionB && weeksCount === 5 ? 120 : 150;
    const ellenWeeklyAmount = Math.round((groceryPlan.ellenMonthlyPlanned || 400) / weeksCount);

    const weeks = Array.from({ length: weeksCount }, (_, idx) => ({
      weekIndex: idx + 1,
      weekLabel: `Semana ${idx + 1}`,
      plannedAmount: weeklyAmount,
      actualAmount: weeklyAmount,
      completed: false,
    }));

    const ellenWeeks = Array.from({ length: weeksCount }, (_, idx) => ({
      weekIndex: idx + 1,
      weekLabel: `Semana ${idx + 1}`,
      plannedAmount: ellenWeeklyAmount,
      actualAmount: ellenWeeklyAmount,
      completed: false,
    }));

    const newMonthPlan: GroceryMonthPlan = {
      monthKey: selectedMonth,
      mode: groceryPlan.mode || 'opcao_a',
      totalWeeks: weeksCount,
      ricardoTotalPlanned: weeklyAmount * weeksCount,
      ricardoWeeklyPlanned: weeklyAmount,
      ricardoWeeks: weeks,
      ellenPlanningType: groceryPlan.ellenPlanningType || 'semanal',
      ellenMonthlyPlanned: groceryPlan.ellenMonthlyPlanned || 400,
      ellenWeeklyPlanned: ellenWeeklyAmount,
      ellenActualAmount: 0,
      ellenCompleted: false,
      ellenWeeks,
      carryOverEnabled: groceryPlan.carryOverEnabled ?? true,
      ellenCarryOverEnabled: groceryPlan.ellenCarryOverEnabled ?? true,
    };

    setGroceryPlan(newMonthPlan);
    setGroceryPlansByMonth((prev) => {
      const updated = { ...prev, [selectedMonth]: newMonthPlan };
      safeStorageSet(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH, updated);
      return updated;
    });
  }, [selectedMonth]);

  // Supabase State & Timer Sync Configurations
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseAutoSyncEnabled, setSupabaseAutoSyncEnabledState] = useState<boolean>(() => {
    const stored = safeStorageGet<boolean>(SUPABASE_STORAGE_KEYS.AUTO_SYNC_ENABLED, true);
    return stored === true || stored === undefined;
  });
  const [supabaseSyncInterval, setSupabaseSyncIntervalState] = useState<number>(() => {
    const stored = safeStorageGet(SUPABASE_STORAGE_KEYS.SYNC_INTERVAL, 60);
    return typeof stored === 'number' && stored >= 10 ? stored : 60;
  });
  const [supabaseNextSyncSeconds, setSupabaseNextSyncSeconds] = useState<number>(() => {
    const stored = safeStorageGet(SUPABASE_STORAGE_KEYS.SYNC_INTERVAL, 60);
    return typeof stored === 'number' && stored >= 10 ? stored : 60;
  });
  const [supabaseLastSyncTime, setSupabaseLastSyncTime] = useState<string | null>(() => {
    return safeStorageGet(SUPABASE_STORAGE_KEYS.LAST_SYNC_TIME, null);
  });
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [supabaseSyncError, setSupabaseSyncError] = useState<string | null>(null);

  const setSupabaseAutoSyncEnabled = useCallback((enabled: boolean) => {
    setSupabaseAutoSyncEnabledState(enabled);
    safeStorageSet(SUPABASE_STORAGE_KEYS.AUTO_SYNC_ENABLED, enabled);
  }, []);

  const setSupabaseSyncInterval = useCallback((seconds: number) => {
    const validSeconds = Math.max(10, seconds);
    setSupabaseSyncIntervalState(validSeconds);
    setSupabaseNextSyncSeconds(validSeconds);
    safeStorageSet(SUPABASE_STORAGE_KEYS.SYNC_INTERVAL, validSeconds);
  }, []);

  const reconnectSupabase = useCallback(() => {
    const configured = isSupabaseConfigured();
    setIsSupabaseConnected(configured);
    if (configured) {
      setSupabaseNextSyncSeconds(supabaseSyncInterval);
    }
  }, [supabaseSyncInterval]);

  // Helper de assinatura rápida para detecção precisa de alterações reais
  const computeDataHash = useCallback((data: {
    transactions?: any[];
    cards?: any[];
    cardSubscriptions?: any[];
    cofrinhos?: any[];
    cofrinhoMovements?: any[];
    installmentPurchases?: any[];
    groceryTrips?: any[];
    groceryPlansByMonth?: Record<string, any>;
    shoppingLists?: any[];
    stockItems?: any[];
    cestaBasicaRecords?: any[];
    salarySettings?: any;
    emergencySettings?: any;
    houseFundSettings?: any;
    futureRentSettings?: any;
    globalCofrinhoSettings?: any;
    closingChecklists?: any[];
    investmentContributions?: any[];
    emergencyContributions?: any[];
    renovationExpenses?: any[];
  }): string => {
    try {
      return JSON.stringify({
        tx: data.transactions?.map((t) => [t.id, t.amount, t.paid, t.date, t.description, t.cardId, t.category, t.type]),
        cd: data.cards?.map((c) => [c.id, c.name, c.closingDay, c.dueDay, c.monthlyLimitGoal, c.person, c.color]),
        cs: data.cardSubscriptions?.map((s) => [s.id, s.name, s.amount, s.person, s.cardId, s.isActive]),
        cf: data.cofrinhos?.map((c) => [c.id, c.name, c.currentBalance, c.initialBalance, c.targetAmount, c.yieldType]),
        cm: data.cofrinhoMovements?.map((m) => [m.id, m.cofrinhoId, m.amount, m.date, m.type, m.person]),
        ip: data.installmentPurchases?.map((i) => [i.id, i.description, i.totalAmount, i.remainingInstallments, i.currentInstallment, i.status, i.cardId]),
        gt: data.groceryTrips?.map((g) => [g.id, g.storeName, g.totalAmount, g.date, g.person, g.items?.length]),
        gp: data.groceryPlansByMonth ? Object.keys(data.groceryPlansByMonth) : [],
        sl: data.shoppingLists?.map((s) => [s.id, s.name, s.items?.length]),
        si: data.stockItems?.map((s) => [s.id, s.product, s.quantity, s.status]),
        cb: data.cestaBasicaRecords?.map((c) => [c.id, c.date, c.items?.length]),
        ss: data.salarySettings,
        es: data.emergencySettings,
        hf: data.houseFundSettings,
        fr: data.futureRentSettings,
        gc: data.globalCofrinhoSettings,
        cc: data.closingChecklists?.map((c) => [c.monthKey, c.isClosed]),
        ic: data.investmentContributions?.map((i) => [i.id, i.date, i.amount, i.person, i.status]),
        ec: data.emergencyContributions?.map((e) => [e.id, e.date, e.amount, e.person, e.status]),
        re: data.renovationExpenses?.map((r) => [r.id, r.date, r.amount, r.ownerAuthorized]),
      });
    } catch {
      return String(Date.now());
    }
  }, []);

  // Hash da última versão sincronizada com a nuvem (impede loop infinito de auto-save)
  const lastSyncedHashRef = useRef<string>('');
  const isSyncInProgressRef = useRef(false);
  const hasCompletedInitialPullRef = useRef(!isSupabaseConfigured());
  const hasPendingLocalChangesRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Executa o envio completo dos dados para o Supabase (Local -> Nuvem)
  const performPushToSupabase = useCallback(async (hashToCommit?: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || isSyncInProgressRef.current) return false;
    isSyncInProgressRef.current = true;
    try {
      const checklistsMap: Record<string, any> = {};
      closingChecklistsRef.current.forEach((c) => {
        checklistsMap[c.monthKey] = c;
      });

      const allPlans = Object.values(groceryPlansByMonthRef.current);
      const res = await pushLocalDataToSupabase({
        cards: cardsRef.current,
        transactions: transactionsRef.current,
        installmentPurchases: installmentPurchasesRef.current,
        cardSubscriptions: cardSubscriptionsRef.current,
        groceryTrips: groceryTripsRef.current,
        groceryMonthPlans: allPlans.length > 0 ? allPlans : [groceryPlanRef.current],
        shoppingLists: shoppingListsRef.current,
        stockItems: stockItemsRef.current,
        cestaBasicaRecords: cestaBasicaRecordsRef.current,
        cofrinhos: cofrinhosRef.current,
        cofrinhoMovements: cofrinhoMovementsRef.current,
        emergencyContributions: emergencyContributionsRef.current,
        investmentContributions: investmentContributionsRef.current,
        renovationExpenses: renovationExpensesRef.current,
        monthlyClosingChecklists: checklistsMap,
        salarySettings: salarySettingsRef.current,
        emergencySettings: emergencySettingsRef.current,
        houseFundSettings: houseFundSettingsRef.current,
        futureRentSettings: futureRentSettingsRef.current,
        globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
      });

      if (res.success) {
        hasPendingLocalChangesRef.current = false;
        lastSyncedHashRef.current = hashToCommit || computeDataHash({
          transactions: transactionsRef.current,
          cards: cardsRef.current,
          cardSubscriptions: cardSubscriptionsRef.current,
          cofrinhos: cofrinhosRef.current,
          cofrinhoMovements: cofrinhoMovementsRef.current,
          installmentPurchases: installmentPurchasesRef.current,
          groceryTrips: groceryTripsRef.current,
          groceryPlansByMonth: groceryPlansByMonthRef.current,
          shoppingLists: shoppingListsRef.current,
          stockItems: stockItemsRef.current,
          cestaBasicaRecords: cestaBasicaRecordsRef.current,
          salarySettings: salarySettingsRef.current,
          emergencySettings: emergencySettingsRef.current,
          houseFundSettings: houseFundSettingsRef.current,
          futureRentSettings: futureRentSettingsRef.current,
          globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
          closingChecklists: closingChecklistsRef.current,
          investmentContributions: investmentContributionsRef.current,
          emergencyContributions: emergencyContributionsRef.current,
          renovationExpenses: renovationExpensesRef.current,
        });
        notifySaved(true);
        const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setSupabaseLastSyncTime(nowTime);
        setSupabaseSyncStatus('success');
        setSupabaseNextSyncSeconds(supabaseSyncInterval);
        safeStorageSet(SUPABASE_STORAGE_KEYS.LAST_SYNC_TIME, nowTime);
        safeStorageSet(SUPABASE_STORAGE_KEYS.LAST_SYNC_STATUS, 'success');
        return true;
      } else {
        notifySaved(false);
        setSupabaseSyncStatus('error');
        setSupabaseSyncError(res.message);
        return false;
      }
    } catch (e: any) {
      console.warn('Falha no auto-push para Supabase:', e);
      notifySaved(false);
      setSupabaseSyncStatus('error');
      setSupabaseSyncError(e?.message || 'Erro no envio');
      return false;
    } finally {
      isSyncInProgressRef.current = false;
    }
  }, [computeDataHash, notifySaved, supabaseSyncInterval]);

  // Flush imediato de alterações pendentes (cancela debounce e envia agora)
  const flushPushToSupabase = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    return performPushToSupabase();
  }, [performPushToSupabase]);

  // Sincronização Bidirecional (Pull + Push) com o Supabase
  const syncWithSupabase = useCallback(async (direction: 'both' | 'pull' | 'push' = 'both'): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseConnected(false);
      return { success: false, message: 'Supabase não está configurado. Insira a URL e chave nas configurações.' };
    }
    setIsSupabaseConnected(true);

    if (isSyncInProgressRef.current) {
      return { success: false, message: 'Sincronização já em execução.' };
    }

    isSyncInProgressRef.current = true;
    setSupabaseSyncStatus('syncing');
    setSupabaseSyncError(null);

    try {
      let hasCloudContent = false;
      // 1. PULL: Baixa as alterações mais recentes do Supabase (Nuvem -> Local)
      if (direction === 'pull' || direction === 'both') {
        const pullRes = await pullDataFromSupabase();
        if (pullRes.success && pullRes.data) {
          const d = pullRes.data;
          hasCloudContent = Boolean(
            pullRes.hasCloudContent ||
            (d.cards && d.cards.length > 0) ||
            (d.transactions && d.transactions.length > 0) ||
            (d.cofrinhos && d.cofrinhos.length > 0) ||
            (d.groceryTrips && d.groceryTrips.length > 0) ||
            (d.installmentPurchases && d.installmentPurchases.length > 0) ||
            (d.cardSubscriptions && d.cardSubscriptions.length > 0)
          );

          // Se a nuvem tem conteúdo ativo, aplica o estado da nuvem fielmente
          if (hasCloudContent) {
            const incomingCloudHash = computeDataHash({
              transactions: d.transactions || transactionsRef.current,
              cards: d.cards || cardsRef.current,
              cardSubscriptions: d.cardSubscriptions || cardSubscriptionsRef.current,
              cofrinhos: d.cofrinhos || cofrinhosRef.current,
              cofrinhoMovements: d.cofrinhoMovements || cofrinhoMovementsRef.current,
              installmentPurchases: d.installmentPurchases || installmentPurchasesRef.current,
              groceryTrips: d.groceryTrips || groceryTripsRef.current,
              groceryPlansByMonth: groceryPlansByMonthRef.current,
              shoppingLists: d.shoppingLists || shoppingListsRef.current,
              stockItems: d.stockItems || stockItemsRef.current,
              cestaBasicaRecords: d.cestaBasicaRecords || cestaBasicaRecordsRef.current,
              salarySettings: d.salarySettings || salarySettingsRef.current,
              emergencySettings: d.emergencySettings || emergencySettingsRef.current,
              houseFundSettings: d.houseFundSettings || houseFundSettingsRef.current,
              futureRentSettings: d.futureRentSettings || futureRentSettingsRef.current,
              globalCofrinhoSettings: d.globalCofrinhoSettings || globalCofrinhoSettingsRef.current,
              closingChecklists: d.closingChecklists || closingChecklistsRef.current,
              investmentContributions: d.investmentContributions || investmentContributionsRef.current,
              emergencyContributions: d.emergencyContributions || emergencyContributionsRef.current,
              renovationExpenses: d.renovationExpenses || renovationExpensesRef.current,
            });

            // Só atualiza os estados se os dados da nuvem tiverem de fato mudado
            if (incomingCloudHash !== lastSyncedHashRef.current) {
              if (d.cards !== undefined) {
                setCards(d.cards);
                cardsRef.current = d.cards;
                safeStorageSet(STORAGE_KEYS.CARDS, d.cards);
              }
            if (d.transactions !== undefined) {
              setTransactions(d.transactions);
              transactionsRef.current = d.transactions;
              safeStorageSet(STORAGE_KEYS.TRANSACTIONS, d.transactions);
            }
            if (d.installmentPurchases !== undefined) {
              setInstallmentPurchases(d.installmentPurchases);
              installmentPurchasesRef.current = d.installmentPurchases;
              safeStorageSet(STORAGE_KEYS.INSTALLMENTS, d.installmentPurchases);
            }
            if (d.cardSubscriptions !== undefined) {
              setCardSubscriptions(d.cardSubscriptions);
              cardSubscriptionsRef.current = d.cardSubscriptions;
              safeStorageSet(STORAGE_KEYS.CARD_SUBSCRIPTIONS, d.cardSubscriptions);
            }
            if (d.groceryTrips !== undefined) {
              setGroceryTrips(d.groceryTrips);
              groceryTripsRef.current = d.groceryTrips;
              safeStorageSet(STORAGE_KEYS.GROCERY, d.groceryTrips);
            }
            if (d.groceryMonthPlans && d.groceryMonthPlans.length > 0) {
              const plansMap: Record<string, GroceryMonthPlan> = {};
              d.groceryMonthPlans.forEach((p) => {
                plansMap[p.monthKey] = p;
              });
              setGroceryPlansByMonth((prev) => ({ ...prev, ...plansMap }));
              groceryPlansByMonthRef.current = { ...groceryPlansByMonthRef.current, ...plansMap };
              safeStorageSet(STORAGE_KEYS.GROCERY_PLANS_BY_MONTH, plansMap);
              const curPlan = d.groceryMonthPlans.find((p) => p.monthKey === selectedMonth) || d.groceryMonthPlans[0];
              if (curPlan) {
                setGroceryPlan(curPlan);
                groceryPlanRef.current = curPlan;
              }
            }
            if (d.shoppingLists !== undefined) {
              setShoppingLists(d.shoppingLists);
              shoppingListsRef.current = d.shoppingLists;
              safeStorageSet(STORAGE_KEYS.SHOPPING_LISTS, d.shoppingLists);
            }
            if (d.stockItems !== undefined) {
              setStockItems(d.stockItems);
              stockItemsRef.current = d.stockItems;
              safeStorageSet(STORAGE_KEYS.STOCK_ITEMS, d.stockItems);
            }
            if (d.cestaBasicaRecords !== undefined) {
              setCestaBasicaRecords(d.cestaBasicaRecords);
              cestaBasicaRecordsRef.current = d.cestaBasicaRecords;
              safeStorageSet(STORAGE_KEYS.CESTA_BASICA, d.cestaBasicaRecords);
            }
            if (d.cofrinhos !== undefined) {
              setCofrinhos(d.cofrinhos);
              cofrinhosRef.current = d.cofrinhos;
              safeStorageSet(STORAGE_KEYS.COFRINHOS, d.cofrinhos);
            }
            if (d.cofrinhoMovements !== undefined) {
              setCofrinhoMovements(d.cofrinhoMovements);
              cofrinhoMovementsRef.current = d.cofrinhoMovements;
              safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, d.cofrinhoMovements);
            }
            if (d.emergencyContributions !== undefined) {
              setEmergencyContributions(d.emergencyContributions);
              emergencyContributionsRef.current = d.emergencyContributions;
              safeStorageSet(STORAGE_KEYS.EMERGENCY, d.emergencyContributions);
            }
            if (d.investmentContributions !== undefined) {
              setInvestmentContributions(d.investmentContributions);
              investmentContributionsRef.current = d.investmentContributions;
              safeStorageSet(STORAGE_KEYS.INVESTMENTS, d.investmentContributions);
            }
            if (d.renovationExpenses !== undefined) {
              setRenovationExpenses(d.renovationExpenses);
              renovationExpensesRef.current = d.renovationExpenses;
              safeStorageSet(STORAGE_KEYS.RENOVATION_EXPENSES, d.renovationExpenses);
            }
            if (d.closingChecklists !== undefined) {
              setClosingChecklists(d.closingChecklists);
              closingChecklistsRef.current = d.closingChecklists;
              safeStorageSet(STORAGE_KEYS.CLOSING_CHECKLISTS, d.closingChecklists);
            }
            if (d.salarySettings) {
              setSalarySettings(d.salarySettings);
              salarySettingsRef.current = d.salarySettings;
              safeStorageSet(STORAGE_KEYS.SALARY_SETTINGS, d.salarySettings);
            }
            if (d.emergencySettings) {
              setEmergencySettings(d.emergencySettings);
              emergencySettingsRef.current = d.emergencySettings;
              safeStorageSet(STORAGE_KEYS.EMERGENCY_SETTINGS, d.emergencySettings);
            }
            if (d.houseFundSettings) {
              setHouseFundSettings(d.houseFundSettings);
              houseFundSettingsRef.current = d.houseFundSettings;
              safeStorageSet(STORAGE_KEYS.HOUSE_FUND_SETTINGS, d.houseFundSettings);
            }
            if (d.futureRentSettings) {
              setFutureRentSettings(d.futureRentSettings);
              futureRentSettingsRef.current = d.futureRentSettings;
              safeStorageSet(STORAGE_KEYS.FUTURE_RENT_SETTINGS, d.futureRentSettings);
            }
            if (d.globalCofrinhoSettings) {
              setGlobalCofrinhoSettings(d.globalCofrinhoSettings);
              globalCofrinhoSettingsRef.current = d.globalCofrinhoSettings;
              safeStorageSet(STORAGE_KEYS.GLOBAL_COFRINHO_SETTINGS, d.globalCofrinhoSettings);
            }

              saveVaultSnapshot(
                {
                  cards: d.cards || cardsRef.current,
                  transactions: d.transactions || transactionsRef.current,
                  cofrinhos: d.cofrinhos || cofrinhosRef.current,
                },
                'Sincronizado da Nuvem Supabase'
              );
            }

            lastSyncedHashRef.current = incomingCloudHash;
            hasPendingLocalChangesRef.current = false;
          }
        } else if (!pullRes.success && direction === 'pull') {
          throw new Error(pullRes.message);
        }
      }

      // Concluiu pull inicial, agora pode permitir auto-push de alterações reais
      hasCompletedInitialPullRef.current = true;

      // 2. PUSH: Envia o estado atual para o Supabase (Local -> Nuvem)
      // SOMENTE se direction for explicitamente 'push', OU se 'both' e a nuvem estava vazia (primeira semeadura do banco)
      if (direction === 'push' || (direction === 'both' && !hasCloudContent)) {
        const checklistsMap: Record<string, any> = {};
        closingChecklistsRef.current.forEach((c) => {
          checklistsMap[c.monthKey] = c;
        });

        const allPlans = Object.values(groceryPlansByMonthRef.current);
        const pushRes = await pushLocalDataToSupabase({
          cards: cardsRef.current,
          transactions: transactionsRef.current,
          installmentPurchases: installmentPurchasesRef.current,
          cardSubscriptions: cardSubscriptionsRef.current,
          groceryTrips: groceryTripsRef.current,
          groceryMonthPlans: allPlans.length > 0 ? allPlans : [groceryPlanRef.current],
          shoppingLists: shoppingListsRef.current,
          stockItems: stockItemsRef.current,
          cestaBasicaRecords: cestaBasicaRecordsRef.current,
          cofrinhos: cofrinhosRef.current,
          cofrinhoMovements: cofrinhoMovementsRef.current,
          emergencyContributions: emergencyContributionsRef.current,
          investmentContributions: investmentContributionsRef.current,
          renovationExpenses: renovationExpensesRef.current,
          monthlyClosingChecklists: checklistsMap,
          salarySettings: salarySettingsRef.current,
          emergencySettings: emergencySettingsRef.current,
          houseFundSettings: houseFundSettingsRef.current,
          futureRentSettings: futureRentSettingsRef.current,
          globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
        });

        if (!pushRes.success && direction === 'push') {
          throw new Error(pushRes.message);
        }

        hasPendingLocalChangesRef.current = false;
        lastSyncedHashRef.current = computeDataHash({
          transactions: transactionsRef.current,
          cards: cardsRef.current,
          cardSubscriptions: cardSubscriptionsRef.current,
          cofrinhos: cofrinhosRef.current,
          cofrinhoMovements: cofrinhoMovementsRef.current,
          installmentPurchases: installmentPurchasesRef.current,
          groceryTrips: groceryTripsRef.current,
          groceryPlansByMonth: groceryPlansByMonthRef.current,
          shoppingLists: shoppingListsRef.current,
          stockItems: stockItemsRef.current,
          cestaBasicaRecords: cestaBasicaRecordsRef.current,
          salarySettings: salarySettingsRef.current,
          emergencySettings: emergencySettingsRef.current,
          houseFundSettings: houseFundSettingsRef.current,
          futureRentSettings: futureRentSettingsRef.current,
          globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
          closingChecklists: closingChecklistsRef.current,
          investmentContributions: investmentContributionsRef.current,
          emergencyContributions: emergencyContributionsRef.current,
          renovationExpenses: renovationExpensesRef.current,
        });
      }

      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSupabaseLastSyncTime(nowTime);
      setSupabaseSyncStatus('success');
      setSupabaseNextSyncSeconds(supabaseSyncInterval);
      safeStorageSet(SUPABASE_STORAGE_KEYS.LAST_SYNC_TIME, nowTime);
      safeStorageSet(SUPABASE_STORAGE_KEYS.LAST_SYNC_STATUS, 'success');
      setSaveStatus('synced_cloud');

      return { success: true, message: `Sincronizado com sucesso às ${nowTime}` };
    } catch (err: any) {
      const errMsg = err?.message || 'Falha durante a sincronização com Supabase';
      setSupabaseSyncStatus('error');
      setSupabaseSyncError(errMsg);
      safeStorageSet(SUPABASE_STORAGE_KEYS.LAST_SYNC_STATUS, 'error');
      return { success: false, message: errMsg };
    } finally {
      isSyncInProgressRef.current = false;
    }
  }, [
    computeDataHash,
    selectedMonth,
    supabaseSyncInterval,
  ]);

  // Ref estável para a função de sincronização (impede recriação de timers e listeners)
  const syncWithSupabaseRef = useRef(syncWithSupabase);
  useEffect(() => {
    syncWithSupabaseRef.current = syncWithSupabase;
  }, [syncWithSupabase]);

  // Timer periódico de Sincronização Contínua (Supabase Polling Timer)
  useEffect(() => {
    if (!supabaseAutoSyncEnabled || !isSupabaseConnected) return;

    const timer = setInterval(() => {
      setSupabaseNextSyncSeconds((prev) => {
        if (prev <= 1) {
          // Só faz pull periódico se não tiver alterações locais pendentes
          if (!hasPendingLocalChangesRef.current && !isSyncInProgressRef.current) {
            syncWithSupabaseRef.current('pull');
          }
          return supabaseSyncInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [supabaseAutoSyncEnabled, isSupabaseConnected, supabaseSyncInterval]);

  // Listener para foco da janela / troca de aba do navegador
  // NUNCA sobrescreve dados locais com pull se houver alterações locais pendentes
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (!supabaseAutoSyncEnabled || !isSupabaseConfigured()) return;

      if (document.visibilityState === 'hidden') {
        // Usuário está saindo desta aba (ex: indo para a Vercel) -> Salva tudo imediatamente!
        if (hasPendingLocalChangesRef.current) {
          flushPushToSupabase();
        }
      } else if (document.visibilityState === 'visible') {
        // Usuário voltou para a aba
        if (hasPendingLocalChangesRef.current) {
          // Se ainda tem alteração pendente de envio, salva na nuvem primeiro!
          flushPushToSupabase();
        } else if (!isSyncInProgressRef.current) {
          // Sem pendências locais: atualiza com as novidades da nuvem
          syncWithSupabaseRef.current('pull');
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pagehide', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pagehide', handleVisibilityOrFocus);
    };
  }, [supabaseAutoSyncEnabled, flushPushToSupabase]);

  // Sincronização inicial ao carregar a aplicação (apenas 1 execução no montamento)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsSupabaseConnected(true);
      const initialTimer = setTimeout(() => {
        syncWithSupabaseRef.current('pull');
      }, 350);
      return () => clearTimeout(initialTimer);
    } else {
      hasCompletedInitialPullRef.current = true;
    }
  }, []);

  // Automatic Debounced Push on Local Edits: só dispara quando HOUVER alteração real do usuário
  useEffect(() => {
    if (!isSupabaseConfigured() || !hasCompletedInitialPullRef.current) {
      return;
    }

    const currentHash = computeDataHash({
      transactions: transactionsRef.current,
      cards: cardsRef.current,
      cardSubscriptions: cardSubscriptionsRef.current,
      cofrinhos: cofrinhosRef.current,
      cofrinhoMovements: cofrinhoMovementsRef.current,
      installmentPurchases: installmentPurchasesRef.current,
      groceryTrips: groceryTripsRef.current,
      groceryPlansByMonth: groceryPlansByMonthRef.current,
      shoppingLists: shoppingListsRef.current,
      stockItems: stockItemsRef.current,
      cestaBasicaRecords: cestaBasicaRecordsRef.current,
      salarySettings: salarySettingsRef.current,
      emergencySettings: emergencySettingsRef.current,
      houseFundSettings: houseFundSettingsRef.current,
      futureRentSettings: futureRentSettingsRef.current,
      globalCofrinhoSettings: globalCofrinhoSettingsRef.current,
      closingChecklists: closingChecklistsRef.current,
      investmentContributions: investmentContributionsRef.current,
      emergencyContributions: emergencyContributionsRef.current,
      renovationExpenses: renovationExpensesRef.current,
    });

    // Se o estado atual é exatamente idêntico ao que já está no Supabase, interrompe aqui!
    if (currentHash === lastSyncedHashRef.current) {
      return;
    }

    // Houve uma alteração real realizada pelo usuário
    hasPendingLocalChangesRef.current = true;
    setSaveStatus('saving');
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      performPushToSupabase(currentHash);
    }, 800);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [
    computeDataHash,
    performPushToSupabase,
    transactions,
    cards,
    cardSubscriptions,
    cofrinhos,
    cofrinhoMovements,
    installmentPurchases,
    groceryTrips,
    groceryPlan,
    groceryPlansByMonth,
    shoppingLists,
    stockItems,
    cestaBasicaRecords,
    salarySettings,
    emergencySettings,
    houseFundSettings,
    futureRentSettings,
    globalCofrinhoSettings,
    closingChecklists,
    investmentContributions,
    emergencyContributions,
    renovationExpenses,
  ]);

  // Demo status check
  const hasDemoData = useMemo(() => {
    return (
      transactions.some((t) => t.isDemo) ||
      cards.some((c) => c.isDemo) ||
      cardSubscriptions.some((s) => s.isDemo) ||
      cofrinhos.some((cof) => cof.isDemo) ||
      installmentPurchases.some((i) => i.isDemo) ||
      groceryTrips.some((g) => g.isDemo) ||
      investmentContributions.some((inv) => inv.isDemo) ||
      emergencyContributions.some((e) => e.isDemo) ||
      renovationExpenses.some((r) => r.isDemo)
    );
  }, [transactions, cards, cardSubscriptions, cofrinhos, installmentPurchases, groceryTrips, investmentContributions, emergencyContributions, renovationExpenses]);

  const clearDemoData = () => {
    // Coleta IDs de itens de demonstração para remoção imediata no Supabase
    const demoTxIds = transactionsRef.current.filter((t) => t.isDemo).map((t) => t.id);
    const demoCardIds = cardsRef.current.filter((c) => c.isDemo).map((c) => c.id);
    const demoSubIds = cardSubscriptionsRef.current.filter((s) => s.isDemo).map((s) => s.id);
    const demoCofIds = cofrinhosRef.current.filter((c) => c.isDemo).map((c) => c.id);
    const demoInstIds = installmentPurchasesRef.current.filter((i) => i.isDemo).map((i) => i.id);
    const demoTripIds = groceryTripsRef.current.filter((g) => g.isDemo).map((g) => g.id);
    const demoListIds = shoppingListsRef.current.filter((l) => l.isDemo).map((l) => l.id);
    const demoStockIds = stockItemsRef.current.filter((s) => s.isDemo).map((s) => s.id);
    const demoCestaIds = cestaBasicaRecordsRef.current.filter((c) => c.isDemo).map((c) => c.id);
    const demoInvIds = investmentContributionsRef.current.filter((inv) => inv.isDemo).map((inv) => inv.id);
    const demoEmerIds = emergencyContributionsRef.current.filter((e) => e.isDemo).map((e) => e.id);
    const demoRenoIds = renovationExpensesRef.current.filter((r) => r.isDemo).map((r) => r.id);

    if (demoTxIds.length > 0) deleteItemFromSupabase('transactions', demoTxIds);
    if (demoCardIds.length > 0) deleteItemFromSupabase('credit_cards', demoCardIds);
    if (demoSubIds.length > 0) deleteItemFromSupabase('card_subscriptions', demoSubIds);
    if (demoCofIds.length > 0) deleteItemFromSupabase('cofrinhos', demoCofIds);
    if (demoInstIds.length > 0) deleteItemFromSupabase('installment_purchases', demoInstIds);
    if (demoTripIds.length > 0) deleteItemFromSupabase('grocery_trips', demoTripIds);
    if (demoListIds.length > 0) deleteItemFromSupabase('shopping_lists', demoListIds);
    if (demoStockIds.length > 0) deleteItemFromSupabase('stock_items', demoStockIds);
    if (demoCestaIds.length > 0) deleteItemFromSupabase('cesta_basica_records', demoCestaIds);
    if (demoInvIds.length > 0) deleteItemFromSupabase('investment_contributions', demoInvIds);
    if (demoEmerIds.length > 0) deleteItemFromSupabase('emergency_contributions', demoEmerIds);
    if (demoRenoIds.length > 0) deleteItemFromSupabase('renovation_expenses', demoRenoIds);

    setTransactions((prev) => prev.filter((t) => !t.isDemo));
    setCards((prev) => prev.filter((c) => !c.isDemo));
    setCardSubscriptions((prev) => prev.filter((s) => !s.isDemo));
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

    cardsRef.current = cardsRef.current.filter((c) => !c.isDemo);
    transactionsRef.current = transactionsRef.current.filter((t) => !t.isDemo);
    cardSubscriptionsRef.current = cardSubscriptionsRef.current.filter((s) => !s.isDemo);
    cofrinhosRef.current = cofrinhosRef.current.filter((cof) => !cof.isDemo);
    cofrinhoMovementsRef.current = cofrinhoMovementsRef.current.filter((cm) => !cm.isDemo);
    installmentPurchasesRef.current = installmentPurchasesRef.current.filter((i) => !i.isDemo);
    groceryTripsRef.current = groceryTripsRef.current.filter((g) => !g.isDemo);
    shoppingListsRef.current = shoppingListsRef.current.filter((l) => !l.isDemo);
    stockItemsRef.current = stockItemsRef.current.filter((s) => !s.isDemo);
    cestaBasicaRecordsRef.current = cestaBasicaRecordsRef.current.filter((c) => !c.isDemo);
    investmentContributionsRef.current = investmentContributionsRef.current.filter((inv) => !inv.isDemo);
    emergencyContributionsRef.current = emergencyContributionsRef.current.filter((e) => !e.isDemo);
    renovationExpensesRef.current = renovationExpensesRef.current.filter((r) => !r.isDemo);

    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const restoreDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCards(INITIAL_CARDS);
    setCardSubscriptions(INITIAL_CARD_SUBSCRIPTIONS);
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
    deleteItemFromSupabase('transactions', id);
    const tx = transactionsRef.current.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    transactionsRef.current = transactionsRef.current.filter((t) => t.id !== id);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);

    if (!tx) {
      hasPendingLocalChangesRef.current = true;
      setTimeout(() => flushPushToSupabase(), 40);
      return;
    }

    // 2. Se for compra de supermercado vinculada, excluir registro de supermercado
    if (tx.groceryTripId) {
      deleteItemFromSupabase('grocery_trips', tx.groceryTripId);
      setGroceryTrips((prev) => prev.filter((g) => g.id !== tx.groceryTripId));
      groceryTripsRef.current = groceryTripsRef.current.filter((g) => g.id !== tx.groceryTripId);
      safeStorageSet(STORAGE_KEYS.GROCERY, groceryTripsRef.current);
    }

    // 3. Sincronização com Cofrinhos & Metas: encontrar movimentações correspondentes
    const relatedMovements = cofrinhoMovements.filter((m) => {
      if (tx.cofrinhoMovementId && m.id === tx.cofrinhoMovementId) return true;
      if (m.transactionId === tx.id) return true;
      if (tx.id === 'tx-reserva-ricardo' && m.id === 'cm-1') return true;
      if (tx.id === 'tx-reserva-ellen' && m.id === 'cm-2') return true;
      if (tx.investmentContributionId && m.investmentContributionId === tx.investmentContributionId) return true;
      if (tx.emergencyContributionId && m.emergencyContributionId === tx.emergencyContributionId) return true;
      if (tx.id === `tx-inv-${m.investmentContributionId}`) return true;

      // Se for lançamento de investimento sem ID explícito, correlacionar por características
      if (tx.type === 'investimento') {
        const isSameAmount = Math.abs(m.amount - tx.amount) < 0.01;
        const isSameDate = m.date === tx.date;
        const isSamePerson = m.person === tx.person;
        const isAporte = m.type === 'aporte';

        const txCofId =
          tx.cofrinhoId ||
          (tx.subcategory === 'Reserva de Emergência' || tx.description.toLowerCase().includes('reserva')
            ? 'cof-reserva'
            : undefined);
        const matchesCof = txCofId ? m.cofrinhoId === txCofId : true;

        if (isSameAmount && isSameDate && isSamePerson && isAporte && matchesCof) {
          return true;
        }
      }
      return false;
    });

    if (relatedMovements.length > 0) {
      const movementIdsToRemove = new Set<string>(relatedMovements.map((m) => m.id));

      // Reverter saldos e rendimentos dos cofrinhos afetados
      setCofrinhos((prev) => {
        const next = prev.map((c) => {
          const movsForCof = relatedMovements.filter((m) => m.cofrinhoId === c.id);
          if (movsForCof.length === 0) return c;

          let deltaBalance = 0;
          let deltaYield = 0;
          let deltaAccYield = 0;

          movsForCof.forEach((mov) => {
            if (mov.type === 'aporte') {
              deltaBalance -= mov.amount;
            } else if (mov.type === 'retirada') {
              deltaBalance += mov.amount;
            } else if (mov.type === 'rendimento') {
              deltaBalance -= mov.amount;
              deltaYield -= mov.amount;
              deltaAccYield -= mov.amount;
            }
          });

          return {
            ...c,
            currentBalance: Math.max(0, c.currentBalance + deltaBalance),
            monthlyYield: Math.max(0, c.monthlyYield + deltaYield),
            accumulatedYield: Math.max(0, c.accumulatedYield + deltaAccYield),
            isDemo: false,
          };
        });
        cofrinhosRef.current = next;
        safeStorageSet(STORAGE_KEYS.COFRINHOS, next);
        return next;
      });

      // Excluir movimentações do cofrinho
      deleteItemFromSupabase('cofrinho_movements', Array.from(movementIdsToRemove));
      setCofrinhoMovements((prev) => prev.filter((m) => !movementIdsToRemove.has(m.id)));
      cofrinhoMovementsRef.current = cofrinhoMovementsRef.current.filter((m) => !movementIdsToRemove.has(m.id));
      safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, cofrinhoMovementsRef.current);
    }

    // 4. Limpar contribuições de investimentos correlacionadas
    setInvestmentContributions((prev) => {
      const next = prev.filter((inv) => {
        if (tx.investmentContributionId && inv.id === tx.investmentContributionId) return false;
        if (tx.id === 'tx-inv-' + inv.id) return false;
        if (inv.transactionId === tx.id) return false;
        if (
          tx.type === 'investimento' &&
          Math.abs(inv.amount - tx.amount) < 0.01 &&
          inv.date === tx.date &&
          inv.person === tx.person
        ) {
          return false;
        }
        return true;
      });
      investmentContributionsRef.current = next;
      safeStorageSet(STORAGE_KEYS.INVESTMENTS, next);
      return next;
    });

    // 5. Limpar contribuições de reserva de emergência correlacionadas
    setEmergencyContributions((prev) => {
      const next = prev.filter((efc) => {
        if (tx.emergencyContributionId && efc.id === tx.emergencyContributionId) return false;
        if (efc.transactionId === tx.id) return false;
        if (tx.id === 'tx-reserva-ricardo' && efc.person === 'Ricardo') return false;
        if (tx.id === 'tx-reserva-ellen' && efc.person === 'Ellen') return false;
        if (
          tx.type === 'investimento' &&
          (tx.subcategory === 'Reserva de Emergência' || tx.description.toLowerCase().includes('reserva')) &&
          Math.abs(efc.amount - tx.amount) < 0.01 &&
          efc.date === tx.date &&
          efc.person === tx.person
        ) {
          return false;
        }
        return true;
      });
      emergencyContributionsRef.current = next;
      safeStorageSet(STORAGE_KEYS.EMERGENCY, next);
      return next;
    });

    // 6. Resetar status do aporte obrigatório do mês se for aporte da reserva
    if (
      tx.id === 'tx-reserva-ricardo' ||
      (tx.type === 'investimento' &&
        tx.person === 'Ricardo' &&
        (tx.subcategory === 'Reserva de Emergência' || tx.description.toLowerCase().includes('reserva')))
    ) {
      setMonthlyAporteStatus('Ricardo', 'programado');
    }
    if (
      tx.id === 'tx-reserva-ellen' ||
      (tx.type === 'investimento' &&
        tx.person === 'Ellen' &&
        (tx.subcategory === 'Reserva de Emergência' || tx.description.toLowerCase().includes('reserva')))
    ) {
      setMonthlyAporteStatus('Ellen', 'programado');
    }

    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
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
      id: 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setCards((prev) => [...prev, newCard]);
  };

  const updateCard = (id: string, updated: Partial<CreditCard>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated, isDemo: false } : c))
    );
  };

  const deleteCard = (id: string) => {
    deleteItemFromSupabase('credit_cards', id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    cardsRef.current = cardsRef.current.filter((c) => c.id !== id);

    // Exclui assinaturas vinculadas a este cartão e desvincula suas transações
    const subsToRemove = cardSubscriptionsRef.current.filter((s) => s.cardId === id);
    const subIdsToRemove = new Set<string>(subsToRemove.map((s) => s.id));
    if (subIdsToRemove.size > 0) {
      deleteItemFromSupabase('card_subscriptions', Array.from(subIdsToRemove));
      setCardSubscriptions((prev) => prev.filter((s) => !subIdsToRemove.has(s.id)));
      cardSubscriptionsRef.current = cardSubscriptionsRef.current.filter((s) => !subIdsToRemove.has(s.id));
    }

    // Desvincula cartão e assinaturas excluídas de todas as transações locais
    setTransactions((prev) =>
      prev.map((t) => {
        const matchesCard = t.cardId === id;
        const matchesSub = t.subscriptionId && subIdsToRemove.has(t.subscriptionId);
        if (matchesCard || matchesSub) {
          return {
            ...t,
            cardId: matchesCard ? undefined : t.cardId,
            subscriptionId: matchesSub ? undefined : t.subscriptionId,
            isCardSubscription: matchesSub ? false : t.isCardSubscription,
          };
        }
        return t;
      })
    );
    transactionsRef.current = transactionsRef.current.map((t) => {
      const matchesCard = t.cardId === id;
      const matchesSub = t.subscriptionId && subIdsToRemove.has(t.subscriptionId);
      if (matchesCard || matchesSub) {
        return {
          ...t,
          cardId: matchesCard ? undefined : t.cardId,
          subscriptionId: matchesSub ? undefined : t.subscriptionId,
          isCardSubscription: matchesSub ? false : t.isCardSubscription,
        };
      }
      return t;
    });

    // Desvincula parcelamentos desse cartão
    setInstallmentPurchases((prev) =>
      prev.map((ip) => (ip.cardId === id ? { ...ip, cardId: undefined } : ip))
    );
    installmentPurchasesRef.current = installmentPurchasesRef.current.map((ip) => (ip.cardId === id ? { ...ip, cardId: undefined } : ip));

    safeStorageSet(STORAGE_KEYS.CARDS, cardsRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
    safeStorageSet(STORAGE_KEYS.CARD_SUBSCRIPTIONS, cardSubscriptionsRef.current);
    safeStorageSet(STORAGE_KEYS.INSTALLMENTS, installmentPurchasesRef.current);

    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  // Installments CRUD
  const addInstallmentPurchase = (purchase: Omit<InstallmentPurchase, 'id'>) => {
    const purchaseId = 'inst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const card = cards.find((c) => c.id === purchase.cardId);
    
    // Determine the first installment month with closingDay consideration
    let startingMonth = purchase.firstInstallmentMonth;
    if (!startingMonth) {
      const pDate = purchase.purchaseDate || new Date().toISOString().slice(0, 10);
      startingMonth = calculateCardCompetenceMonth(pDate, card?.closingDay);
    }

    const newPurchase: InstallmentPurchase = {
      ...purchase,
      firstInstallmentMonth: startingMonth,
      firstDueDate: startingMonth,
      id: purchaseId,
    };
    setInstallmentPurchases((prev) => [newPurchase, ...prev]);

    const newTxs: Transaction[] = [];
    for (let i = 0; i < purchase.totalInstallments; i++) {
      const monthForInst = addMonthsToKey(startingMonth, i);
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
    deleteItemFromSupabase('installment_purchases', id);
    setInstallmentPurchases((prev) => prev.filter((i) => i.id !== id));
    installmentPurchasesRef.current = installmentPurchasesRef.current.filter((i) => i.id !== id);
    const relatedTxs = transactionsRef.current.filter((t) => t.installmentInfo?.purchaseId === id);
    if (relatedTxs.length > 0) {
      deleteItemFromSupabase('transactions', relatedTxs.map((t) => t.id));
    }
    setTransactions((prev) =>
      prev.filter((t) => t.installmentInfo?.purchaseId !== id)
    );
    transactionsRef.current = transactionsRef.current.filter((t) => t.installmentInfo?.purchaseId !== id);

    safeStorageSet(STORAGE_KEYS.INSTALLMENTS, installmentPurchasesRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);

    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const deleteInstallmentFromMonth = (purchaseId: string, fromCurrentInstallment: number) => {
    // Excluir a parcela atual e todas as parcelas subsequentes (nos meses seguintes)
    const txsToRemove = transactionsRef.current.filter((t) => {
      if (t.installmentInfo?.purchaseId === purchaseId) {
        return (t.installmentInfo.current || 1) >= fromCurrentInstallment;
      }
      return false;
    });
    if (txsToRemove.length > 0) {
      deleteItemFromSupabase('transactions', txsToRemove.map((t) => t.id));
    }

    setTransactions((prev) =>
      prev.filter((t) => {
        if (t.installmentInfo?.purchaseId === purchaseId) {
          return (t.installmentInfo.current || 1) < fromCurrentInstallment;
        }
        return true;
      })
    );
    transactionsRef.current = transactionsRef.current.filter((t) => {
      if (t.installmentInfo?.purchaseId === purchaseId) {
        return (t.installmentInfo.current || 1) < fromCurrentInstallment;
      }
      return true;
    });

    // Se for a partir da 1ª parcela, exclui a compra parcelada por completo
    if (fromCurrentInstallment <= 1) {
      deleteItemFromSupabase('installment_purchases', purchaseId);
      setInstallmentPurchases((prev) => prev.filter((i) => i.id !== purchaseId));
      installmentPurchasesRef.current = installmentPurchasesRef.current.filter((i) => i.id !== purchaseId);
    } else {
      // Se for a partir de uma parcela intermediária, ajusta o total de parcelas da compra
      setInstallmentPurchases((prev) => {
        const next = prev.map((inst) => {
          if (inst.id === purchaseId) {
            const newTotal = fromCurrentInstallment - 1;
            return {
              ...inst,
              totalInstallments: newTotal,
              remainingInstallments: 0,
              totalAmount: Number((newTotal * inst.installmentAmount).toFixed(2)),
              isDemo: false,
            };
          }
          return inst;
        });
        installmentPurchasesRef.current = next;
        return next;
      });
    }

    safeStorageSet(STORAGE_KEYS.INSTALLMENTS, installmentPurchasesRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);

    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const updateInstallmentPurchase = (id: string, updated: Partial<InstallmentPurchase>) => {
    setInstallmentPurchases((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updated, isDemo: false } : inst))
    );

    // Sincronizar todos os lançamentos gerados nos meses correspondentes com o novo nome/dados
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.installmentInfo?.purchaseId === id) {
          const current = t.installmentInfo.current;
          const total = updated.totalInstallments ?? t.installmentInfo.total;
          const newDesc =
            updated.description !== undefined
              ? `${updated.description} (Parc. ${current}/${total})`
              : t.description;

          return {
            ...t,
            description: newDesc,
            category: updated.category !== undefined ? updated.category : t.category,
            person: updated.person !== undefined ? updated.person : t.person,
            cardId: updated.cardId !== undefined ? updated.cardId : t.cardId,
            amount: updated.installmentAmount !== undefined ? updated.installmentAmount : t.amount,
            installmentInfo: {
              ...t.installmentInfo,
              total,
            },
          };
        }
        return t;
      })
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

  // Card Subscriptions CRUD
  const addCardSubscription = (subscription: Omit<CardSubscription, 'id'>) => {
    const subId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newSub: CardSubscription = {
      ...subscription,
      id: subId,
    };
    setCardSubscriptions((prev) => [newSub, ...prev]);
  };

  const updateCardSubscription = (id: string, updated: Partial<CardSubscription>) => {
    setCardSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updated, isDemo: false } : sub))
    );
  };

  const deleteCardSubscription = (id: string) => {
    deleteItemFromSupabase('card_subscriptions', id);
    setCardSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    cardSubscriptionsRef.current = cardSubscriptionsRef.current.filter((sub) => sub.id !== id);
    const relatedTxs = transactionsRef.current.filter((t) => t.subscriptionId === id || t.id === id || t.id.includes(id));
    if (relatedTxs.length > 0) {
      deleteItemFromSupabase('transactions', relatedTxs.map((t) => t.id));
    }
    setTransactions((prev) =>
      prev.filter((t) => t.subscriptionId !== id && t.id !== id && !t.id.includes(id))
    );
    transactionsRef.current = transactionsRef.current.filter((t) => t.subscriptionId !== id && t.id !== id && !t.id.includes(id));

    safeStorageSet(STORAGE_KEYS.CARD_SUBSCRIPTIONS, cardSubscriptionsRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);

    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  // Cofrinhos CRUD
  const addCofrinho = (cofrinho: Omit<Cofrinho, 'id'>) => {
    const newCof: Cofrinho = {
      ...cofrinho,
      id: 'cof-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setCofrinhos((prev) => [...prev, newCof]);
  };

  const updateCofrinho = (id: string, updated: Partial<Cofrinho>) => {
    setCofrinhos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated, isDemo: false } : c))
    );
  };

  const adjustCofrinhoBalance = (id: string, newCurrentBalance: number, newInitialBalance?: number) => {
    setCofrinhos((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            currentBalance: Math.max(0, newCurrentBalance),
            initialBalance: newInitialBalance !== undefined ? Math.max(0, newInitialBalance) : c.initialBalance,
            isDemo: false,
          };
        }
        return c;
      })
    );
  };

  const recalculateCofrinhoBalancesFromMovements = () => {
    setCofrinhos((prev) =>
      prev.map((c) => {
        const movs = cofrinhoMovements.filter((m) => m.cofrinhoId === c.id);
        let calc = c.initialBalance || 0;
        let monthlyY = 0;
        let accY = 0;
        movs.forEach((m) => {
          if (m.type === 'aporte') {
            calc += m.amount;
          } else if (m.type === 'retirada') {
            calc = Math.max(0, calc - m.amount);
          } else if (m.type === 'rendimento') {
            calc += m.amount;
            accY += m.amount;
            if (m.date.startsWith(selectedMonth)) {
              monthlyY += m.amount;
            }
          }
        });
        return {
          ...c,
          currentBalance: Math.max(0, Math.round(calc * 100) / 100),
          monthlyYield: Math.round(monthlyY * 100) / 100,
          accumulatedYield: Math.round(accY * 100) / 100,
          isDemo: false,
        };
      })
    );
  };

  const resetAllCofrinhosToZero = () => {
    setCofrinhos((prev) =>
      prev.map((c) => ({
        ...c,
        currentBalance: 0,
        initialBalance: 0,
        monthlyYield: 0,
        accumulatedYield: 0,
        isDemo: false,
      }))
    );
    setCofrinhoMovements([]);
  };

  const deleteCofrinho = (id: string) => {
    deleteItemFromSupabase('cofrinhos', id);
    const relatedMovIds = cofrinhoMovementsRef.current.filter((m) => m.cofrinhoId === id).map((m) => m.id);
    if (relatedMovIds.length > 0) {
      deleteItemFromSupabase('cofrinho_movements', relatedMovIds);
    }
    setCofrinhos((prev) => prev.filter((c) => c.id !== id));
    cofrinhosRef.current = cofrinhosRef.current.filter((c) => c.id !== id);
    setCofrinhoMovements((prev) => prev.filter((m) => m.cofrinhoId !== id));
    cofrinhoMovementsRef.current = cofrinhoMovementsRef.current.filter((m) => m.cofrinhoId !== id);

    setTransactions((prev) =>
      prev.map((t) => (t.cofrinhoId === id ? { ...t, cofrinhoId: undefined, cofrinhoMovementId: undefined } : t))
    );
    transactionsRef.current = transactionsRef.current.map((t) =>
      (t.cofrinhoId === id ? { ...t, cofrinhoId: undefined, cofrinhoMovementId: undefined } : t)
    );

    safeStorageSet(STORAGE_KEYS.COFRINHOS, cofrinhosRef.current);
    safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, cofrinhoMovementsRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);

    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const addCofrinhoMovement = (
    movementOrId: string | Omit<CofrinhoMovement, 'id'>,
    optionalMovement?: Omit<CofrinhoMovement, 'id' | 'cofrinhoId'>
  ): CofrinhoMovement => {
    const movement: Omit<CofrinhoMovement, 'id'> =
      typeof movementOrId === 'string' && optionalMovement
        ? { ...optionalMovement, cofrinhoId: movementOrId }
        : (movementOrId as Omit<CofrinhoMovement, 'id'>);

    const newMovement: CofrinhoMovement = {
      ...movement,
      id: 'cm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
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

    return newMovement;
  };

  const deleteCofrinhoMovement = (id: string) => {
    const mov = cofrinhoMovements.find((m) => m.id === id);
    if (mov) {
      // 1. Reverter saldos e rendimentos do cofrinho
      setCofrinhos((prev) => {
        const next = prev.map((c) => {
          if (c.id === mov.cofrinhoId) {
            const delta = mov.type === 'retirada' ? mov.amount : -mov.amount;
            const newYield =
              mov.type === 'rendimento' ? Math.max(0, c.monthlyYield - mov.amount) : c.monthlyYield;
            const newAccYield =
              mov.type === 'rendimento' ? Math.max(0, c.accumulatedYield - mov.amount) : c.accumulatedYield;
            return {
              ...c,
              currentBalance: Math.max(0, c.currentBalance + delta),
              monthlyYield: newYield,
              accumulatedYield: newAccYield,
              isDemo: false,
            };
          }
          return c;
        });
        cofrinhosRef.current = next;
        safeStorageSet(STORAGE_KEYS.COFRINHOS, next);
        return next;
      });

      // 2. Sincronizar exclusão com a lista de lançamentos (Transactions)
      setTransactions((prev) => {
        const next = prev.filter((t) => {
          if (mov.transactionId && t.id === mov.transactionId) return false;
          if (t.cofrinhoMovementId && t.cofrinhoMovementId === id) return false;
          if (id === 'cm-1' && t.id === 'tx-reserva-ricardo') return false;
          if (id === 'cm-2' && t.id === 'tx-reserva-ellen') return false;
          if (mov.type === 'aporte' && t.type === 'investimento') {
            const isSameDate = t.date === mov.date;
            const isSameAmount = Math.abs(t.amount - mov.amount) < 0.01;
            const isSamePerson = t.person === mov.person;
            if (isSameDate && isSameAmount && isSamePerson) {
              return false;
            }
          }
          return true;
        });
        transactionsRef.current = next;
        safeStorageSet(STORAGE_KEYS.TRANSACTIONS, next);
        return next;
      });

      // 3. Excluir contribuição de reserva ou investimentos vinculada
      if (mov.emergencyContributionId) {
        setEmergencyContributions((prev) => {
          const next = prev.filter((e) => e.id !== mov.emergencyContributionId);
          emergencyContributionsRef.current = next;
          safeStorageSet(STORAGE_KEYS.EMERGENCY, next);
          return next;
        });
      } else if (mov.cofrinhoId === 'cof-reserva' || id === 'cm-1' || id === 'cm-2') {
        setEmergencyContributions((prev) => {
          const next = prev.filter((e) => !(Math.abs(e.amount - mov.amount) < 0.01 && e.date === mov.date && e.person === mov.person));
          emergencyContributionsRef.current = next;
          safeStorageSet(STORAGE_KEYS.EMERGENCY, next);
          return next;
        });
      }

      if (mov.investmentContributionId) {
        setInvestmentContributions((prev) => {
          const next = prev.filter((inv) => inv.id !== mov.investmentContributionId);
          investmentContributionsRef.current = next;
          safeStorageSet(STORAGE_KEYS.INVESTMENTS, next);
          return next;
        });
      }

      // 4. Resetar status se for aporte mensal da reserva
      if (id === 'cm-1' || (mov.cofrinhoId === 'cof-reserva' && mov.person === 'Ricardo')) {
        setMonthlyAporteStatus('Ricardo', 'programado');
      }
      if (id === 'cm-2' || (mov.cofrinhoId === 'cof-reserva' && mov.person === 'Ellen')) {
        setMonthlyAporteStatus('Ellen', 'programado');
      }
    }
    deleteItemFromSupabase('cofrinho_movements', id);
    setCofrinhoMovements((prev) => prev.filter((m) => m.id !== id));
    cofrinhoMovementsRef.current = cofrinhoMovementsRef.current.filter((m) => m.id !== id);
    safeStorageSet(STORAGE_KEYS.COFRINHO_MOVEMENTS, cofrinhoMovementsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
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

    // Aporte 20% Fundo Compra da Casa Nova
    if (casaAmount > 0) {
      addCofrinhoMovement({
        cofrinhoId: 'cof-casa',
        date,
        type: 'aporte',
        amount: casaAmount,
        person,
        isExtraordinaryShare: true,
        subPurpose: 'compra_casa',
        notes: `20% de "${description}" - Destinação Fundo Compra da Casa Nova`,
      });
    }

    // Aporte 10% Lazer e Viagens
    if (lazerAmount > 0) {
      addCofrinhoMovement({
        cofrinhoId: 'cof-lazer',
        date,
        type: 'aporte',
        amount: lazerAmount,
        person,
        isExtraordinaryShare: true,
        subPurpose: 'passeios',
        notes: `10% de "${description}" - Destinação Cofrinho Lazer e Viagens`,
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
    const tripId = 'groc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
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
    deleteItemFromSupabase('grocery_trips', id);
    const relatedTxIds = transactionsRef.current.filter((t) => t.groceryTripId === id).map((t) => t.id);
    if (relatedTxIds.length > 0) {
      deleteItemFromSupabase('transactions', relatedTxIds);
    }
    setGroceryTrips((prev) => prev.filter((g) => g.id !== id));
    groceryTripsRef.current = groceryTripsRef.current.filter((g) => g.id !== id);
    setTransactions((prev) => prev.filter((t) => t.groceryTripId !== id));
    transactionsRef.current = transactionsRef.current.filter((t) => t.groceryTripId !== id);
    safeStorageSet(STORAGE_KEYS.GROCERY, groceryTripsRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
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

  const toggleEllenWeek = (weekIndex: number) => {
    setGroceryPlan((prev) => ({
      ...prev,
      ellenWeeks: (prev.ellenWeeks || []).map((w) => {
        if (w.weekIndex === weekIndex) {
          const nextCompleted = !w.completed;
          return {
            ...w,
            completed: nextCompleted,
            actualAmount: nextCompleted ? (w.actualAmount || w.plannedAmount || 80) : 0,
          };
        }
        return w;
      }),
    }));
  };

  const updateEllenWeekAmount = (weekIndex: number, amount: number) => {
    setGroceryPlan((prev) => ({
      ...prev,
      ellenWeeks: (prev.ellenWeeks || []).map((w) =>
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

  const updateGroceryPlanSettings = (settings: Partial<GroceryMonthPlan>) => {
    setGroceryPlan((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem(STORAGE_KEYS.GROCERY_PLAN, JSON.stringify(updated));
      return updated;
    });
  };

  // Shopping Lists CRUD & Conversions
  const addShoppingList = (list: Omit<ShoppingList, 'id'>) => {
    const newList: ShoppingList = {
      ...list,
      id: 'list-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setShoppingLists((prev) => [newList, ...prev]);
  };

  const updateShoppingList = (id: string, updated: Partial<ShoppingList>) => {
    setShoppingLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updated, isDemo: false } : l))
    );
  };

  const deleteShoppingList = (id: string) => {
    deleteItemFromSupabase('shopping_lists', id);
    setShoppingLists((prev) => prev.filter((l) => l.id !== id));
    shoppingListsRef.current = shoppingListsRef.current.filter((l) => l.id !== id);
    safeStorageSet(STORAGE_KEYS.SHOPPING_LISTS, shoppingListsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const copyShoppingList = (id: string) => {
    const original = shoppingLists.find((l) => l.id === id);
    if (!original) return;
    const copied: ShoppingList = {
      ...original,
      id: 'list-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
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

  const generateAutoShoppingListFromStock = () => {
    const autoList = generateSmartShoppingListFromStock(stockItems, groceryTrips, selectedMonth);
    if (autoList.items.length === 0) {
      alert('Todos os itens em estoque estão em nível suficiente! Nenhuma reposição imediata é necessária.');
      return;
    }
    const newList: ShoppingList = {
      ...autoList,
      id: 'list-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setShoppingLists((prev) => [newList, ...prev]);
  };

  const convertShoppingListToTrip = (
    listId: string,
    storeName: string,
    person: Person,
    paymentMethod: PaymentMethod,
    totalAmount?: number,
    tripType?: 'semanal' | 'mensal' | 'extraordinaria',
    weekNumber?: number,
    savingsAmount?: number,
    customItems?: ShoppingListItem[]
  ) => {
    const list = shoppingLists.find((l) => l.id === listId);
    if (!list && !customItems) return;

    const sourceItems = customItems || list?.items || [];
    const completedItems = sourceItems.filter((i) => i.completed || (i.actualPricePaid && i.actualPricePaid > 0));
    const itemsToConvert = completedItems.length > 0 ? completedItems : sourceItems;
    
    const products: GroceryProduct[] = itemsToConvert.map((item) => {
      const unitPrice = item.actualPricePaid && item.quantity ? item.actualPricePaid / item.quantity : (item.lastPricePaid || item.estimatedPrice || 0);
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

    const computedTotal = products.reduce((sum, p) => sum + p.totalPrice, 0);
    const finalAmount = totalAmount !== undefined && totalAmount > 0 ? totalAmount : (computedTotal > 0 ? computedTotal : (list?.estimatedTotal || 0));
    const today = new Date().toISOString().slice(0, 10);

    // 1. Add Grocery Trip
    addGroceryTrip({
      date: today,
      storeName: storeName || 'Supermercado',
      totalAmount: finalAmount,
      person: person || 'Família',
      paymentMethod: paymentMethod || 'debito',
      isExtraordinary: tripType === 'extraordinaria',
      notes: `Compra realizada no ${storeName || 'Mercado'}${savingsAmount ? ` (Economia: R$ ${savingsAmount.toFixed(2)})` : ''}. Gerada da lista: ${list?.name || 'Lista de Compras'}.`,
      items: products,
      products,
    });

    // 2. Synchronize Stock: update purchased items' lastPurchaseDate and mark sufficient
    setStockItems((prevStock) => {
      return prevStock.map((stock) => {
        const matchingBought = itemsToConvert.find(
          (bought) =>
            bought.product.toLowerCase().includes(stock.product.toLowerCase()) ||
            stock.product.toLowerCase().includes(bought.product.toLowerCase())
        );
        if (matchingBought) {
          return {
            ...stock,
            lastPurchaseDate: today,
            status: 'suficiente',
            lastPricePaid: matchingBought.actualPricePaid || matchingBought.estimatedPrice || stock.lastPricePaid,
            store: storeName || stock.store,
            isDemo: false,
          };
        }
        return stock;
      });
    });

    // 3. Mark all converted items in shopping list as completed
    if (list) {
      setShoppingLists((prevLists) =>
        prevLists.map((l) =>
          l.id === listId
            ? {
                ...l,
                items: l.items.map((i) => ({ ...i, completed: true })),
                isDemo: false,
              }
            : l
        )
      );
    }

    // 4. Update Grocery Plan if weekly
    if (tripType === 'semanal' && weekNumber) {
      if (person === 'Ricardo') {
        updateRicardoWeekAmount(weekNumber, finalAmount);
      } else if (person === 'Ellen') {
        updateEllenWeekAmount(weekNumber, finalAmount);
      }
    }
  };

  // Stock Items CRUD
  const addStockItem = (item: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...item,
      id: 'stk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setStockItems((prev) => [newItem, ...prev]);
  };

  const updateStockItem = (id: string, updated: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated, isDemo: false } : s))
    );
  };

  const deleteStockItem = (id: string) => {
    deleteItemFromSupabase('stock_items', id);
    setStockItems((prev) => prev.filter((s) => s.id !== id));
    stockItemsRef.current = stockItemsRef.current.filter((s) => s.id !== id);
    safeStorageSet(STORAGE_KEYS.STOCK_ITEMS, stockItemsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  // Cesta Basica CRUD
  const addCestaBasicaRecord = (record: Omit<CestaBasicaRecord, 'id'>) => {
    const newRecord: CestaBasicaRecord = {
      ...record,
      id: 'cesta-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
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
    deleteItemFromSupabase('cesta_basica_records', id);
    setCestaBasicaRecords((prev) => prev.filter((c) => c.id !== id));
    cestaBasicaRecordsRef.current = cestaBasicaRecordsRef.current.filter((c) => c.id !== id);
    safeStorageSet(STORAGE_KEYS.CESTA_BASICA, cestaBasicaRecordsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
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
    const invId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const txId = inv.transactionId || 'tx-inv-' + invId;

    const newTx: Transaction = {
      id: txId,
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
      investmentContributionId: invId,
      notes: inv.notes,
    };

    const newInv: InvestmentContribution = {
      ...inv,
      id: invId,
      transactionId: txId,
    };

    setInvestmentContributions((prev) => [newInv, ...prev]);
    if (!inv.transactionId) {
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const deleteInvestmentContribution = (id: string) => {
    deleteItemFromSupabase('investment_contributions', id);
    const inv = investmentContributions.find((item) => item.id === id);
    const relatedTxIds = transactionsRef.current
      .filter((t) => t.id === 'tx-inv-' + id || t.investmentContributionId === id || (inv?.transactionId && t.id === inv.transactionId))
      .map((t) => t.id);
    if (relatedTxIds.length > 0) {
      deleteItemFromSupabase('transactions', relatedTxIds);
    }
    setInvestmentContributions((prev) => prev.filter((item) => item.id !== id));
    investmentContributionsRef.current = investmentContributionsRef.current.filter((item) => item.id !== id);
    setTransactions((prev) =>
      prev.filter((t) => t.id !== 'tx-inv-' + id && t.investmentContributionId !== id && (!inv?.transactionId || t.id !== inv.transactionId))
    );
    transactionsRef.current = transactionsRef.current.filter((t) => t.id !== 'tx-inv-' + id && t.investmentContributionId !== id && (!inv?.transactionId || t.id !== inv.transactionId));
    if (inv?.cofrinhoMovementId) {
      deleteCofrinhoMovement(inv.cofrinhoMovementId);
    }
    safeStorageSet(STORAGE_KEYS.INVESTMENTS, investmentContributionsRef.current);
    safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const addEmergencyContribution = (efc: Omit<EmergencyFundContribution, 'id'>) => {
    const efcId = 'efc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    
    // Add to Cofrinho Reserva as well if not already passed with cofrinhoMovementId
    let createdMovId = efc.cofrinhoMovementId;
    if (!createdMovId) {
      const targetCofId =
        efc.person === 'Ellen' || efc.institution?.toLowerCase().includes('ellen')
          ? 'cof-reserva-ellen'
          : 'cof-reserva';

      const mov = addCofrinhoMovement({
        cofrinhoId: targetCofId,
        date: efc.date,
        type: 'aporte',
        amount: efc.amount,
        person: efc.person,
        transactionId: efc.transactionId,
        emergencyContributionId: efcId,
        notes: efc.notes || `Aporte Reserva de Emergência (${efc.institution})`,
      });
      createdMovId = mov.id;
    }

    const newEfc: EmergencyFundContribution = {
      ...efc,
      id: efcId,
      cofrinhoMovementId: createdMovId,
    };
    setEmergencyContributions((prev) => [newEfc, ...prev]);
  };

  const deleteEmergencyContribution = (id: string) => {
    deleteItemFromSupabase('emergency_contributions', id);
    const efc = emergencyContributions.find((e) => e.id === id);
    if (efc?.transactionId) {
      deleteItemFromSupabase('transactions', efc.transactionId);
      setTransactions((prev) => prev.filter((t) => t.id !== efc.transactionId));
      transactionsRef.current = transactionsRef.current.filter((t) => t.id !== efc.transactionId);
      safeStorageSet(STORAGE_KEYS.TRANSACTIONS, transactionsRef.current);
    }
    if (efc?.cofrinhoMovementId) {
      deleteCofrinhoMovement(efc.cofrinhoMovementId);
    }
    setEmergencyContributions((prev) => prev.filter((e) => e.id !== id));
    emergencyContributionsRef.current = emergencyContributionsRef.current.filter((e) => e.id !== id);
    safeStorageSet(STORAGE_KEYS.EMERGENCY, emergencyContributionsRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const updateEmergencySettings = (updated: Partial<EmergencyFundSettings>) => {
    setEmergencySettings((prev) => ({ ...prev, ...updated }));
  };

  // Total Emergency Fund Balance (soma consolidada de todas as reservas)
  const totalEmergencyFund = useMemo(() => {
    const reservaCofs = cofrinhos.filter((c) => c.type === 'reserva');
    if (reservaCofs.length > 0) {
      return reservaCofs.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
    }
    return emergencyContributions.reduce((acc, e) => acc + e.amount, 0);
  }, [cofrinhos, emergencyContributions]);

  // Reserva individual do Ricardo
  const ricardoEmergencyFund = useMemo(() => {
    const cof = cofrinhos.find((c) => c.id === 'cof-reserva' || (c.type === 'reserva' && c.person === 'Ricardo'));
    return cof ? cof.currentBalance : 0;
  }, [cofrinhos]);

  // Reserva individual da Ellen
  const ellenEmergencyFund = useMemo(() => {
    const cof = cofrinhos.find((c) => c.id === 'cof-reserva-ellen' || (c.type === 'reserva' && c.person === 'Ellen'));
    return cof ? cof.currentBalance : 0;
  }, [cofrinhos]);

  // Credit Card Invoices per Month
  const getCardInvoicesForMonth = useCallback((monthKey: string): CardInvoiceSummary[] => {
    return cards.map((card) => {
      // 1. Regular transactions linked to this card
      const cardTxs = transactions.filter((t) => {
        if (t.cardId !== card.id) return false;
        return (t.competenceMonth || getMonthKey(t.date)) === monthKey;
      });

      // 2. Active recurring subscriptions on this card
      const activeSubs = cardSubscriptions.filter((sub) => {
        if (sub.cardId !== card.id) return false;
        if (sub.status && sub.status !== 'active') return false;
        if (sub.isActive === false) return false;
        // Check starting month
        if (sub.startMonth && sub.startMonth > monthKey) return false;
        return true;
      });

      const txItems = cardTxs.map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        person: t.person,
        date: t.date,
        installmentInfo: t.installmentInfo,
        isCardSubscription: t.isCardSubscription || !!t.subscriptionId,
        subscriptionId: t.subscriptionId,
        isDemo: t.isDemo,
      }));

      // Subscriptions that don't already have an explicit transaction logged in cardTxs for this month
      const subItems = activeSubs
        .filter((sub) => !cardTxs.some((t) => t.subscriptionId === sub.id))
        .map((sub) => {
          const dueDay = card ? String(card.dueDay).padStart(2, '0') : '10';
          const subTitle = sub.name || sub.description || 'Assinatura';
          return {
            id: `sub-item-${sub.id}-${monthKey}`,
            description: `${subTitle} (Assinatura Recorrente)`,
            amount: sub.amount,
            person: sub.person,
            date: `${monthKey}-${dueDay}`,
            installmentInfo: undefined,
            isCardSubscription: true,
            subscriptionId: sub.id,
            isDemo: sub.isDemo,
          };
        });

      const allItems = [...txItems, ...subItems];
      const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
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
        items: allItems,
      };
    });
  }, [cards, transactions, cardSubscriptions]);

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
    const transfersSentByPerson: Record<Person, number> = { Ricardo: 0, Ellen: 0, Família: 0 };
    const transfersReceivedAsExtraByPerson: Record<Person, number> = { Ricardo: 0, Ellen: 0, Família: 0 };

    monthTxs.forEach((t) => {
      // Transferências
      if (t.type === 'transferencia') {
        if (t.isExternalTransfer || t.transferType === 'externa') {
          // Transferência externa recebida é contabilizada como receita
          extraordinaryIncome += t.amount;
          incomeByPerson[t.person] = (incomeByPerson[t.person] || 0) + t.amount;
        } else {
          // Transferência entre Ricardo e Ellen (ou entre usuários):
          // "tem que ser considera a inclusao no saldo da pessoa que esta recebendo a transferencia como extra.
          //  E nao pode ser somada a receita pois esta saindo de um e indo para outro, so se for recebida uma transferencia externa. Entre os usuarios nao."
          const sender = t.person;
          const recipient = t.destinationPerson || (sender === 'Ricardo' ? 'Ellen' : 'Ricardo');

          transfersSentByPerson[sender] = (transfersSentByPerson[sender] || 0) + t.amount;
          transfersReceivedAsExtraByPerson[recipient] = (transfersReceivedAsExtraByPerson[recipient] || 0) + t.amount;
        }
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

    // Faturas de Cartão de Ricardo e Ellen
    let ricardoInvoiceTotal = 0;
    let ellenInvoiceTotal = 0;
    const currentInvoices = getCardInvoicesForMonth(selectedMonth);
    currentInvoices.forEach((inv) => {
      if (inv.card.person === 'Ricardo') ricardoInvoiceTotal += inv.totalAmount;
      else if (inv.card.person === 'Ellen') ellenInvoiceTotal += inv.totalAmount;
    });

    // Contabilizar assinaturas e débitos recorrentes de cartões no demonstrativo do mês
    const activeSubs = cardSubscriptions.filter((sub) => {
      if (sub.status && sub.status !== 'active') return false;
      if (sub.isActive === false) return false;
      if (sub.startMonth && sub.startMonth > selectedMonth) return false;
      if (sub.endMonth && sub.endMonth < selectedMonth) return false;
      return true;
    });

    let cardSubscriptionsTotal = 0;
    let ricardoSubscriptionsTotal = 0;
    let ellenSubscriptionsTotal = 0;

    activeSubs.forEach((sub) => {
      cardSubscriptionsTotal += sub.amount;
      if (sub.person === 'Ricardo') ricardoSubscriptionsTotal += sub.amount;
      else if (sub.person === 'Ellen') ellenSubscriptionsTotal += sub.amount;

      // Se a assinatura ainda não foi lançada como transação avulsa no extrato, contabiliza como despesa recorrente
      const alreadyInTxs = monthTxs.some((t) => t.subscriptionId === sub.id);
      if (!alreadyInTxs) {
        totalExpense += sub.amount;
        recurringExpense += sub.amount;
        expenseByPerson[sub.person] = (expenseByPerson[sub.person] || 0) + sub.amount;
      }
    });

    const totalInvoicesAmount = ricardoInvoiceTotal + ellenInvoiceTotal;
    const totalIncome = recurringIncome + extraordinaryIncome + reimbursementIncome;
    const availableBalance = totalIncome - totalExpense - totalInvested;

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
      cardSubscriptionsTotal,
      ricardoSubscriptionsTotal,
      ellenSubscriptionsTotal,
      totalInvoicesAmount,
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
      transfersSentByPerson,
      transfersReceivedAsExtraByPerson,
      netBalanceByPerson: {
        Ricardo:
          (incomeByPerson['Ricardo'] || 0) +
          (transfersReceivedAsExtraByPerson['Ricardo'] || 0) -
          (expenseByPerson['Ricardo'] || 0) -
          (transfersSentByPerson['Ricardo'] || 0),
        Ellen:
          (incomeByPerson['Ellen'] || 0) +
          (transfersReceivedAsExtraByPerson['Ellen'] || 0) -
          (expenseByPerson['Ellen'] || 0) -
          (transfersSentByPerson['Ellen'] || 0),
        Família: (incomeByPerson['Família'] || 0) - (expenseByPerson['Família'] || 0),
      },
    };
  }, [
    transactions,
    selectedMonth,
    cards,
    cardSubscriptions,
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
    deleteItemFromSupabase('renovation_expenses', id);
    setRenovationExpenses((prev) => prev.filter((r) => r.id !== id));
    renovationExpensesRef.current = renovationExpensesRef.current.filter((r) => r.id !== id);
    safeStorageSet(STORAGE_KEYS.RENOVATION_EXPENSES, renovationExpensesRef.current);
    hasPendingLocalChangesRef.current = true;
    setTimeout(() => flushPushToSupabase(), 40);
  };

  const updateFutureRentSettings = (settings: Partial<FutureRentSettings>) => {
    setFutureRentSettings((prev) => ({ ...prev, ...settings }));
  };

  // Fechamento Mensal
  const toggleClosingChecklistItem = (monthKey: string, itemId: string) => {
    setClosingChecklists((prev) => {
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        return [
          ...prev,
          {
            monthKey,
            isClosed: false,
            checkedItems: {
              [itemId]: true,
            },
          },
        ];
      }
      return prev.map((c) => {
        if (c.monthKey !== monthKey) return c;
        const currentChecked = c.checkedItems || {};
        return {
          ...c,
          checkedItems: {
            ...currentChecked,
            [itemId]: !currentChecked[itemId],
          },
        };
      });
    });
  };

  const uncheckAllClosingChecklistItems = (monthKey: string) => {
    setClosingChecklists((prev) => {
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        return [
          ...prev,
          {
            monthKey,
            isClosed: false,
            checkedItems: {},
          },
        ];
      }
      return prev.map((c) => (c.monthKey === monthKey ? { ...c, checkedItems: {} } : c));
    });
  };

  const checkAllClosingChecklistItems = (monthKey: string) => {
    setClosingChecklists((prev) => {
      const allCheckedMap: Record<string, boolean> = {
        salario_ricardo: true,
        salario_ellen: true,
        rendas_extraordinarias: true,
        reserva_ricardo_500: true,
        reserva_ellen_500: true,
        fatura_ricardo: true,
        fatura_ellen: true,
        parcelas_futuras: true,
        supermercado_ricardo_semanal: true,
        supermercado_ellen_mensal: true,
        compras_supermercado_detalhadas: true,
        rendimentos_cofrinhos: true,
        credito_reforma: true,
        saldos_bancarios: true,
      };
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        return [
          ...prev,
          {
            monthKey,
            isClosed: false,
            checkedItems: allCheckedMap,
          },
        ];
      }
      return prev.map((c) => (c.monthKey === monthKey ? { ...c, checkedItems: allCheckedMap } : c));
    });
  };

  const toggleMonthClosed = (monthKey: string) => {
    setClosingChecklists((prev) => {
      const existing = prev.find((c) => c.monthKey === monthKey);
      if (!existing) {
        return [
          ...prev,
          {
            monthKey,
            isClosed: true,
            closedAt: new Date().toISOString(),
            checkedItems: {},
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
        return [
          ...prev,
          {
            monthKey,
            isClosed: false,
            notes,
            checkedItems: {},
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
      cofrinhoMovements,
      groceryTrips,
      groceryPlan,
      renovationExpenses,
      futureRent: futureRentSettings,
      installmentPurchases,
      closingChecklists,
      salarySettings,
      emergencySettings,
      person1Name,
      person2Name,
    });
  };

  // Total Cumulative Balance (all recorded history excluding internal transfers)
  const cumulativeBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'transferencia') {
        if (t.isExternalTransfer || t.transferType === 'externa') {
          return acc + t.amount;
        }
        return acc;
      }
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
      cardSubscriptions,
      cofrinhos,
      cofrinhoMovements,
      installmentPurchases,
      groceryTrips,
      groceryPlan,
      groceryPlansByMonth,
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
      customCategories,
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
      function ensureUniqueIds<T extends { id?: string }>(arr: T[], prefix: string): T[] {
        const seen = new Set<string>();
        return arr.map((item, idx) => {
          if (!item.id || seen.has(item.id)) {
            const newId = `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            seen.add(newId);
            return { ...item, id: newId };
          }
          seen.add(item.id);
          return item;
        });
      }

      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        setTransactions(ensureUniqueIds(parsed.transactions, 'tx'));
      }
      if (parsed.cards && Array.isArray(parsed.cards)) {
        setCards(ensureUniqueIds(parsed.cards, 'card'));
      }
      if (parsed.cardSubscriptions && Array.isArray(parsed.cardSubscriptions)) {
        setCardSubscriptions(ensureUniqueIds(parsed.cardSubscriptions, 'sub'));
      }
      if (parsed.cofrinhos && Array.isArray(parsed.cofrinhos)) {
        setCofrinhos(ensureUniqueIds(parsed.cofrinhos, 'cof'));
      }
      if (parsed.cofrinhoMovements && Array.isArray(parsed.cofrinhoMovements)) {
        setCofrinhoMovements(ensureUniqueIds(parsed.cofrinhoMovements, 'cm'));
      }
      if (parsed.installmentPurchases && Array.isArray(parsed.installmentPurchases)) {
        setInstallmentPurchases(ensureUniqueIds(parsed.installmentPurchases, 'inst'));
      }
      if (parsed.groceryTrips && Array.isArray(parsed.groceryTrips)) {
        setGroceryTrips(ensureUniqueIds(parsed.groceryTrips, 'groc'));
      }
      if (parsed.groceryPlansByMonth && typeof parsed.groceryPlansByMonth === 'object') {
        setGroceryPlansByMonth(parsed.groceryPlansByMonth);
      }
      if (parsed.groceryPlan) {
        setGroceryPlan(parsed.groceryPlan);
      }
      if (parsed.shoppingLists && Array.isArray(parsed.shoppingLists)) {
        setShoppingLists(ensureUniqueIds(parsed.shoppingLists, 'list'));
      }
      if (parsed.stockItems && Array.isArray(parsed.stockItems)) {
        setStockItems(ensureUniqueIds(parsed.stockItems, 'stk'));
      }
      if (parsed.cestaBasicaRecords && Array.isArray(parsed.cestaBasicaRecords)) {
        setCestaBasicaRecords(ensureUniqueIds(parsed.cestaBasicaRecords, 'cesta'));
      }
      if (parsed.salarySettings) {
        setSalarySettings(parsed.salarySettings);
      }
      if (parsed.investmentContributions && Array.isArray(parsed.investmentContributions)) {
        setInvestmentContributions(ensureUniqueIds(parsed.investmentContributions, 'inv'));
      }
      if (parsed.emergencyContributions && Array.isArray(parsed.emergencyContributions)) {
        setEmergencyContributions(ensureUniqueIds(parsed.emergencyContributions, 'efc'));
      }
      if (parsed.emergencySettings) {
        setEmergencySettings(parsed.emergencySettings);
      }
      if (parsed.globalCofrinhoSettings) {
        setGlobalCofrinhoSettings(parsed.globalCofrinhoSettings);
      }
      if (parsed.houseFundSettings) {
        setHouseFundSettings(parsed.houseFundSettings);
      }
      if (parsed.renovationExpenses && Array.isArray(parsed.renovationExpenses)) {
        setRenovationExpenses(ensureUniqueIds(parsed.renovationExpenses, 'renov'));
      }
      if (parsed.futureRentSettings) {
        setFutureRentSettings(parsed.futureRentSettings);
      }
      if (parsed.closingChecklists && Array.isArray(parsed.closingChecklists)) {
        setClosingChecklists(parsed.closingChecklists);
      }
      if (parsed.customCategories) {
        setCustomCategories(parsed.customCategories);
      }
      return true;
    } catch (e) {
      console.error('Falha ao importar backup JSON:', e);
      return false;
    }
  };

  const restoreFromSnapshot = useCallback(
    (snapshot: VaultSnapshot): boolean => {
      if (!snapshot || !snapshot.data) return false;
      const ok = importBackupJSON(JSON.stringify(snapshot.data));
      if (ok) {
        setRecoverableSnapshot(null);
        setRecoveryBannerDismissed(true);
        forceSaveNow();
      }
      return ok;
    },
    [forceSaveNow]
  );

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
        cardSubscriptions,
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
        deleteInstallmentFromMonth,
        earlyPayInstallment,
        addCardSubscription,
        updateCardSubscription,
        deleteCardSubscription,
        addCofrinho,
        updateCofrinho,
        adjustCofrinhoBalance,
        recalculateCofrinhoBalancesFromMovements,
        resetAllCofrinhosToZero,
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
        uncheckAllClosingChecklistItems,
        checkAllClosingChecklistItems,
        toggleMonthClosed,
        updateClosingNotes,
        dismissAlert,
        addGroceryTrip,
        updateGroceryTrip,
        deleteGroceryTrip,
        setGroceryPlanningMode,
        toggleRicardoWeek,
        updateRicardoWeekAmount,
        toggleEllenWeek,
        updateEllenWeekAmount,
        toggleEllenGrocery,
        updateEllenGroceryAmount,
        groceryMonthlyGoal,
        setGroceryMonthlyGoal,
        updateGroceryPlanSettings,
        addShoppingList,
        updateShoppingList,
        deleteShoppingList,
        copyShoppingList,
        generateAutoShoppingListFromStock,
        convertShoppingListToTrip,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        addCestaBasicaRecord,
        deleteCestaBasicaRecord,
        updateSalarySettings,
        person1Name,
        person2Name,
        customCategories,
        addCustomCategory,
        addInvestmentContribution,
        deleteInvestmentContribution,
        addEmergencyContribution,
        deleteEmergencyContribution,
        updateEmergencySettings,
        currentMonthSummary,
        getCardInvoicesForMonth,
        cumulativeBalance,
        totalEmergencyFund,
        ricardoEmergencyFund,
        ellenEmergencyFund,
        renovationCreditTotal,
        renovationCredit: renovationCreditTotal,
        theme,
        isDarkMode,
        toggleTheme,
        setTheme,
        saveStatus,
        lastSavedTime,
        lastSavedTimestamp,
        forceSaveNow,
        purgeWeekOldData,
        restorePoints,
        recoverableSnapshot,
        recoveryBannerDismissed,
        restoreFromSnapshot,
        createManualRestorePoint,
        dismissRecoveryBanner,
        isSupabaseConnected,
        supabaseAutoSyncEnabled,
        setSupabaseAutoSyncEnabled,
        supabaseSyncInterval,
        setSupabaseSyncInterval,
        supabaseNextSyncSeconds,
        supabaseLastSyncTime,
        supabaseSyncStatus,
        supabaseSyncError,
        syncWithSupabase,
        reconnectSupabase,
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

