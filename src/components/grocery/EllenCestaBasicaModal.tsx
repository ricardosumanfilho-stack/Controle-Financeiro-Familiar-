import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CestaBasicaItem, CestaBasicaRecord } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Gift, Plus, Trash2, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface EllenCestaBasicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<CestaBasicaRecord, 'id'>, updateStock: boolean) => void;
}

const DEFAULT_CESTA_ITEMS: CestaBasicaItem[] = [
  { product: 'Arroz Agulhinha Tipo 1 5kg', quantity: 2, unit: 'pac (10kg)', estimatedValue: 58.00 },
  { product: 'Feijão Carioca 1kg', quantity: 3, unit: 'pac (3kg)', estimatedValue: 24.00 },
  { product: 'Óleo de Soja 900ml', quantity: 2, unit: 'un', estimatedValue: 16.00 },
  { product: 'Café Torrado e Moído 500g', quantity: 2, unit: 'pac (1kg)', estimatedValue: 42.00 },
  { product: 'Açúcar Refinado 1kg', quantity: 3, unit: 'pac (3kg)', estimatedValue: 15.00 },
  { product: 'Macarrão Espaguete & Parafuso 500g', quantity: 4, unit: 'pac (2kg)', estimatedValue: 18.00 },
  { product: 'Molho de Tomate Tradicional 300g', quantity: 4, unit: 'sachê', estimatedValue: 12.00 },
  { product: 'Farinha de Trigo Especial 1kg', quantity: 2, unit: 'pac (2kg)', estimatedValue: 12.00 },
  { product: 'Leite em Pó Integral 400g', quantity: 2, unit: 'lata', estimatedValue: 34.00 },
  { product: 'Biscoito Doce & Salgado', quantity: 4, unit: 'pac', estimatedValue: 18.00 },
  { product: 'Sal Refinado 1kg', quantity: 1, unit: 'pac', estimatedValue: 3.50 },
  { product: 'Sardinha em Óleo', quantity: 3, unit: 'lata', estimatedValue: 16.50 },
  { product: 'Farinha de Mandioca / Fubá', quantity: 2, unit: 'pac', estimatedValue: 11.00 },
];

export const EllenCestaBasicaModal: React.FC<EllenCestaBasicaModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(
    'Cesta básica mensal recebida por Ellen. Alivia substancialmente as compras de mercearia seca e grãos da família.'
  );
  const [items, setItems] = useState<CestaBasicaItem[]>(DEFAULT_CESTA_ITEMS);
  const [updateStock, setUpdateStock] = useState(true);

  // New item inputs
  const [newProductName, setNewProductName] = useState('');
  const [newProductQty, setNewProductQty] = useState(1);
  const [newProductUnit, setNewProductUnit] = useState('un');
  const [newProductValue, setNewProductValue] = useState('');

  const totalEstimatedSavings = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    setItems([
      ...items,
      {
        product: newProductName.trim(),
        quantity: Number(newProductQty) || 1,
        unit: newProductUnit.trim() || 'un',
        estimatedValue: Number(newProductValue) || 0,
      },
    ]);
    setNewProductName('');
    setNewProductQty(1);
    setNewProductUnit('un');
    setNewProductValue('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof CestaBasicaItem, value: any) => {
    setItems(
      items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        date,
        receivedBy: 'Ellen',
        estimatedSavings: totalEstimatedSavings,
        items,
        notes,
        isDemo: false,
      },
      updateStock
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cesta Básica Mensal da Ellen"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner with impact */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-indigo-500/15 border border-pink-200 dark:border-pink-900/50 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              Economia Familiar Garantida
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/70 text-pink-700 dark:text-pink-300 font-bold">
                {formatCurrency(totalEstimatedSavings)}
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ao registrar a cesta, esses itens são automaticamente marcados como cobertos nas listas de compras e inseridos no controle de estoque da despensa.
            </p>
          </div>
        </div>

        {/* Date and Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Recebimento da Cesta *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Beneficiária
            </label>
            <div className="w-full text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500" />
              Ellen (Cesta Mensal de Trabalho/Instituição)
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Itens da Cesta ({items.length} produtos incluídos)
            </h4>
            <span className="text-xs text-slate-500">
              Valor estimado economizado: <strong>{formatCurrency(totalEstimatedSavings)}</strong>
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto pr-1 space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.product}
                    onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                    className="w-full font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 text-xs truncate"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>Qtd:</span>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-12 bg-slate-100 dark:bg-slate-700 border-0 rounded px-1 py-0.5 text-[10px] text-center"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-16 bg-slate-100 dark:bg-slate-700 border-0 rounded px-1 py-0.5 text-[10px] text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Valor Est.</span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] text-slate-500">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.estimatedValue || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(',', '.'));
                          handleItemChange(idx, 'estimatedValue', isNaN(val) ? 0 : Number(val.toFixed(2)));
                        }}
                        className="w-16 text-right font-bold text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-700 border-0 rounded px-1.5 py-0.5 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Remover item da cesta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Custom Item */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Adicionar outro item da cesta..."
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              min="0.001"
              step="any"
              value={newProductQty}
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(',', '.'));
                setNewProductQty(isNaN(val) ? 1 : val);
              }}
              placeholder="Qtd"
              className="w-16 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-center"
            />
            <input
              type="text"
              value={newProductUnit}
              onChange={(e) => setNewProductUnit(e.target.value)}
              placeholder="Unidade"
              className="w-20 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-center"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={newProductValue}
              onChange={(e) => setNewProductValue(e.target.value)}
              placeholder="R$ Valor"
              className="w-24 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-right"
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync with Household Inventory Checkbox */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={updateStock}
              onChange={(e) => setUpdateStock(e.target.checked)}
              className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Atualizar automaticamente o estoque da despensa
            </span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
            Registra esses itens como <strong>"Estoque Seguro / Suficiente"</strong> para os próximos 30 dias e evita que sejam adicionados desnecessariamente na lista de compras.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Salvar Cesta Básica ({formatCurrency(totalEstimatedSavings)})</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
