import { Cofrinho, CofrinhoMovement, CofrinhoYieldType, CofrinhoProjection, EmergencyFundContribution } from '../types';

/**
 * Calcula a taxa anual efetiva de rendimento do Cofrinho (% a.a.)
 * Fórmula da taxa anual do Cofrinho:
 * - 100% CDI => CDI anual * 100%
 * - Custom % CDI => CDI anual * (percentual / 100)
 * - Taxa Fixa => customAnnualRate
 * - Sem rendimento => 0
 */
export const calculateAnnualRate = (
  cdiAnnualRate: number,
  yieldType: CofrinhoYieldType,
  cdiPercentage: number = 100,
  customAnnualRate: number = 0
): number => {
  switch (yieldType) {
    case 'cdi_100':
      return cdiAnnualRate;
    case 'cdi_custom':
      return cdiAnnualRate * (cdiPercentage / 100);
    case 'fixed_annual':
      return customAnnualRate;
    case 'none':
      return 0;
    case 'manual':
      return customAnnualRate || cdiAnnualRate;
    default:
      return cdiAnnualRate;
  }
};

/**
 * Converte a taxa anual em taxa mensal equivalente usando juros compostos:
 * Taxa mensal equivalente = (1 + taxa anual)^(1/12) - 1
 */
export const calculateMonthlyEquivalentRate = (annualRatePercentage: number): number => {
  if (annualRatePercentage <= 0) return 0;
  const annualDecimal = annualRatePercentage / 100;
  return Math.pow(1 + annualDecimal, 1 / 12) - 1;
};

/**
 * Calcula o rendimento mensal de um cofrinho
 * Fórmula:
 * Rendimento bruto = Saldo inicial * taxa mensal + (Aportes líquidos ponderados * taxa mensal / 2)
 * Impostos/Taxas = Rendimento bruto * alíquota IR (ex: 15%)
 * Rendimento líquido = Rendimento bruto - Impostos
 * Saldo final = Saldo inicial + aportes + rendimento líquido - retiradas
 */
export const calculateMonthlyYieldDetails = (
  initialBalance: number,
  annualRatePercentage: number,
  monthlyAportes: number = 0,
  monthlyRetiradas: number = 0,
  taxRatePercentage: number = 0
): {
  grossYield: number;
  taxAndFees: number;
  netYield: number;
  finalBalance: number;
  monthlyRatePercentage: number;
} => {
  const monthlyRate = calculateMonthlyEquivalentRate(annualRatePercentage);
  const monthlyRatePercentage = monthlyRate * 100;

  if (monthlyRate <= 0 || initialBalance < 0) {
    const finalBalance = Math.max(0, initialBalance + monthlyAportes - monthlyRetiradas);
    return {
      grossYield: 0,
      taxAndFees: 0,
      netYield: 0,
      finalBalance,
      monthlyRatePercentage: 0,
    };
  }

  // Rendimento sobre saldo inicial + ponderação de aportes/retiradas no meio do mês
  const baseYield = initialBalance * monthlyRate;
  const flowYield = Math.max(0, (monthlyAportes - monthlyRetiradas) * (monthlyRate / 2));
  const grossYield = Math.max(0, baseYield + flowYield);

  const taxAndFees = grossYield * (taxRatePercentage / 100);
  const netYield = Math.max(0, grossYield - taxAndFees);
  const finalBalance = Math.max(0, initialBalance + monthlyAportes + netYield - monthlyRetiradas);

  return {
    grossYield,
    taxAndFees,
    netYield,
    finalBalance,
    monthlyRatePercentage,
  };
};

/**
 * Calcula projeções com juros compostos para 6, 12, 24, 36 e 60 meses
 * Considera:
 * - Saldo atual
 * - Aporte mensal regular
 * - Taxa de rendimento configurada
 * - Aportes extraordinários anuais/mensais estimados
 */
