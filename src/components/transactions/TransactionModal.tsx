import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Person, TransactionType, PaymentMethod, Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  ArrowLeftRight,
  PlusCircle,
  CreditCard as CardIcon,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatMonthYearBR,
  calculateCardCompetenceMonth,
} from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const DEFAULT_CATEGORIES_DESPESA = [
  'Habitação',
  'Supermercado',
  'Alimentação & Delivery',
  'Transporte',
  'Saúde & Farmácia',
  'Educação',
  'Lazer & Passeios',
  'Assinaturas & Serviços',
  'Cartão de Crédito',
  'Casa & Utilidades',
  'Cofrinho Reforma',
  'Cofrinho Manutenção',
  'Cofrinho Lazer',
  'Reserva de Emergência',
  'Outros',
];

const DEFAULT_CATEGORIES_RECEITA = [
  'Salário (Pagamento Principal)',
  'Adiantamento Salarial (Dia 15)',
  'Bolsa Estágio',
  'Renda Extra',
  'Renda Extraordinária (13º/Bônus/Férias)',
  'Rendimento de Investimento',
  'Venda de Bens',
  'Outros',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteInstallmentPurchase,
    deleteInstallmentFromMonth,
    updateInstallmentPurchase,
    addInstallmentPurchase,
    installmentPurchases,
    cards,
    cofrinhos,
    addCofrinhoMovement,
    addInvestmentContribution,
    addEmergencyContribution,
    setMonthlyAporteStatus,
    selectedMonth,
    setSelectedMonth,
    person1Name,
    person2Name,
    customCategories,
    addCustomCategory,
    transactions,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('despesa');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<string>('');
  const [selectedCofrinhoTarget, setSelectedCofrinhoTarget] = useState<string>('cof-reserva');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [person, setPerson] = useState<Person>(person1Name || 'Ricardo');
  const [date, setDate] = useState('');
  const [competenceMonth, setCompetenceMonth] = useState(selectedMonth);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardId, setCardId] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [accountOrPot, setAccountOrPot] = useState('Conta Corrente Principal');
  const [paid, setPaid] = useState(true);
  const [isRecurring, setIsRecurring] = useState(true);
  const [isExtraIncome, setIsExtraIncome] = useState(false);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Delete confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInstallmentMode, setDeleteInstallmentMode] = useState<'subsequent' | 'all' | 'single'>('subsequent');

  // Assemble unique category lists
  const availableCategories = useMemo(() => {
    const defaultList =
      type === 'despesa'
        ? DEFAULT_CATEGORIES_DESPESA
        : type === 'receita'
        ? DEFAULT_CATEGORIES_RECEITA
        : type === 'investimento'
        ? ['Reserva de Emergência', 'Investimentos Gerais', 'Tesouro Direto', 'CDB / Renda Fixa']
        : ['Transferência Interna', 'Transferência Cofrinho', 'Ajuste de Saldo'];

    const userCreatedList = customCategories[type === 'receita' ? 'receita' : 'despesa'] || [];
    
    // Also include any unique categories already stored in transactions of this type
    const fromExistingTx = transactions
      .filter((t) => t.type === type && t.category)
      .map((t) => t.category);

    const merged = Array.from(new Set([...defaultList, ...userCreatedList, ...fromExistingTx])).filter(Boolean);
    return merged;
  }, [type, customCategories, transactions]);

  const accountsAndPots = useMemo(() => {
    return [
      'Conta Corrente Principal',
      `Conta ${person1Name || 'Ricardo'}`,
      `Conta ${person2Name || 'Ellen'}`,
      'Reserva de Emergência (Ricardo & Ellen)',
      'Fundo Compra da Casa Nova',
      'Cofrinho Lazer e Viagens',
      'Cartão de Crédito',
      'Dinheiro / Carteira',
    ];
  }, [person1Name, person2Name]);

  const selectedCard = useMemo(() => {
    return cards.find((c) => c.id === cardId) || cards[0];
  }, [cards, cardId]);

  // Smart computed invoice month for credit purchases
  const computedInvoiceMonth = useMemo(() => {
    if (paymentMethod === 'credito' && selectedCard && date) {
      return calculateCardCompetenceMonth(date, selectedCard.closingDay);
    }
    return competenceMonth || date.slice(0, 7) || selectedMonth;
  }, [paymentMethod, selectedCard, date, competenceMonth, selectedMonth]);

  useEffect(() => {
    setValidationError(null);
    if (editingTransaction) {
      setType(editingTransaction.type);

      // Check if this transaction is part of an installment purchase
      const instPurchase = editingTransaction.installmentInfo?.purchaseId
        ? installmentPurchases.find((p) => p.id === editingTransaction.installmentInfo?.purchaseId)
        : undefined;

      if (instPurchase) {
        // Strip "(Parc. X/Y)" suffix if present to show clean description
        const cleanDesc = instPurchase.description || editingTransaction.description.replace(/\s*\(Parc\.\s*\d+\/\d+\)/i, '').replace(/\s*\(\d+\/\d+\)/i, '').trim();
        setDescription(cleanDesc);
        setAmount(String(instPurchase.totalAmount));
        setInstallments(instPurchase.totalInstallments);
        setCardId(instPurchase.cardId || editingTransaction.cardId || cards[0]?.id || '');
      } else if (editingTransaction.installmentInfo?.total && editingTransaction.installmentInfo.total > 1) {
        const cleanDesc = editingTransaction.description.replace(/\s*\(Parc\.\s*\d+\/\d+\)/i, '').replace(/\s*\(\d+\/\d+\)/i, '').trim();
        setDescription(cleanDesc);
        setAmount(String(editingTransaction.amount * editingTransaction.installmentInfo.total));
        setInstallments(editingTransaction.installmentInfo.total);
        setCardId(editingTransaction.cardId || cards[0]?.id || '');
      } else {
        setDescription(editingTransaction.description);
        setAmount(String(editingTransaction.amount));
        setInstallments(1);
        setCardId(editingTransaction.cardId || cards[0]?.id || '');
      }

      setPerson(editingTransaction.person === 'Família' ? (person1Name || 'Ricardo') : editingTransaction.person);
      setSelectedCategoryOption(editingTransaction.category);
      setIsCreatingNewCategory(false);
      setNewCategoryName('');
      setDate(editingTransaction.date);
      setCompetenceMonth(editingTransaction.competenceMonth || editingTransaction.date.slice(0, 7) || selectedMonth);
      setPaymentMethod(editingTransaction.paymentMethod);
      setAccountOrPot(editingTransaction.accountOrPot || 'Conta Corrente Principal');
      setPaid(editingTransaction.paid);
      setIsRecurring(editingTransaction.isRecurring ?? true);
      setIsExtraIncome(editingTransaction.isReimbursable ?? false);
      setNotes(editingTransaction.notes || '');
    } else {
      // Defaults for new entry
      setType('despesa');
      const defaultCat = 'Habitação';
      setSelectedCategoryOption(defaultCat);
      setIsCreatingNewCategory(false);
      setNewCategoryName('');
      setDescription(defaultCat);
      setAmount('');
      setPerson(person1Name || 'Ricardo');
      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setCompetenceMonth(selectedMonth);
      setPaymentMethod('pix');
      setCardId(cards[0]?.id || '');
      setInstallments(1);
      setAccountOrPot('Conta Corrente Principal');
      setPaid(true);
      setIsRecurring(true);
      setIsExtraIncome(false);
      setNotes('');
    }
  }, [editingTransaction, isOpen, selectedMonth, cards, person1Name, person2Name, installmentPurchases]);

  // When card or date changes on a credit purchase, synchronize competenceMonth
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (paymentMethod === 'credito' && selectedCard && newDate) {
      setCompetenceMonth(calculateCardCompetenceMonth(newDate, selectedCard.closingDay));
    } else if (newDate) {
      setCompetenceMonth(newDate.slice(0, 7));
    }
  };

  const handleCardChange = (newCardId: string) => {
    setCardId(newCardId);
    const card = cards.find((c) => c.id === newCardId);
    if (paymentMethod === 'credito' && card && date) {
      setCompetenceMonth(calculateCardCompetenceMonth(date, card.closingDay));
    }
  };

  const handlePaymentMethodChange = (newMethod: PaymentMethod) => {
    setPaymentMethod(newMethod);
    if (newMethod === 'credito') {
      const card = cards.find((c) => c.id === cardId) || cards[0];
      if (card) {
        if (!cardId) setCardId(card.id);
        if (date) {
          setCompetenceMonth(calculateCardCompetenceMonth(date, card.closingDay));
        }
      }
    } else {
      setInstallments(1);
      if (date) {
        setCompetenceMonth(date.slice(0, 7));
      }
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    const defaultForType =
      newType === 'despesa'
        ? 'Habitação'
        : newType === 'receita'
        ? 'Salário (Pagamento Principal)'
        : newType === 'investimento'
        ? 'Reserva de Emergência'
        : 'Transferência Interna';

    setSelectedCategoryOption(defaultForType);
    setDescription(defaultForType);
    if (newType !== 'despesa') {
      setPaymentMethod('pix');
      setInstallments(1);
    }
  };

  const handleCategorySelectChange = (value: string) => {
    if (value === '__NEW_CATEGORY__') {
      setIsCreatingNewCategory(true);
      setSelectedCategoryOption('__NEW_CATEGORY__');
      setNewCategoryName('');
      setDescription('');
    } else {
      setIsCreatingNewCategory(false);
      setSelectedCategoryOption(value);
      setDescription(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Por favor, insira um valor válido maior que zero.');
      return;
    }

    let finalCategory = selectedCategoryOption;
    if (isCreatingNewCategory) {
      finalCategory = newCategoryName.trim();
      if (!finalCategory) {
        setValidationError('Por favor, informe o nome da nova categoria.');
        return;
      }
      addCustomCategory(type === 'receita' ? 'receita' : 'despesa', finalCategory);
    }

    if (!finalCategory) {
      setValidationError('Por favor, selecione ou crie uma categoria.');
      return;
    }

    const finalDescription = description.trim() || finalCategory;

    // Integrated Installment Purchase on Credit Card (Creation or Edition to multiple installments)
    if (type === 'despesa' && paymentMethod === 'credito' && installments > 1) {
      if (!cardId && cards.length > 0) {
        setCardId(cards[0].id);
      }
      const activeCard = cards.find((c) => c.id === (cardId || cards[0]?.id));
      const startingInvoiceMonth = calculateCardCompetenceMonth(
        date || new Date().toISOString().slice(0, 10),
        activeCard?.closingDay
      );

      const instAmount = Number((numAmount / installments).toFixed(2));

      // If we are editing: remove previous single transaction or previous installment purchase
      if (editingTransaction) {
        if (editingTransaction.installmentInfo?.purchaseId) {
          deleteInstallmentPurchase(editingTransaction.installmentInfo.purchaseId);
        } else {
          deleteTransaction(editingTransaction.id);
        }
      }

      addInstallmentPurchase({
        description: finalDescription,
        totalAmount: numAmount,
        installmentAmount: instAmount,
        totalInstallments: installments,
        remainingInstallments: installments,
        currentInstallment: 1,
        firstInstallmentMonth: startingInvoiceMonth,
        firstDueDate: startingInvoiceMonth,
        purchaseDate: date || new Date().toISOString().slice(0, 10),
        cardId: activeCard?.id || cardId,
        person: person || person1Name || 'Ricardo',
        category: finalCategory,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString().slice(0, 10),
      });

      if (startingInvoiceMonth && startingInvoiceMonth !== selectedMonth) {
        setSelectedMonth(startingInvoiceMonth);
      }

      onClose();
      return;
    }

    const finalCompetence =
      paymentMethod === 'credito' && selectedCard
        ? calculateCardCompetenceMonth(date, selectedCard.closingDay)
        : competenceMonth || date.slice(0, 7) || selectedMonth;

    const payload = {
      description: finalDescription,
      amount: numAmount,
      type,
      category: type === 'investimento' ? 'Investimentos' : finalCategory,
      person: person || person1Name || 'Ricardo',
      date: date || new Date().toISOString().slice(0, 10),
      competenceMonth: finalCompetence,
      paid: true,
      isRecurring,
      isReimbursable: isExtraIncome,
      paymentMethod,
      cardId: paymentMethod === 'credito' ? cardId || cards[0]?.id : undefined,
      accountOrPot: type === 'investimento' ? (accountOrPot || finalCategory) : accountOrPot,
      notes: notes.trim() || undefined,
    };

    // Automatic Synchronization with Cofrinhos & Metas when creating investment
    if (type === 'investimento' && !editingTransaction) {
      const targetCof = cofrinhos.find(
        (c) =>
          c.id === selectedCofrinhoTarget ||
          c.name.toLowerCase() === finalCategory.toLowerCase() ||
          c.name.toLowerCase() === finalDescription.toLowerCase() ||
          c.name.toLowerCase() === accountOrPot.toLowerCase()
      );

      const targetCofId =
        targetCof?.id ||
        (selectedCofrinhoTarget !== 'tesouro' &&
        selectedCofrinhoTarget !== 'cdb' &&
        selectedCofrinhoTarget !== 'acoes' &&
        selectedCofrinhoTarget !== 'geral'
          ? selectedCofrinhoTarget
          : undefined);

      const createdTx = addTransaction({
        ...payload,
        cofrinhoId: targetCofId,
      });

      if (targetCof) {
        const createdMov = addCofrinhoMovement({
          cofrinhoId: targetCof.id,
          date: payload.date,
          type: 'aporte',
          amount: numAmount,
          person: payload.person,
          transactionId: createdTx.id,
          notes: notes.trim() || `Aporte registrado via Novo Lançamento: ${finalDescription}`,
        });

        updateTransaction(createdTx.id, {
          cofrinhoMovementId: createdMov.id,
          cofrinhoId: targetCof.id,
        });

        if (targetCof.id === 'cof-reserva' || targetCof.type === 'reserva') {
          addEmergencyContribution({
            person: payload.person,
            amount: numAmount,
            date: payload.date,
            institution: targetCof.institution || 'Reserva de Emergência',
            transactionId: createdTx.id,
            cofrinhoMovementId: createdMov.id,
            notes: notes.trim() || undefined,
          });
          setMonthlyAporteStatus(
            payload.person === 'Ricardo' ? 'Ricardo' : 'Ellen',
            'realizado'
          );
        }
      } else {
        addInvestmentContribution({
          person: payload.person,
          amount: numAmount,
          date: payload.date,
          targetAsset: finalDescription,
          transactionId: createdTx.id,
          notes: notes.trim() || undefined,
          status: 'realizado',
        });
      }

      const targetMonth = payload.date ? payload.date.slice(0, 7) : selectedMonth;
      if (targetMonth && targetMonth !== selectedMonth) {
        setSelectedMonth(targetMonth);
      }
      onClose();
      return;
    }

    if (editingTransaction) {
      if (editingTransaction.installmentInfo?.purchaseId) {
        // Was an installment purchase, now converted to single 1x transaction
        deleteInstallmentPurchase(editingTransaction.installmentInfo.purchaseId);
        addTransaction(payload);
      } else {
        updateTransaction(editingTransaction.id, payload);
      }
    } else {
      addTransaction(payload);
      const targetMonth = payload.date ? payload.date.slice(0, 7) : selectedMonth;
      if (targetMonth && targetMonth !== selectedMonth) {
        setSelectedMonth(targetMonth);
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!editingTransaction) return;

    if (editingTransaction.installmentInfo?.purchaseId) {
      if (deleteInstallmentMode === 'subsequent') {
        deleteInstallmentFromMonth(
          editingTransaction.installmentInfo.purchaseId,
          editingTransaction.installmentInfo.current || 1
        );
      } else if (deleteInstallmentMode === 'all') {
        deleteInstallmentPurchase(editingTransaction.installmentInfo.purchaseId);
      } else {
        deleteTransaction(editingTransaction.id);
      }
    } else {
      deleteTransaction(editingTransaction.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const purchaseDay = date ? parseInt(date.slice(8, 10), 10) : 0;
  const isPostClosing = selectedCard && purchaseDay >= selectedCard.closingDay;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
        subtitle="Cadastre receitas, despesas, parcelamentos ou transferências"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Tipo: Despesa vs Receita vs Investimento vs Transferência */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              type="button"
              id="type-despesa-btn"
              onClick={() => handleTypeChange('despesa')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
                type === 'despesa'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
            </button>

            <button
              type="button"
              id="type-receita-btn"
              onClick={() => handleTypeChange('receita')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Receita
            </button>

            <button
              type="button"
              id="type-investimento-btn"
              onClick={() => handleTypeChange('investimento')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
                type === 'investimento'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" /> Investimento
            </button>

            <button
              type="button"
              id="type-transferencia-btn"
              onClick={() => handleTypeChange('transferencia')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all ${
                type === 'transferencia'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transf.
            </button>
          </div>

          {/* Seleção de Categoria (com opção Criar Nova como 1ª opção) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            {type === 'investimento' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Destino do Aporte (Metas & Cofrinhos)
                </label>
                <select
                  value={selectedCofrinhoTarget}
                  onChange={(e) => {
                    setSelectedCofrinhoTarget(e.target.value);
                    const cof = cofrinhos.find((c) => c.id === e.target.value);
                    if (cof) {
                      setDescription(cof.name);
                      setSelectedCategoryOption(cof.name);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-blue-950 dark:text-blue-100"
                >
                  <optgroup label="Cofrinhos & Metas Ativas">
                    {cofrinhos.map((cof) => (
                      <option key={cof.id} value={cof.id}>
                        🐷 {cof.name} (Saldo: R$ {cof.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Outros Investimentos / Ativos">
                    <option value="tesouro">📈 Tesouro Direto / Selic</option>
                    <option value="cdb">🏦 CDB / Renda Fixa</option>
                    <option value="acoes">📊 Ações / FIIs</option>
                    <option value="geral">💼 Investimento Geral</option>
                  </optgroup>
                </select>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  ✨ Este lançamento atualizará automaticamente o saldo do cofrinho e será contabilizado na aba Metas e Cofrinhos.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Categoria do Lançamento</span>
                <span className="text-[11px] font-normal text-slate-400">
                  Selecione uma existente ou crie uma nova
                </span>
              </label>
              <select
                id="tx-category-select"
                value={isCreatingNewCategory ? '__NEW_CATEGORY__' : selectedCategoryOption}
                onChange={(e) => handleCategorySelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-medium"
              >
                <option value="__NEW_CATEGORY__" className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50">
                  ➕ + Criar nova categoria...
                </option>
                <option disabled>────────── Categorias Existentes ──────────</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo de Nova Categoria quando selecionado */}
            {isCreatingNewCategory && (
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-2 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Nome da Nova Categoria
                </label>
                <input
                  type="text"
                  id="tx-new-category-input"
                  required
                  placeholder="Ex: Reforma do Banheiro, Freela Design, Combustível..."
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setDescription(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
                  autoFocus
                />
              </div>
            )}

            {/* Descrição Detalhada & Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Descrição do Lançamento
                </label>
                <input
                  type="text"
                  id="tx-description-input"
                  required
                  placeholder="Ex: Aluguel, Supermercado Assaí, Notebook..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {installments > 1 && paymentMethod === 'credito'
                    ? 'Valor Total da Compra (R$)'
                    : 'Valor (R$)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    id="tx-amount-input"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Responsável pelo Lançamento</span>
              <span className="text-[11px] font-normal text-slate-400">
                Personalizável nas Configurações
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[person1Name || 'Ricardo', person2Name || 'Ellen'].map((pName, idx) => {
                const active = person === pName || (idx === 0 && person !== person2Name && person !== (person2Name || 'Ellen'));
                return (
                  <button
                    type="button"
                    key={pName}
                    id={`person-select-${idx}`}
                    onClick={() => setPerson(pName)}
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                      active
                        ? idx === 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : idx === 0 ? 'bg-blue-500' : 'bg-rose-500'}`} />
                    {pName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conta/Cofrinho e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Conta / Origem
              </label>
              <select
                id="tx-account-select"
                value={accountOrPot}
                onChange={(e) => setAccountOrPot(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                {accountsAndPots.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                id="tx-date-input"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                id="tx-payment-method-select"
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              >
                <option value="pix">PIX</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="debito">Cartão de Débito</option>
                <option value="transferencia">Transferência / TED</option>
                <option value="boleto">Boleto</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mês de Competência
              </label>
              <input
                type="month"
                id="tx-competence-input"
                required
                value={computedInvoiceMonth}
                onChange={(e) => setCompetenceMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          {/* CARTÃO DE CRÉDITO & PARCELAMENTO INTEGRADO */}
          {paymentMethod === 'credito' && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/70 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                <CardIcon className="w-4 h-4" />
                <span>Configurações do Cartão & Parcelas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qual Cartão?
                  </label>
                  <select
                    id="tx-card-select"
                    value={cardId || cards[0]?.id}
                    onChange={(e) => handleCardChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-semibold"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.person} - Fecha dia {c.closingDay})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade de Parcelas
                  </label>
                  <select
                    id="tx-installments-select"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-bold text-purple-700 dark:text-purple-300"
                  >
                    <option value={1}>1x à vista ({formatCurrency(parsedAmount)})</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => {
                      const parcelVal = parsedAmount > 0 ? parsedAmount / n : 0;
                      return (
                        <option key={n} value={n}>
                          {n}x de {formatCurrency(parcelVal)} / mês
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Informative Closing Date Alert */}
              {selectedCard && date && (
                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-purple-200 dark:border-purple-800/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> 1ª Fatura: {formatMonthYearBR(computedInvoiceMonth)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Fechamento dia {selectedCard.closingDay} • Vencimento dia {selectedCard.dueDay}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isPostClosing ? (
                      <span className="text-amber-700 dark:text-amber-300 font-medium">
                        ✨ Compra realizada no dia <strong>{purchaseDay}</strong> (após o fechamento dia {selectedCard.closingDay}). Por isso cairá na fatura seguinte de <strong>{formatMonthYearBR(computedInvoiceMonth)}</strong>.
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        ✓ Compra realizada no dia <strong>{purchaseDay}</strong> (antes do fechamento dia {selectedCard.closingDay}). Cairá na fatura de <strong>{formatMonthYearBR(computedInvoiceMonth)}</strong>.
                      </span>
                    )}
                  </p>

                  {installments > 1 && (
                    <div className="pt-1.5 border-t border-purple-100 dark:border-purple-900/60 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                      <span>Projeção de {installments} parcelas automáticas</span>
                      <span>{installments}x de {formatCurrency(parsedAmount / installments)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Classificação para Receita */}
          {type === 'receita' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tx-recurring-checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                />
                <label htmlFor="tx-recurring-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                  Renda Salarial Recorrente
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tx-reimbursable-checkbox"
                  checked={isExtraIncome}
                  onChange={(e) => setIsExtraIncome(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                />
                <label htmlFor="tx-reimbursable-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                  Renda Extra (Freelas, bônus)
                </label>
              </div>
            </div>
          )}

          {/* Status de Pagamento */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="tx-paid-checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
            />
            <label htmlFor="tx-paid-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              {type === 'despesa'
                ? 'Despesa já liquidada / paga'
                : type === 'receita'
                ? 'Receita já creditada na conta'
                : 'Operação já confirmada'}
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              id="tx-notes-input"
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Modal Footer & Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              {editingTransaction && (
                <button
                  type="button"
                  id="tx-delete-modal-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Lançamento</span>
                </button>
              )}
            </div>

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
                id="tx-submit-btn"
                className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
              >
                {editingTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Excluir Lançamento"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-slate-100">
                  Deseja excluir "{editingTransaction?.description}"?
                </p>
                <p>Valor: {formatCurrency(editingTransaction?.amount || 0)}</p>
              </div>
            </div>

            {editingTransaction?.installmentInfo?.purchaseId && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2.5 text-xs">
                <p className="font-semibold text-purple-300">
                  Este lançamento é a parcela {editingTransaction.installmentInfo.current}/{editingTransaction.installmentInfo.total} de uma compra parcelada.
                </p>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteInstallmentOption"
                      checked={deleteInstallmentMode === 'subsequent'}
                      onChange={() => setDeleteInstallmentMode('subsequent')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="font-semibold block text-slate-100">Excluir desta parcela em diante (meses subsequentes)</span>
                      <span className="text-[11px] text-slate-400">Remove da parcela {editingTransaction.installmentInfo.current} até a {editingTransaction.installmentInfo.total}</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteInstallmentOption"
                      checked={deleteInstallmentMode === 'all'}
                      onChange={() => setDeleteInstallmentMode('all')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="font-semibold block text-slate-100">Excluir todas as parcelas ({editingTransaction.installmentInfo.total})</span>
                      <span className="text-[11px] text-slate-400">Remove o parcelamento completo de todos os meses</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteInstallmentOption"
                      checked={deleteInstallmentMode === 'single'}
                      onChange={() => setDeleteInstallmentMode('single')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="font-medium block text-slate-300">Excluir somente esta parcela isolada</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
