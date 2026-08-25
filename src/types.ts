export type Person = 'Ricardo' | 'Ellen' | 'Família';

export type TransactionType = 'receita' | 'despesa' | 'investimento' | 'transferencia' | 'rendimento';

export type IncomeClassification = 'recorrente' | 'extraordinaria' | 'reembolso' | 'transferencia' | 'rendimento';

export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito' | 'boleto' | 'transferencia' | 'vale_alimentacao' | 'vale_refeicao';

export type GroceryCategory =
  | 'Alimentos'
  | 'Carnes e frango'
  | 'Bebidas'
  | 'Frutas, verduras e legumes'
  | 'Frios e laticínios'
  | 'Produtos de padaria'
  | 'Doces, biscoitos e sobremesas'
  | 'Produtos de limpeza'
  | 'Produtos de higiene'
  | 'Produtos para o pet'
  | 'Produtos da cesta básica'
  | 'Itens para a casa'
  | 'Outros';

export interface GroceryProduct {
  id: string;
  name: string;
  brand?: string;
  category: GroceryCategory;
  quantity: number;
  unit: string; // kg, g, un, L, ml, pac, band, cx
  unitPrice: number;
  totalPrice: number;
  price?: number; // alias for backwards compatibility
  store?: string;
  purchaseDate?: string;
  isPromotion?: boolean;
  isPromotional?: boolean;
  promoDiscount?: number;
  cpfAppDiscount?: number;
  storeCardDiscount?: number;
  cardSavingsTotal?: number;
  notes?: string;
  isExtraordinary?: boolean;
  isHouseItemExtraordinary?: boolean; // "Itens para a casa" -> Compra extraordinária para casa
}

export type GroceryItem = GroceryProduct; // alias for compatibility

export interface GroceryTrip {
  id: string;
  date: string; // YYYY-MM-DD
  storeName: string; // 'Assaí' | 'Carrefour' | 'Sonda' | 'Outros' | etc.
  totalAmount: number;
  person: Person;
  paymentMethod: PaymentMethod;
  isExtraordinary?: boolean; // Compra regular ou extraordinária
  notes?: string;
  items?: GroceryProduct[];
  products?: GroceryProduct[];
  promoSavings?: number;
  promotionalSavings?: number;
  cpfAppSavings?: number;
  appOrCpfSavings?: number;
  cardSavings?: number;
  storeCardSavings?: number;
  isDemo?: boolean;
}

export interface ShoppingListItem {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
  priority: 'Alta' | 'Média' | 'Baixa';
  preferredStore: string;
  lastPricePaid?: number;
  lowestHistoricalPrice?: number;
  estimatedPrice: number;
  actualPricePaid?: number;
  completed: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  type: 'semanal' | 'mensal' | 'personalizada';
  monthKey: string;
  createdAt: string;
  estimatedTotal?: number;
  items: ShoppingListItem[];
  isDemo?: boolean;
}

export interface StockItem {
  id: string;
  product: string;
  category: GroceryCategory;
  lastPurchaseDate: string;
  quantity: number;
  unit: string;
  estimatedDurationDays: number;
  nextPurchasePredictedDate?: string;
  lastPricePaid?: number;
  store: string;
  status: 'suficiente' | 'baixo' | 'esgotado';
  isFromCestaBasica?: boolean;
  notes?: string;
  isDemo?: boolean;
}

export interface CestaBasicaItem {
  product: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
}

export interface CestaBasicaRecord {
  id: string;
  date: string; // YYYY-MM-DD
  receivedBy: 'Ellen' | 'Ricardo';
  estimatedSavings: number; // ex: R$ 250
  items: CestaBasicaItem[];
  notes?: string;
  isDemo?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  person: Person;
  date: string; // YYYY-MM-DD
  competenceMonth: string; // YYYY-MM
  paid: boolean;
  isRecurring: boolean; // Recorrente ou Extraordinário
  isReimbursable?: boolean;
  paymentMethod: PaymentMethod;
  accountOrPot?: string;
  notes?: string;
  isDemo?: boolean;
  cardId?: string;
  installmentInfo?: {
    current: number;
    total: number;
    purchaseId?: string;
  };
  groceryTripId?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  person: Person;
  closingDay: number;
  dueDay: number;
  monthlyLimitGoal: number; // Meta máxima da fatura (R$ 500 por pessoa)
  color: string;
  brand?: string;
  isDemo?: boolean;
}

export interface InstallmentPurchase {
  id: string;
  description: string;
  person: 'Ricardo' | 'Ellen';
  totalAmount: number;
  installmentAmount: number;
  currentInstallment?: number;
  totalInstallments: number;
  remainingInstallments?: number;
  purchaseDate?: string; // YYYY-MM-DD
  firstDueDate?: string; // YYYY-MM
  lastDueDate?: string; // YYYY-MM
  category: string;
  notes?: string;
  status?: 'ativa' | 'antecipada' | 'encerrada';
  earlyPaidInstallments?: number;
  earlyPaidDate?: string;
  cardId?: string;
  createdAt?: string; // YYYY-MM-DD
  firstInstallmentMonth?: string; // alias
  isDemo?: boolean;
}

