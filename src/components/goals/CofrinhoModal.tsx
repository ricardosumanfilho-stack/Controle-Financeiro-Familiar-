import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Person, CofrinhoYieldType } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { calculateMonthlyYieldDetails, calculateAnnualRate } from '../../utils/yieldCalculations';
import {
  PiggyBank,
  Plus,
  Minus,
  TrendingUp,
  ArrowRightLeft,
  Settings2,
  Sparkles,
  Info,
  RotateCcw,
  Calculator,
  Coins,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

interface CofrinhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCofrinhoId?: string;
  initialMode?: 'movement' | 'transfer' | 'edit';
}

const CASA_SUB_PURPOSES = [
  { id: 'manutencao_casa', label: 'Manutenção da Casa Atual' },
  { id: 'manutencao_carro', label: 'Manutenção do Carro' },
  { id: 'reforma', label: 'Reforma do Lar' },
  { id: 'compra_casa', label: 'Compra da Nova Casa' },
  { id: 'outro', label: 'Outro Objetivo Patrimonial' },
];

const LAZER_SUB_PURPOSES = [
  { id: 'passeios', label: 'Passeios & Fins de Semana' },
  { id: 'restaurantes', label: 'Restaurantes & Gastronomia' },
  { id: 'viagens', label: 'Viagens & Férias' },
  { id: 'compras', label: 'Compras Planejadas' },
  { id: 'entretenimento', label: 'Entretenimento & Shows' },
];

