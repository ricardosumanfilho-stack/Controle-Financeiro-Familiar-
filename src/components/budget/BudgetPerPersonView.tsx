import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Person } from '../../types';
import {
  formatCurrency,
  formatMonthYearBR,
  getPersonBadgeColor,
  addMonthsToKey,
} from '../../utils/formatters';
import {
  Users,
  User,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  ShieldCheck,
  Edit2,
  Check,
  Sparkles,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Briefcase,
  Layers,
  HelpCircle,
  Target,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const BudgetPerPersonView: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    salarySettings,
    updateSalarySettings,
    transactions,
    groceryPlan,
    groceryTrips,
    getCardInvoicesForMonth,
    investmentContributions,
    emergencyContributions,
    person1Name,
    person2Name,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [isEditingSalaries, setIsEditingSalaries] = useState(false);
  const [ricardoSalaryInput, setRicardoSalaryInput] = useState(salarySettings.ricardoNetSalary);
  const [ricardoAdvanceInput, setRicardoAdvanceInput] = useState(salarySettings.ricardoAdvanceSalary);
  const [ellenSalaryInput, setEllenSalaryInput] = useState(salarySettings.ellenNetSalary);
  const [selectedPersonTab, setSelectedPersonTab] = useState<'comparativo' | 'ricardo' | 'ellen' | 'tabela'>('comparativo');
  const [activeChartType, setActiveChartType] = useState<'composicao' | 'donut' | 'metas' | 'historico'>('composicao');
  const [donutPersonFilter, setDonutPersonFilter] = useState<'Familia' | 'Ricardo' | 'Ellen'>('Familia');

  // Calculations for the current selected month
  const monthTxs = useMemo(() => {
    return transactions.filter(
      (t) => (t.competenceMonth || t.date.slice(0, 7)) === selectedMonth
    );
  }, [transactions, selectedMonth]);

  // Card invoices for selected month
  const cardInvoices = getCardInvoicesForMonth(selectedMonth);
  const ricardoCardTotal = cardInvoices
    .filter((i) => i.card.person === 'Ricardo')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const ellenCardTotal = cardInvoices
    .filter((i) => i.card.person === 'Ellen')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  // Grocery contributions
  const ricardoGroceryPlanned = groceryPlan.mode === 'opcao_b' ? 600 : (groceryPlan.totalWeeks === 5 ? 750 : 600);
  const ricardoGroceryRealized = groceryPlan.ricardoWeeks.reduce(
    (sum, w) => sum + (w.completed ? (w.actualAmount || w.plannedAmount || 150) : 0),
    0
  );
  const ellenGroceryPlanned = 400;
  const ellenGroceryRealized = groceryPlan.ellenCompleted
    ? (groceryPlan.ellenActualAmount || 400)
    : 0;

  // Emergency Fund Contributions in the selected month
  const ricardoEmergency = emergencyContributions
    .filter((e) => e.person === 'Ricardo' && e.date.startsWith(selectedMonth))
    .reduce((sum, e) => sum + e.amount, 0) || 500; // default planned 500

  const ellenEmergency = emergencyContributions
    .filter((e) => e.person === 'Ellen' && e.date.startsWith(selectedMonth))
    .reduce((sum, e) => sum + e.amount, 0) || 500; // default planned 500

  // Other Fixed & Variable Expenses (excluding cards & supermarket to avoid double counting)
  const ricardoOtherExpenses = monthTxs
    .filter(
      (t) =>
        t.person === 'Ricardo' &&
        t.type === 'despesa' &&
        t.paymentMethod !== 'credito' &&
        t.category !== 'Supermercado' &&
        t.category !== 'Investimentos'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const ellenOtherExpenses = monthTxs
    .filter(
      (t) =>
        t.person === 'Ellen' &&
        t.type === 'despesa' &&
        t.paymentMethod !== 'credito' &&
        t.category !== 'Supermercado' &&
        t.category !== 'Investimentos'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Outflows & Available Net Free Balance (Saldo Livre)
  const ricardoTotalCommitted =
    ricardoCardTotal + ricardoGroceryRealized + ricardoEmergency + ricardoOtherExpenses;
  const ricardoFreeBalance = Math.max(0, salarySettings.ricardoNetSalary - ricardoTotalCommitted);
  const ricardoDeficit = ricardoTotalCommitted > salarySettings.ricardoNetSalary ? ricardoTotalCommitted - salarySettings.ricardoNetSalary : 0;

  const ellenTotalCommitted =
    ellenCardTotal + ellenGroceryRealized + ellenEmergency + ellenOtherExpenses;
  const ellenFreeBalance = Math.max(0, salarySettings.ellenNetSalary - ellenTotalCommitted);
  const ellenDeficit = ellenTotalCommitted > salarySettings.ellenNetSalary ? ellenTotalCommitted - salarySettings.ellenNetSalary : 0;

  const totalFamilyIncome = salarySettings.ricardoNetSalary + salarySettings.ellenNetSalary;
  const totalFamilyCommitted = ricardoTotalCommitted + ellenTotalCommitted;
  const totalFamilyFreeBalance = ricardoFreeBalance + ellenFreeBalance;
  const totalFamilyCard = ricardoCardTotal + ellenCardTotal;
  const totalFamilyGrocery = ricardoGroceryRealized + ellenGroceryRealized;
  const totalFamilyEmergency = ricardoEmergency + ellenEmergency;
  const totalFamilyOther = ricardoOtherExpenses + ellenOtherExpenses;

  // Percentages of Income
  const ricardoFreePercent = salarySettings.ricardoNetSalary > 0 ? (ricardoFreeBalance / salarySettings.ricardoNetSalary) * 100 : 0;
  const ellenFreePercent = salarySettings.ellenNetSalary > 0 ? (ellenFreeBalance / salarySettings.ellenNetSalary) * 100 : 0;
  const familyFreePercent = totalFamilyIncome > 0 ? (totalFamilyFreeBalance / totalFamilyIncome) * 100 : 0;

  // 1. Stacked Bar Chart Data (Composição do Orçamento)
  const stackedBarData = [
    {
      name: p1,
      salario: salarySettings.ricardoNetSalary,
      cartao: ricardoCardTotal,
      mercado: ricardoGroceryRealized,
      reserva: ricardoEmergency,
      outras: ricardoOtherExpenses,
      saldoLivre: ricardoFreeBalance,
    },
    {
      name: p2,
      salario: salarySettings.ellenNetSalary,
      cartao: ellenCardTotal,
      mercado: ellenGroceryRealized,
      reserva: ellenEmergency,
      outras: ellenOtherExpenses,
      saldoLivre: ellenFreeBalance,
    },
    {
      name: 'Família (Total)',
      salario: totalFamilyIncome,
      cartao: totalFamilyCard,
      mercado: totalFamilyGrocery,
      reserva: totalFamilyEmergency,
      outras: totalFamilyOther,
      saldoLivre: totalFamilyFreeBalance,
    },
  ];

  // 2. Donut Data for selected Person / Family
  const donutData = useMemo(() => {
    if (donutPersonFilter === 'Ricardo') {
      return [
        { name: 'Cartão de Crédito', value: ricardoCardTotal, color: '#8b5cf6' },
        { name: 'Supermercado', value: ricardoGroceryRealized, color: '#10b981' },
        { name: 'Reserva Obrigatória', value: ricardoEmergency, color: '#3b82f6' },
        { name: 'Outras Despesas', value: ricardoOtherExpenses, color: '#f59e0b' },
        { name: 'Saldo Livre Disponível', value: ricardoFreeBalance, color: '#06b6d4' },
      ].filter((d) => d.value > 0);
    }
    if (donutPersonFilter === 'Ellen') {
      return [
        { name: 'Cartão de Crédito', value: ellenCardTotal, color: '#8b5cf6' },
        { name: 'Supermercado', value: ellenGroceryRealized, color: '#10b981' },
        { name: 'Reserva Obrigatória', value: ellenEmergency, color: '#3b82f6' },
        { name: 'Outras Despesas', value: ellenOtherExpenses, color: '#f59e0b' },
        { name: 'Saldo Livre Disponível', value: ellenFreeBalance, color: '#ec4899' },
      ].filter((d) => d.value > 0);
    }
    return [
      { name: 'Cartão de Crédito (Ambos)', value: totalFamilyCard, color: '#8b5cf6' },
      { name: 'Supermercado Conjunto', value: totalFamilyGrocery, color: '#10b981' },
      { name: 'Reserva de Emergência', value: totalFamilyEmergency, color: '#3b82f6' },
      { name: 'Outras Despesas Fixas', value: totalFamilyOther, color: '#f59e0b' },
      { name: 'Saldo Livre Familiar', value: totalFamilyFreeBalance, color: '#10b981' },
    ].filter((d) => d.value > 0);
  }, [
    donutPersonFilter,
    ricardoCardTotal,
    ricardoGroceryRealized,
    ricardoEmergency,
    ricardoOtherExpenses,
    ricardoFreeBalance,
    ellenCardTotal,
    ellenGroceryRealized,
    ellenEmergency,
    ellenOtherExpenses,
    ellenFreeBalance,
    totalFamilyCard,
    totalFamilyGrocery,
    totalFamilyEmergency,
    totalFamilyOther,
    totalFamilyFreeBalance,
  ]);

  // 3. Targets vs Actual Data (Metas e Limites)
  const targetsComparisonData = [
    {
      categoria: `Cartão (${p1})`,
      real: ricardoCardTotal,
      meta: 500,
      status: ricardoCardTotal <= 500 ? 'ok' : 'alerta',
      pessoa: p1,
    },
    {
      categoria: `Cartão (${p2})`,
      real: ellenCardTotal,
      meta: 500,
      status: ellenCardTotal <= 500 ? 'ok' : 'alerta',
      pessoa: p2,
    },
    {
      categoria: `Mercado (${p1})`,
      real: ricardoGroceryRealized,
      meta: ricardoGroceryPlanned,
      status: ricardoGroceryRealized <= ricardoGroceryPlanned ? 'ok' : 'alerta',
      pessoa: p1,
    },
    {
      categoria: `Mercado (${p2})`,
      real: ellenGroceryRealized,
      meta: ellenGroceryPlanned,
      status: ellenGroceryRealized <= ellenGroceryPlanned ? 'ok' : 'alerta',
      pessoa: p2,
    },
    {
      categoria: `Reserva (${p1})`,
      real: ricardoEmergency,
      meta: 500,
      status: ricardoEmergency >= 500 ? 'ok' : 'atencao',
      pessoa: p1,
    },
    {
      categoria: `Reserva (${p2})`,
      real: ellenEmergency,
      meta: 500,
      status: ellenEmergency >= 500 ? 'ok' : 'atencao',
      pessoa: p2,
    },
  ];

  // 4. 6-Month Historical Evolution Data
  const historicalEvolutionData = useMemo(() => {
    const months = [-3, -2, -1, 0, 1, 2].map((offset) => addMonthsToKey(selectedMonth, offset));
    
    return months.map((mKey) => {
      const isCurrent = mKey === selectedMonth;
      const mInvoices = getCardInvoicesForMonth(mKey);
      const rCard = mInvoices.filter((i) => i.card.person === 'Ricardo').reduce((s, i) => s + i.totalAmount, 0);
      const eCard = mInvoices.filter((i) => i.card.person === 'Ellen').reduce((s, i) => s + i.totalAmount, 0);

      // Check transactions for month
      const txs = transactions.filter((t) => (t.competenceMonth || t.date.slice(0, 7)) === mKey);
      const rOther = txs
        .filter((t) => t.person === 'Ricardo' && t.type === 'despesa' && t.paymentMethod !== 'credito' && t.category !== 'Supermercado' && t.category !== 'Investimentos')
        .reduce((s, t) => s + t.amount, 0);
      const eOther = txs
        .filter((t) => t.person === 'Ellen' && t.type === 'despesa' && t.paymentMethod !== 'credito' && t.category !== 'Supermercado' && t.category !== 'Investimentos')
        .reduce((s, t) => s + t.amount, 0);

      const rGrocery = isCurrent ? ricardoGroceryRealized : 600;
      const eGrocery = isCurrent ? ellenGroceryRealized : 400;
      const rEmerg = 500;
      const eEmerg = 500;

      const rCommitted = rCard + rGrocery + rEmerg + rOther;
      const eCommitted = eCard + eGrocery + eEmerg + eOther;

      const rFree = Math.max(0, salarySettings.ricardoNetSalary - rCommitted);
      const eFree = Math.max(0, salarySettings.ellenNetSalary - eCommitted);

      const [y, m] = mKey.split('-');
      const shortLabel = `${m}/${y.slice(2)}`;

      return {
        monthKey: mKey,
        label: shortLabel,
        isCurrent,
        rendaTotal: totalFamilyIncome,
        rendaRicardo: salarySettings.ricardoNetSalary,
        rendaEllen: salarySettings.ellenNetSalary,
        gastoRicardo: rCommitted,
        gastoEllen: eCommitted,
        gastoFamiliar: rCommitted + eCommitted,
        saldoLivreRicardo: rFree,
        saldoLivreEllen: eFree,
        saldoLivreFamiliar: rFree + eFree,
      };
    });
  }, [
    selectedMonth,
    getCardInvoicesForMonth,
    transactions,
    salarySettings,
    ricardoGroceryRealized,
    ellenGroceryRealized,
    totalFamilyIncome,
  ]);

  const handleSaveSalaries = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalarySettings({
      ricardoNetSalary: Number(ricardoSalaryInput) || 5300,
      ricardoAdvanceSalary: Number(ricardoAdvanceInput) || 2120,
      ricardoMainSalary: (Number(ricardoSalaryInput) || 5300) - (Number(ricardoAdvanceInput) || 2120),
      ellenNetSalary: Number(ellenSalaryInput) || 1600,
    });
    setIsEditingSalaries(false);
  };

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs space-y-1.5 z-50 text-white min-w-[200px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400">{formatMonthYearBR(selectedMonth)}</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <strong className="text-white font-mono">{formatCurrency(entry.value)}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Orçamento Pessoal & Gestão por Pessoa
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {formatMonthYearBR(selectedMonth)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoramento gráfico individual de rendas, tetos de cartão, reserva obrigatória e saldo livre
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsEditingSalaries(!isEditingSalaries)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingSalaries ? 'Fechar Edição' : 'Ajustar Salários Base'}</span>
          </button>
        </div>
      </div>

      {/* Salary Settings Editing Drawer */}
      {isEditingSalaries && (
        <form
          onSubmit={handleSaveSalaries}
          className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              Configurar Salários Líquidos Mensais
            </h3>
            <span className="text-[11px] text-slate-500">
              Base recorrente mensal da família
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {p1} - Salário Líquido Total (R$)
              </label>
              <input
                type="number"
                step="50"
                value={ricardoSalaryInput}
                onChange={(e) => setRicardoSalaryInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {p1} - Adiantamento Dia 15 (R$)
              </label>
              <input
                type="number"
                step="50"
                value={ricardoAdvanceInput}
                onChange={(e) => setRicardoAdvanceInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {p2} - Salário / Bolsa Estágio (R$)
              </label>
              <input
                type="number"
                step="50"
                value={ellenSalaryInput}
                onChange={(e) => setEllenSalaryInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-900/50">
            <button
              type="button"
              onClick={() => setIsEditingSalaries(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Salários</span>
            </button>
          </div>
        </form>
      )}

      {/* KPI Quick Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Renda Total Familiar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Renda Total Líquida</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalFamilyIncome)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
            <span className="text-blue-500 font-semibold">{p1}: {formatCurrency(salarySettings.ricardoNetSalary)}</span>
            <span>•</span>
            <span className="text-pink-500 font-semibold">{p2}: {formatCurrency(salarySettings.ellenNetSalary)}</span>
          </div>
        </div>

        {/* Total Comprometido */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Compromissos do Mês</span>
          <div className="text-base sm:text-lg font-black text-red-600 dark:text-red-400">
            {formatCurrency(totalFamilyCommitted)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {((totalFamilyCommitted / (totalFamilyIncome || 1)) * 100).toFixed(1)}% da renda familiar
          </div>
        </div>

        {/* Saldo Livre Familiar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Saldo Livre Familiar</span>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalFamilyFreeBalance)}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-semibold">
            {familyFreePercent.toFixed(1)}% de margem disponível
          </div>
        </div>

        {/* Status Regra dos Cartões */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 block mb-1">Faturas / Meta R$ 1.000</span>
          <div className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(totalFamilyCard)}
          </div>
          <div className="flex items-center gap-1 text-[10px] mt-1 font-semibold">
            {totalFamilyCard <= 1000 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Dentro da Meta
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> Excedeu +{formatCurrency(totalFamilyCard - 1000)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 PAINEL DE GRÁFICOS & MONITORAMENTO VISUAL DO ORÇAMENTO                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
        {/* Chart Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Monitoramento Gráfico do Orçamento
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize a decomposição de gastos, alocação percentual e tendências
            </p>
          </div>

          {/* Chart Type Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveChartType('composicao')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeChartType === 'composicao'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Composição da Renda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartType('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeChartType === 'donut'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Distribuição %</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartType('metas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeChartType === 'metas'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Metas vs Realizado</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartType('historico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeChartType === 'historico'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Evolução 6 Meses</span>
            </button>
          </div>
        </div>

        {/* 1. CHART TYPE: COMPOSIÇÃO DA RENDA (Stacked Bar Chart) */}
        {activeChartType === 'composicao' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-medium">
                Decomposição do Salário Líquido em Faturas, Supermercado, Reserva e Saldo Livre:
              </span>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Cartão de Crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Supermercado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Reserva Obrigatória
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Outras Despesas
                </span>
                <span className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Saldo Livre Disponível
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stackedBarData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="cartao" name="Cartão de Crédito" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="mercado" name="Supermercado" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="reserva" name="Reserva de Emergência" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="outras" name="Outras Despesas" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="saldoLivre" name="Saldo Livre Disponível" stackId="a" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <span className="font-bold text-blue-900 dark:text-blue-200 block">{p1}:</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Comprometido: <strong>{formatCurrency(ricardoTotalCommitted)}</strong> • Saldo Livre: <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(ricardoFreeBalance)}</strong> ({ricardoFreePercent.toFixed(0)}%)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-pink-50/60 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40">
                <span className="font-bold text-pink-900 dark:text-pink-200 block">{p2}:</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Comprometido: <strong>{formatCurrency(ellenTotalCommitted)}</strong> • Saldo Livre: <strong className="text-pink-600 dark:text-pink-400">{formatCurrency(ellenFreeBalance)}</strong> ({ellenFreePercent.toFixed(0)}%)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">Família (Consolidado):</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Comprometido: <strong>{formatCurrency(totalFamilyCommitted)}</strong> • Saldo Livre: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFamilyFreeBalance)}</strong> ({familyFreePercent.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHART TYPE: DISTRIBUIÇÃO % (Donut Chart) */}
        {activeChartType === 'donut' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Fatia do Orçamento por Categoria ({donutPersonFilter === 'Familia' ? 'Consolidado Familiar' : donutPersonFilter}):
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                {(['Familia', 'Ricardo', 'Ellen'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDonutPersonFilter(filter)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      donutPersonFilter === filter
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'Familia' ? 'Família' : filter === 'Ricardo' ? p1 : p2}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Donut Graphic */}
              <div className="h-72 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                    />
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {donutPersonFilter === 'Familia' ? 'Renda Total' : `Renda ${donutPersonFilter === 'Ricardo' ? p1 : p2}`}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(
                      donutPersonFilter === 'Ricardo'
                        ? salarySettings.ricardoNetSalary
                        : donutPersonFilter === 'Ellen'
                        ? salarySettings.ellenNetSalary
                        : totalFamilyIncome
                    )}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Livre: {formatCurrency(
                      donutPersonFilter === 'Ricardo'
                        ? ricardoFreeBalance
                        : donutPersonFilter === 'Ellen'
                        ? ellenFreeBalance
                        : totalFamilyFreeBalance
                    )}
                  </span>
                </div>
              </div>

              {/* Legend & Breakdown List */}
              <div className="space-y-2.5 text-xs">
                {donutData.map((item, idx) => {
                  const baseIncome =
                    donutPersonFilter === 'Ricardo'
                      ? salarySettings.ricardoNetSalary
                      : donutPersonFilter === 'Ellen'
                      ? salarySettings.ellenNetSalary
                      : totalFamilyIncome;
                  const pct = baseIncome > 0 ? (item.value / baseIncome) * 100 : 0;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-md shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. CHART TYPE: METAS VS REALIZADO */}
        {activeChartType === 'metas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Comparação direta entre os Tetos/Metas Planejados e o Realizado no Mês:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Meta / Teto
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Realizado no Mês
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={targetsComparisonData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="categoria"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tickFormatter={(val) => `R$ ${val}`}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="meta" name="Meta / Teto Planejado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="real" name="Gasto / Aporte Realizado" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {targetsComparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-target-${index}`}
                        fill={entry.status === 'ok' ? '#10b981' : entry.status === 'alerta' ? '#ef4444' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40">
                <span className="font-bold text-purple-900 dark:text-purple-200 block mb-1">Regra de Cartões (R$ 500 cada):</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {p1}: {formatCurrency(ricardoCardTotal)} / R$ 500 • {p2}: {formatCurrency(ellenCardTotal)} / R$ 500
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1">Supermercado (R$ 1.000 a 1.150):</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {p1} ({formatCurrency(ricardoGroceryRealized)}/{formatCurrency(ricardoGroceryPlanned)}) + {p2} ({formatCurrency(ellenGroceryRealized)}/{formatCurrency(ellenGroceryPlanned)})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">Reserva Obrigatória (R$ 1.000):</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {p1}: {formatCurrency(ricardoEmergency)} • {p2}: {formatCurrency(ellenEmergency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. CHART TYPE: EVOLUÇÃO 6 MESES */}
        {activeChartType === 'historico' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Trajetória da Renda Familiar, Gastos Comprometidos e Saldo Livre ao Longo do Tempo:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Renda Familiar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Gastos Comprometidos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Saldo Livre
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historicalEvolutionData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorRenda" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLivre" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rendaTotal"
                    name="Renda Familiar"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRenda)"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastoFamiliar"
                    name="Gastos Comprometidos"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGasto)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saldoLivreFamiliar"
                    name="Saldo Livre Disponível"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLivre)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              💡 Mês destacado atual: <strong>{formatMonthYearBR(selectedMonth)}</strong>. Altere o seletor de mês na barra superior para simular cenários futuros ou passados.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📑 DETALHAMENTO INDIVIDUAL & CARDS POR PESSOA                           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Navigation Tabs between Comparative Cards & Table */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedPersonTab('comparativo')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedPersonTab === 'comparativo'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Visão Lado a Lado (Cards)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPersonTab('ricardo')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedPersonTab === 'ricardo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Foco {p1}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPersonTab('ellen')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedPersonTab === 'ellen'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Foco {p2}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPersonTab('tabela')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedPersonTab === 'tabela'
                  ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tabela Comparativa %</span>
            </button>
          </div>
        </div>

        {/* Main Comparative Cards (Ricardo, Ellen & Consolidated Total) */}
        {(selectedPersonTab === 'comparativo' || selectedPersonTab === 'ricardo' || selectedPersonTab === 'ellen') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Ricardo Column */}
            {(selectedPersonTab === 'comparativo' || selectedPersonTab === 'ricardo') && (
              <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 space-y-4 shadow-xs ${selectedPersonTab === 'ricardo' ? 'lg:col-span-3 max-w-2xl mx-auto w-full' : ''}`}>
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Orçamento Individual
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {p1}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Renda Líquida</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(salarySettings.ricardoNetSalary)}
                    </span>
                  </div>
                </div>

                {/* Income Structure */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Composição da Renda:
                  </span>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Adiantamento (Dia 15):</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatCurrency(salarySettings.ricardoAdvanceSalary || 2120)}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Pagamento Principal:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatCurrency(
                        salarySettings.ricardoNetSalary - (salarySettings.ricardoAdvanceSalary || 2120)
                      )}
                    </strong>
                  </div>
                </div>

                {/* Outflows Breakdown */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Compromissos do Mês ({formatMonthYearBR(selectedMonth)}):
                  </span>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                      Fatura Cartão:
                    </span>
                    <strong className={ricardoCardTotal > 500 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}>
                      {formatCurrency(ricardoCardTotal)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ R$ 500</span>
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                      Supermercado (Semanal):
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100">
                      {formatCurrency(ricardoGroceryRealized)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ {formatCurrency(ricardoGroceryPlanned)}</span>
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      Reserva Obrigatória:
                    </span>
                    <strong className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(ricardoEmergency)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ R$ 500</span>
                    </strong>
                  </div>

                  {ricardoOtherExpenses > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-500">Outras Despesas Fixas:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatCurrency(ricardoOtherExpenses)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Saldo Livre Ricardo */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-blue-900 dark:text-blue-200">Saldo Livre Disponível:</span>
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                      {formatCurrency(ricardoFreeBalance)}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">
                    Representa <strong>{ricardoFreePercent.toFixed(1)}%</strong> da renda mensal após todos os compromissos.
                  </p>
                </div>
              </div>
            )}

            {/* Ellen Column */}
            {(selectedPersonTab === 'comparativo' || selectedPersonTab === 'ellen') && (
              <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/60 space-y-4 shadow-xs ${selectedPersonTab === 'ellen' ? 'lg:col-span-3 max-w-2xl mx-auto w-full' : ''}`}>
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                      Orçamento Individual
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {p2}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Bolsa Estágio</span>
                    <span className="text-lg font-black text-pink-600 dark:text-pink-400">
                      {formatCurrency(salarySettings.ellenNetSalary)}
                    </span>
                  </div>
                </div>

                {/* Income Structure */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Composição da Renda:
                  </span>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Remuneração Única:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatCurrency(salarySettings.ellenNetSalary)}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Benefício Cesta Básica:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      Alívio Mensal Ativo
                    </strong>
                  </div>
                </div>

                {/* Outflows Breakdown */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Compromissos do Mês ({formatMonthYearBR(selectedMonth)}):
                  </span>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                      Fatura Cartão:
                    </span>
                    <strong className={ellenCardTotal > 500 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}>
                      {formatCurrency(ellenCardTotal)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ R$ 500</span>
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                      Supermercado (Mensal):
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100">
                      {formatCurrency(ellenGroceryRealized)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ R$ 400</span>
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-pink-500" />
                      Reserva Obrigatória:
                    </span>
                    <strong className="text-pink-600 dark:text-pink-400">
                      {formatCurrency(ellenEmergency)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ R$ 500</span>
                    </strong>
                  </div>

                  {ellenOtherExpenses > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-500">Outras Despesas Fixas:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatCurrency(ellenOtherExpenses)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Saldo Livre Ellen */}
                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/50 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-pink-900 dark:text-pink-200">Saldo Livre Disponível:</span>
                    <span className="text-sm font-black text-pink-700 dark:text-pink-300">
                      {formatCurrency(ellenFreeBalance)}
                    </span>
                  </div>
                  <p className="text-[10px] text-pink-600 dark:text-pink-400">
                    Representa <strong>{ellenFreePercent.toFixed(1)}%</strong> da remuneração mensal.
                  </p>
                </div>
              </div>
            )}

            {/* Family Consolidated Column */}
            {selectedPersonTab === 'comparativo' && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-4 shadow-xs">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Consolidado Familiar
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      Família ({p1} + {p2})
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Renda Total</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalFamilyIncome)}
                    </span>
                  </div>
                </div>

                {/* Summary Items */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Metas de Cartão (Ambos):</span>
                    <strong className="text-purple-600 dark:text-purple-400">
                      {formatCurrency(totalFamilyCard)} / R$ 1.000
                    </strong>
                  </div>

                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Supermercado Conjunto:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatCurrency(totalFamilyGrocery)}
                    </strong>
                  </div>

                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Aporte Reserva de Emergência:</span>
                    <strong className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(totalFamilyEmergency)} / R$ 1.000
                    </strong>
                  </div>

                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Total Comprometido do Mês:</span>
                    <strong className="text-red-600 dark:text-red-400">
                      {formatCurrency(totalFamilyCommitted)}
                    </strong>
                  </div>
                </div>

                {/* Total Family Free Balance */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">Saldo Livre Familiar:</span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(totalFamilyFreeBalance)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Representa <strong>{familyFreePercent.toFixed(1)}%</strong> da renda conjunta para poupança e lazer.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tabela Comparativa de Alocação */}
        {selectedPersonTab === 'tabela' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-x-auto shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Tabela de Alocação Orçamentária Detalhada ({formatMonthYearBR(selectedMonth)})
            </h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Item Orçamentário</th>
                  <th className="py-2.5 px-3 text-right">{p1} (R$)</th>
                  <th className="py-2.5 px-3 text-right">% {p1}</th>
                  <th className="py-2.5 px-3 text-right">{p2} (R$)</th>
                  <th className="py-2.5 px-3 text-right">% {p2}</th>
                  <th className="py-2.5 px-3 text-right">Família (R$)</th>
                  <th className="py-2.5 px-3 text-right">% Família</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-bold">
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">Renda Líquida Total</td>
                  <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400">{formatCurrency(salarySettings.ricardoNetSalary)}</td>
                  <td className="py-2.5 px-3 text-right">100%</td>
                  <td className="py-2.5 px-3 text-right text-pink-600 dark:text-pink-400">{formatCurrency(salarySettings.ellenNetSalary)}</td>
                  <td className="py-2.5 px-3 text-right">100%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFamilyIncome)}</td>
                  <td className="py-2.5 px-3 text-right">100%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-500" /> Fatura Cartão de Crédito
                  </td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ricardoCardTotal)}</td>
                  <td className="py-2 px-3 text-right">{((ricardoCardTotal / (salarySettings.ricardoNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ellenCardTotal)}</td>
                  <td className="py-2 px-3 text-right">{((ellenCardTotal / (salarySettings.ellenNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatCurrency(totalFamilyCard)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{((totalFamilyCard / (totalFamilyIncome || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" /> Supermercado
                  </td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ricardoGroceryRealized)}</td>
                  <td className="py-2 px-3 text-right">{((ricardoGroceryRealized / (salarySettings.ricardoNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ellenGroceryRealized)}</td>
                  <td className="py-2 px-3 text-right">{((ellenGroceryRealized / (salarySettings.ellenNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatCurrency(totalFamilyGrocery)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{((totalFamilyGrocery / (totalFamilyIncome || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Reserva de Emergência
                  </td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ricardoEmergency)}</td>
                  <td className="py-2 px-3 text-right">{((ricardoEmergency / (salarySettings.ricardoNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ellenEmergency)}</td>
                  <td className="py-2 px-3 text-right">{((ellenEmergency / (salarySettings.ellenNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatCurrency(totalFamilyEmergency)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{((totalFamilyEmergency / (totalFamilyIncome || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Outras Despesas Fixas/Variáveis</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ricardoOtherExpenses)}</td>
                  <td className="py-2 px-3 text-right">{((ricardoOtherExpenses / (salarySettings.ricardoNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(ellenOtherExpenses)}</td>
                  <td className="py-2 px-3 text-right">{((ellenOtherExpenses / (salarySettings.ellenNetSalary || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatCurrency(totalFamilyOther)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{((totalFamilyOther / (totalFamilyIncome || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold border-t-2 border-emerald-200 dark:border-emerald-800">
                  <td className="py-2.5 px-3 text-emerald-900 dark:text-emerald-200">Saldo Livre Disponível</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(ricardoFreeBalance)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{ricardoFreePercent.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(ellenFreeBalance)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{ellenFreePercent.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300">{formatCurrency(totalFamilyFreeBalance)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300">{familyFreePercent.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

