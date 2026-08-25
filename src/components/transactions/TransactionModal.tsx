import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Person, TransactionType, PaymentMethod, Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { ArrowDownRight, ArrowUpRight, PiggyBank, ArrowLeftRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const CATEGORIES_DESPESA = [
  'Habitação',
  'Supermercado',
  'Alimentação & Delivery',
  'Transporte',
  'Saúde & Farmácia',
  'Educação',
  'Lazer & Passeios',
  'Assinaturas & Serviços',
  'Cartão de Crédito',
  'Casa & Utilidades',
  'Cofrinho Reforma',
  'Cofrinho Manutenção',
  'Cofrinho Lazer',
  'Reserva de Emergência',
  'Outros',
];

const CATEGORIES_RECEITA = [
  'Salário (Pagamento Principal)',
  'Adiantamento Salarial (Dia 15)',
  'Bolsa Estágio',
  'Renda Extraordinária (13º/Bônus/Férias)',
  'Reembolso de Trabalho',
  'Rendimento de Investimento',
  'Venda de Bens',
  'Outros',
];

const ACCOUNTS_AND_POTS = [
  'Conta Corrente Principal',
  'Conta Ricardo',
  'Conta Ellen',
  'Reserva de Emergência (8 Meses)',
  'Cofrinho Reforma & Casa Própria',
  'Cofrinho Manutenção',
  'Cofrinho Lazer Familiar',
  'Cartão de Crédito',
  'Dinheiro / Carteira',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const { addTransaction, updateTransaction, cards, selectedMonth } = useFinance();

  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState<Person>('Família');
  const [category, setCategory] = useState('Habitação');
  const [date, setDate] = useState('');
  const [competenceMonth, setCompetenceMonth] = useState(selectedMonth);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardId, setCardId] = useState<string>('');
  const [accountOrPot, setAccountOrPot] = useState('Conta Corrente Principal');
  const [paid, setPaid] = useState(true);
  const [isRecurring, setIsRecurring] = useState(true);
  const [isReimbursable, setIsReimbursable] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmount(String(editingTransaction.amount));
      setPerson(editingTransaction.person);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setCompetenceMonth(editingTransaction.competenceMonth || editingTransaction.date.slice(0, 7) || selectedMonth);
      setPaymentMethod(editingTransaction.paymentMethod);
      setCardId(editingTransaction.cardId || '');
      setAccountOrPot(editingTransaction.accountOrPot || 'Conta Corrente Principal');
      setPaid(editingTransaction.paid);
      setIsRecurring(editingTransaction.isRecurring ?? true);
      setIsReimbursable(editingTransaction.isReimbursable ?? false);
      setNotes(editingTransaction.notes || '');
    } else {
      // Defaults for new entry
      setType('despesa');
      setDescription('');
      setAmount('');
      setPerson('Família');
      setCategory('Habitação');
      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setCompetenceMonth(selectedMonth);
      setPaymentMethod('pix');
      setCardId(cards[0]?.id || '');
      setAccountOrPot('Conta Corrente Principal');
      setPaid(true);
      setIsRecurring(true);
      setIsReimbursable(false);
      setNotes('');
    }
  }, [editingTransaction, isOpen, selectedMonth, cards]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, informe a descrição do lançamento.');
      return;
    }

    const payload = {
      description: description.trim(),
      amount: numAmount,
      type,
      category,
      person,
      date: date || new Date().toISOString().slice(0, 10),
      competenceMonth: competenceMonth || date.slice(0, 7) || selectedMonth,
      paid,
      isRecurring,
      isReimbursable,
      paymentMethod,
      cardId: paymentMethod === 'credito' ? cardId : undefined,
      accountOrPot,
      notes: notes.trim() || undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
      subtitle="Cadastre receitas, despesas, investimentos ou transferências"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo: Despesa vs Receita vs Investimento vs Transferência */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <button
            type="button"
            id="type-despesa-btn"
            onClick={() => {
              setType('despesa');
              if (!CATEGORIES_DESPESA.includes(category)) setCategory(CATEGORIES_DESPESA[0]);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
              type === 'despesa'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
          </button>

          <button
            type="button"
            id="type-receita-btn"
            onClick={() => {
              setType('receita');
              if (!CATEGORIES_RECEITA.includes(category)) setCategory(CATEGORIES_RECEITA[0]);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
              type === 'receita'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Receita
          </button>

          <button
            type="button"
            id="type-investimento-btn"
            onClick={() => {
              setType('investimento');
              setCategory('Reserva de Emergência');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
              type === 'investimento'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" /> Investimento
          </button>

          <button
            type="button"
            id="type-transferencia-btn"
            onClick={() => {
              setType('transferencia');
              setCategory('Transferência Interna');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
              type === 'transferencia'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transferência
          </button>
        </div>

        {/* Descrição & Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              id="tx-description-input"
              required
              placeholder="Ex: Salário, Aluguel, Farmácia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                id="tx-amount-input"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Responsável: Ricardo | Ellen | Família */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Responsável (Divisão Familiar)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Ricardo', 'Ellen', 'Família'] as Person[]).map((p) => {
              const active = person === p;
              return (
                <button
                  type="button"
                  key={p}
                  id={`person-select-${p.toLowerCase()}`}
                  onClick={() => setPerson(p)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    active
                      ? p === 'Ricardo'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : p === 'Ellen'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoria e Conta/Cofrinho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <select
              id="tx-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            >
              {(type === 'despesa'
                ? CATEGORIES_DESPESA
                : type === 'receita'
                ? CATEGORIES_RECEITA
                : type === 'investimento'
                ? ['Reserva de Emergência', 'Investimentos Gerais']
                : ['Transferência Interna', 'Transferência Cofrinho']
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Conta / Destino
            </label>
            <select
              id="tx-account-select"
              value={accountOrPot}
              onChange={(e) => setAccountOrPot(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            >
              {ACCOUNTS_AND_POTS.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data e Mês de Competência */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Data do Lançamento
            </label>
            <input
              type="date"
              id="tx-date-input"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (e.target.value) {
                  setCompetenceMonth(e.target.value.slice(0, 7));
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Mês de Competência (Relatórios)
            </label>
            <input
              type="month"
              id="tx-competence-input"
              required
              value={competenceMonth}
              onChange={(e) => setCompetenceMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Forma de Pagamento
            </label>
            <select
              id="tx-payment-method-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            >
              <option value="pix">PIX</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="debito">Cartão de Débito</option>
              <option value="transferencia">Transferência / TED</option>
              <option value="boleto">Boleto</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>

          {paymentMethod === 'credito' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Cartão de Crédito
              </label>
              <select
                id="tx-card-select"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.person})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Classification Toggles for Receita: Recorrente vs Extraordinária vs Reembolso */}
        {type === 'receita' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tx-recurring-checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
              <label htmlFor="tx-recurring-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                Renda Salarial Recorrente
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tx-reimbursable-checkbox"
                checked={isReimbursable}
                onChange={(e) => setIsReimbursable(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
              />
              <label htmlFor="tx-reimbursable-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                Reembolso corporativo (não é renda real)
              </label>
            </div>
          </div>
        )}

        {/* Status de Pagamento */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            id="tx-paid-checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
          />
          <label htmlFor="tx-paid-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
            {type === 'despesa'
              ? 'Despesa já está liquidada/paga'
              : type === 'receita'
              ? 'Receita já foi creditada na conta'
              : 'Operação já confirmada'}
          </label>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Observações (Opcional)
          </label>
          <input
            type="text"
            id="tx-notes-input"
            placeholder="Detalhes adicionais..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            id="tx-submit-btn"
            className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            {editingTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