export const CofrinhoModal: React.FC<CofrinhoModalProps> = ({
  isOpen,
  onClose,
  defaultCofrinhoId = 'cof-reserva',
  initialMode = 'movement',
}) => {
  const {
    cofrinhos,
    cofrinhoMovements,
    addCofrinhoMovement,
    updateCofrinho,
    transferBetweenCofrinhos,
    globalCofrinhoSettings,
    selectedMonth,
    addTransaction,
    updateTransaction,
    setMonthlyAporteStatus,
    person1Name,
    person2Name,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const [activeTab, setActiveTab] = useState<'movement' | 'transfer' | 'edit'>(initialMode);
  const [cofrinhoId, setCofrinhoId] = useState<string>(defaultCofrinhoId);

  // Movement Form State
  const [movType, setMovType] = useState<'aporte' | 'retirada' | 'rendimento'>('aporte');
  const [amount, setAmount] = useState('500');
  const [person, setPerson] = useState<Person>(p1);
  const [date, setDate] = useState('');
  const [subPurpose, setSubPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Transfer Form State
  const [transferTargetId, setTransferTargetId] = useState('cof-casa');
  const [transferAmount, setTransferAmount] = useState('500');
  const [transferNotes, setTransferNotes] = useState('');

  // Edit Cofrinho Form State (including Direct Balance Configuration)
  const [editName, setEditName] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editResponsible, setEditResponsible] = useState<Person>(p1);
  const [editInstitution, setEditInstitution] = useState('');
  const [editApplicationType, setEditApplicationType] = useState('');
  const [editYieldType, setEditYieldType] = useState<CofrinhoYieldType>('cdi_100');
  const [editCdiPercentage, setEditCdiPercentage] = useState(100);
  const [editCustomAnnualRate, setEditCustomAnnualRate] = useState(10.5);
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editStatus, setEditStatus] = useState<'ativo' | 'encerrado'>('ativo');
  const [editNotes, setEditNotes] = useState('');

  // Balances
  const [editCurrentBalance, setEditCurrentBalance] = useState('0');
  const [editInitialBalance, setEditInitialBalance] = useState('0');
  const [editMonthlyYield, setEditMonthlyYield] = useState('0');
  const [editAccumulatedYield, setEditAccumulatedYield] = useState('0');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setCofrinhoId(defaultCofrinhoId || 'cof-reserva');
      setMovType('aporte');
      setAmount('500');
      setPerson('Família');
      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setNotes('');
      setTransferAmount('500');
      setTransferNotes('');
      setFeedbackMsg(null);

      const targetOther = cofrinhos.find((c) => c.id !== defaultCofrinhoId);
      if (targetOther) setTransferTargetId(targetOther.id);

      const targetCof = cofrinhos.find((c) => c.id === defaultCofrinhoId);
      if (targetCof) {
        populateEditForm(targetCof);
      }
    }
  }, [isOpen, defaultCofrinhoId, initialMode, selectedMonth]);

  const populateEditForm = (cof: any) => {
    setEditName(cof.name || '');
    setEditObjective(cof.objective || cof.description || '');
    setEditResponsible(cof.person || cof.responsiblePerson || 'Família');
    setEditInstitution(cof.institution || '');
    setEditApplicationType(cof.applicationType || '');
    setEditYieldType(cof.yieldType || 'cdi_100');
    setEditCdiPercentage(cof.cdiPercentage || 100);
    setEditCustomAnnualRate(cof.customAnnualRate || globalCofrinhoSettings.cdiAnnualRate);
    setEditTargetAmount(cof.targetAmount ? String(cof.targetAmount) : '');
    setEditTargetDate(cof.targetDate || '');
    setEditStatus(cof.status || 'ativo');
    setEditNotes(cof.notes || '');

    // Current & Initial Balances
    setEditCurrentBalance(cof.currentBalance !== undefined ? String(cof.currentBalance) : '0');
    setEditInitialBalance(cof.initialBalance !== undefined ? String(cof.initialBalance) : '0');
    setEditMonthlyYield(cof.monthlyYield !== undefined ? String(cof.monthlyYield) : '0');
    setEditAccumulatedYield(cof.accumulatedYield !== undefined ? String(cof.accumulatedYield) : '0');
  };

  const handleSelectCofrinho = (id: string) => {
    setCofrinhoId(id);
    const cof = cofrinhos.find((c) => c.id === id);
    if (cof) populateEditForm(cof);
    setFeedbackMsg(null);
  };

  // Helper Quick Balance Actions
  const handleSetBalanceZero = () => {
    setEditCurrentBalance('0');
    setFeedbackMsg('Saldo atual definido como R$ 0,00. Clique em "Salvar Alterações" para confirmar.');
  };

  const handleSetBalanceToInitial = () => {
    setEditCurrentBalance(editInitialBalance || '0');
    setFeedbackMsg(`Saldo atual igualado ao Saldo Inicial (${formatCurrency(parseFloat(editInitialBalance) || 0)}).`);
  };

  const handleCalculateBalanceFromMovements = () => {
    const movs = cofrinhoMovements.filter((m) => m.cofrinhoId === cofrinhoId);
    let calc = parseFloat(editInitialBalance.replace(',', '.')) || 0;
    let monthlyY = 0;
    let accY = 0;
    movs.forEach((m) => {
      if (m.type === 'aporte') {
        calc += m.amount;
      } else if (m.type === 'retirada') {
        calc = Math.max(0, calc - m.amount);
      } else if (m.type === 'rendimento') {
        calc += m.amount;
        accY += m.amount;
        if (m.date.startsWith(selectedMonth)) {
          monthlyY += m.amount;
        }
      }
    });
    setEditCurrentBalance(String(Math.round(calc * 100) / 100));
    setEditMonthlyYield(String(Math.round(monthlyY * 100) / 100));
    setEditAccumulatedYield(String(Math.round(accY * 100) / 100));
    setFeedbackMsg(`Saldo calculado com base em ${movs.length} movimentação(ões): ${formatCurrency(calc)}.`);
  };

  const selectedCofrinho = cofrinhos.find((c) => c.id === cofrinhoId) || cofrinhos[0];

  // Calculated Yield Preview
  const annualRate = calculateAnnualRate(
    globalCofrinhoSettings.cdiAnnualRate,
    selectedCofrinho?.yieldType || 'cdi_100',
    selectedCofrinho?.cdiPercentage || 100,
    selectedCofrinho?.customAnnualRate || 0
  );

  const previewYield = calculateMonthlyYieldDetails(
    selectedCofrinho?.currentBalance || 0,
    annualRate,
    movType === 'aporte' ? parseFloat(amount.replace(',', '.')) || 0 : 0,
    0,
    globalCofrinhoSettings.defaultIncomeTaxRate || 15
  );

  // Handlers
  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Informe um valor de movimentação válido.');
      return;
    }

    const movDate = date || new Date().toISOString().slice(0, 10);
    const cof = cofrinhos.find((c) => c.id === cofrinhoId);
    const finalNotes = notes.trim();

    if (movType === 'aporte' || movType === 'retirada') {
      const isAporte = movType === 'aporte';
      const defaultDesc = isAporte
        ? `Aporte - ${cof?.name || 'Cofrinho'}`
        : `Resgate - ${cof?.name || 'Cofrinho'}`;
      const finalDesc = finalNotes || defaultDesc;

      const createdTx = addTransaction({
        description: finalDesc,
        amount: numAmount,
        type: isAporte ? 'investimento' : 'receita',
        category: isAporte ? 'Investimentos' : 'Resgate Cofrinho',
        subcategory: cof?.name,
        person: person || (cof?.person !== 'Família' ? (cof?.person as any) : 'Família') || 'Ricardo',
        date: movDate,
        competenceMonth: movDate.slice(0, 7),
        paid: true,
        isRecurring: false,
        paymentMethod: 'transferencia',
        accountOrPot: cof?.name || 'Cofrinho',
        cofrinhoId,
        notes: finalNotes || undefined,
      });

      const createdMov = addCofrinhoMovement({
        cofrinhoId,
        type: movType,
        amount: numAmount,
        date: movDate,
        person,
        subPurpose: subPurpose || undefined,
        transactionId: createdTx.id,
        notes: finalNotes || undefined,
      });

      updateTransaction(createdTx.id, {
        cofrinhoMovementId: createdMov.id,
      });

      if (cofrinhoId === 'cof-reserva' && isAporte) {
        if (person === 'Ricardo' || person === 'Ellen') {
          setMonthlyAporteStatus(person, 'realizado');
        }
      }
    } else {
      // Rendimento
      addCofrinhoMovement({
        cofrinhoId,
        type: movType,
        amount: numAmount,
        date: movDate,
        person,
        subPurpose: subPurpose || undefined,
        notes: finalNotes || undefined,
      });
    }

    onClose();
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(transferAmount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Informe um valor de transferência válido.');
      return;
    }
    if (cofrinhoId === transferTargetId) {
      alert('Selecione um cofrinho de destino diferente da origem.');
      return;
    }

    transferBetweenCofrinhos(
      cofrinhoId,
      transferTargetId,
      numAmount,
      person,
      transferNotes.trim() || undefined,
      subPurpose || undefined
    );

    onClose();
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Informe o nome do cofrinho.');
      return;
    }

    const numCurrentBalance = parseFloat(editCurrentBalance.replace(',', '.'));
    const numInitialBalance = parseFloat(editInitialBalance.replace(',', '.'));
    const numMonthlyYield = parseFloat(editMonthlyYield.replace(',', '.'));
    const numAccumulatedYield = parseFloat(editAccumulatedYield.replace(',', '.'));

    updateCofrinho(cofrinhoId, {
      name: editName.trim(),
      objective: editObjective.trim(),
      person: editResponsible,
      institution: editInstitution.trim(),
      applicationType: editApplicationType.trim(),
      yieldType: editYieldType,
      cdiPercentage: Number(editCdiPercentage),
      customAnnualRate: Number(editCustomAnnualRate),
      targetAmount: editTargetAmount ? parseFloat(editTargetAmount.replace(',', '.')) : undefined,
      targetDate: editTargetDate || undefined,
      currentBalance: !isNaN(numCurrentBalance) ? Math.max(0, numCurrentBalance) : (selectedCofrinho?.currentBalance || 0),
      initialBalance: !isNaN(numInitialBalance) ? Math.max(0, numInitialBalance) : (selectedCofrinho?.initialBalance || 0),
      monthlyYield: !isNaN(numMonthlyYield) ? Math.max(0, numMonthlyYield) : (selectedCofrinho?.monthlyYield || 0),
      accumulatedYield: !isNaN(numAccumulatedYield) ? Math.max(0, numAccumulatedYield) : (selectedCofrinho?.accumulatedYield || 0),
      status: editStatus,
      notes: editNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestão de Cofrinhos & Reservas"
      subtitle={selectedCofrinho ? `${selectedCofrinho.name} — Saldo Atual: ${formatCurrency(selectedCofrinho.currentBalance)}` : 'Metas estruturadas'}
    >
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('movement')}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'movement'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aporte / Retirada</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfer')}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'transfer'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Transferência Interna</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'edit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Ajustar Saldo & Parâmetros</span>
        </button>
      </div>

      {/* Select active cofrinho */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
          {activeTab === 'transfer' ? 'Cofrinho de Origem (Sai do Saldo)' : 'Cofrinho Selecionado'}
        </label>
        <select
          value={cofrinhoId}
          onChange={(e) => handleSelectCofrinho(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
        >
          {cofrinhos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {formatCurrency(c.currentBalance)} ({c.applicationType || 'Investimento'})
            </option>
          ))}
        </select>
      </div>

      {/* TAB 1: MOVEMENT (APORTE / RETIRADA / RENDIMENTO) */}
      {activeTab === 'movement' && (
        <form onSubmit={handleSubmitMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMovType('aporte')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  movType === 'aporte'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Aporte (+)
              </button>
              <button
                type="button"
                onClick={() => setMovType('retirada')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  movType === 'retirada'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Retirada (-)
              </button>
              <button
                type="button"
                onClick={() => setMovType('rendimento')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  movType === 'rendimento'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Rendimento (%)
              </button>
            </div>
          </div>

          {/* Person */}
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
                    className={`py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
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

          {/* Sub-purpose for Casa or Lazer */}
          {(selectedCofrinho?.type === 'manutencao' || selectedCofrinho?.type === 'lazer') && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Finalidade / Categoria
              </label>
              <select
                value={subPurpose}
                onChange={(e) => setSubPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="">Geral / Padrão</option>
                {selectedCofrinho?.type === 'manutencao' &&
                  CASA_SUB_PURPOSES.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.label}
                    </option>
                  ))}
                {selectedCofrinho?.type === 'lazer' &&
                  LAZER_SUB_PURPOSES.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor (R$)
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Yield estimate preview */}
          {selectedCofrinho?.yieldType !== 'none' && (
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-600 dark:text-slate-300">
                  Rendimento Mensal Estimado ({annualRate.toFixed(2)}% a.a.):
                </span>
              </div>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                +{formatCurrency(previewYield.netYield)} / mês
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Aporte mensal complementar ou resgate para manutenção"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TRANSFER BETWEEN COFRINHOS */}
      {activeTab === 'transfer' && (
        <form onSubmit={handleSubmitTransfer} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            Exemplo: Transferir recursos acumulados em <strong>Casa & Manutenção</strong> para o cofrinho de <strong>Compra da Nova Casa</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Cofrinho de Destino (Entra no Saldo)
            </label>
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
            >
              {cofrinhos
                .filter((c) => c.id !== cofrinhoId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Saldo: {formatCurrency(c.currentBalance)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Valor a Transferir (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-medium text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedCofrinho?.currentBalance || 999999}
                required
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Saldo disponível na origem: {formatCurrency(selectedCofrinho?.currentBalance || 0)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Motivo / Observações da Transferência
            </label>
            <input
              type="text"
              placeholder="Ex: Realocação de sobras de manutenção para compra do imóvel"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Realizar Transferência</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: EDIT COFRINHO PARAMETERS & DIRECT BALANCE CALIBRATION */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          {/* Top Highlight: Direct Saldo Configuration & Calibration */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 via-emerald-50/40 to-white dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Configuração do Saldo Atual
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ajuste o valor real disponível para sincronizar com seu extrato ou recalibrar.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg">
                Patrimônio Real
              </span>
            </div>

            {/* Saldo Atual Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                Saldo Atual em Conta / Aplicação (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-bold text-indigo-600 dark:text-indigo-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  id="input-cofrinho-current-balance"
                  value={editCurrentBalance}
                  onChange={(e) => {
                    setEditCurrentBalance(e.target.value);
                    setFeedbackMsg(null);
                  }}
                  className="w-full pl-12 pr-3.5 py-2.5 text-lg bg-white dark:bg-slate-900 border-2 border-indigo-400 dark:border-indigo-600 rounded-xl focus:ring-2 focus:ring-indigo-500 font-black text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Quick Actions for Balance */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleSetBalanceZero}
                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Zerar Saldo (R$ 0,00)</span>
              </button>

              <button
                type="button"
                onClick={handleSetBalanceToInitial}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <Wallet className="w-3 h-3" />
                <span>Igualar ao Saldo Inicial</span>
              </button>

              <button
                type="button"
                onClick={handleCalculateBalanceFromMovements}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors flex items-center gap-1"
              >
                <Calculator className="w-3 h-3" />
                <span>Calcular pelas Movimentações</span>
              </button>
            </div>

            {/* Feedback Message */}
            {feedbackMsg && (
              <div className="p-2 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>

          {/* Additional Balance Details: Saldo Inicial & Rendimentos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Saldo Inicial Base (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editInitialBalance}
                onChange={(e) => setEditInitialBalance(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Saldo no início do plano</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Rendimento do Mês (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editMonthlyYield}
                onChange={(e) => setEditMonthlyYield(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Rendimento líquido do mês</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Rendimento Acumulado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editAccumulatedYield}
                onChange={(e) => setEditAccumulatedYield(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Total histórico recebido</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nome do Cofrinho
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <select
                value={editResponsible}
                onChange={(e) => setEditResponsible(e.target.value as Person)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value={p1}>{p1}</option>
                <option value={p2}>{p2}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Objetivo / Descrição
            </label>
            <input
              type="text"
              value={editObjective}
              onChange={(e) => setEditObjective(e.target.value)}
              placeholder="Ex: Aquisição da casa própria após cumprimento do ciclo de locação"
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Instituição Financeira
              </label>
              <input
                type="text"
                value={editInstitution}
                onChange={(e) => setEditInstitution(e.target.value)}
                placeholder="Ex: Tesouro Direto, Nubank, Itaú, XP"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tipo de Aplicação
              </label>
              <input
                type="text"
                value={editApplicationType}
                onChange={(e) => setEditApplicationType(e.target.value)}
                placeholder="Ex: CDB Liquidez Diária, LCI 95% CDI, Tesouro Selic"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Yield Options */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Regra de Rendimento
              </label>
              <select
                value={editYieldType}
                onChange={(e) => setEditYieldType(e.target.value as CofrinhoYieldType)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
              >
                <option value="cdi_100">100% do CDI (Padrão Tesouro Selic / CDB)</option>
                <option value="cdi_custom">Outro % do CDI (Ex: 110% CDI ou 95% CDI LCI)</option>
                <option value="fixed_annual">Taxa Anual Fixa (Ex: 11.5% ao ano)</option>
                <option value="manual">Rendimento Informado Manualmente</option>
                <option value="none">Sem Rendimento (Conta Corrente / Espécie)</option>
              </select>
            </div>

            {editYieldType === 'cdi_custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Percentual do CDI (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={editCdiPercentage}
                  onChange={(e) => setEditCdiPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            )}

            {editYieldType === 'fixed_annual' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Taxa Anual Fixa (% ao ano)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editCustomAnnualRate}
                  onChange={(e) => setEditCustomAnnualRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Meta Financeira Alvo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={editTargetAmount}
                onChange={(e) => setEditTargetAmount(e.target.value)}
                placeholder="Ex: 80000"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data Desejada / Prazo Alvo
              </label>
              <input
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
