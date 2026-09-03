import React, { useState, useMemo } from 'react';
import { ShoppingList, ShoppingListItem, GroceryCategory } from '../../types';
import { CARREFOUR_MASTER_ITEMS_DATA, createCarrefourMasterShoppingList } from '../../data/carrefourMasterList';
import { formatCurrency } from '../../utils/formatters';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Store,
  DollarSign,
  Search,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Filter,
} from 'lucide-react';

interface ShoppingListEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (listData: {
    id?: string;
    name: string;
    type: 'semanal' | 'mensal' | 'reposicao' | 'personalizada';
    monthKey: string;
    items: ShoppingListItem[];
    estimatedTotal: number;
  }) => void;
  initialList?: ShoppingList | null;
  selectedMonth: string;
}

const CATEGORY_GROUPS = [
  'Todas',
  'Proteínas',
  'Básicos',
  'Hortifruti',
  'Laticínios e Frios',
  'Padaria',
  'Temperos',
  'Limpeza',
  'Higiene',
  'Gatos / Pet',
  'Extras e Bebidas',
  'Jardim e Casa',
];

const PRESET_STORES = ['Carrefour', 'Assaí', 'Atacadão', 'Sonda', 'Mambo', 'Feira Livre', 'Outro'];

export const ShoppingListEditModal: React.FC<ShoppingListEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialList,
  selectedMonth,
}) => {
  const isEditing = Boolean(initialList?.id);

  const [name, setName] = useState<string>(
    initialList?.name || 'LISTA DE COMPRAS - CARREFOUR'
  );
  const [type, setType] = useState<'semanal' | 'mensal' | 'reposicao' | 'personalizada'>(
    initialList?.type || 'personalizada'
  );
  const [globalStore, setGlobalStore] = useState<string>(
    initialList?.items?.[0]?.preferredStore || 'Carrefour'
  );
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    if (initialList?.items && initialList.items.length > 0) {
      return initialList.items;
    }
    // Default to Carrefour master items if starting fresh
    return createCarrefourMasterShoppingList('LISTA DE COMPRAS - CARREFOUR', 'Carrefour', selectedMonth).items;
  });

  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New item quick form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('un');
  const [newPrice, setNewPrice] = useState('');
  const [newCategoryGroup, setNewCategoryGroup] = useState('Básicos');
  const [newCategory, setNewCategory] = useState<GroceryCategory>('Alimentos');

  if (!isOpen) return null;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchGroup =
        activeGroupFilter === 'Todas' ||
        (item.categoryGroup && item.categoryGroup.toLowerCase().includes(activeGroupFilter.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(activeGroupFilter.toLowerCase()));
      const matchSearch =
        !searchQuery.trim() ||
        item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryGroup && item.categoryGroup.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGroup && matchSearch;
    });
  }, [items, activeGroupFilter, searchQuery]);

  // Compute Total
  const totalEstimated = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.estimatedPrice || (i.quantity * (i.lastPricePaid || 0)) || 0), 0);
  }, [items]);

  // Apply Global Store to all items
  const handleApplyGlobalStore = (store: string) => {
    setGlobalStore(store);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        preferredStore: store,
      }))
    );
  };

  // Update item price (accepts real decimal numbers up to 2 decimals)
  const handlePriceChange = (id: string, rawVal: string | number) => {
    let parsed: number;
    if (typeof rawVal === 'string') {
      const normalized = rawVal.replace(',', '.');
      parsed = parseFloat(normalized);
    } else {
      parsed = rawVal;
    }
    const safePrice = isNaN(parsed) || parsed < 0 ? 0 : Number(parsed.toFixed(2));
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            estimatedPrice: safePrice,
            lastPricePaid: safePrice,
          };
        }
        return item;
      })
    );
  };

  // Update item quantity (accepts integers and real decimal numbers like 0.5, 0.25, 1.350 kg)
  const handleQuantityChange = (id: string, rawVal: string | number) => {
    let parsed: number;
    if (typeof rawVal === 'string') {
      const normalized = rawVal.replace(',', '.');
      parsed = parseFloat(normalized);
    } else {
      parsed = rawVal;
    }
    const safeVal = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: safeVal } : item))
    );
  };

  // Update item store
  const handleItemStoreChange = (id: string, store: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, preferredStore: store } : item))
    );
  };

  // Remove single item from list
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Quick remove filtered items
  const handleRemoveFiltered = () => {
    if (filteredItems.length === 0) return;
    const idsToRemove = new Set(filteredItems.map((i) => i.id));
    setItems((prev) => prev.filter((i) => !idsToRemove.has(i.id)));
  };

  // Reset to full Master Carrefour Template
  const handleLoadCarrefourTemplate = () => {
    const master = createCarrefourMasterShoppingList('LISTA DE COMPRAS - CARREFOUR', globalStore, selectedMonth);
    setItems(master.items);
    setName(`LISTA DE COMPRAS - ${(globalStore || '').toUpperCase()}`);
  };

  // Add new item to list
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const priceNum = parseFloat(newPrice.replace(',', '.')) || 0;
    const qtyNum = typeof newQuantity === 'string' ? parseFloat(String(newQuantity).replace(',', '.')) || 1 : Number(newQuantity) || 1;
    const newItem: ShoppingListItem = {
      id: `sli-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product: newProductName.trim(),
      quantity: qtyNum > 0 ? qtyNum : 1,
      unit: newUnit.trim() || 'un',
      category: newCategory,
      categoryGroup: newCategoryGroup,
      priority: 'Média',
      preferredStore: globalStore,
      estimatedPrice: priceNum,
      lastPricePaid: priceNum,
      completed: false,
    };

    setItems((prev) => [newItem, ...prev]);
    setNewProductName('');
    setNewPrice('');
    setIsAddingItem(false);
  };

  // Handle Save
  const [formError, setFormError] = useState<string>('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Por favor informe o nome da lista.');
      return;
    }
    setFormError('');

    onSave({
      id: initialList?.id,
      name: name.trim(),
      type,
      monthKey: initialList?.monthKey || selectedMonth,
      items,
      estimatedTotal: totalEstimated,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                {isEditing ? 'Editar Lista de Compras' : 'Criar / Personalizar Lista de Compras'}
              </h3>
              <p className="text-xs text-slate-500">
                Altere o supermercado, edite preços estimados e remova produtos que não deseja comprar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {formError && (
            <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 font-semibold">
              {formError}
            </div>
          )}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Top Config Row: Name, Type, and Global Store */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-6">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nome da Lista
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: LISTA DE COMPRAS - CARREFOUR"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Tipo de Frequência
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="personalizada">Personalizada</option>
                  <option value="semanal">Semanal (Hortifruti & Feira)</option>
                  <option value="mensal">Mensal (Atacado & Limpeza)</option>
                  <option value="reposicao">Reposição de Estoque</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Mercado Principal
                </label>
                <select
                  value={globalStore}
                  onChange={(e) => handleApplyGlobalStore(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-emerald-600 dark:text-emerald-400"
                >
                  {PRESET_STORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Store Change Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Trocar mercado da lista:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {PRESET_STORES.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        handleApplyGlobalStore(s);
                        if (name.includes('LISTA DE COMPRAS -')) {
                          setName(`LISTA DE COMPRAS - ${s.toUpperCase()}`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        globalStore === s
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadCarrefourTemplate}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs transition-colors"
                  title="Carregar todos os 128 itens da Lista Master"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Restaurar Modelo Padrão</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* Category Pills */}
              <div className="overflow-x-auto flex items-center gap-1.5 no-scrollbar py-1">
                {CATEGORY_GROUPS.map((grp) => {
                  const count =
                    grp === 'Todas'
                      ? items.length
                      : items.filter(
                          (i) =>
                            (i.categoryGroup && i.categoryGroup.toLowerCase().includes(grp.toLowerCase())) ||
                            (i.category && i.category.toLowerCase().includes(grp.toLowerCase()))
                        ).length;

                  if (count === 0 && grp !== 'Todas') return null;

                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setActiveGroupFilter(grp)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                        activeGroupFilter === grp
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{grp}</span>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Produto</span>
                </button>
              </div>
            </div>

            {/* Quick Add Product Sub-form */}
            {isAddingItem && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Adicionar Novo Produto à Lista
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕ Fechar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Nome do produto"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Qtd (ex: 0.5)"
                      value={newQuantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(',', '.'));
                        setNewQuantity(isNaN(val) ? 1 : val);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Unidade (kg, un, pac)"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Preço Est. (R$)"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs text-xs"
                    >
                      Inserir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items List Table */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-1">
                <span>
                  Exibindo <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> produtos
                </span>
                {filteredItems.length < items.length && (
                  <button
                    type="button"
                    onClick={handleRemoveFiltered}
                    className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Excluir estes {filteredItems.length} itens</span>
                  </button>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum produto encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {filteredItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      {/* Left: Product Name & Category */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.product}
                        </span>
                        {item.categoryGroup && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap shrink-0">
                            {item.categoryGroup}
                          </span>
                        )}
                      </div>

                      {/* Middle: Quantity & Unit */}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-16 p-1 text-center rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 text-xs"
                          title="Quantidade em kg, un ou pac (aceita inteiros e decimais, ex: 1, 2, 0.5, 0.25, 1.350)"
                          placeholder="1"
                        />
                        <span className="text-slate-400 text-[11px] w-12 truncate">{item.unit}</span>
                      </div>

                      {/* Store selector per item */}
                      <div className="hidden sm:block shrink-0">
                        <select
                          value={item.preferredStore || globalStore}
                          onChange={(e) => handleItemStoreChange(item.id, e.target.value)}
                          className="p-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                        >
                          {PRESET_STORES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Right: Editable Price (R$) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1">
                          <span className="text-[10px] text-slate-400 mr-1">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.estimatedPrice ?? item.lastPricePaid ?? ''}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            className="w-16 text-right bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none text-xs"
                            title="Preço Estimado / Unitário (aceita até duas casas decimais, ex: 12.90)"
                            placeholder="0,00"
                          />
                        </div>

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remover este produto da lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Total de Itens:</span>
                <strong className="text-slate-900 dark:text-slate-100 text-sm">
                  {items.length} produtos
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Valor Total Previsto:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {formatCurrency(totalEstimated)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                {isEditing ? 'Salvar Alterações' : 'Salvar Lista'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
