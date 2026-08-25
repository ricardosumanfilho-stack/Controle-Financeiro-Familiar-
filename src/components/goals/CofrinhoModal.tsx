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
    addCofrinhoMovement,
    updateCofrinho,
    transferBetweenCofrinhos,
    globalCofrinhoSettings,
    selectedMonth,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'movement' | 'transfer' | 'edit'>(initialMode);
  const [cofrinhoId, setCofrinhoId] = useState<string>(defaultCofrinhoId);

  // Movement Form State
  const [movType, setMovType] = useState<'aporte' | 'retirada' | 'rendimento'>('aporte');
  const [amount, setAmount] = useState('500');
  const [person, setPerson] = useState<Person>('Família');
  const [date, setDate] = useState('');
  const [subPurpose, setSubPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Transfer Form State
  const [transferTargetId, setTransferTargetId] = useState('cof-casa');
  const [transferAmount, setTransferAmount] = useState('500');
  const [transferNotes, setTransferNotes] = useState('');

  // Edit Cofrinho Form State
  const [editName, setEditName] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editResponsible, setEditResponsible] = useState<Person>('Família');
  const [editInstitution, setEditInstitution] = useState('');
  const [editApplicationType, setEditApplicationType] = useState('');
  const [editYieldType, setEditYieldType] = useState<CofrinhoYieldType>('cdi_100');
  const [editCdiPercentage, setEditCdiPercentage] = useState(100);
  const [editCustomAnnualRate, setEditCustomAnnualRate] = useState(10.5);
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editStatus, setEditStatus] = useState<'ativo' | 'encerrado'>('ativo');
  const [editNotes, setEditNotes] = useState('');

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
    setEditResponsible(cof.responsiblePerson || 'Família');
    setEditInstitution(cof.institution || '');
    setEditApplicationType(cof.applicationType || '');
    setEditYieldType(cof.yieldType || 'cdi_100');
    setEditCdiPercentage(cof.cdiPercentage || 100);
    setEditCustomAnnualRate(cof.customAnnualRate || globalCofrinhoSettings.cdiAnnualRate);
    setEditTargetAmount(cof.targetAmount ? String(cof.targetAmount) : '');
    setEditTargetDate(cof.targetDate || '');
    setEditStatus(cof.status || 'ativo');
    setEditNotes(cof.notes || '');
  };

  const handleSelectCofrinho = (id: string) => {
    setCofrinhoId(id);
    const cof = cofrinhos.find((c) => c.id === id);
    if (cof) populateEditForm(cof);
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

    addCofrinhoMovement({
      cofrinhoId,
      type: movType,
      amount: numAmount,
      date: date || new Date().toISOString().slice(0, 10),
      person,
      subPurpose: subPurpose || undefined,
      notes: notes.trim() || undefined,
    });

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
      subtitle={selectedCofrinho ? `${selectedCofrinho.name} — Saldo: ${formatCurrency(selectedCofrinho.currentBalance)}` : 'Metas estruturadas'}
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
          <span>Configurar Parâmetros</span>
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
            <div className="grid grid-cols-3 gap-2">
              {(['Família', 'Ricardo', 'Ellen'] as Person[]).map((p) => {
                const active = person === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPerson(p)}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
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

      {/* TAB 3: EDIT COFRINHO PARAMETERS */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSubmitEdit} className="space-y-4">
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
                <option value="Família">Família (Ambos)</option>
                <option value="Ricardo">Ricardo</option>
                <option value="Ellen">Ellen</option>
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
