import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreditCard,
  Transaction,
  InstallmentPurchase,
  CardSubscription,
  GroceryTrip,
  GroceryMonthPlan,
  ShoppingList,
  StockItem,
  CestaBasicaRecord,
  Cofrinho,
  CofrinhoMovement,
  EmergencyFundContribution,
  InvestmentContribution,
  RenovationExpense,
  MonthlyClosingChecklist,
  SalarySettings,
  EmergencyFundSettings,
  HouseFundSettings,
  FutureRentSettings,
  GlobalCofrinhoSettings,
} from '../types';

// Environment variables
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim().length > 0 &&
    supabaseAnonKey.trim().length > 0 &&
    supabaseUrl.startsWith('https://')
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!clientInstance && supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
  }
  return clientInstance;
};

/**
 * Testa a conexão com o Supabase
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; error?: any }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase não configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase não inicializado.');

    const { error } = await client.from('app_settings').select('id').limit(1);
    if (error) {
      // Se a tabela não existir ainda, orientar a rodar a migration
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: false,
          message: 'Conectado ao Supabase com sucesso, mas as tabelas ainda não foram criadas. Execute a migration no SQL Editor.',
          error,
        };
      }
      return { success: false, message: `Erro ao consultar Supabase: ${error.message}`, error };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na conexão: ${err.message || String(err)}`, error: err };
  }
};

/**
 * Envia todos os dados locais para o Supabase (Upsert completo)
 */
