import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Person } from '../../types';
import {
  formatCurrency,
  formatMonthYearBR,
  getPersonBadgeColor,
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
  Briefcase,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const BudgetPerPersonView: React.FC = () => {
  const {
    selectedMonth,
    salarySettings,
    updateSalarySettings,
    transactions,
    groceryPlan,
    groceryTrips,
    getCardInvoicesForMonth,
    investmentContributions,
    emergencyContributions,
  } = useFinance();

  const [isEditingSalaries, setIsEditingSalaries] = useState(false);
  const [ricardoSalaryInput, setRicardoSalaryInput] = useState(salarySettings.ricardoNetSalary);
  const [ricardoAdvanceInput, setRicardoAdvanceInput] = useState(salarySettings.ricardoAdvanceSalary);
  const [ellenSalaryInput, setEllenSalaryInput] = useState(salarySettings.ellenNetSalary);
  const [selectedPersonTab, setSelectedPersonTab] = useState<'comparativo' | 'ricardo' | 'ellen'>('comparativo');

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
  const ricardoFreeBalance = salarySettings.ricardoNetSalary - ricardoTotalCommitted;

  const ellenTotalCommitted =
    ellenCardTotal + ellenGroceryRealized + ellenEmergency + ellenOtherExpenses;
  const ellenFreeBalance = salarySettings.ellenNetSalary - ellenTotalCommitted;

  const totalFamilyIncome = salarySettings.ricardoNetSalary + salarySettings.ellenNetSalary;
  const totalFamilyCommitted = ricardoTotalCommitted + ellenTotalCommitted;
  const totalFamilyFreeBalance = ricardoFreeBalance + ellenFreeBalance;

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

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Orçamento Detalhado por Pessoa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Divisão individual de rendas salariais, metas de cartão, investimentos obrigatórios e saldo livre
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditingSalaries(!isEditingSalaries)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{isEditingSalaries ? 'Fechar Edição' : 'Ajustar Salários Base'}</span>
        </button>
      </div>

      {/* Salary Settings Editing Drawer */}
      {isEditingSalaries && (
        <form
          onSubmit={handleSaveSalaries}
          className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
              Configurar Salários Líquidos Mensais
            </h3>
            <span className="text-[11px] text-slate-500">
              Base recorrente mensal da família
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ricardo - Salário Líquido Total (R$)
              </label>
              <input
                type="number"
                step="50"
                value={ricardoSalaryInput}
                onChange={(e) => setRicardoSalaryInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ricardo - Adiantamento Dia 15 (R$)
              </label>
              <input
                type="number"
                step="50"
                value={ricardoAdvanceInput}
                onChange={(e) => setRicardoAdvanceInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ellen - Salário / Bolsa Estágio (R$)
              </label>
              <input
                type="number"
                step="50"
                value={ellenSalaryInput}
                onChange={(e) => setEllenSalaryInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
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

      {/* Main Comparative Cards (Ricardo, Ellen & Consolidated Total) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ricardo Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 space-y-4 shadow-xs">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Orçamento Individual
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                Ricardo
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
                Supermercado (R$ 150/sem):
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
              Valor restante após faturas, mercado e aporte da reserva de emergência.
            </p>
          </div>
        </div>

        {/* Ellen Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/60 space-y-4 shadow-xs">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                Orçamento Individual
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                Ellen
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
              Valor restante após faturas, mercado e aporte da reserva de emergência.
            </p>
          </div>
        </div>

        {/* Family Consolidated Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-4 shadow-xs">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Consolidado Familiar
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                Família (Ricardo + Ellen)
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
                {formatCurrency(ricardoCardTotal + ellenCardTotal)} / R$ 1.000
              </strong>
            </div>

            <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500">Supermercado Conjunto:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {formatCurrency(ricardoGroceryRealized + ellenGroceryRealized)}
              </strong>
            </div>

            <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500">Aporte Reserva de Emergência:</span>
              <strong className="text-blue-600 dark:text-blue-400">
                {formatCurrency(ricardoEmergency + ellenEmergency)} / R$ 1.000
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
              Capacidade de poupança extra e margem de segurança do lar no mês.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
