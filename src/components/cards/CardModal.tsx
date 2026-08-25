import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CreditCard, Person } from '../../types';
import { useFinance } from '../../context/FinanceContext';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CreditCard | null;
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, editingCard }) => {
  const { addCard, updateCard } = useFinance();

  const [name, setName] = useState('');
  const [person, setPerson] = useState<Person>('Ricardo');
  const [closingDay, setClosingDay] = useState(20);
  const [dueDay, setDueDay] = useState(27);
  const [monthlyLimitGoal, setMonthlyLimitGoal] = useState(500);
  const [color, setColor] = useState('#820AD1');
  const [brand, setBrand] = useState('Mastercard');

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setPerson(editingCard.person);
      setClosingDay(editingCard.closingDay);
      setDueDay(editingCard.dueDay);
      setMonthlyLimitGoal(editingCard.monthlyLimitGoal || 500);
      setColor(editingCard.color);
      setBrand(editingCard.brand || 'Mastercard');
    } else {
      setName('');
      setPerson('Ricardo');
      setClosingDay(20);
      setDueDay(27);
      setMonthlyLimitGoal(500);
      setColor('#820AD1');
      setBrand('Mastercard');
    }
  }, [editingCard, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do cartão.');
      return;
    }

    const payload = {
      name: name.trim(),
      person,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      monthlyLimitGoal: Number(monthlyLimitGoal) || 500,
      color,
      brand,
    };

    if (editingCard) {
      updateCard(editingCard.id, payload);
    } else {
      addCard(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
      subtitle="Defina o cartão e sua meta mensal de fatura (Meta: R$ 500)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Nome do Cartão
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Nubank Ricardo, Itaú Ellen, XP Família..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Responsável / Titular
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Meta da Fatura (R$)
            </label>
            <input
              type="number"
              min="1"
              required
              value={monthlyLimitGoal}
              onChange={(e) => setMonthlyLimitGoal(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Dia Fechamento
            </label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={closingDay}
              onChange={(e) => setClosingDay(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Dia Vencimento
            </label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Bandeira
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            >
              <option value="Mastercard">Mastercard</option>
              <option value="Visa">Visa</option>
              <option value="Elo">Elo</option>
              <option value="Amex">American Express</option>
              <option value="Hipercard">Hipercard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Cor do Cartão
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-500">{color}</span>
            </div>
          </div>
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
            className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
          >
            {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
