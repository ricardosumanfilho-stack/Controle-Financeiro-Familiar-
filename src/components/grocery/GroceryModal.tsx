import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { GroceryTrip, Person, PaymentMethod, GroceryItem } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface GroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrip?: GroceryTrip | null;
}

export const GroceryModal: React.FC<GroceryModalProps> = ({ isOpen, onClose, editingTrip }) => {
  const { addGroceryTrip, updateGroceryTrip, selectedMonth } = useFinance();

  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [person, setPerson] = useState<Person>('Família');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<GroceryItem[]>([]);

  // Item adding helper state
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Mercearia');

  useEffect(() => {
    if (editingTrip) {
      setStoreName(editingTrip.storeName);
      setTotalAmount(String(editingTrip.totalAmount));
      setPerson(editingTrip.person);
      setDate(editingTrip.date);
      setPaymentMethod(editingTrip.paymentMethod);
      setNotes(editingTrip.notes || '');
      setItems(editingTrip.items || []);
    } else {
      setStoreName('');
      setTotalAmount('');
      setPerson('Família');
      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setPaymentMethod('debito');
      setNotes('');
      setItems([]);
    }
  }, [editingTrip, isOpen, selectedMonth]);

  const handleAddItem = () => {
    const p = parseFloat(newItemPrice.replace(',', '.'));
    if (!newItemName.trim() || isNaN(p) || p <= 0) {
      alert('Informe o nome e valor do item.');
      return;
    }
    const item: GroceryItem = {
      id: 'gi-' + Date.now(),
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
      subtitle="Controle suas compras com meta mensal de R$ 1.000"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              Valor Total da Compra (R$)
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
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Quem realizou a compra?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Família', 'Ricardo', 'Ellen'] as Person[]).map((p) => {
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
              onChange={(e) => setDate(e.target.value)}
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
