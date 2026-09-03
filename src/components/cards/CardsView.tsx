import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard as CreditCardType, InstallmentPurchase, CardSubscription, Person } from '../../types';
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
  Eye,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { CardInvoiceDetailsModal } from './CardInvoiceDetailsModal';
import { CardSubscriptionModal } from './CardSubscriptionModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface CardsViewProps {
  onOpenNewInstallment: () => void;
  onEditInstallment?: (inst: InstallmentPurchase) => void;
  onOpenNewCard: () => void;
  onEditCard: (card: CreditCardType) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  onOpenNewInstallment,
  onEditInstallment,
  onOpenNewCard,
  onEditCard,
}) => {
  const {
    cards,
    selectedMonth,
    getCardInvoicesForMonth,
    installmentPurchases,
    deleteInstallmentPurchase,
    cardSubscriptions,
    deleteCardSubscription,
    deleteCard,
    earlyPayInstallment,
    person1Name,
    person2Name,
  } = useFinance();

  const [personTab, setPersonTab] = useState<'Todos' | string>('Todos');
  const [projectionMonthsCount, setProjectionMonthsCount] = useState<number>(12);

  // Modals state
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<CreditCardType | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCardType | null>(null);
  const [installmentToDelete, setInstallmentToDelete] = useState<InstallmentPurchase | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<CardSubscription | null>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<CardSubscription | null>(null);

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const cardInvoices = getCardInvoicesForMonth(selectedMonth);

  // Group invoices by person
  const p1Invoices = useMemo(() => {
    return cardInvoices.filter((inv) => inv.card.person === p1);
  }, [cardInvoices, p1]);

  const p2Invoices = useMemo(() => {
    return cardInvoices.filter((inv) => inv.card.person === p2);
  }, [cardInvoices, p2]);

  const p1Total = p1Invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const p2Total = p2Invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

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
      const p1Month = invoices
        .filter((i) => i.card.person === p1)
        .reduce((sum, i) => sum + i.totalAmount, 0);
      const p2Month = invoices
        .filter((i) => i.card.person === p2)
        .reduce((sum, i) => sum + i.totalAmount, 0);
      const totalMonth = p1Month + p2Month;

      return {
        monthKey: mKey,
        invoices,
        p1Month,
        p2Month,
        totalMonth,
      };
    });
  }, [futureMonths, getCardInvoicesForMonth, p1, p2]);

  const filteredInstallments = useMemo(() => {
    if (personTab === 'Todos') return installmentPurchases;
    return installmentPurchases.filter((i) => i.person === personTab);
  }, [installmentPurchases, personTab]);

  const filteredSubscriptions = useMemo(() => {
    if (personTab === 'Todos') return cardSubscriptions;
    return cardSubscriptions.filter((s) => s.person === personTab);
  }, [cardSubscriptions, personTab]);

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
            Meta de <strong>R$ 500,00</strong> por pessoa ({p1} & {p2}) com visão de 12 meses futuros e extratos por cartão
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
            id="add-subscription-btn"
            onClick={() => {
              setSubscriptionToEdit(null);
              setIsSubscriptionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 rounded-xl transition-colors active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>+ Assinatura Recorrente</span>
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
        {['Todos', p1, p2].map((tab) => (
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

      {/* Goal Summary by Person */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Person 1 Card Goal Box */}
        {(personTab === 'Todos' || personTab === p1) && (
          <div
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs ${
              getGoalStatus(p1Total, 500).cardBorder
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {p1}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Fatura Consolidada do Mês
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGoalStatus(p1Total, 500).badgeBg}`}>
                {getGoalStatus(p1Total, 500).label}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(p1Total)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Teto Meta: <strong>R$ 500,00</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getGoalStatus(p1Total, 500).progressBar}`}
                style={{ width: `${Math.min(100, (p1Total / 500) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{p1Invoices.length} cartão(ões)</span>
              <span>
                {p1Total <= 500
                  ? `Margem livre: ${formatCurrency(500 - p1Total)}`
                  : `Excesso: +${formatCurrency(p1Total - 500)}`}
              </span>
            </div>
          </div>
        )}

        {/* Person 2 Card Goal Box */}
        {(personTab === 'Todos' || personTab === p2) && (
          <div
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs ${
              getGoalStatus(p2Total, 500).cardBorder
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                  {p2}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Fatura Consolidada do Mês
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGoalStatus(p2Total, 500).badgeBg}`}>
                {getGoalStatus(p2Total, 500).label}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(p2Total)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Teto Meta: <strong>R$ 500,00</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getGoalStatus(p2Total, 500).progressBar}`}
                style={{ width: `${Math.min(100, (p2Total / 500) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{p2Invoices.length} cartão(ões)</span>
              <span>
                {p2Total <= 500
                  ? `Margem livre: ${formatCurrency(500 - p2Total)}`
                  : `Excesso: +${formatCurrency(p2Total - 500)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Individual Cards Grid for Selected Month */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Detalhamento por Cartão em {formatMonthYearBR(selectedMonth)}
          </h3>
          <span className="text-xs text-slate-400">
            Clique no cartão ou no ícone para ver todos os lançamentos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardInvoices
            .filter((inv) => personTab === 'Todos' || inv.card.person === personTab)
            .map((inv) => {
              const status = getGoalStatus(inv.totalAmount, inv.limitGoal || 500);
              const personColors = getPersonBadgeColor(inv.card.person);

              return (
                <div
                  key={inv.card.id}
                  className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between ${status.cardBorder}`}
                >
                  <div className="space-y-3">
                    {/* Card Header & Title */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                            style={{ backgroundColor: inv.card.color }}
                          />
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {inv.card.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${personColors.badge}`}>
                            {inv.card.person}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {inv.card.brand || 'Cartão'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCardForDetails(inv.card)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
                          title="Abrir Extrato Completo do Cartão"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditCard(inv.card)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar Cartão"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardToDelete(inv.card)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Excluir Cartão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Crucial Dates Requested by User: Fechamento, Vencimento & Melhor Compra */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                      <div className="p-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Fechamento</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                          Dia {inv.card.closingDay}
                        </span>
                      </div>

                      <div className="p-1 border-x border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-semibold block">Vencimento</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                          Dia {inv.card.dueDay}
                        </span>
                      </div>

                      <div className="p-1">
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-300 font-semibold block">Melhor Compra</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-300 text-xs">
                          Dia {inv.card.closingDay}
                        </span>
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

                    {/* Items in Invoice (Spacious, clean layout so descriptions are never cut off or overlapping) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Lançamentos na Fatura ({inv.items.length})
                        </span>
                        {inv.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCardForDetails(inv.card)}
                            className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                          >
                            Ver todos
                          </button>
                        )}
                      </div>

                      {inv.items.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          Nenhuma cobrança nesta fatura.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {inv.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.description}>
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {item.installmentInfo && (
                                    <span className="px-1.5 py-0.2 rounded-sm bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                                      Parc. {item.installmentInfo.current}/{item.installmentInfo.total}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {item.date ? item.date.slice(8, 10) + '/' + item.date.slice(5, 7) : ''}
                                  </span>
                                </div>
                              </div>

                              <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0 text-right">
                                {formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Button to open popup modal */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedCardForDetails(inv.card)}
                      className="w-full py-2 px-3 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-xl border border-purple-200 dark:border-purple-800/60 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Extrato Completo do Cartão</span>
                    </button>
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
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{p1}:</span>
                      <span className={proj.p1Month > 500 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {formatCurrency(proj.p1Month)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">{p2}:</span>
                      <span className={proj.p2Month > 500 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {formatCurrency(proj.p2Month)}
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

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onEditInstallment) {
                            onEditInstallment(inst);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                        title="Editar Compra Parcelada (Nome, Valor, Cartão)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setInstallmentToDelete(inst)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir Compra Parcelada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* RECURRING CARD SUBSCRIPTIONS & FIXED CHARGES */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              Assinaturas & Cobranças Fixas Recorrentes na Fatura
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Serviços contínuos (ex: Seguradora do Carro, YouTube Music, Streaming) que entram automaticamente todo mês na fatura com valor reajustável
            </p>
          </div>

          <button
            id="add-subscription-btn-section"
            onClick={() => {
              setSubscriptionToEdit(null);
              setIsSubscriptionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Assinatura
          </button>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs space-y-2">
            <p>Nenhuma assinatura ou débito fixo recorrente cadastrado no cartão.</p>
            <button
              onClick={() => {
                setSubscriptionToEdit(null);
                setIsSubscriptionModalOpen(true);
              }}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              + Cadastrar primeira assinatura (ex: Seguro Auto, YouTube Music)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSubscriptions.map((sub) => {
              const card = cards.find((c) => c.id === sub.cardId);
              const personColors = getPersonBadgeColor(sub.person);
              const subTitle = sub.name || sub.description || 'Assinatura';

              return (
                <div
                  key={sub.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={subTitle}>
                          {subTitle}
                        </span>
                        {sub.isDemo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            Demo
                          </span>
                        )}
                        {sub.status === 'paused' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                            Pausada
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-medium">{card?.name || 'Cartão'}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded-md font-semibold text-[10px] ${personColors.badge}`}>
                          {sub.person}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSubscriptionToEdit(sub);
                          setIsSubscriptionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                        title="Editar / Reajustar Valor da Assinatura"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubscriptionToDelete(sub)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir Assinatura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Value & Category Info */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Valor Mensal na Fatura</span>
                      <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                        {formatCurrency(sub.amount)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">/mês</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Categoria</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {sub.category || 'Assinatura'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>Início: {sub.startMonth ? formatMonthYearBR(sub.startMonth) : 'Contínuo'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSubscriptionToEdit(sub);
                        setIsSubscriptionModalOpen(true);
                      }}
                      className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Reajustar valor</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Details Popup Modal */}
      {selectedCardForDetails && (
        <CardInvoiceDetailsModal
          isOpen={!!selectedCardForDetails}
          onClose={() => setSelectedCardForDetails(null)}
          card={selectedCardForDetails}
        />
      )}

      {/* Subscription Modal (Create / Edit) */}
      <CardSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setSubscriptionToEdit(null);
        }}
        subscriptionToEdit={subscriptionToEdit}
      />

      {/* Delete Subscription Confirm Modal */}
      {subscriptionToDelete && (
        <ConfirmModal
          isOpen={!!subscriptionToDelete}
          onClose={() => setSubscriptionToDelete(null)}
          onConfirm={() => {
            if (subscriptionToDelete) {
              deleteCardSubscription(subscriptionToDelete.id);
              setSubscriptionToDelete(null);
            }
          }}
          title="Excluir Assinatura Recorrente"
          message={`Tem certeza que deseja remover a assinatura "${subscriptionToDelete.name || subscriptionToDelete.description || 'Assinatura'}" (${formatCurrency(subscriptionToDelete.amount)}/mês)? Ela deixará de constar nas faturas futuras do cartão.`}
          confirmText="Excluir Assinatura"
          confirmVariant="danger"
        />
      )}

      {/* Delete Card Confirm Modal */}
      {cardToDelete && (
        <ConfirmModal
          isOpen={!!cardToDelete}
          onClose={() => setCardToDelete(null)}
          onConfirm={() => {
            if (cardToDelete) {
              deleteCard(cardToDelete.id);
              setCardToDelete(null);
            }
          }}
          title="Excluir Cartão de Crédito"
          message={`Tem certeza que deseja excluir o cartão "${cardToDelete.name}" (${cardToDelete.person})? Os lançamentos associados continuarão preservados no histórico.`}
          confirmLabel="Excluir Cartão"
          confirmVariant="danger"
        />
      )}

      {/* Delete Installment Confirm Modal */}
      {installmentToDelete && (
        <ConfirmModal
          isOpen={!!installmentToDelete}
          onClose={() => setInstallmentToDelete(null)}
          onConfirm={() => {
            if (installmentToDelete) {
              deleteInstallmentPurchase(installmentToDelete.id);
              setInstallmentToDelete(null);
            }
          }}
          title="Excluir Compra Parcelada"
          message={`Tem certeza que deseja excluir "${installmentToDelete.description}"? Todas as ${installmentToDelete.totalInstallments} parcelas desta compra serão removidas deste mês e de todos os meses subsequentes das faturas.`}
          confirmLabel="Excluir Compra e Meses Subsequentes"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};

