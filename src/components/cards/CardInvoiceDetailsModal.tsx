import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { CreditCard, Transaction, InstallmentPurchase } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearBR,
  getPersonBadgeColor,
  addMonthsToKey,
} from '../../utils/formatters';
import {
  Calendar,
  CreditCard as CardIcon,
  Trash2,
  Edit2,
  Zap,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface CardInvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  onEditTransaction?: (tx: Transaction) => void;
}

export const CardInvoiceDetailsModal: React.FC<CardInvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  card,
  onEditTransaction,
}) => {
  const {
    transactions,
    selectedMonth,
    deleteTransaction,
    earlyPayInstallment,
    installmentPurchases,
    deleteInstallmentPurchase,
    deleteInstallmentFromMonth,
    cardSubscriptions,
    deleteCardSubscription,
  } = useFinance();

  const [filterMonth, setFilterMonth] = useState<string>(selectedMonth);
  const [showAllMonths, setShowAllMonths] = useState<boolean>(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Synchronize filter month with selectedMonth when opened
  React.useEffect(() => {
    if (isOpen) {
      setFilterMonth(selectedMonth);
      setShowAllMonths(false);
    }
  }, [isOpen, selectedMonth]);

  if (!card) return null;

  const personColors = getPersonBadgeColor(card.person);

  // All transactions and subscriptions on this card
  const cardTransactions = useMemo(() => {
    const regularTxs = transactions
      .filter((t) => t.cardId === card.id || (t.paymentMethod === 'credito' && t.cardId === card.id))
      .filter((t) => {
        if (showAllMonths) return true;
        const compMonth = t.competenceMonth || t.date.slice(0, 7);
        return compMonth === filterMonth;
      });

    // Also include recurring subscriptions if not already added as a transaction
    const activeSubs = cardSubscriptions.filter((sub) => {
      if (sub.cardId !== card.id) return false;
      if (sub.status && sub.status !== 'active') return false;
      if (sub.isActive === false) return false;
      if (!showAllMonths && sub.startMonth && sub.startMonth > filterMonth) return false;
      return true;
    });

    const subTxs: Transaction[] = [];
    if (!showAllMonths) {
      activeSubs.forEach((sub) => {
        const alreadyLogged = regularTxs.some((t) => t.subscriptionId === sub.id);
        if (!alreadyLogged) {
          const subTitle = sub.name || sub.description || 'Assinatura';
          subTxs.push({
            id: `sub-${sub.id}-${filterMonth}`,
            description: `${subTitle} (Assinatura Recorrente)`,
            amount: sub.amount,
            type: 'despesa',
            category: sub.category || 'Assinaturas',
            person: sub.person,
            date: `${filterMonth}-${String(card.dueDay).padStart(2, '0')}`,
            competenceMonth: filterMonth,
            paid: false,
            isRecurring: true,
            paymentMethod: 'credito',
            cardId: card.id,
            subscriptionId: sub.id,
            isCardSubscription: true,
            isDemo: sub.isDemo,
            notes: sub.notes || 'Débito automático mensal',
          });
        }
      });
    }

    return [...regularTxs, ...subTxs].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, cardSubscriptions, card.id, card.dueDay, showAllMonths, filterMonth]);

  // Total amount for the filtered view
  const totalAmount = cardTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Available months with purchases on this card
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(selectedMonth);
    monthsSet.add(addMonthsToKey(selectedMonth, 1));
    monthsSet.add(addMonthsToKey(selectedMonth, 2));

    transactions
      .filter((t) => t.cardId === card.id)
      .forEach((t) => {
        const m = t.competenceMonth || t.date.slice(0, 7);
        if (m) monthsSet.add(m);
      });

    return Array.from(monthsSet).sort();
  }, [transactions, card.id, selectedMonth]);

  const bestPurchaseDay = card.closingDay;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Fatura & Extrato: ${card.name}`}
        subtitle={`Titular: ${card.person} • Limite Meta: ${formatCurrency(card.monthlyLimitGoal || 500)}`}
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Card Info & Dates Ribbon */}
          <div
            className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
            style={{
              backgroundColor: `${card.color}15`,
              borderColor: `${card.color}40`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: card.color }}
              >
                <CardIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">{card.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${personColors.badge}`}>
                    {card.person}
                  </span>
                  <span className="text-slate-400 font-medium">
                    Bandeira: {card.brand || 'Mastercard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Crucial Dates Requested by User */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Fechamento</span>
                <span className="font-bold text-amber-400 text-xs">Dia {card.closingDay}</span>
              </div>

              <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Vencimento</span>
                <span className="font-bold text-emerald-400 text-xs">Dia {card.dueDay}</span>
              </div>

              <div className="px-3 py-1.5 bg-indigo-950/60 border border-indigo-800/60 rounded-xl text-center">
                <span className="text-[10px] text-indigo-300 block font-semibold flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Melhor Compra
                </span>
                <span className="font-bold text-indigo-200 text-xs">Dia {bestPurchaseDay}</span>
              </div>
            </div>
          </div>

          {/* Month Filter Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Competência da Fatura:</span>
              <select
                disabled={showAllMonths}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden disabled:opacity-50"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthYearBR(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAllMonths(!showAllMonths)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  showAllMonths
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showAllMonths ? 'Mostrando Todos os Meses' : 'Ver Todas as Faturas'}
              </button>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Total Listado</span>
                <span className="text-sm font-black text-slate-100">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Lançamentos ({cardTransactions.length})</span>
              <span className="text-[11px] font-normal lowercase text-slate-500">
                {showAllMonths ? 'histórico completo' : `fatura de ${formatMonthYearBR(filterMonth)}`}
              </span>
            </h4>

            {cardTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
                Nenhum lançamento encontrado para este cartão no período selecionado.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {cardTransactions.map((tx) => {
                  const isInstallment = !!tx.installmentInfo;
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-100 text-xs truncate max-w-[280px]" title={tx.description}>
                            {tx.description}
                          </span>

                          {isInstallment && tx.installmentInfo && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                              Parcela {tx.installmentInfo.current}/{tx.installmentInfo.total}
                            </span>
                          )}

                          {tx.isCardSubscription && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5" /> Assinatura Recorrente
                            </span>
                          )}

                          <span className="px-2 py-0.2 text-[10px] rounded-md bg-slate-800 text-slate-400 font-medium shrink-0">
                            {tx.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Data da compra: {formatDateBR(tx.date)}</span>
                          <span>•</span>
                          <span>Fatura: {formatMonthYearBR(tx.competenceMonth || tx.date.slice(0, 7))}</span>
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500">{tx.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-100 block">
                            {formatCurrency(tx.amount)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              tx.paid ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {tx.paid ? 'Pago' : 'Aberto'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {onEditTransaction && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditTransaction(tx);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Editar Lançamento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p>
              Compras realizadas a partir do dia <strong>{card.closingDay}</strong> (fechamento) são debitadas na fatura do mês subsequente, aproveitando o melhor dia de compra.
            </p>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for deleting transaction or recurring subscription */}
      <ConfirmModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) {
            if (txToDelete.installmentInfo?.purchaseId) {
              const purchaseId = txToDelete.installmentInfo.purchaseId;
              const cur = txToDelete.installmentInfo.current || 1;
              deleteInstallmentFromMonth(purchaseId, cur);
            } else if (txToDelete.isCardSubscription || txToDelete.subscriptionId) {
              if (txToDelete.subscriptionId) {
                deleteCardSubscription(txToDelete.subscriptionId);
              } else if (txToDelete.id.startsWith('sub-item-')) {
                const parts = txToDelete.id.replace('sub-item-', '').split('-');
                const monthSuffix = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
                const cleanId = txToDelete.id.replace('sub-item-', '').replace(`-${monthSuffix}`, '');
                deleteCardSubscription(cleanId);
              } else if (txToDelete.id.startsWith('sub-')) {
                const parts = txToDelete.id.replace('sub-', '').split('-');
                const monthSuffix = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
                const cleanId = txToDelete.id.replace('sub-', '').replace(`-${monthSuffix}`, '');
                deleteCardSubscription(cleanId);
              }
              deleteTransaction(txToDelete.id);
            } else {
              deleteTransaction(txToDelete.id);
            }
            setTxToDelete(null);
          }
        }}
        title={
          txToDelete?.installmentInfo?.purchaseId
            ? 'Excluir Parcela e Meses Subsequentes'
            : txToDelete?.isCardSubscription
            ? 'Excluir Assinatura Recorrente'
            : 'Excluir Lançamento da Fatura'
        }
        message={
          txToDelete?.installmentInfo?.purchaseId
            ? `Esta é a parcela ${txToDelete.installmentInfo.current}/${txToDelete.installmentInfo.total} de "${txToDelete.description}". Ao confirmar, esta parcela e todas as parcelas dos meses subsequentes serão excluídas da fatura deste cartão.`
            : txToDelete?.isCardSubscription
            ? `Tem certeza que deseja remover a assinatura "${txToDelete?.description}" no valor de ${formatCurrency(
                txToDelete?.amount || 0
              )}/mês? Ela será removida da fatura deste cartão e de todas as projeções.`
            : `Tem certeza que deseja excluir o lançamento "${txToDelete?.description}" no valor de ${formatCurrency(
                txToDelete?.amount || 0
              )}?`
        }
        confirmText={
          txToDelete?.installmentInfo?.purchaseId
            ? 'Excluir Deste e dos Próximos Meses'
            : txToDelete?.isCardSubscription
            ? 'Excluir Assinatura'
            : 'Excluir Lançamento'
        }
      />
    </>
  );
};
