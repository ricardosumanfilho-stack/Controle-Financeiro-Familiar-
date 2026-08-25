import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Person, Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDateBR, getPersonBadgeColor } from '../../utils/formatters';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Filter,
  CreditCard,
  ShoppingCart,
  Calendar,
} from 'lucide-react';

interface TransactionsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const {
    transactions,
    selectedMonth,
    deleteTransaction,
    toggleTransactionPaid,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<'Todos' | Person>('Todos');
  const [selectedType, setSelectedType] = useState<'Todos' | TransactionType>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<'Todos' | 'pago' | 'pendente'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [allMonthsFilter, setAllMonthsFilter] = useState(false);

  // Extract available categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return ['Todas', ...Array.from(set)];
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month filter
      if (!allMonthsFilter && !tx.date.startsWith(selectedMonth)) {
        return false;
      }
      // Person filter
      if (selectedPerson !== 'Todos' && tx.person !== selectedPerson) {
        return false;
      }
      // Type filter
      if (selectedType !== 'Todos' && tx.type !== selectedType) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'pago' && !tx.paid) return false;
      if (selectedStatus === 'pendente' && tx.paid) return false;
      // Category filter
      if (selectedCategory !== 'Todas' && tx.category !== selectedCategory) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchNotes = (tx.notes || '').toLowerCase().includes(query);
        const matchCat = tx.category.toLowerCase().includes(query);
        if (!matchDesc && !matchNotes && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    selectedMonth,
    allMonthsFilter,
    selectedPerson,
    selectedType,
    selectedStatus,
    selectedCategory,
    searchTerm,
  ]);

  // Summaries for the current filtered view
  const filterStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'receita') income += t.amount;
      else expense += t.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Lançamentos de Receitas e Despesas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Controle de fluxo de caixa com separação entre Ricardo, Ellen e Família
          </p>
        </div>

        <button
          id="tx-add-btn-main"
          onClick={onOpenNewTransaction}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Search input and Month Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="tx-search-input"
              placeholder="Buscar por descrição, categoria ou anotação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          <button
            type="button"
            id="tx-month-toggle-btn"
            onClick={() => setAllMonthsFilter(!allMonthsFilter)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              allMonthsFilter
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{allMonthsFilter ? 'Exibindo Todos os Meses' : 'Apenas Mês Selecionado'}</span>
          </button>
        </div>

        {/* Responsável Pill Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Responsável:
          </span>
          {(['Todos', 'Ricardo', 'Ellen', 'Família'] as ('Todos' | Person)[]).map((p) => {
            const active = selectedPerson === p;
            return (
              <button
                key={p}
                id={`tx-filter-person-${p.toLowerCase()}`}
                onClick={() => setSelectedPerson(p)}
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

        {/* Dropdown Filters (Tipo, Status, Categoria) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tipo de Lançamento</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'Todos' | TransactionType)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="investimento">Investimentos</option>
              <option value="transferencia">Transferências</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'Todos' | 'pago' | 'pendente')}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              <option value="Todos">Todos os Status</option>
              <option value="pago">Apenas Pagos / Recebidos</option>
              <option value="pendente">Apenas Pendentes</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Receitas Filtradas
            </span>
            <span className="text-lg font-black text-emerald-900 dark:text-emerald-200">
              {formatCurrency(filterStats.income)}
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider block">
              Despesas Filtradas
            </span>
            <span className="text-lg font-black text-red-900 dark:text-red-200">
              {formatCurrency(filterStats.expense)}
            </span>
          </div>
          <TrendingDown className="w-5 h-5 text-red-600" />
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Resultado ({filterStats.count} registros)
            </span>
            <span
              className={`text-lg font-black ${
                filterStats.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'
              }`}
            >
              {formatCurrency(filterStats.balance)}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">Saldo Líquido</span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Nenhum lançamento encontrado para os filtros selecionados.
            </p>
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-xs hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Cadastrar Lançamento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const personColors = getPersonBadgeColor(tx.person);
              const isIncome = tx.type === 'receita';

              return (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTransactionPaid(tx.id)}
                      className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                        tx.paid
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                      title={tx.paid ? 'Clique para marcar como pendente' : 'Clique para marcar como pago'}
                    >
                      {tx.paid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
                            Transferência Interna
                          </span>
                        )}

                        {tx.type === 'receita' && tx.isRecurring === false && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 font-semibold">
                            Extraordinário
                          </span>
                        )}

                        {tx.isReimbursable && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-semibold">
                            Reembolso
                          </span>
                        )}

                        {tx.installmentInfo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 font-semibold flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {tx.installmentInfo.current}/{tx.installmentInfo.total}
                          </span>
                        )}

                        {tx.groceryTripId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-semibold flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" /> Mercado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDateBR(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        {tx.accountOrPot && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 dark:text-slate-500 font-medium">
                              {tx.accountOrPot}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{tx.paymentMethod}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${personColors.badge}`}>
                          {tx.person}
                        </span>
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-slate-500 italic pt-0.5">{tx.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span
                        className={`text-base font-black ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                      <span
                        className={`block text-[11px] font-semibold ${
                          tx.paid ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {tx.paid ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja excluir "${tx.description}"?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