export interface GroceryWeekConfig {
  weekIndex: number;
  weekLabel: string;
  plannedAmount: number;
  actualAmount: number;
  completed: boolean;
  paid?: boolean;
}

export interface GroceryMonthPlan {
  monthKey: string;
  mode: 'opcao_a' | 'opcao_b';
  totalWeeks: number; // 4 ou 5
  weeksCount?: number;
  ricardoWeeklyPlanned: number; // R$ 150
  ricardoTotalPlanned?: number;
  ricardoWeeks: GroceryWeekConfig[];
  ellenMonthlyPlanned: number; // R$ 400
  ellenActualAmount: number;
  ellenCompleted: boolean;
}

export type CofrinhoType = 'reserva' | 'casa' | 'manutencao' | 'lazer' | 'aluguel_futuro' | 'reforma' | 'outro';

export type CofrinhoYieldType = 'cdi_100' | 'cdi_custom' | 'fixed_annual' | 'none' | 'manual';

export type CofrinhoMovementType = 'aporte' | 'retirada' | 'rendimento' | 'transferencia_interna';
export type CofrinhoId = string;

export type MonthlyAporteStatus = 'programado' | 'realizado' | 'parcial' | 'nao_realizado';

export interface Cofrinho {
  id: string;
  name: string;
  type: CofrinhoType;
  objective?: string; // Objetivo descritivo
  description?: string;
  person: Person; // Responsável: Ricardo, Ellen ou Família
  institution: string; // Ex: Nubank, Inter, Sofisa, Tesouro Direto, XP
  applicationType: string; // Ex: CDB 100% CDI, Tesouro Selic 2029, LCI
  yieldType: CofrinhoYieldType;
  cdiPercentage?: number; // Ex: 100, 90, 110 (%)
  customAnnualRate?: number; // Ex: 10.5 (% a.a. para taxa fixa ou personalizada)
  initialBalance: number;
  currentBalance: number;
  monthlyYield: number; // Rendimento líquido do mês
  accumulatedYield: number; // Rendimento acumulado
  grossYield?: number;
  taxAndFees?: number;
  startDate?: string; // YYYY-MM-DD
  targetAmount?: number; // Meta financeira
  targetDate?: string; // Data desejada (ex: '2027-01' para o futuro aluguel)
  status: 'ativo' | 'encerrado';
  color: string;
  iconName?: string;
  subCategoryPurpose?: 'compra_casa' | 'manutencao_casa' | 'manutencao_carro' | 'reforma' | 'outro_patrimonial' | 'passeios' | 'restaurantes' | 'viagens' | 'compras_planejadas' | 'entretenimento' | 'emergencia' | 'geral';
  notes?: string;
  isDemo?: boolean;
}

export interface CofrinhoMovement {
  id: string;
  cofrinhoId: string;
  date: string; // YYYY-MM-DD
  type: 'aporte' | 'retirada' | 'rendimento' | 'transferencia_interna';
  amount: number;
  person: Person;
  grossAmount?: number;
  taxAmount?: number;
  isExtraordinaryShare?: boolean;
  subPurpose?: string;
  destinationCofrinhoId?: string; // Usado em transferências internas entre cofrinhos
  notes?: string;
  isDemo?: boolean;
}

export interface InvestmentContribution {
  id: string;
  date: string; // YYYY-MM-DD
  person: 'Ricardo' | 'Ellen';
  amount: number;
  targetAsset: string;
  status?: MonthlyAporteStatus;
  notes?: string;
  isDemo?: boolean;
}

export interface EmergencyFundContribution {
  id: string;
  date: string; // YYYY-MM-DD
  person: Person;
  amount: number;
  institution: string;
  isExtraordinary?: boolean;
  status?: MonthlyAporteStatus;
  notes?: string;
  isDemo?: boolean;
}

export interface EmergencyFundSettings {
  targetAmount: number; // 8 meses da renda familiar = R$ 55.200 (recalculado automaticamente)
  familySalaryIncome: number; // R$ 6.900 (Ricardo 5.300 + Ellen 1.600)
  monthlyLivingCost: number; // Custo de vida mensal estimado ou renda salarial
  targetMonths: number; // 8 meses
  ricardoMonthlyObligation: number; // R$ 500
  ellenMonthlyObligation: number; // R$ 500
  ricardoStatus?: MonthlyAporteStatus;
  ellenStatus?: MonthlyAporteStatus;
  redirectWhenCompleted?: boolean; // Redirecionar 70% da renda extraordinária para Nova Casa
  redirectTargetCofrinhoId?: string; // Padrão: 'cof-casa'
}

export interface GlobalCofrinhoSettings {
  cdiAnnualRate: number; // Taxa CDI anual editável pelo usuário (ex: 10.5% a.a.)
  defaultIncomeTaxRate: number; // Alíquota estimada de IR (ex: 15% ou 22.5%)
  extraordinaryReservaPercentage: number; // 70%
  extraordinaryCasaManutencaoPercentage: number; // 20%
  extraordinaryLazerPercentage: number; // 10%
  redirectAfterEmergencyMet: boolean; // True
  redirectTargetCofrinhoId: string; // 'cof-casa'
}