export const pushLocalDataToSupabase = async (payload: {
  cards: CreditCard[];
  transactions: Transaction[];
  installmentPurchases: InstallmentPurchase[];
  cardSubscriptions: CardSubscription[];
  groceryTrips: GroceryTrip[];
  groceryMonthPlans: GroceryMonthPlan[];
  shoppingLists: ShoppingList[];
  stockItems: StockItem[];
  cestaBasicaRecords: CestaBasicaRecord[];
  cofrinhos: Cofrinho[];
  cofrinhoMovements: CofrinhoMovement[];
  emergencyContributions: EmergencyFundContribution[];
  investmentContributions: InvestmentContribution[];
  renovationExpenses: RenovationExpense[];
  monthlyClosingChecklists: Record<string, MonthlyClosingChecklist>;
  salarySettings: SalarySettings;
  emergencySettings: EmergencyFundSettings;
  houseFundSettings: HouseFundSettings;
  futureRentSettings: FutureRentSettings;
  globalCofrinhoSettings: GlobalCofrinhoSettings;
}): Promise<{ success: boolean; message: string; details?: Record<string, number> }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase não configurado.' };
  }

  const details: Record<string, number> = {};

  try {
    // 1. App Settings
    const settingsRows = [
      { id: 'salary_settings', category: 'salary', value: payload.salarySettings },
      { id: 'emergency_settings', category: 'emergency', value: payload.emergencySettings },
      { id: 'house_fund_settings', category: 'house', value: payload.houseFundSettings },
      { id: 'future_rent_settings', category: 'rent', value: payload.futureRentSettings },
      { id: 'global_cofrinho_settings', category: 'cofrinho', value: payload.globalCofrinhoSettings },
    ];
    const { error: errSettings } = await client.from('app_settings').upsert(settingsRows);
    if (errSettings) throw new Error(`app_settings: ${errSettings.message}`);
    details.settings = settingsRows.length;

    // 2. Credit Cards
    if (payload.cards.length > 0) {
      const cardRows = payload.cards.map((c) => ({
        id: c.id,
        name: c.name,
        person: c.person,
        closing_day: c.closingDay,
        due_day: c.dueDay,
        monthly_limit_goal: c.monthlyLimitGoal,
        color: c.color,
        brand: c.brand,
        is_demo: Boolean(c.isDemo),
      }));
      const { error } = await client.from('credit_cards').upsert(cardRows);
      if (error) throw new Error(`credit_cards: ${error.message}`);
      details.cards = cardRows.length;
    }

    // 3. Installment Purchases
    if (payload.installmentPurchases.length > 0) {
      const instRows = payload.installmentPurchases.map((ip) => ({
        id: ip.id,
        description: ip.description,
        person: ip.person,
        total_amount: ip.totalAmount,
        installment_amount: ip.installmentAmount,
        current_installment: ip.currentInstallment || 1,
        total_installments: ip.totalInstallments,
        remaining_installments: ip.remainingInstallments,
        purchase_date: ip.purchaseDate || null,
        first_due_date: ip.firstDueDate || null,
        last_due_date: ip.lastDueDate || null,
        category: ip.category,
        status: ip.status || 'ativa',
        early_paid_installments: ip.earlyPaidInstallments || 0,
        early_paid_date: ip.earlyPaidDate || null,
        card_id: ip.cardId || null,
        notes: ip.notes || null,
        is_demo: Boolean(ip.isDemo),
      }));
      const { error } = await client.from('installment_purchases').upsert(instRows);
      if (error) throw new Error(`installment_purchases: ${error.message}`);
      details.installmentPurchases = instRows.length;
    }

    // 4. Card Subscriptions
    if (payload.cardSubscriptions.length > 0) {
      const subRows = payload.cardSubscriptions.map((s) => ({
        id: s.id,
        name: s.name || s.description,
        description: s.description,
        amount: s.amount,
        person: s.person,
        card_id: s.cardId,
        category: s.category,
        billing_day: s.billingDay || null,
        start_month: s.startMonth || null,
        end_month: s.endMonth || null,
        is_active: s.isActive ?? true,
        status: s.status || 'active',
        notes: s.notes || null,
        is_demo: Boolean(s.isDemo),
      }));
      const { error } = await client.from('card_subscriptions').upsert(subRows);
      if (error) throw new Error(`card_subscriptions: ${error.message}`);
      details.cardSubscriptions = subRows.length;
    }

    // 5. Transactions
    if (payload.transactions.length > 0) {
      const txRows = payload.transactions.map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        subcategory: t.subcategory || null,
        person: t.person,
        date: t.date,
        competence_month: t.competenceMonth,
        paid: t.paid,
        is_recurring: t.isRecurring,
        is_reimbursable: Boolean(t.isReimbursable),
        payment_method: t.paymentMethod,
        account_or_pot: t.accountOrPot || null,
        notes: t.notes || null,
        card_id: t.cardId || null,
        purchase_date: t.purchaseDate || null,
        installment_info: t.installmentInfo || null,
        subscription_id: t.subscriptionId || null,
        is_card_subscription: Boolean(t.isCardSubscription),
        grocery_trip_id: t.groceryTripId || null,
        cofrinho_movement_id: t.cofrinhoMovementId || null,
        cofrinho_id: t.cofrinhoId || null,
        investment_contribution_id: t.investmentContributionId || null,
        emergency_contribution_id: t.emergencyContributionId || null,
        is_demo: Boolean(t.isDemo),
      }));
      // Inserir em lotes de 50 para evitar limites de payload
      for (let i = 0; i < txRows.length; i += 50) {
        const chunk = txRows.slice(i, i + 50);
        const { error } = await client.from('transactions').upsert(chunk);
        if (error) throw new Error(`transactions (bloco ${i}): ${error.message}`);
      }
      details.transactions = txRows.length;
    }

    // 6. Grocery Trips
    if (payload.groceryTrips.length > 0) {
      const tripRows = payload.groceryTrips.map((gt) => ({
        id: gt.id,
        date: gt.date,
        store_name: gt.storeName,
        total_amount: gt.totalAmount,
        person: gt.person,
        payment_method: gt.paymentMethod,
        trip_type: gt.tripType || 'semanal',
        week_number: gt.weekNumber || null,
        is_extraordinary: Boolean(gt.isExtraordinary),
        notes: gt.notes || null,
        items: gt.items || gt.products || [],
        promo_savings: gt.promoSavings || gt.promotionalSavings || 0,
        cpf_app_savings: gt.cpfAppSavings || gt.appOrCpfSavings || 0,
        card_savings: gt.cardSavings || gt.storeCardSavings || 0,
        is_demo: Boolean(gt.isDemo),
      }));
      const { error } = await client.from('grocery_trips').upsert(tripRows);
      if (error) throw new Error(`grocery_trips: ${error.message}`);
      details.groceryTrips = tripRows.length;
    }

    // 7. Grocery Month Plans
    if (payload.groceryMonthPlans.length > 0) {
      const planRows = payload.groceryMonthPlans.map((gp) => ({
        month_key: gp.monthKey,
        mode: gp.mode,
        total_weeks: gp.totalWeeks,
        monthly_goal: gp.monthlyGoal || 1000,
        ricardo_weekly_planned: gp.ricardoWeeklyPlanned,
        ricardo_weeks: gp.ricardoWeeks,
        ellen_planning_type: gp.ellenPlanningType || 'mensal',
        ellen_monthly_planned: gp.ellenMonthlyPlanned,
        ellen_weekly_planned: gp.ellenWeeklyPlanned || null,
        ellen_actual_amount: gp.ellenActualAmount || 0,
        ellen_completed: Boolean(gp.ellenCompleted),
        ellen_weeks: gp.ellenWeeks || [],
        carry_over_enabled: gp.carryOverEnabled ?? true,
        ellen_carry_over_enabled: gp.ellenCarryOverEnabled ?? false,
      }));
      const { error } = await client.from('grocery_month_plans').upsert(planRows);
      if (error) throw new Error(`grocery_month_plans: ${error.message}`);
      details.groceryMonthPlans = planRows.length;
    }

    // 8. Cofrinhos
    if (payload.cofrinhos.length > 0) {
      const cofRows = payload.cofrinhos.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        objective: c.objective || null,
        description: c.description || null,
        person: c.person,
        institution: c.institution,
        application_type: c.applicationType,
        yield_type: c.yieldType,
        cdi_percentage: c.cdiPercentage || null,
        custom_annual_rate: c.customAnnualRate || null,
        initial_balance: c.initialBalance,
        current_balance: c.currentBalance,
        monthly_yield: c.monthlyYield,
        accumulated_yield: c.accumulatedYield,
        gross_yield: c.grossYield || 0,
        tax_and_fees: c.taxAndFees || 0,
        start_date: c.startDate || null,
        target_amount: c.targetAmount || null,
        target_date: c.targetDate || null,
        status: c.status,
        color: c.color,
        icon_name: c.iconName || null,
        sub_category_purpose: c.subCategoryPurpose || null,
        notes: c.notes || null,
        is_demo: Boolean(c.isDemo),
      }));
      const { error } = await client.from('cofrinhos').upsert(cofRows);
      if (error) throw new Error(`cofrinhos: ${error.message}`);
      details.cofrinhos = cofRows.length;
    }

    // 9. Cofrinho Movements
    if (payload.cofrinhoMovements.length > 0) {
      const movRows = payload.cofrinhoMovements.map((m) => ({
        id: m.id,
        cofrinho_id: m.cofrinhoId,
        date: m.date,
        type: m.type,
        amount: m.amount,
        person: m.person,
        gross_amount: m.grossAmount || null,
        tax_amount: m.taxAmount || null,
        is_extraordinary_share: Boolean(m.isExtraordinaryShare),
        sub_purpose: m.subPurpose || null,
        destination_cofrinho_id: m.destinationCofrinhoId || null,
        transaction_id: m.transactionId || null,
        emergency_contribution_id: m.emergencyContributionId || null,
        investment_contribution_id: m.investmentContributionId || null,
        notes: m.notes || null,
        is_demo: Boolean(m.isDemo),
      }));
      const { error } = await client.from('cofrinho_movements').upsert(movRows);
      if (error) throw new Error(`cofrinho_movements: ${error.message}`);
      details.cofrinhoMovements = movRows.length;
    }

    // 10. Renovation Expenses
    if (payload.renovationExpenses.length > 0) {
      const renRows = payload.renovationExpenses.map((r) => ({
        id: r.id,
        date: r.date,
        description: r.description,
        amount: r.amount,
        paid_by: r.paidBy,
        receipt_description: r.receiptDescription || null,
        owner_authorized: r.ownerAuthorized || 'pendente',
        requested_amount: r.requestedAmount || 0,
        accepted_amount: r.acceptedAmount || 0,
        under_analysis_amount: r.underAnalysisAmount || 0,
        already_compensated_amount: r.alreadyCompensatedAmount || 0,
        notes: r.notes || null,
        is_demo: Boolean(r.isDemo),
      }));
      const { error } = await client.from('renovation_expenses').upsert(renRows);
      if (error) throw new Error(`renovation_expenses: ${error.message}`);
      details.renovationExpenses = renRows.length;
    }

    return {
      success: true,
      message: 'Sincronização com o Supabase concluída com sucesso!',
      details,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro na sincronização: ${err.message || String(err)}`,
      details,
    };
  }
};

/**
 * Lê todos os dados salvos no Supabase
 */
export const pullDataFromSupabase = async (): Promise<{
  success: boolean;
  message: string;
  data?: Partial<{
    cards: CreditCard[];
    transactions: Transaction[];
    installmentPurchases: InstallmentPurchase[];
    cardSubscriptions: CardSubscription[];
    groceryTrips: GroceryTrip[];
    groceryMonthPlans: GroceryMonthPlan[];
    cofrinhos: Cofrinho[];
    cofrinhoMovements: CofrinhoMovement[];
    renovationExpenses: RenovationExpense[];
    salarySettings: SalarySettings;
    emergencySettings: EmergencyFundSettings;
    houseFundSettings: HouseFundSettings;
    futureRentSettings: FutureRentSettings;
    globalCofrinhoSettings: GlobalCofrinhoSettings;
  }>;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase não configurado.' };
  }

  try {
    const [
      cardsRes,
      transRes,
      instRes,
      subsRes,
      tripsRes,
      plansRes,
      cofsRes,
      movsRes,
      renRes,
      settingsRes,
    ] = await Promise.all([
      client.from('credit_cards').select('*'),
      client.from('transactions').select('*'),
      client.from('installment_purchases').select('*'),
      client.from('card_subscriptions').select('*'),
      client.from('grocery_trips').select('*'),
      client.from('grocery_month_plans').select('*'),
      client.from('cofrinhos').select('*'),
      client.from('cofrinho_movements').select('*'),
      client.from('renovation_expenses').select('*'),
      client.from('app_settings').select('*'),
    ]);

    const resultData: any = {};

    if (cardsRes.data) {
      resultData.cards = cardsRes.data.map((r: any): CreditCard => ({
        id: r.id,
        name: r.name,
        person: r.person,
        closingDay: Number(r.closing_day),
        dueDay: Number(r.due_day),
        monthlyLimitGoal: Number(r.monthly_limit_goal),
        color: r.color,
        brand: r.brand,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (transRes.data) {
      resultData.transactions = transRes.data.map((r: any): Transaction => ({
        id: r.id,
        description: r.description,
        amount: Number(r.amount),
        type: r.type,
        category: r.category,
        subcategory: r.subcategory || undefined,
        person: r.person,
        date: r.date,
        competenceMonth: r.competence_month,
        paid: Boolean(r.paid),
        isRecurring: Boolean(r.is_recurring),
        isReimbursable: Boolean(r.is_reimbursable),
        paymentMethod: r.payment_method,
        accountOrPot: r.account_or_pot || undefined,
        notes: r.notes || undefined,
        cardId: r.card_id || undefined,
        purchaseDate: r.purchase_date || undefined,
        installmentInfo: r.installment_info || undefined,
        subscriptionId: r.subscription_id || undefined,
        isCardSubscription: Boolean(r.is_card_subscription),
        groceryTripId: r.grocery_trip_id || undefined,
        cofrinhoMovementId: r.cofrinho_movement_id || undefined,
        cofrinhoId: r.cofrinho_id || undefined,
        investmentContributionId: r.investment_contribution_id || undefined,
        emergencyContributionId: r.emergency_contribution_id || undefined,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (instRes.data) {
      resultData.installmentPurchases = instRes.data.map((r: any): InstallmentPurchase => ({
        id: r.id,
        description: r.description,
        person: r.person,
        totalAmount: Number(r.total_amount),
        installmentAmount: Number(r.installment_amount),
        currentInstallment: r.current_installment ? Number(r.current_installment) : 1,
        totalInstallments: Number(r.total_installments),
        remainingInstallments: r.remaining_installments ? Number(r.remaining_installments) : undefined,
        purchaseDate: r.purchase_date || undefined,
        firstDueDate: r.first_due_date || undefined,
        lastDueDate: r.last_due_date || undefined,
        category: r.category,
        status: r.status || 'ativa',
        earlyPaidInstallments: r.early_paid_installments ? Number(r.early_paid_installments) : 0,
        earlyPaidDate: r.early_paid_date || undefined,
        cardId: r.card_id || undefined,
        notes: r.notes || undefined,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (subsRes.data) {
      resultData.cardSubscriptions = subsRes.data.map((r: any): CardSubscription => ({
        id: r.id,
        name: r.name,
        description: r.description || r.name,
        amount: Number(r.amount),
        person: r.person,
        cardId: r.card_id,
        category: r.category,
        billingDay: r.billing_day ? Number(r.billing_day) : undefined,
        startMonth: r.start_month || undefined,
        endMonth: r.end_month || undefined,
        isActive: Boolean(r.is_active),
        status: r.status || 'active',
        notes: r.notes || undefined,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (tripsRes.data) {
      resultData.groceryTrips = tripsRes.data.map((r: any): GroceryTrip => ({
        id: r.id,
        date: r.date,
        storeName: r.store_name,
        totalAmount: Number(r.total_amount),
        person: r.person,
        paymentMethod: r.payment_method,
        tripType: r.trip_type || 'semanal',
        weekNumber: r.week_number ? Number(r.week_number) : undefined,
        isExtraordinary: Boolean(r.is_extraordinary),
        notes: r.notes || undefined,
        items: r.items || [],
        promoSavings: Number(r.promo_savings || 0),
        cpfAppSavings: Number(r.cpf_app_savings || 0),
        cardSavings: Number(r.card_savings || 0),
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (plansRes.data) {
      resultData.groceryMonthPlans = plansRes.data.map((r: any): GroceryMonthPlan => ({
        monthKey: r.month_key,
        mode: r.mode,
        totalWeeks: Number(r.total_weeks),
        monthlyGoal: Number(r.monthly_goal),
        ricardoWeeklyPlanned: Number(r.ricardo_weekly_planned),
        ricardoWeeks: r.ricardo_weeks || [],
        ellenPlanningType: r.ellen_planning_type || 'mensal',
        ellenMonthlyPlanned: Number(r.ellen_monthly_planned),
        ellenWeeklyPlanned: r.ellen_weekly_planned ? Number(r.ellen_weekly_planned) : undefined,
        ellenActualAmount: Number(r.ellen_actual_amount || 0),
        ellenCompleted: Boolean(r.ellen_completed),
        ellenWeeks: r.ellen_weeks || [],
        carryOverEnabled: Boolean(r.carry_over_enabled),
        ellenCarryOverEnabled: Boolean(r.ellen_carry_over_enabled),
      }));
    }

    if (cofsRes.data) {
      resultData.cofrinhos = cofsRes.data.map((r: any): Cofrinho => ({
        id: r.id,
        name: r.name,
        type: r.type,
        objective: r.objective || undefined,
        description: r.description || undefined,
        person: r.person,
        institution: r.institution,
        applicationType: r.application_type,
        yieldType: r.yield_type,
        cdiPercentage: r.cdi_percentage ? Number(r.cdi_percentage) : undefined,
        customAnnualRate: r.custom_annual_rate ? Number(r.custom_annual_rate) : undefined,
        initialBalance: Number(r.initial_balance),
        currentBalance: Number(r.current_balance),
        monthlyYield: Number(r.monthly_yield),
        accumulatedYield: Number(r.accumulated_yield),
        grossYield: Number(r.gross_yield || 0),
        taxAndFees: Number(r.tax_and_fees || 0),
        startDate: r.start_date || undefined,
        targetAmount: r.target_amount ? Number(r.target_amount) : undefined,
        targetDate: r.target_date || undefined,
        status: r.status,
        color: r.color,
        iconName: r.icon_name || undefined,
        subCategoryPurpose: r.sub_category_purpose || undefined,
        notes: r.notes || undefined,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (movsRes.data) {
      resultData.cofrinhoMovements = movsRes.data.map((r: any): CofrinhoMovement => ({
        id: r.id,
        cofrinhoId: r.cofrinho_id,
        date: r.date,
        type: r.type,
        amount: Number(r.amount),
        person: r.person,
        grossAmount: r.gross_amount ? Number(r.gross_amount) : undefined,
        taxAmount: r.tax_amount ? Number(r.tax_amount) : undefined,
        isExtraordinaryShare: Boolean(r.is_extraordinary_share),
        subPurpose: r.sub_purpose || undefined,
        destinationCofrinhoId: r.destination_cofrinho_id || undefined,
        transactionId: r.transaction_id || undefined,
        emergencyContributionId: r.emergency_contribution_id || undefined,
        investmentContributionId: r.investment_contribution_id || undefined,
        notes: r.notes || undefined,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (renRes.data) {
      resultData.renovationExpenses = renRes.data.map((r: any): RenovationExpense => ({
        id: r.id,
        date: r.date,
        description: r.description,
        amount: Number(r.amount),
        paidBy: r.paid_by,
        receiptDescription: r.receipt_description || undefined,
        ownerAuthorized: r.owner_authorized,
        requestedAmount: Number(r.requested_amount || 0),
        acceptedAmount: Number(r.accepted_amount || 0),
        underAnalysisAmount: Number(r.under_analysis_amount || 0),
        alreadyCompensatedAmount: Number(r.already_compensated_amount || 0),
        notes: r.notes || undefined,
        isDemo: Boolean(r.is_demo),
      }));
    }

    if (settingsRes.data) {
      settingsRes.data.forEach((s: any) => {
        if (s.id === 'salary_settings') resultData.salarySettings = s.value;
        if (s.id === 'emergency_settings') resultData.emergencySettings = s.value;
        if (s.id === 'house_fund_settings') resultData.houseFundSettings = s.value;
        if (s.id === 'future_rent_settings') resultData.futureRentSettings = s.value;
        if (s.id === 'global_cofrinho_settings') resultData.globalCofrinhoSettings = s.value;
      });
    }

    return {
      success: true,
      message: 'Dados baixados do Supabase com sucesso!',
      data: resultData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao baixar dados: ${err.message || String(err)}`,
    };
  }
};