export const calculateProjections = (
  currentBalance: number,
  monthlyAporte: number,
  annualRatePercentage: number,
  estimatedExtraordinaryMonthly: number = 0
): CofrinhoProjection[] => {
  const intervals = [
    { months: 6, label: '6 meses' },
    { months: 12, label: '1 ano (12 meses)' },
    { months: 24, label: '2 anos (24 meses)' },
    { months: 36, label: '3 anos (36 meses)' },
    { months: 60, label: '5 anos (60 meses)' },
  ];

  const monthlyRate = calculateMonthlyEquivalentRate(annualRatePercentage);
  const totalMonthlyFlow = monthlyAporte + estimatedExtraordinaryMonthly;

  return intervals.map((interval) => {
    let balance = currentBalance;
    let totalInvested = currentBalance;

    for (let m = 1; m <= interval.months; m++) {
      const yieldAmount = balance * monthlyRate;
      balance = balance + yieldAmount + totalMonthlyFlow;
      totalInvested += totalMonthlyFlow;
    }

    const totalInterest = Math.max(0, balance - totalInvested);

    return {
      months: interval.months,
      label: interval.label,
      projectedBalance: balance,
      totalInvested,
      totalInterest,
    };
  });
};

/**
 * Calcula os meses restantes e data estimada de conclusão da Reserva de Emergência
 */
export const estimateEmergencyCompletion = (
  currentBalance: number,
  targetAmount: number,
  monthlyRegularAporte: number = 1000,
  annualYieldRatePercentage: number = 10.5,
  estimatedMonthlyExtraordinary: number = 0
): {
  remainingAmount: number;
  percentageCompleted: number;
  monthsRemaining: number;
  estimatedDateBR: string;
  isCompleted: boolean;
} => {
  const remainingAmount = Math.max(0, targetAmount - currentBalance);
  const percentageCompleted = targetAmount > 0 ? Math.min(100, (currentBalance / targetAmount) * 100) : 0;
  const isCompleted = currentBalance >= targetAmount;

  if (isCompleted) {
    return {
      remainingAmount: 0,
      percentageCompleted: 100,
      monthsRemaining: 0,
      estimatedDateBR: 'Concluída!',
      isCompleted: true,
    };
  }

  const monthlyRate = calculateMonthlyEquivalentRate(annualYieldRatePercentage);
  const totalMonthlyAporte = monthlyRegularAporte + estimatedMonthlyExtraordinary;

  if (totalMonthlyAporte <= 0 && monthlyRate <= 0) {
    return {
      remainingAmount,
      percentageCompleted,
      monthsRemaining: 999,
      estimatedDateBR: 'Indeterminado (Sem aportes)',
      isCompleted: false,
    };
  }

  // Simulação mês a mês com juros compostos
  let balance = currentBalance;
  let months = 0;
  const maxMonths = 360; // 30 anos limite de segurança

  while (balance < targetAmount && months < maxMonths) {
    months++;
    const yieldAmount = balance * monthlyRate;
    balance += yieldAmount + totalMonthlyAporte;
  }

  // Estimar data futura
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + months);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const estimatedDateBR = `${monthNames[futureDate.getMonth()]} de ${futureDate.getFullYear()}`;

  return {
    remainingAmount,
    percentageCompleted,
    monthsRemaining: months,
    estimatedDateBR,
    isCompleted: false,
  };
};

/**
 * Projeta o crescimento com juros compostos para um período de meses
 */
export const calculateCompoundInterestProjection = (
  initialBalance: number,
  monthlyAporte: number,
  annualRatePercentage: number,
  months: number,
  taxRatePercentage: number = 0
): {
  finalBalance: number;
  totalContributed: number;
  totalNetInterest: number;
} => {
  const monthlyRate = calculateMonthlyEquivalentRate(annualRatePercentage);
  let balance = initialBalance;
  let totalContributed = initialBalance;
  let totalNetInterest = 0;

  for (let m = 1; m <= months; m++) {
    const grossInterest = balance * monthlyRate;
    const netInterest = grossInterest * (1 - taxRatePercentage / 100);
    balance = balance + netInterest + monthlyAporte;
    totalContributed += monthlyAporte;
    totalNetInterest += netInterest;
  }

  return {
    finalBalance: Math.round(balance * 100) / 100,
    totalContributed: Math.round(totalContributed * 100) / 100,
    totalNetInterest: Math.round(totalNetInterest * 100) / 100,
  };
};

