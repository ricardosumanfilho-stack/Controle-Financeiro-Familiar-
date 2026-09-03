import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateBR, getPersonBadgeColor } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  CreditCard,
  ShoppingCart,
  Target,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Home,
  Hammer,
  PiggyBank,
  Zap,
  Palmtree,
  Wallet,
  Compass,
} from 'lucide-react';
import { Person } from '../../types';
import { CofrinhoModal } from '../goals/CofrinhoModal';

interface DashboardViewProps {
  onOpenNewTransaction: () => void;
  onOpenNewInstallment: () => void;
  onOpenNewGrocery: () => void;
  onOpenNewInvestment: (person?: 'Ricardo' | 'Ellen') => void;
  onOpenNewEmergency: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTransaction,
  onOpenNewInstallment,
  onOpenNewGrocery,
  onOpenNewInvestment,
  onOpenNewEmergency,
}) => {
  const {
    currentMonthSummary,
    cumulativeBalance,
    getCardInvoicesForMonth,
    selectedMonth,
    transactions,
    totalEmergencyFund,
    emergencySettings,
    cofrinhos,
    cofrinhoMovements,
    renovationCredit,
    setActiveTab,
    person1Name,
    person2Name,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [personFilter, setPersonFilter] = useState<'Todos' | string>('Todos');
  const [isCofrinhoModalOpen, setIsCofrinhoModalOpen] = useState(false);
  const [cofrinhoModalMode, setCofrinhoModalMode] = useState<'movement' | 'transfer' | 'edit'>('movement');
  const [selectedCofrinhoId, setSelectedCofrinhoId] = useState<string>('cof-lazer');

  const cardInvoices = getCardInvoicesForMonth(selectedMonth);

  // Month transactions filtered by person
  const monthTransactions = transactions
    .filter((t) => t.date.startsWith(selectedMonth))
    .filter((t) => (personFilter === 'Todos' ? true : t.person === personFilter));

  const recentTransactions = monthTransactions.slice(0, 6);

  // Lazer Cofrinho calculations
  const lazerCofrinho = cofrinhos.find((c) => c.id === 'cof-lazer' || c.type === 'lazer');
  const lazerBalance = lazerCofrinho?.currentBalance || 0;
  const lazerTarget = lazerCofrinho?.targetAmount || 6000;
  const lazerPercentage = lazerTarget > 0 ? Math.min(100, (lazerBalance / lazerTarget) * 100) : 0;

  // Lazer expense in the selected month
  const lazerMonthExpense = monthTransactions
    .filter(
      (t) =>
        t.type === 'despesa' &&
        (t.category === 'Lazer' ||
          t.category.toLowerCase().includes('lazer') ||
          t.category.toLowerCase().includes('viagem') ||
          t.category.toLowerCase().includes('passeio') ||
          t.category.toLowerCase().includes('restaurante'))
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Recent movements of Lazer Cofrinho
  const lazerMovements = (cofrinhoMovements || [])
    .filter((m) => m.cofrinhoId === 'cof-lazer' || m.cofrinhoId === lazerCofrinho?.id)
    .slice(0, 3);

  const handleOpenLazerModal = (mode: 'movement' | 'transfer' | 'edit' = 'movement') => {
    setSelectedCofrinhoId(lazerCofrinho?.id || 'cof-lazer');
    setCofrinhoModalMode(mode);
    setIsCofrinhoModalOpen(true);
  };

  // Emergency Fund calculations
  const emergencyCoverageMonths =
    emergencySettings.monthlyLivingCost > 0
      ? totalEmergencyFund / emergencySettings.monthlyLivingCost
      : 0;
  const emergencyPercentage =
    emergencySettings.targetAmount > 0
      ? Math.min(100, (totalEmergencyFund / emergencySettings.targetAmount) * 100)
      : 0;

  // Grocery percentage
  const plannedGrocery = currentMonthSummary.groceryPlanned || 1000;
  const groceryPercentage = Math.min(
    100,
    (currentMonthSummary.groceryTotal / plannedGrocery) * 100
  );
  const groceryRemaining = Math.max(0, plannedGrocery - currentMonthSummary.groceryTotal);

  // Category breakdown
  const categoryExpenses = React.useMemo(() => {
    const cats: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);

  const totalFilteredExpense = monthTransactions
    .filter((t) => t.type === 'despesa')
    .reduce((s, t) => s + t.amount, 0);

  // Cofrinhos total accumulated
  const totalCofrinhos = cofrinhos.reduce((s, c) => s + c.currentBalance, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter by Person & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Filtrar Visão:
          </span>
          <div className="flex flex-wrap gap-1">
            {['Todos', p1, p2].map((p) => {
              const active = personFilter === p;
              return (
                <button
                  key={p}
                  id={`dash-filter-${p.toLowerCase()}`}
                  onClick={() => setPersonFilter(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="dash-quick-add-tx"
            onClick={onOpenNewTransaction}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançamento</span>
          </button>
        </div>
      </div>

      {/* Main Monthly Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receitas do Mês
            </span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(
                personFilter === 'Todos'
                  ? currentMonthSummary.totalIncome
                  : currentMonthSummary.incomeByPerson[personFilter]
              )}
            </h3>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1">
              <span>Recorrente: {formatCurrency(currentMonthSummary.recurringIncome)}</span>
              {currentMonthSummary.extraordinaryIncome > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  • +{formatCurrency(currentMonthSummary.extraordinaryIncome)} Extraordinário
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Despesas do Mês
            </span>
            <div className="p-2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(
                personFilter === 'Todos'
                  ? currentMonthSummary.totalExpense
                  : currentMonthSummary.expenseByPerson[personFilter]
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {monthTransactions.filter((t) => t.type === 'despesa').length} despesas no período
            </p>
          </div>
        </div>

        {/* Saldo Líquido do Mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saldo Líquido Mensal
            </span>
            <div
              className={`p-2 rounded-xl ${
                currentMonthSummary.balance >= 0
                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl font-black ${
                currentMonthSummary.balance >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {formatCurrency(
                personFilter === 'Todos'
                  ? currentMonthSummary.balance
                  : currentMonthSummary.incomeByPerson[personFilter] -
                      currentMonthSummary.expenseByPerson[personFilter]
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Receitas menos despesas do mês
            </p>
          </div>
        </div>

        {/* Saldo Acumulado */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saldo Acumulado Geral
            </span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(cumulativeBalance)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Patrimônio líquido em caixa
            </p>
          </div>
        </div>
      </div>

      {/* COFRINHOS & ESTRUTURA PATRIMONIAL BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-slate-800 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cofrinhos & Metas Estruturais
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Planejamento Familiar
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Total Acumulado em Cofrinhos: <strong className="text-white">{formatCurrency(totalCofrinhos)}</strong> • Crédito Reforma Disponível: <strong className="text-amber-300">{formatCurrency(currentMonthSummary.renovationCreditAvailable)}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('house')}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl transition-all shadow-xs flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Nova Casa</span>
            </button>
            <button
              onClick={() => setActiveTab('renovation')}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600/80 hover:bg-amber-600 text-white rounded-xl transition-all shadow-xs flex items-center gap-1"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Reforma</span>
            </button>
            <button
              onClick={() => setActiveTab('closing')}
              className="px-3 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all shadow-xs flex items-center gap-1"
            >
              <span>Fechamento</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {cofrinhos.map((pot) => (
            <div
              key={pot.id}
              className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[140px]">
                  {pot.name}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pot.color }} />
              </div>
              <div className="text-sm font-black text-white">{formatCurrency(pot.currentBalance)}</div>
              {pot.targetAmount ? (
                <div className="text-[10px] text-slate-400">
                  Meta: {formatCurrency(pot.targetAmount)}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500">Reserva Contínua</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown por Pessoa: Ricardo, Ellen e Família */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Divisão Familiar: Ricardo, Ellen & Família
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhamento de receitas, adiantamento dia 15, despesas e saldo individual
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Ricardo', 'Ellen', 'Família'] as Person[]).map((person) => {
            const colors = getPersonBadgeColor(person);
            const income = currentMonthSummary.incomeByPerson[person];
            const expense = currentMonthSummary.expenseByPerson[person];
            const net = income - expense;

            return (
              <div
                key={person}
                className={`p-4 rounded-2xl border ${colors.border} ${colors.bg} space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                      <User className="w-4 h-4" style={{ color: colors.accent }} />
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {person}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      net >= 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    Saldo: {formatCurrency(net)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Receitas</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(income)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Despesas</span>
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      {formatCurrency(expense)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Os 4 Pilares / Metas Obrigatórias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Faturas de Cartão com Meta de R$ 500 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-950/50 text-purple-600 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Faturas com Meta de R$ 500
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Limite e meta de R$ 500 por cartão
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('cards')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
            >
              Ver Detalhes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cardInvoices.map((inv) => {
              const isOver = inv.totalAmount > inv.limitGoal;
              return (
                <div
                  key={inv.card.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: inv.card.color }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {inv.card.name}
                      </span>
                      <span className="text-slate-400">({inv.card.person})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                      <span className="text-slate-400 text-[11px]"> / {formatCurrency(inv.limitGoal)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver
                          ? 'bg-red-500'
                          : inv.percentageUsed > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, inv.percentageUsed)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={
                        isOver
                          ? 'text-red-600 dark:text-red-400 font-semibold flex items-center gap-1'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {isOver ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          Ultrapassou a meta em {formatCurrency(inv.totalAmount - inv.limitGoal)}
                        </>
                      ) : (
                        `Disponível: ${formatCurrency(inv.limitGoal - inv.totalAmount)}`
                      )}
                    </span>
                    <span className="text-slate-400">{inv.items.length} itens na fatura</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onOpenNewInstallment}
              className="w-full py-2 px-3 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors text-center"
            >
              + Nova Compra Parcelada
            </button>
          </div>
        </div>

        {/* 2. Supermercado com Planejamento Inteligente */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Supermercado (Meta {formatCurrency(plannedGrocery)})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ricardo (R$ 150/semana) + Ellen (R$ 400/mês)
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('grocery')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              Ver Detalhes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Gasto no Mês</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(currentMonthSummary.groceryTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Meta Planejada</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(plannedGrocery)}
                </span>
              </div>
            </div>

            {/* Large progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentMonthSummary.groceryTotal > plannedGrocery
                      ? 'bg-red-500'
                      : groceryPercentage > 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, groceryPercentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{groceryPercentage.toFixed(1)}% do orçamento utilizado</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Resta: {formatCurrency(groceryRemaining)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenNewGrocery}
            className="w-full py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Compra de Supermercado</span>
          </button>
        </div>

        {/* 3. Investimentos: R$ 500 por Pessoa (Ricardo + Ellen) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Investimentos (R$ 500 / pessoa)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aportes mensais planejados
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('goals')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              Ver Metas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ricardo */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Ricardo</span>
                {currentMonthSummary.investmentRicardo >= 500 ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Meta OK
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600">Pendente</span>
                )}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(currentMonthSummary.investmentRicardo)}
                <span className="text-xs font-normal text-slate-400"> / R$ 500</span>
              </div>
              <button
                onClick={() => onOpenNewInvestment('Ricardo')}
                className="w-full py-1.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + Aporte Ricardo
              </button>
            </div>

            {/* Ellen */}
            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">Ellen</span>
                {currentMonthSummary.investmentEllen >= 500 ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Meta OK
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600">Pendente</span>
                )}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(currentMonthSummary.investmentEllen)}
                <span className="text-xs font-normal text-slate-400"> / R$ 500</span>
              </div>
              <button
                onClick={() => onOpenNewInvestment('Ellen')}
                className="w-full py-1.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                + Aporte Ellen
              </button>
            </div>
          </div>
        </div>

        {/* 4. Reserva de Emergência (8 Meses) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Reserva de Emergência
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Meta de 8 meses da renda salarial (R$ 55.200)
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('goals')}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              Acompanhar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Saldo Consolidado</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalEmergencyFund)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Meta (8 Meses)</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(emergencySettings.targetAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${emergencyPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span>{emergencyPercentage.toFixed(1)}% da meta atingida</span>
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  {emergencyCoverageMonths.toFixed(1)} meses de custos cobertos
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenNewEmergency}
            className="w-full py-2 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Aporte na Reserva</span>
          </button>
        </div>

        {/* 5. JANELA DE SALDO PARA LAZER & VIAGENS (10% Rendas Extras + Rendimentos CDI) */}
        <div
          id="dash-lazer-window"
          className="md:col-span-2 bg-gradient-to-br from-white via-purple-50/20 to-purple-100/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 p-5 sm:p-6 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 space-y-5 shadow-xs relative overflow-hidden"
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-2xl border border-purple-200/60 dark:border-purple-800/60 shadow-2xs">
                <Palmtree className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Saldo para Lazer & Viagens
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    10% Renda Extra
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    Livre de Culpa
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Recurso familiar dedicado para passeios, viagens, restaurantes e entretenimento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="dash-lazer-view-cofrinho"
                onClick={() => setActiveTab('goals')}
                className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 bg-purple-50/80 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200/50 dark:border-purple-900/40"
              >
                <span>Acessar Metas & Cofrinhos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metric Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
            {/* Saldo Atual */}
            <div className="p-4 bg-white dark:bg-slate-800/80 border border-purple-200/70 dark:border-purple-900/40 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Saldo Disponível
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(lazerBalance)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{lazerCofrinho?.institution || 'C6 Bank'}</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {lazerCofrinho?.applicationType || 'CDB 102% CDI'}
                </span>
              </div>
            </div>

            {/* Rendimentos CDI */}
            <div className="p-4 bg-white dark:bg-slate-800/80 border border-purple-200/70 dark:border-purple-900/40 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Rendimento CDI
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(lazerCofrinho?.monthlyYield || 0)}
                <span className="text-xs font-normal text-slate-400">/mês</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Acumulado:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  +{formatCurrency(lazerCofrinho?.accumulatedYield || 0)}
                </span>
              </div>
            </div>

            {/* Gastos de Lazer no Mês */}
            <div className="p-4 bg-white dark:bg-slate-800/80 border border-purple-200/70 dark:border-purple-900/40 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Utilizado no Mês
                </span>
                <Compass className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(lazerMonthExpense)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Despesas de Lazer:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {
                    monthTransactions.filter(
                      (t) =>
                        t.type === 'despesa' &&
                        (t.category === 'Lazer' ||
                          t.category.toLowerCase().includes('lazer') ||
                          t.category.toLowerCase().includes('viagem') ||
                          t.category.toLowerCase().includes('restaurante'))
                    ).length
                  }{' '}
                  lançamentos
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar for Leisure / Vacation Goal */}
          <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 rounded-2xl space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Meta de Lazer & Férias da Família
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(lazerBalance)} de {formatCurrency(lazerTarget)}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${lazerPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>{lazerPercentage.toFixed(1)}% do objetivo acumulado</span>
              <span className="text-purple-700 dark:text-purple-300 font-medium">
                Regra 70/20/10: 10% automático de toda renda extra
              </span>
            </div>
          </div>

          {/* Recent movements list (if any) + Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 relative z-10">
            {lazerMovements.length > 0 ? (
              <div className="flex-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Últimos movimentos:
                </span>
                {lazerMovements.slice(0, 2).map((mov) => {
                  const isPositive = mov.type === 'aporte' || mov.type === 'rendimento';
                  return (
                    <span
                      key={mov.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      <span
                        className={`font-bold ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatCurrency(mov.amount)}
                      </span>
                      <span className="text-slate-400 text-[10px]">({formatDateBR(mov.date)})</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Nenhum resgate recente no cofrinho de lazer.
              </div>
            )}

            <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
              <button
                id="dash-lazer-btn-movement"
                onClick={() => handleOpenLazerModal('movement')}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aportar / Resgatar</span>
              </button>
              <button
                id="dash-lazer-btn-expense"
                onClick={onOpenNewTransaction}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Palmtree className="w-3.5 h-3.5" />
                <span>+ Gasto de Lazer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Despesas por Categoria & Últimos Lançamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categorias */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Despesas por Categoria
          </h3>

          {categoryExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhuma despesa registrada neste mês.</p>
          ) : (
            <div className="space-y-3">
              {categoryExpenses.map(([cat, amount]) => {
                const pct = totalFilteredExpense > 0 ? (amount / totalFilteredExpense) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(amount)}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos Lançamentos */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Lançamentos do Mês ({monthTransactions.length})
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              Ver Todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const personColors = getPersonBadgeColor(tx.person);
              const isIncome = tx.type === 'receita';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-xs font-bold ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tx.description}
                        </span>
                        {tx.isDemo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-semibold">
                            Demo
                          </span>
                        )}
                        {tx.type === 'investimento' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-semibold">
                            Investimento
                          </span>
                        )}
                        {tx.type === 'transferencia' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 font-semibold">
                            Transferência
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{formatDateBR(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded-md font-semibold ${personColors.badge}`}>
                          {tx.person}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={`block text-[10px] font-medium ${
                        tx.paid
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {tx.paid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal para Operações Diretas de Cofrinho (Lazer / Reserva / Casa) */}
      <CofrinhoModal
        isOpen={isCofrinhoModalOpen}
        onClose={() => setIsCofrinhoModalOpen(false)}
        defaultCofrinhoId={selectedCofrinhoId}
        initialMode={cofrinhoModalMode}
      />
    </div>
  );
};
