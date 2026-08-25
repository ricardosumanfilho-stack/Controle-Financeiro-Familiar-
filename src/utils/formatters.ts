import { Person } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export const formatCurrencyBR = formatCurrency;

export const parseCurrencyInput = (valueStr: string): number => {
  const clean = valueStr.replace(/\D/g, '');
  if (!clean) return 0;
  return parseFloat(clean) / 100;
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const formatMonthYearBR = (monthKey: string): string => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} de ${year}`;
};

export const getMonthKey = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr.slice(0, 7); // YYYY-MM
};

export const addMonthsToKey = (monthKey: string, count: number): string => {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + count;
  
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const getWeeksInMonth = (monthKey: string): number => {
  if (!monthKey) return 4;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Se tiver 31 ou 30 dias com início em determinados dias da semana, tem 5 semanas operacionais
  return daysInMonth >= 30 ? 5 : 4;
};

export const getPersonBadgeColor = (person: Person): { bg: string; text: string; border: string; badge: string; accent: string } => {
  switch (person) {
    case 'Ricardo':
      return {
        bg: 'bg-blue-950/40',
        text: 'text-blue-300',
        border: 'border-blue-800/60',
        badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
        accent: '#3B82F6',
      };
    case 'Ellen':
      return {
        bg: 'bg-rose-950/40',
        text: 'text-rose-300',
        border: 'border-rose-800/60',
        badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        accent: '#F43F5E',
      };
    case 'Família':
    default:
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-300',
        border: 'border-emerald-800/60',
        badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        accent: '#10B981',
      };
  }
};

// Categorias padrão solicitadas no contexto financeiro
export const INCOME_CATEGORIES = [
  'Salário principal de Ricardo',
  'Adiantamento salarial de Ricardo, dia 15',
  'Salário principal de Ellen',
  'Adiantamento salarial de Ellen',
  'Hora extra',
  'Diária de viagem',
  'PLR',
  'Férias',
  'Décimo terceiro',
  'Restituição do Imposto de Renda',
  'Reembolso de trabalho',
  'Renda extra',
  'Rendimento de Cofrinho',
  'Outras receitas',
] as const;

export const EXPENSE_CATEGORIES = [
  'Moradia',
  'Supermercado',
  'Transporte',
  'Carro',
  'Saúde e pet',
  'Educação',
  'Cartões',
  'Lazer',
  'Assinaturas',
  'Reforma da casa',
  'Futuro aluguel',
  'Casamento e lua de mel',
  'Viagens pessoais',
  'Viagens a trabalho',
  'Investimentos',
  'Outras despesas',
] as const;

export const ACCOUNTS_AND_POTS = [
  'Conta Corrente Ricardo',
  'Conta Ellen',
  'Conta Família / Conjunta',
  'Cofrinho Reserva de Emergência',
  'Cofrinho Compra da Casa',
  'Cofrinho Manutenção (Casa/Carro)',
  'Cofrinho Lazer',
  'Cofrinho Futuro Aluguel (Jan 2027)',
  'Cofrinho Reforma da Casa',
] as const;

export const classifyIncomeCategory = (category: string): {
  isSalaryRecurring: boolean;
  isExtraordinary: boolean;
  isReimbursement: boolean;
  isYield: boolean;
  defaultPerson: Person;
} => {
  const isSalaryRecurring = [
    'Salário principal de Ricardo',
    'Adiantamento salarial de Ricardo, dia 15',
    'Salário principal de Ellen',
    'Adiantamento salarial de Ellen',
  ].includes(category);

  const isReimbursement = category === 'Reembolso de trabalho';
  const isYield = category === 'Rendimento de Cofrinho';
  const isExtraordinary = !isSalaryRecurring && !isReimbursement && !isYield;

  let defaultPerson: Person = 'Família';
  if (category.includes('Ricardo')) defaultPerson = 'Ricardo';
  else if (category.includes('Ellen')) defaultPerson = 'Ellen';

  return {
    isSalaryRecurring,
    isExtraordinary,
    isReimbursement,
    isYield,
    defaultPerson,
  };
};

// Paleta Oficial de Cores do Sistema
export const FINANCIAL_COLORS = {
  withinGoal: '#10B981',      // Verde: dentro da meta
  nearGoal: '#F59E0B',        // Amarelo: próximo da meta
  overGoal: '#EF4444',        // Vermelho: acima da meta
  investment: '#3B82F6',      // Azul: investimentos
  extraordinary: '#A855F7',   // Roxo: gastos / receitas extraordinárias
  attention: '#F97316',       // Laranja: atenção ou revisão
  futureProgrammed: '#64748B',// Cinza: valores programados para o futuro
  ricardo: '#3B82F6',         // Azul Ricardo
  ellen: '#F43F5E',           // Rosa Ellen
  family: '#10B981',          // Verde Família
};

