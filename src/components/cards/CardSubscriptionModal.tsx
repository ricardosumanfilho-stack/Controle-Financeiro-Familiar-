import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CardSubscription, Person } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { RefreshCw, DollarSign, Calendar, CreditCard as CardIcon, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface CardSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit?: CardSubscription | null;
}

export const CardSubscriptionModal: React.FC<CardSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionToEdit,
}) => {
  const {
    cards,
    selectedMonth,
    person1Name,
    person2Name,
    addCardSubscription,
    updateCardSubscription,
    deleteCardSubscription,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState('');
  const [person, setPerson] = useState<Person>(p1);
  const [category, setCategory] = useState('Assinaturas & Serviços');
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [status, setStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [notes, setNotes] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name || subscriptionToEdit.description || '');
      setAmount(subscriptionToEdit.amount.toString());
      setCardId(subscriptionToEdit.cardId);
      setPerson(subscriptionToEdit.person);
      setCategory(subscriptionToEdit.category || 'Assinaturas & Serviços');
      setStartMonth(subscriptionToEdit.startMonth || selectedMonth);
      setStatus(subscriptionToEdit.status || 'active');
      setNotes(subscriptionToEdit.notes || '');
    } else {
      setName('');
      setAmount('');
      setCardId(cards[0]?.id || '');
      setPerson(p1);
      setCategory('Assinaturas & Serviços');
      setStartMonth(selectedMonth);
      setStatus('active');
      setNotes('');
    }
  }, [subscriptionToEdit, isOpen, cards, selectedMonth, p1]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Informe um valor mensal válido para a assinatura.');
      return;
    }
    if (!name.trim()) {
      alert('Informe o nome do serviço ou assinatura (ex: Seguradora do Carro, YouTube Music).');
      return;
    }
    if (!cardId) {
      alert('Selecione o cartão de crédito onde a cobrança é realizada.');
      return;
    }

    if (subscriptionToEdit) {
      updateCardSubscription(subscriptionToEdit.id, {
        name: name.trim(),
        description: name.trim(),
        amount: numAmount,
        cardId,
        person,
        category,
        startMonth,
        status,
        isActive: status === 'active',
        notes: notes.trim() || undefined,
      });
    } else {
      addCardSubscription({
        name: name.trim(),
        description: name.trim(),
        amount: numAmount,
        cardId,
        person,
        category,
        startMonth,
        status,
        isActive: status === 'active',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (subscriptionToEdit) {
      deleteCardSubscription(subscriptionToEdit.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={subscriptionToEdit ? 'Editar Assinatura Recorrente no Cartão' : 'Nova Assinatura Recorrente no Cartão'}
        subtitle="Cobrança mensal contínua (sem número fixo de parcelas). O valor pode ser reajustado a qualquer momento."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nome do Serviço / Assinatura
            </label>
            <input
              type="text"
              id="sub-name-input"
              required
              placeholder="Ex: Seguradora do Carro (Porto Seguro), YouTube Music, Netflix..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Amount & Start Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor Mensal Atual (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="sub-amount-input"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Caso haja reajuste futuro, basta editar este valor.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mês de Início da Cobrança
              </label>
              <input
                type="month"
                id="sub-start-month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Card and Person Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Cartão de Crédito
              </label>
              <select
                id="sub-card-select"
                value={cardId}
                onChange={(e) => {
                  const cId = e.target.value;
                  setCardId(cId);
                  const found = cards.find((c) => c.id === cId);
                  if (found) {
                    setPerson(found.person);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.person} - Venc. dia {c.dueDay})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <select
                id="sub-person-select"
                value={person}
                onChange={(e) => setPerson(e.target.value as Person)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                <option value={p1}>{p1}</option>
                <option value={p2}>{p2}</option>
              </select>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                id="sub-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                <option value="Assinaturas & Serviços">Assinaturas & Serviços</option>
                <option value="Seguros">Seguros & Proteção</option>
                <option value="Streaming & Música">Streaming & Música</option>
                <option value="Software & Apps">Software & Apps</option>
                <option value="Saúde & Bem-Estar">Saúde & Bem-Estar</option>
                <option value="Educação">Educação & Cursos</option>
                <option value="Transporte & Auto">Transporte & Auto</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Status da Assinatura
              </label>
              <select
                id="sub-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'paused' | 'cancelled')}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                <option value="active">Ativa (Lançar na fatura todos os meses)</option>
                <option value="paused">Pausada temporariamente</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações / Detalhes (Opcional)
            </label>
            <input
              type="text"
              id="sub-notes-input"
              placeholder="Ex: Reajuste previsto para Dezembro, plano familiar, renovação anual..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Informative Banner */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-xl flex items-start gap-2.5 text-xs text-purple-800 dark:text-purple-300">
            <RefreshCw className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
            <span>
              Ao contrário das compras parceladas que têm fim programado, as assinaturas constam permanentemente na fatura mensal do cartão selecionado. Se o valor for reajustado, basta editar este registro para atualizar todos os meses subsequentes.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              {subscriptionToEdit && (
                <button
                  type="button"
                  id="delete-subscription-modal-btn"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Assinatura</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="save-subscription-btn"
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{subscriptionToEdit ? 'Salvar Reajuste / Alterações' : 'Cadastrar Assinatura'}</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Nested Confirm Delete Modal */}
      {isConfirmDeleteOpen && subscriptionToEdit && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Excluir Assinatura Recorrente"
          message={`Tem certeza que deseja remover a assinatura "${name || subscriptionToEdit.name || subscriptionToEdit.description || 'Assinatura'}" (${formatCurrency(parseFloat(amount) || subscriptionToEdit.amount)}/mês)? Ela deixará de ser lançada nas faturas.`}
          confirmText="Excluir Definitivamente"
          confirmVariant="danger"
        />
      )}
    </>
  );
};
