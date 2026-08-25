import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Person } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({ isOpen, onClose }) => {
  const { addInstallmentPurchase, cards, selectedMonth } = useFinance();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(6);
  const [firstInstallmentMonth, setFirstInstallmentMonth] = useState(selectedMonth);
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [person, setPerson] = useState<Person>('Ricardo');
  const [category, setCategory] = useState('Cartão de Crédito');

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
      category: category || 'Cartão de Crédito',
      createdAt: new Date().toISOString().slice(0, 10),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Compra Parcelada"
      subtitle="Cadastre compras parceladas para projetar as faturas futuras"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Descrição do Produto / Serviço
          </label>
          <input
            type="text"
            id="inst-desc-input"
            required
            placeholder="Ex: Notebook Dell, Geladeira, Seguro do Carro..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
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
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
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
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
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
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-center justify-between">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            Valor de cada parcela mensal:
          </span>
          <span className="text-base font-bold text-blue-900 dark:text-blue-200">
            {formatCurrency(calculatedInstallmentValue)} / mês
          </span>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Responsável
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Ricardo', 'Ellen', 'Família'] as Person[]).map((p) => {
              const active = person === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPerson(p)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    active
                      ? p === 'Ricardo'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : p === 'Ellen'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-emerald-600 text-white border-emerald-600'
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
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
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
              value={firstInstallmentMonth}
              onChange={(e) => setFirstInstallmentMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
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
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            id="inst-save-btn"
            className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
          >
            Gerar Parcelas Futuras
          </button>
        </div>
      </form>
    </Modal>
  );
};
