import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard as CreditCardType, InstallmentPurchase, Person } from '../../types';
import { addMonthsToKey, formatCurrency, formatMonthYearBR, getPersonBadgeColor } from '../../utils/formatters';
import {
  CreditCard,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Zap,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface CardsViewProps {
  onOpenNewInstallment: () => void;
  onOpenNewCard: () => void;
  onEditCard: (card: CreditCardType) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  onOpenNewInstallment,
  onOpenNewCard,
  onEditCard,
}) => {
  const {
    cards,
    selectedMonth,
    getCardInvoicesForMonth,
    installmentPurchases,
    deleteInstallmentPurchase,
    deleteCard,
    earlyPayInstallment,
  } = useFinance();

  const [personTab, setPersonTab] = useState<'Todos' | 'Ricardo' | 'Ellen'>('Todos');
  const [projectionMonthsCount, setProjectionMonthsCount] = useState<number>(12);

  const cardInvoices = getCardInvoicesForMonth(selectedMonth);

  // Group invoices by person
  const ricardoInvoices = useMemo(() => {
    return cardInvoices.filter((inv) => inv.card.person === 'Ricardo');
  }, [cardInvoices]);

  const ellenInvoices = useMemo(() => {
    return cardInvoices.filter((inv) => inv.card.person === 'Ellen');
  }, [cardInvoices]);

  const ricardoTotal = ricardoInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const ellenTotal = ellenInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Status badge helper: Green <80%, Yellow 80-99%, Red >=100%
  const getGoalStatus = (amount: number, goal: number = 500) => {
    const ratio = goal > 0 ? (amount / goal) * 100 : 0;
    if (ratio >= 100) {
      return {
        level: 'red',
        label: 'Meta Ultrapassada (≥ 100%)',
        badgeBg: 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        progressBar: 'bg-red-500',
        cardBorder: 'border-red-300 dark:border-red-800/80 ring-1 ring-red-400/30',
      };
    }
    if (ratio >= 80) {
      return {
        level: 'yellow',
        label: 'Atenção (80% - 99%)',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        progressBar: 'bg-amber-500',
        cardBorder: 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/30',
      };
    }
    return {
      level: 'green',
      label: 'Dentro da Meta (< 80%)',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      progressBar: 'bg-emerald-500',
      cardBorder: 'border-slate-200 dark:border-slate-800',
    };
  };

  // 12-Month Projection Matrix
  const futureMonths = useMemo(() => {
    const months: string[] = [];
    for (let i = 0; i < projectionMonthsCount; i++) {
      months.push(addMonthsToKey(selectedMonth, i));
    }
    return months;
  }, [selectedMonth, projectionMonthsCount]);

  const projectionMatrix = useMemo(() => {
    return futureMonths.map((mKey) => {
      const invoices = getCardInvoicesForMonth(mKey);
      const ricardoMonth = invoices
        .filter((i) => i.card.person === 'Ricardo')
        .reduce((sum, i) => sum + i.totalAmount, 0);
      const ellenMonth = invoices
        .filter((i) => i.card.person === 'Ellen')
        .reduce((sum, i) => sum + i.totalAmount, 0);
      const totalMonth = ricardoMonth + ellenMonth;

      return {
        monthKey: mKey,
        invoices,
        ricardoMonth,
        ellenMonth,
        totalMonth,
      };
    });
  }, [futureMonths, getCardInvoicesForMonth]);

  // Max projection value for visual scaling
  const maxProjectionValue = useMemo(() => {
    const max = Math.max(...projectionMatrix.map((p) => p.totalMonth), 1000);
    return max > 0 ? max : 1000;
  }, [projectionMatrix]);

  const filteredInstallments = useMemo(() => {
    if (personTab === 'Todos') return installmentPurchases;
    return installmentPurchases.filter((i) => i.person === personTab);
  }, [installmentPurchases, personTab]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Cartões de Crédito & Controle de Parcelas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Meta rigorosa de <strong>R$ 500,00</strong> por pessoa (Ricardo & Ellen) com visão de 12 meses futuros
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="add-card-btn"
            onClick={onOpenNewCard}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            + Novo Cartão
          </button>

          <button
            id="add-installment-btn"
            onClick={onOpenNewInstallment}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra Parcelada</span>
          </button>
        </div>
      </div>

      {/* Person Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['Todos', 'Ricardo', 'Ellen'] as const).map((tab) => (
          <button
            key={tab}
            id={`filter-person-${tab}`}
            onClick={() => setPersonTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              personTab === tab
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab === 'Todos' ? 'Todas as Faturas' : `Faturas de ${tab}`}
          </button>
        ))}
      </div>

      {/* Goal Summary by Person (Ricardo & Ellen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ricardo's Card Goal Box */}
        {(personTab === 'Todos' || personTab === 'Ricardo') && (
          <div
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs ${
              getGoalStatus(ricardoTotal, 500).cardBorder
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Ricardo
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Fatura Consolidada do Mês
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGoalStatus(ricardoTotal, 500).badgeBg}`}>
                {getGoalStatus(ricardoTotal, 500).label}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(ricardoTotal)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Teto Meta: <strong>R$ 500,00</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getGoalStatus(ricardoTotal, 500).progressBar}`}
                style={{ width: `${Math.min(100, (ricardoTotal / 500) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{ricardoInvoices.length} cartão(ões)</span>
              <span>
                {ricardoTotal <= 500
                  ? `Margem livre: ${formatCurrency(500 - ricardoTotal)}`
                  : `Excesso: +${formatCurrency(ricardoTotal - 500)}`}
              </span>
            </div>
          </div>
        )}

        {/* Ellen's Card Goal Box */}
        {(personTab === 'Todos' || personTab === 'Ellen') && (
          <div
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs ${
              getGoalStatus(ellenTotal, 500).cardBorder
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                  Ellen
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Fatura Consolidada do Mês
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGoalStatus(ellenTotal, 500).badgeBg}`}>
                {getGoalStatus(ellenTotal, 500).label}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(ellenTotal)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Teto Meta: <strong>R$ 500,00</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getGoalStatus(ellenTotal, 500).progressBar}`}
                style={{ width: `${Math.min(100, (ellenTotal / 500) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{ellenInvoices.length} cartão(ões)</span>
              <span>
                {ellenTotal <= 500
                  ? `Margem livre: ${formatCurrency(500 - ellenTotal)}`
                  : `Excesso: +${formatCurrency(ellenTotal - 500)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Individual Cards Grid for Selected Month */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Detalhamento por Cartão em {formatMonthYearBR(selectedMonth)}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cardInvoices
            .filter((inv) => personTab === 'Todos' || inv.card.person === personTab)
            .map((inv) => {
              const status = getGoalStatus(inv.totalAmount, inv.limitGoal || 500);
              const personColors = getPersonBadgeColor(inv.card.person);

              return (
                <div
                  key={inv.card.id}
                  className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 space-y-4 shadow-xs relative overflow-hidden ${status.cardBorder}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shadow-2xs"
                          style={{ backgroundColor: inv.card.color }}
                        />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {inv.card.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${personColors.badge}`}>
                          {inv.card.person}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Dia {inv.card.dueDay}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditCard(inv.card)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                        title="Editar Cartão"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja excluir o cartão "${inv.card.name}"?`)) {
                            deleteCard(inv.card.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                        title="Excluir Cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amount and Goal Status */}
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Meta: {formatCurrency(inv.limitGoal || 500)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${status.progressBar}`}
                        style={{ width: `${Math.min(100, ((inv.totalAmount / (inv.limitGoal || 500)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Items in Invoice */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Lançamentos na Fatura ({inv.items.length})
                    </span>
                    {inv.items.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">Nenhuma cobrança neste mês.</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {inv.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                              {item.description}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 12-MONTH FUTURE PROJECTION TIMELINE & RELIEF */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Projeção de 12 Meses Futuros & Alívio das Parcelas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhe o impacto decrescente das faturas conforme os parcelamentos atuais vão sendo quitados
            </p>
          </div>

          <div className="flex items-center gap-1">
            {[6, 9, 12].map((num) => (
              <button
                key={num}
                onClick={() => setProjectionMonthsCount(num)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  projectionMonthsCount === num
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {num} Meses
              </button>
            ))}
          </div>
        </div>

        {/* Visual Timeline Bars */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {projectionMatrix.map((proj) => {
              const isCurrent = proj.monthKey === selectedMonth;
              const ricardoStatus = getGoalStatus(proj.ricardoMonth, 500);
              const ellenStatus = getGoalStatus(proj.ellenMonth, 500);

              return (
                <div
                  key={proj.monthKey}
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    isCurrent
                      ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-1 ring-purple-400/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMonthYearBR(proj.monthKey).split(' de ')[0]}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded-sm">
                        Atual
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                      {formatCurrency(proj.totalMonth)}
                    </span>
                    <span className="text-[10px] text-slate-400">Total projetado</span>
                  </div>

                  {/* Person breakdown mini-bars */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Ricardo:</span>
                      <span className={proj.ricardoMonth > 500 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {formatCurrency(proj.ricardoMonth)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">Ellen:</span>
                      <span className={proj.ellenMonth > 500 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {formatCurrency(proj.ellenMonth)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE INSTALLMENTS LIST & EARLY PAYOFF */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Compras Parceladas Ativas & Opção de Antecipação
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualize parcelas restantes, valor acumulado e antecipe pagamentos com um clique
            </p>
          </div>

          <button
            onClick={onOpenNewInstallment}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Parcela
          </button>
        </div>

        {filteredInstallments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma compra parcelada ativa para o filtro selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInstallments.map((inst) => {
              const card = cards.find((c) => c.id === inst.cardId);
              const personColors = getPersonBadgeColor(inst.person);
              const remainingValue = (inst.remainingInstallments || inst.totalInstallments) * inst.installmentAmount;

              return (
                <div
                  key={inst.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {inst.description}
                        </span>
                        {inst.isDemo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{card?.name || 'Cartão'}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded-md font-semibold text-[10px] ${personColors.badge}`}>
                          {inst.person}
                        </span>
                        <span>•</span>
                        <span>{inst.category}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Deseja remover "${inst.description}" e todas as suas parcelas geradas?`
                          )
                        ) {
                          deleteInstallmentPurchase(inst.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Excluir Compra Parcelada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Installment Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Valor Total</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(inst.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Valor Parcela</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(inst.installmentAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Parcelas</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {inst.currentInstallment || 1}/{inst.totalInstallments}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Saldo Restante</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(remainingValue)}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Early payoff button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Início: {inst.firstInstallmentMonth}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        earlyPayInstallment(inst.id, 1);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Antecipar 1 Parcela</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
