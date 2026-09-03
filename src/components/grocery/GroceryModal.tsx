import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { GroceryTrip, Person, PaymentMethod, GroceryItem, GroceryCategory } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface GroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrip?: GroceryTrip | null;
}

export const GroceryModal: React.FC<GroceryModalProps> = ({ isOpen, onClose, editingTrip }) => {
  const { addGroceryTrip, updateGroceryTrip, selectedMonth, person1Name, person2Name } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [person, setPerson] = useState<Person>(p1);
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [tripType, setTripType] = useState<'semanal' | 'mensal' | 'extraordinaria'>('semanal');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<GroceryCategory>('Alimentos');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Helper to compute week number from date string YYYY-MM-DD
  const getWeekFromDate = (dateStr: string): number => {
    if (!dateStr) return 1;
    const day = parseInt(dateStr.slice(8, 10), 10);
    if (isNaN(day)) return 1;
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 28) return 4;
    return 5;
  };

  useEffect(() => {
    if (editingTrip) {
      setStoreName(editingTrip.storeName);
      setTotalAmount(String(editingTrip.totalAmount));
      setPerson(editingTrip.person === 'Família' ? p1 : editingTrip.person);
      setDate(editingTrip.date);
      setPaymentMethod(editingTrip.paymentMethod);
      const computedType = editingTrip.tripType || (editingTrip.isExtraordinary ? 'extraordinaria' : 'semanal');
      setTripType(computedType);
      setWeekNumber(editingTrip.weekNumber || getWeekFromDate(editingTrip.date));
      setNotes(editingTrip.notes || '');
      setItems(editingTrip.items || (editingTrip.products as GroceryItem[]) || []);
    } else {
      setStoreName('');
      setTotalAmount('');
      setPerson(p1);
      const today = new Date().toISOString().slice(0, 10);
      const initialDate = today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`;
      setDate(initialDate);
      setPaymentMethod('debito');
      setTripType('semanal');
      setWeekNumber(getWeekFromDate(initialDate));
      setNotes('');
      setItems([]);
    }
  }, [editingTrip, isOpen, selectedMonth, p1]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (tripType === 'semanal') {
      setWeekNumber(getWeekFromDate(newDate));
    }
  };

  const handleAddItem = () => {
    const p = parseFloat(newItemPrice.replace(',', '.'));
    if (!newItemName.trim() || isNaN(p) || p <= 0) {
      alert('Informe o nome e valor do item.');
      return;
    }
    const item: GroceryItem = {
      id: 'gi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: 1,
      unit: 'un',
      unitPrice: p,
      totalPrice: p,
      price: p,
    };
    const newItems = [...items, item];
    setItems(newItems);
    setNewItemName('');
    setNewItemPrice('');

    // If total amount is 0 or user wants it auto-summed:
    const calculatedSum = newItems.reduce((s, i) => s + (i.totalPrice || i.price || 0), 0);
    setTotalAmount(calculatedSum.toFixed(2));
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    if (updated.length > 0) {
      const calculatedSum = updated.reduce((s, i) => s + (i.totalPrice || i.price || 0), 0);
      setTotalAmount(calculatedSum.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(totalAmount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Informe um valor total válido para a compra.');
      return;
    }
    if (!storeName.trim()) {
      alert('Informe o supermercado ou estabelecimento.');
      return;
    }

    const payload = {
      storeName: storeName.trim(),
      totalAmount: numAmount,
      person,
      date: date || new Date().toISOString().slice(0, 10),
      paymentMethod,
      tripType,
      weekNumber: tripType === 'semanal' ? weekNumber : undefined,
      isExtraordinary: tripType === 'extraordinaria',
      notes: notes.trim() || undefined,
      items: items.length > 0 ? items : undefined,
    };

    if (editingTrip) {
      updateGroceryTrip(editingTrip.id, payload);
    } else {
      addGroceryTrip(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTrip ? 'Editar Compra de Supermercado' : 'Nova Compra de Supermercado'}
      subtitle="Controle semanal e mensal com transferência inteligente de sobras/estouros"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Compra: Semanal / Mensal / Extraordinária */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Tipo de Compra
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'semanal', label: 'Semanal (Hortifruti / Feira)', desc: 'Meta semanal' },
              { id: 'mensal', label: 'Mensal (Abastecimento)', desc: 'Meta mensal fixa' },
              { id: 'extraordinaria', label: 'Extraordinária', desc: 'Fora da rotina' },
            ].map((t) => {
              const active = tripType === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    const nextType = t.id as 'semanal' | 'mensal' | 'extraordinaria';
                    setTripType(nextType);
                    if (nextType === 'semanal' && !weekNumber) {
                      setWeekNumber(getWeekFromDate(date));
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Se for semanal, escolher a semana do mês */}
        {tripType === 'semanal' && (
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Semana de Referência (Meta Semanal)
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                Sobra/estouro acumula para as próximas semanas
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { num: 1, label: 'Sem 1', range: '01 a 07' },
                { num: 2, label: 'Sem 2', range: '08 a 14' },
                { num: 3, label: 'Sem 3', range: '15 a 21' },
                { num: 4, label: 'Sem 4', range: '22 a 28' },
                { num: 5, label: 'Sem 5', range: '29+' },
              ].map((w) => (
                <button
                  key={w.num}
                  type="button"
                  onClick={() => setWeekNumber(w.num)}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all border ${
                    weekNumber === w.num
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-blue-200/80 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 hover:bg-blue-100/50'
                  }`}
                >
                  <div className="text-[11px] font-bold">{w.label}</div>
                  <div className="text-[9px] opacity-75">{w.range}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Supermercado / Estabelecimento
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Assaí, Carrefour, Hortifruti..."
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Valor Real Gasto na Compra (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-bold text-emerald-600 dark:text-emerald-400 text-base"
              />
            </div>
          </div>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Quem realizou a compra?
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
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data e Forma de Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Data da Compra
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            >
              <option value="debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="transferencia">Outro</option>
            </select>
          </div>
        </div>

        {/* Itens / Categorias da Compra (Opcional) */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Detalhamento de Itens / Categorias (Opcional)
            </span>
            <span className="text-xs text-slate-500">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Ex: Açougue, Hortifruti, Limpeza..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="sm:col-span-6 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="sm:col-span-3 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
            >
              <option value="Mercearia">Mercearia</option>
              <option value="Açougue">Açougue</option>
              <option value="Hortifruti">Hortifruti</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Laticínios">Laticínios</option>
              <option value="Padaria">Padaria</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Outros">Outros</option>
            </select>
            <div className="sm:col-span-3 flex gap-1">
              <input
                type="number"
                step="0.01"
                placeholder="R$"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                title="Adicionar item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {it.name} <span className="text-slate-400 font-normal">({it.category})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(it.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Observações
          </label>
          <input
            type="text"
            placeholder="Ex: Compras da primeira quinzena..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
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
            className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
          >
            {editingTrip ? 'Salvar Alterações' : 'Registrar Compra'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
