import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPerson?: 'Ricardo' | 'Ellen';
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  defaultPerson = 'Ricardo',
}) => {
  const { addInvestmentContribution, selectedMonth } = useFinance();

  const [person, setPerson] = useState<'Ricardo' | 'Ellen'>(defaultPerson);
  const [amount, setAmount] = useState('500');
  const [targetAsset, setTargetAsset] = useState('Tesouro Selic / IPCA+');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    setPerson(defaultPerson);
    setAmount('500'); // Padrão meta R$ 500
    const today = new Date().toISOString().slice(0, 10);
    setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-05`);
    setNotes('');
  }, [defaultPerson, isOpen, selectedMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Informe um valor de aporte válido.');
      return;
    }

    addInvestmentContribution({
      person,
      amount: numAmount,
      targetAsset: targetAsset.trim() || 'Renda Fixa / Ações',
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Aporte Mensal de Investimento"
      subtitle="Meta individual de R$ 500,00 por pessoa ao mês"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Investidor (Meta R$ 500 cada)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Ricardo', 'Ellen'] as ('Ricardo' | 'Ellen')[]).map((p) => {
              const active = person === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPerson(p)}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    active
                      ? p === 'Ricardo'
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Valor do Aporte (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Data do Aporte
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Ativo / Destino do Investimento
          </label>
          <select
            value={targetAsset}
            onChange={(e) => setTargetAsset(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          >
            <option value="Tesouro Selic / IPCA+">Tesouro Selic / IPCA+</option>
            <option value="CDB 110% CDI / LCI">CDB 110% CDI / LCI</option>
            <option value="Fundos Imobiliários (FIIs)">Fundos Imobiliários (FIIs)</option>
            <option value="Ações Brasil / Dividendos">Ações Brasil / Dividendos</option>
            <option value="ETFs Globais / Exterior">ETFs Globais / Exterior</option>
            <option value="Previdência Privada">Previdência Privada</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Observações
          </label>
          <input
            type="text"
            placeholder="Ex: Aporte mensal da meta de R$ 500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
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
            className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
          >
            Confirmar Aporte
          </button>
        </div>
      </form>
    </Modal>
  );
};
