import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingList, ShoppingListItem, Person, PaymentMethod } from '../../types';
import { CARREFOUR_CATALOG, CATALOG_GROUPS } from '../../data/carrefourCatalog';
import { formatCurrency } from '../../utils/formatters';
import {
  ShoppingCart,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  Edit2,
  X,
  ExternalLink,
  Store,
  CreditCard,
  User,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Tag,
  Maximize2,
  Minimize2,
  Share2,
  Check,
  Search,
  Smartphone,
} from 'lucide-react';

interface LiveMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ShoppingList;
  onUpdateList: (updatedItems: ShoppingListItem[]) => void;
  onFinalizeTrip: (params: {
    listId: string;
    storeName: string;
    totalAmount: number;
    person: Person;
    paymentMethod: PaymentMethod;
    tripType: 'semanal' | 'mensal' | 'extraordinaria';
    weekNumber?: number;
    savingsAmount?: number;
    items: ShoppingListItem[];
  }) => void;
  isStandalone?: boolean;
}

export const LiveMarketModal: React.FC<LiveMarketModalProps> = ({
  isOpen,
  onClose,
  list,
  onUpdateList,
  onFinalizeTrip,
  isStandalone = false,
}) => {
  const [items, setItems] = useState<ShoppingListItem[]>(list.items || []);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronize when list changes
  useEffect(() => {
    if (list?.items) {
      setItems(list.items);
    }
  }, [list]);
  
  // Quick edit popover for item (price & quantity)
  const [editPromptItem, setEditPromptItem] = useState<{
    id: string;
    product: string;
    quantity: string | number;
    unit: string;
    currentPrice: string;
  } | null>(null);

  // Delete item confirmation modal
  const [itemToDelete, setItemToDelete] = useState<ShoppingListItem | null>(null);

  // Extra item add
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraSearch, setExtraSearch] = useState('');
  const [extraQty, setExtraQty] = useState<number | string>(1);
  const [extraPrice, setExtraPrice] = useState('');

  // Final checkout modal step
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [cashierTotal, setCashierTotal] = useState('');
  const [cashierError, setCashierError] = useState('');
  const [storeName, setStoreName] = useState(list.items?.[0]?.preferredStore || 'Carrefour');
  const [payerPerson, setPayerPerson] = useState<Person>('Família');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [tripType, setTripType] = useState<'semanal' | 'mensal' | 'extraordinaria'>('semanal');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [discountsSavings, setDiscountsSavings] = useState('');

  if (!isOpen) return null;

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchCategory =
        activeCategoryFilter === 'Todas' ||
        (i.categoryGroup || i.category) === activeCategoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        i.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.categoryGroup && i.categoryGroup.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [items, activeCategoryFilter, searchQuery]);

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  
  // Sum of prices entered so far
  const enteredSum = items.reduce((sum, i) => {
    if (i.actualPricePaid && i.actualPricePaid > 0) return sum + i.actualPricePaid;
    if (i.completed && i.estimatedPrice) return sum + i.estimatedPrice;
    return sum;
  }, 0);

  // Handle checking an item
  const handleToggleCheck = (item: ShoppingListItem) => {
    // Haptic feedback for mobile
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch (_) {}

    const nextCompleted = !item.completed;
    const updated = items.map((i) => (i.id === item.id ? { ...i, completed: nextCompleted } : i));
    setItems(updated);
    onUpdateList(updated);

    // If just checked, prompt if user wants to enter actual price paid or adjust quantity
    if (nextCompleted && (!item.actualPricePaid || item.actualPricePaid === 0)) {
      setEditPromptItem({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        unit: item.unit || 'un',
        currentPrice: item.estimatedPrice ? String(item.estimatedPrice) : '',
      });
    }
  };

  const handleSaveEditPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPromptItem) return;
    const priceVal = parseFloat(String(editPromptItem.currentPrice).replace(',', '.'));
    const qtyVal = typeof editPromptItem.quantity === 'string'
      ? parseFloat(editPromptItem.quantity.replace(',', '.'))
      : Number(editPromptItem.quantity);

    const safeQty = !isNaN(qtyVal) && qtyVal > 0 ? qtyVal : 1;
    const safePrice = !isNaN(priceVal) && priceVal >= 0 ? Number(priceVal.toFixed(2)) : undefined;

    const updated = items.map((i) =>
      i.id === editPromptItem.id
        ? {
            ...i,
            quantity: safeQty,
            unit: editPromptItem.unit.trim() || i.unit,
            actualPricePaid: safePrice,
            estimatedPrice: safePrice !== undefined ? safePrice : i.estimatedPrice,
          }
        : i
    );
    setItems(updated);
    onUpdateList(updated);
    setEditPromptItem(null);
  };

  const handleSkipEditPrompt = () => {
    setEditPromptItem(null);
  };

  // Add extra product on the fly
  const handleAddExtraProduct = (productName: string, category: any, estPrice: number, unit: string) => {
    const qtyVal = typeof extraQty === 'string' ? parseFloat(String(extraQty).replace(',', '.')) : Number(extraQty);
    const safeQty = !isNaN(qtyVal) && qtyVal > 0 ? qtyVal : 1;
    const priceVal = parseFloat(String(extraPrice).replace(',', '.'));
    const safePrice = !isNaN(priceVal) && priceVal > 0 ? Number(priceVal.toFixed(2)) : (estPrice ? Number(estPrice.toFixed(2)) : 0);

    const newItem: ShoppingListItem = {
      id: 'sli-live-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      product: productName,
      quantity: safeQty,
      unit: unit || 'un',
      category: category || 'Alimentos',
      priority: 'Alta',
      preferredStore: storeName || 'Carrefour',
      estimatedPrice: safePrice,
      actualPricePaid: safePrice > 0 ? safePrice : undefined,
      completed: true, // already picked in store!
    };
    const updated = [newItem, ...items];
    setItems(updated);
    onUpdateList(updated);
    setIsAddingExtra(false);
    setExtraSearch('');
    setExtraPrice('');
    setExtraQty(1);
  };

  // Open standalone popup window
  const handleOpenStandaloneWindow = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = `${origin}${path}?mode=live-market&listId=${encodeURIComponent(list.id)}`;
    window.open(url, 'LiveMarketAppWindow', 'width=480,height=860,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Copy shareable mobile link
  const handleCopyMobileLink = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = `${origin}${path}?mode=live-market&listId=${encodeURIComponent(list.id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Catalog filtered suggestions for extra add
  const catalogSuggestions = useMemo(() => {
    if (!extraSearch.trim()) return CARREFOUR_CATALOG.slice(0, 8);
    const q = extraSearch.toLowerCase();
    return CARREFOUR_CATALOG.filter(
      (c) => c.name.toLowerCase().includes(q) || c.categoryGroup.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [extraSearch]);

  const handleOpenCheckout = () => {
    setCashierTotal(enteredSum > 0 ? enteredSum.toFixed(2) : '');
    setCashierError('');
    setIsCheckoutStep(true);
  };

  const handleFinalizeCashier = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(cashierTotal.replace(',', '.'));
    if (isNaN(total) || total <= 0) {
      setCashierError('O valor total do caixa é OBRIGATÓRIO para registrar a compra.');
      return;
    }

    const savings = parseFloat(discountsSavings.replace(',', '.')) || 0;

    onFinalizeTrip({
      listId: list.id,
      storeName: storeName || 'Carrefour',
      totalAmount: total,
      person: payerPerson,
      paymentMethod,
      tripType,
      weekNumber: tripType === 'semanal' ? weekNumber : undefined,
      savingsAmount: savings,
      items,
    });

    setIsCheckoutStep(false);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden ${isStandalone ? '' : 'backdrop-blur-xs bg-slate-950/95'}`}>
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between text-white shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-xs">{list.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold uppercase whitespace-nowrap">
                Modo Mercado Ao Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {completedCount} de {items.length} no carrinho ({Math.round(progressPercent)}%) • Previsto: <strong className="text-slate-200">{formatCurrency(list.estimatedTotal || enteredSum)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Share mobile link */}
          <button
            type="button"
            onClick={handleCopyMobileLink}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-xs flex items-center gap-1"
            title="Copiar link para abrir no celular no supermercado"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline text-emerald-400 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Link Celular</span>
              </>
            )}
          </button>

          {/* Dedicated Window / Popout */}
          {!isStandalone && (
            <button
              type="button"
              onClick={handleOpenStandaloneWindow}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-xs flex items-center gap-1"
              title="Abrir em Janela Dedicada / Popout (otimizada para celular)"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Janela Dedicada</span>
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-xs"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia Imersivo'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsAddingExtra(true)}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">+ Extra</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Fechar Modo Mercado"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 shrink-0">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/95 px-3 sm:px-4 py-2 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        {/* Category Pills Filter */}
        <div className="overflow-x-auto flex items-center gap-1.5 no-scrollbar py-0.5">
          <button
            onClick={() => setActiveCategoryFilter('Todas')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategoryFilter === 'Todas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas ({items.length})
          </button>
          {CATALOG_GROUPS.map((grp) => {
            const count = items.filter((i) => (i.categoryGroup || i.category) === grp).length;
            if (count === 0) return null;
            return (
              <button
                key={grp}
                onClick={() => setActiveCategoryFilter(grp)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategoryFilter === grp
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{grp}</span>
                <span className="text-[10px] opacity-80 bg-black/30 px-1.5 py-0.2 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[160px] sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar item na lista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Checklist Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-w-4xl w-full mx-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Nenhum item nesta seção.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleCheck(item)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                item.completed
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-300'
                  : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  {item.completed && <CheckCircle2 className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        item.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {item.product}
                    </span>
                    {item.isFromCestaBasica && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-950 border border-pink-800 text-pink-300 font-bold">
                        📦 Cesta Ellen
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                    {item.categoryGroup && (
                      <span>• <strong className="text-slate-300">{item.categoryGroup}</strong></span>
                    )}
                    {item.preferredStore && <span>• {item.preferredStore}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {item.actualPricePaid ? 'Preço pago:' : 'Estimado:'}
                  </span>
                  <span
                    className={`font-bold text-sm ${
                      item.actualPricePaid
                        ? 'text-emerald-400'
                        : item.completed
                        ? 'text-slate-300'
                        : 'text-slate-200'
                    }`}
                  >
                    {formatCurrency(item.actualPricePaid || item.estimatedPrice || 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditPromptItem({
                      id: item.id,
                      product: item.product,
                      quantity: item.quantity,
                      unit: item.unit || 'un',
                      currentPrice: item.actualPricePaid
                        ? String(item.actualPricePaid)
                        : item.estimatedPrice
                        ? String(item.estimatedPrice)
                        : '',
                    });
                  }}
                  className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Editar preço e quantidade deste item"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item);
                  }}
                  className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Remover produto da lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 sm:py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block text-[11px]">Itens no carrinho:</span>
              <strong className="text-white text-sm">
                {completedCount} de {items.length} itens
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Subtotal somado:</span>
              <strong className="text-emerald-400 text-sm">
                {formatCurrency(enteredSum)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsAddingExtra(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              <span>+ Item Não Listado</span>
            </button>
            <button
              onClick={handleOpenCheckout}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <span>🏁 Finalizar Compra no Caixa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Modal: Edit Item (Quantity & Price) */}
      {editPromptItem && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Editar Produto no Mercado</h4>
                <p className="text-xs text-emerald-400 font-semibold">{editPromptItem.product}</p>
              </div>
              <button
                onClick={handleSkipEditPrompt}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPrompt} className="space-y-3">
              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Quantidade (ex: 1, 0.5)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="1"
                    value={editPromptItem.quantity}
                    onChange={(e) =>
                      setEditPromptItem({ ...editPromptItem, quantity: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={editPromptItem.unit}
                    onChange={(e) =>
                      setEditPromptItem({ ...editPromptItem, unit: e.target.value })
                    }
                    placeholder="kg, un, pac"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Preço no Caixa / Etiqueta (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    placeholder="0,00"
                    value={editPromptItem.currentPrice}
                    onChange={(e) =>
                      setEditPromptItem({ ...editPromptItem, currentPrice: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aceita valores decimais (ex: 9.90 ou 14.50) com até 2 casas após a vírgula.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const item = items.find((i) => i.id === editPromptItem.id);
                    if (item) {
                      setItemToDelete(item);
                      setEditPromptItem(null);
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 p-1 hover:bg-red-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSkipEditPrompt}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-900/60 shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Remover Produto da Lista?</h4>
                <p className="text-xs text-slate-400 truncate max-w-[200px]">{itemToDelete.product}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja retirar <strong>{itemToDelete.product}</strong> ({itemToDelete.quantity} {itemToDelete.unit}) desta lista de compras?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = items.filter((i) => i.id !== itemToDelete.id);
                  setItems(updated);
                  onUpdateList(updated);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
              >
                Sim, Remover Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Modal: Add Extra Product on the fly */}
      {isAddingExtra && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between shrink-0">
              <div>
                <h4 className="text-sm font-bold text-white">Incluir Produto Extra no Carrinho</h4>
                <p className="text-xs text-slate-400">
                  Selecione do catálogo Carrefour ou digite o nome do item
                </p>
              </div>
              <button
                onClick={() => setIsAddingExtra(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 shrink-0">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Buscar ou Digitar Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Queijo, Iogurte, Frango, Maçã..."
                  value={extraSearch}
                  onChange={(e) => setExtraSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Quantidade (ex: 1, 0.5 kg)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={extraQty}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(',', '.'));
                      setExtraQty(isNaN(val) ? 1 : val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Preço Pago (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="R$ 0,00"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Quick Catalog Suggestions */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border-t border-slate-800 pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Sugestões do Catálogo:
              </span>
              {catalogSuggestions.map((catItem) => (
                <button
                  key={catItem.id}
                  type="button"
                  onClick={() =>
                    handleAddExtraProduct(
                      catItem.name,
                      catItem.category,
                      catItem.estimatedPrice,
                      catItem.defaultUnit
                    )
                  }
                  className="w-full text-left p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-700 border border-slate-700/60 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-semibold text-white">{catItem.name}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {catItem.categoryGroup} • {catItem.defaultUnit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(catItem.estimatedPrice)}
                    </span>
                  </div>
                </button>
              ))}

              {extraSearch.trim() && !catalogSuggestions.some((c) => c.name.toLowerCase() === extraSearch.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() =>
                    handleAddExtraProduct(extraSearch.trim(), 'Alimentos', Number(extraPrice) || 0, 'un')
                  }
                  className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center"
                >
                  + Adicionar "{extraSearch.trim()}" como item personalizado
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FINAL CHECKOUT CASHIER MODAL */}
      {isCheckoutStep && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-5 sm:p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-500" />
                  Fechamento da Compra no Caixa
                </h3>
                <p className="text-xs text-slate-400">
                  Preencha o total exato do cupom fiscal para registrar o gasto familiar
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutStep(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeCashier} className="space-y-4">
              {/* OBRIGATÓRIO: Total do Caixa */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/80 space-y-2">
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Valor Total Real no Caixa (R$) * (OBRIGATÓRIO)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-base font-bold text-emerald-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={cashierTotal}
                    onChange={(e) => {
                      setCashierTotal(e.target.value);
                      setCashierError('');
                    }}
                    className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl pl-10 pr-4 py-2 text-lg font-bold text-white focus:ring-2 focus:ring-emerald-400"
                    autoFocus
                  />
                </div>
                {cashierError && (
                  <p className="text-xs text-red-400 font-semibold">{cashierError}</p>
                )}
                <span className="text-[11px] text-slate-400 block">
                  Subtotal previsto/estimado somado: {formatCurrency(enteredSum)}
                </span>
              </div>

              {/* Estabelecimento & Pagador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supermercado
                  </label>
                  <select
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Carrefour">Carrefour</option>
                    <option value="Assaí">Assaí Atacadista</option>
                    <option value="Sonda">Sonda Supermercados</option>
                    <option value="Pão de Açúcar">Pão de Açúcar</option>
                    <option value="Feira Livre">Feira Livre / Hortifruti</option>
                    <option value="Outros">Outro Estabelecimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quem Pagou?
                  </label>
                  <select
                    value={payerPerson}
                    onChange={(e) => setPayerPerson(e.target.value as Person)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Família">Família (Geral)</option>
                    <option value="Ricardo">Ricardo (Semanal)</option>
                    <option value="Ellen">Ellen (Semanal / Mensal)</option>
                  </select>
                </div>
              </div>

              {/* Forma de Pagamento & Tipo de Compra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="debito">Cartão de Débito</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro Físico</option>
                    <option value="vale_alimentacao">Vale Alimentação (VA)</option>
                    <option value="vale_refeicao">Vale Refeição (VR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Competência / Tipo de Compra
                  </label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as any)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="semanal">Compra Semanal (Feira / Reposição)</option>
                    <option value="mensal">Abastecimento Mensal</option>
                    <option value="extraordinaria">Compra Extraordinária</option>
                  </select>
                </div>
              </div>

              {tripType === 'semanal' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Semana de Competência (Rolagem de Saldo)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 text-xs">
                    {[1, 2, 3, 4, 5].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeekNumber(w)}
                        className={`py-1.5 rounded-xl font-bold border transition-colors ${
                          weekNumber === w
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        Sem. {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Desconto / Economia App Meu Carrefour / CPF (R$ Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 14,50 de desconto obtido"
                  value={discountsSavings}
                  onChange={(e) => setDiscountsSavings(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCheckoutStep(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gravar Compra & Atualizar Transações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