export interface CofrinhoProjection {
  months: number;
  label: string;
  projectedBalance: number;
  totalInvested: number;
  totalInterest: number;
}

export interface SalarySettings {
  salaryRicardo: number; // R$ 5.300
  salaryEllen: number; // R$ 1.600
  ricardoNetSalary: number; // R$ 5.300
  ricardoAdvanceSalary: number; // R$ 2.120
  ricardoMainSalary: number; // R$ 3.180
  ellenNetSalary: number; // R$ 1.600
}

export interface MonthSummary {
  monthKey: string; // YYYY-MM
  recurringIncome: number;
  extraordinaryIncome: number;
  totalIncome: number;
  reimbursementIncome: number;
  totalExpense: number;
  recurringExpense: number;
  extraordinaryExpense: number;
  totalInvested: number;
  availableBalance: number;
  balance: number; // Saldo líquido do mês (totalIncome - totalExpense)
  cumulativeBalance: number;
  
  // Reserva de Emergência
  emergencyFundCurrent: number;
  emergencyFundTarget: number; // R$ 55.200 (8 meses)
  emergencyFundPercentage: number;
  
  // Cofrinhos e Fundos acumulados
  houseFundAccumulated: number;
  maintenanceFundAccumulated: number;
  leisureFundAccumulated: number;
  futureRentAccumulated: number;
  renovationCreditAvailable: number;
  renovationCreditTotal: number;
  renovationCreditWithdrawn: number;
  
  // Investimentos R$ 500 / pessoa
  investmentRicardo: number;
  investmentEllen: number;
  
  // Faturas de Cartão
  ricardoInvoiceTotal: number;
  ellenInvoiceTotal: number;
  
  // Supermercado
  groceryGoal: number;
  groceryTotal: number;
  groceryPlanned: number;
  groceryTransferred: number;
  groceryActualSpent: number;
  groceryAvailableBalance: number;
  
  // Rendimentos Cofrinhos
  cofrinhoMonthlyYield: number;
  cofrinhoAccumulatedYield: number;
  
  // Totais por Responsável
  incomeByPerson: Record<Person, number>;
  expenseByPerson: Record<Person, number>;
}

export interface HouseFundSettings {
  targetDownPayment: number; // R$ 120.000 (meta para entrada do imóvel)
  estimatedPropertyTotal: number; // R$ 400.000 (estimativa total do imóvel)
  targetDate: string; // YYYY-MM (ex: '2029-12')
  
  // Cenário Conservador (Apenas aportes fixos pós-reserva: R$ 500 Ricardo + R$ 500 Ellen = R$ 1.000)
  monthlyContributionConservative: number;
  annualRateConservative: number; // % a.a.

  // Cenário Intermediário (Aportes fixos + média de extras)
  monthlyContributionModerate: number;
  annualRateModerate: number; // % a.a.

  // Cenário Acelerado (Aportes fixos + extras + economia com redução de faturas e supermercado)
  monthlyContributionAccelerated: number;
  annualRateAccelerated: number; // % a.a.
}

export interface RenovationExpense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Valor pago
  paidBy: Person;
  receiptDescription?: string; // Comprovante / recibo
  ownerAuthorized: 'sim' | 'pendente' | 'nao'; // Autorização do proprietário
  requestedAmount: number; // Valor solicitado para compensação
  acceptedAmount: number; // Valor aceito pelo proprietário
  underAnalysisAmount: number; // Valor ainda em análise
  alreadyCompensatedAmount: number; // Valor já compensado no aluguel
  notes?: string;
  isDemo?: boolean;
}

export interface FutureRentSettings {
  startDate: string; // '2027-01' (Data real de início do aluguel)
  grossRentAmount: number; // R$ 800 (Valor mensal bruto do aluguel)
  dueDay: number; // Dia 10
  annualAdjustmentRate: number; // 5% a.a. (Correção anual estimada)
  compensationMethod: 'total' | 'parcelado' | 'percentual'; // Forma de compensação
  fixedMonthlyCompensation?: number; // Se parcelado, quanto abater por mês
  monthlyProvisionAmount: number; // Provisão mensal recomendada no cofrinho de aluguel
  notes?: string;
}

export interface MonthlyClosingChecklist {
  monthKey: string;
  checkedItems: Record<string, boolean>;
  isClosed: boolean;
  closedAt?: string;
  notes?: string;
}

export interface AppAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  category: 'cartao' | 'supermercado' | 'reserva' | 'renda_extra' | 'parcela' | 'fechamento' | 'reforma' | 'aluguel' | 'cdi' | 'geral';
  title: string;
  message: string;
  actionLabel?: string;
  actionTab?: ActiveTab;
  actionPayload?: any;
  dismissed?: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'cards'
  | 'grocery'
  | 'budget'
  | 'goals'
  | 'house'
  | 'renovation'
  | 'closing'
  | 'alerts'
  | 'settings';
