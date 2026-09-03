import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Person, InstallmentPurchase } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installmentToEdit?: InstallmentPurchase | null;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  installmentToEdit,
}) => {
  const {
    addInstallmentPurchase,
    updateInstallmentPurchase,
    deleteInstallmentPurchase,
    cards,
    selectedMonth,
    person1Name,
    person2Name,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(6);
  const [firstInstallmentMonth, setFirstInstallmentMonth] = useState(selectedMonth);
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [person, setPerson] = useState<Person>(p1);
  const [category, setCategory] = useState('Cartão de Crédito');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = Boolean(installmentToEdit);

  useEffect(() => {
    if (isOpen) {
      if (installmentToEdit) {
        setDescription(installmentToEdit.description || '');
        setTotalAmount(installmentToEdit.totalAmount ? String(installmentToEdit.totalAmount) : '');
        setTotalInstallments(installmentToEdit.totalInstallments || 6);
        setFirstInstallmentMonth(installmentToEdit.firstInstallmentMonth || selectedMonth);
        setCardId(installmentToEdit.cardId || cards[0]?.id || '');
        setPerson(installmentToEdit.person || p1);
        setCategory(installmentToEdit.category || 'Cartão de Crédito');
      } else {
        setDescription('');
        setTotalAmount('');
        setTotalInstallments(6);
        setFirstInstallmentMonth(selectedMonth);
        setCardId(cards[0]?.id || '');
        setPerson(p1);
        setCategory('Cartão de Crédito');
      }
      setShowDeleteConfirm(false);
    }
  }, [isOpen, installmentToEdit, selectedMonth, cards, p1]);

  const calculatedInstallmentValue = React.useMemo(() => {
    const numTotal = parseFloat(totalAmount.replace(',', '.'));
    if (!isNaN(numTotal) && totalInstallments > 0) {
      return numTotal / totalInstallments;
    }
    return 0;
  }, [totalAmount, totalInstallments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(totalAmount.replace(',', '.'));
    if (isNaN(numTotal) || numTotal <= 0) {
      alert('Informe um valor total válido para a compra.');
      return;
    }
    if (!description.trim()) {
      alert('Informe o nome da compra parcelada.');
      return;
    }
    if (!cardId) {
      alert('Selecione o cartão de crédito.');
      return;
    }

    if (isEditing && installmentToEdit) {
      updateInstallmentPurchase(installmentToEdit.id, {
        description: description.trim(),
        totalAmount: numTotal,
        installmentAmount: Number(calculatedInstallmentValue.toFixed(2)),
        totalInstallments: Number(totalInstallments),
        cardId,
        person,
        category: category.trim() || 'Cartão de Crédito',
      });
    } else {
      addInstallmentPurchase({
        description: description.trim(),
        totalAmount: numTotal,
        installmentAmount: Number(calculatedInstallmentValue.toFixed(2)),
        totalInstallments: Number(totalInstallments),
        remainingInstallments: Number(totalInstallments),
        currentInstallment: 1,
        firstInstallmentMonth,
        firstDueDate: firstInstallmentMonth,
        purchaseDate: new Date().toISOString().slice(0, 10),
        cardId,
        person,
        category: category.trim() || 'Cartão de Crédito',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (installmentToEdit) {
      deleteInstallmentPurchase(installmentToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Editar Compra Parcelada' : 'Nova Compra Parcelada'}
        subtitle={
          isEditing
            ? 'Atualize o nome da compra, valor, categoria ou responsável'
            : 'Cadastre compras parceladas para projetar as faturas futuras'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nome / Descrição da Compra
            </label>
            <input
              type="text"
              id="inst-desc-input"
              required
              placeholder="Ex: Notebook Dell, Geladeira, Celular Samsung..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-medium"
            />
            {isEditing && (
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
                Ao alterar o nome, todas as parcelas geradas nos meses correspondentes serão atualizadas automaticamente.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor Total da Compra (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="inst-total-amount"
                  required
                  placeholder="0,00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Número de Parcelas
              </label>
              <select
                id="inst-total-parcels"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}x de {formatCurrency(calculatedInstallmentValue > 0 ? calculatedInstallmentValue : 0)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumo da Parcela */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-xl flex items-center justify-between">
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
              Valor de cada parcela mensal:
            </span>
            <span className="text-base font-bold text-purple-900 dark:text-purple-200">
              {formatCurrency(calculatedInstallmentValue)} / mês
            </span>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Responsável
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[p1, p2].map((p, idx) => {
                const active = person === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPerson(p)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      active
                        ? idx === 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cartão e Mês da 1ª Parcela */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Cartão de Crédito
              </label>
              <select
                id="inst-card-select"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.person})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mês da 1ª Parcela
              </label>
              <input
                type="month"
                id="inst-first-month-input"
                required
                disabled={isEditing}
                value={firstInstallmentMonth}
                onChange={(e) => setFirstInstallmentMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <input
              type="text"
              placeholder="Ex: Tecnologia, Educação, Casa, Transporte..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Compra</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="inst-save-btn"
                className="px-5 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
              >
                {isEditing ? 'Salvar Alterações' : 'Gerar Parcelas Futuras'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation for Installment */}
      {isEditing && installmentToEdit && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Excluir Compra Parcelada"
          message={`Tem certeza que deseja excluir "${installmentToEdit.description}"? Todas as parcelas desta compra serão removidas deste mês e de todos os meses subsequentes das faturas.`}
          confirmText="Excluir Compra e Meses Subsequentes"
          confirmVariant="danger"
        />
      )}
    </>
  );
};
