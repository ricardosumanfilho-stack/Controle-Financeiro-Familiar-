import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearBR,
  getPersonBadgeColor,
} from '../../utils/formatters';
import {
  calculateAnnualRate,
  calculateMonthlyYieldDetails,
  calculateCompoundInterestProjection,
} from '../../utils/yieldCalculations';
import {
  Target,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Settings,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight,
  Home,
  Wrench,
  Palmtree,
  Calendar,
  Hammer,
  PiggyBank,
  ArrowDownRight,
  ArrowRightLeft,
  Settings2,
  Percent,
  Calculator,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Person, CofrinhoYieldType, MonthlyAporteStatus } from '../../types';
import { CofrinhoModal } from './CofrinhoModal';
import { ExtraordinaryIncomeModal } from './ExtraordinaryIncomeModal';

interface GoalsViewProps {
  onOpenNewInvestment: (person?: 'Ricardo' | 'Ellen') => void;
  onOpenNewEmergency: () => void;
  onOpenEmergencySettings: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  onOpenNewInvestment,
  onOpenNewEmergency,
  onOpenEmergencySettings,
}) => {
  const {
    investmentContributions,
    emergencyContributions,
    emergencySettings,
    totalEmergencyFund,
    selectedMonth,
    deleteInvestmentContribution,
    deleteEmergencyContribution,
    cofrinhos,
    cofrinhoMovements,
    deleteCofrinhoMovement,
    currentMonthSummary,
    globalCofrinhoSettings,
    updateGlobalCofrinhoSettings,
    applyMonthlyYieldToAllCofrinhos,
    setMonthlyAporteStatus,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'cofrinhos' | 'emergency' | 'extraordinary'>('cofrinhos');
  const [isCofrinhoModalOpen, setIsCofrinhoModalOpen] = useState(false);
  const [selectedCofrinhoIdForModal, setSelectedCofrinhoIdForModal] = useState<string>('cof-reserva');
  const [cofrinhoModalInitialMode, setCofrinhoModalInitialMode] = useState<'movement' | 'transfer' | 'edit'>('movement');
  const [isExtraordinaryModalOpen, setIsExtraordinaryModalOpen] = useState(false);
  const [isCdiSettingsOpen, setIsCdiSettingsOpen] = useState(false);
  const [tempCdiRate, setTempCdiRate] = useState(globalCofrinhoSettings.cdiAnnualRate);
  const [appliedYieldSuccess, setAppliedYieldSuccess] = useState(false);

  const handleOpenCofrinhoModal = (id: string = 'cof-reserva', mode: 'movement' | 'transfer' | 'edit' = 'movement') => {
    setSelectedCofrinhoIdForModal(id);
    setCofrinhoModalInitialMode(mode);
    setIsCofrinhoModalOpen(true);
  };

  const handleApplyYield = () => {
    applyMonthlyYieldToAllCofrinhos(selectedMonth);
    setAppliedYieldSuccess(true);
    setTimeout(() => setAppliedYieldSuccess(false), 4000);
  };

  const handleSaveCdiRate = (e: React.FormEvent) => {
    e.preventDefault();
    updateGlobalCofrinhoSettings({ cdiAnnualRate: Number(tempCdiRate) });
    setIsCdiSettingsOpen(false);
  };

  // Month Investments / Aportes
  const monthInvestments = investmentContributions.filter(
    (inv) => inv.date.startsWith(selectedMonth)
  );

  const ricardoMonthInvested = monthInvestments
    .filter((i) => i.person === 'Ricardo')
    .reduce((sum, i) => sum + i.amount, 0);

  const ellenMonthInvested = monthInvestments
    .filter((i) => i.person === 'Ellen')
    .reduce((sum, i) => sum + i.amount, 0);

  // Emergency Fund Metrics & Breakdown
  const resCof = cofrinhos.find((c) => c.type === 'reserva');
  const currentEmergencyValue = resCof ? resCof.currentBalance : totalEmergencyFund;
  const emergencyTarget = emergencySettings.targetAmount || 55200;
  const emergencyRemaining = Math.max(0, emergencyTarget - currentEmergencyValue);
  const emergencyPercentage = emergencyTarget > 0 ? Math.min(100, (currentEmergencyValue / emergencyTarget) * 100) : 0;
  const isEmergencyMet = currentEmergencyValue >= emergencyTarget;

  // Breakdown of Emergency Fund Origins
  const resMovements = cofrinhoMovements.filter((m) => m.cofrinhoId === 'cof-reserva');
  const ricardoResContributions = resMovements
    .filter((m) => m.type === 'aporte' && m.person === 'Ricardo')
    .reduce((s, m) => s + m.amount, 0);
  const ellenResContributions = resMovements
    .filter((m) => m.type === 'aporte' && m.person === 'Ellen')
    .reduce((s, m) => s + m.amount, 0);
  const extraordinaryResContributions = resMovements
    .filter((m) => m.type === 'aporte' && m.isExtraordinaryShare)
    .reduce((s, m) => s + m.amount, 0);
  const yieldResTotal = resMovements
    .filter((m) => m.type === 'rendimento')
    .reduce((s, m) => s + m.amount, 0);
  const withdrawResTotal = resMovements
    .filter((m) => m.type === 'retirada')
    .reduce((s, m) => s + m.amount, 0);

  // Time to Completion Estimation (based on R$ 1.000/month contributions + CDI yield)
  const monthlyFixedAporte = (emergencySettings.ricardoMonthlyObligation || 500) + (emergencySettings.ellenMonthlyObligation || 500);
  const monthlyRateCDI = Math.pow(1 + (globalCofrinhoSettings.cdiAnnualRate / 100), 1 / 12) - 1;

  // Approximate remaining months with compound yield
  let simulatedBalance = currentEmergencyValue;
  let remainingMonthsCount = 0;
  if (!isEmergencyMet && (monthlyFixedAporte > 0 || monthlyRateCDI > 0)) {
    while (simulatedBalance < emergencyTarget && remainingMonthsCount < 120) {
      simulatedBalance = simulatedBalance * (1 + monthlyRateCDI) + monthlyFixedAporte;
      remainingMonthsCount++;
    }
  }

  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setMonth(estimatedCompletionDate.getMonth() + remainingMonthsCount);
  const formattedEstimatedDate = estimatedCompletionDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  // Helper icons for cofrinhos
  const getCofrinhoIcon = (id: string, type: string) => {
    if (type === 'reserva' || id === 'cof-reserva') return <ShieldCheck className="w-5 h-5 text-amber-500" />;
    if (type === 'casa' || id === 'cof-casa') return <Home className="w-5 h-5 text-blue-500" />;
    if (type === 'manutencao_casa' || id === 'cof-manutencao') return <Wrench className="w-5 h-5 text-teal-500" />;
    if (type === 'lazer' || id === 'cof-lazer') return <Palmtree className="w-5 h-5 text-purple-500" />;
    if (type === 'aluguel_futuro' || id === 'cof-aluguel') return <Calendar className="w-5 h-5 text-indigo-500" />;
    return <PiggyBank className="w-5 h-5 text-emerald-500" />;
  };

  // Status Badge Component
  const renderStatusBadge = (status: MonthlyAporteStatus = 'programado') => {
    switch (status) {
      case 'realizado':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Realizado
          </span>
        );
      case 'parcial':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Parcial
          </span>
        );
      case 'nao_realizado':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Não Realizado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Programado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Strategy Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Metas, Cofrinhos & Reserva de Emergência
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reserva de Emergência (8 Meses = R$ 55.200) • Regra 70/20/10 Rendas Extras • Cofrinhos com Rendimento CDI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action: Extraordinary Income */}
          <button
            id="goals-extraordinary-btn"
            onClick={() => setIsExtraordinaryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Renda Extra 70/20/10</span>
          </button>

          {/* Quick Action: New Movement */}
          <button
            id="goals-new-cofrinho-btn"
            onClick={() => handleOpenCofrinhoModal('cof-reserva', 'movement')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Movimentar</span>
          </button>
        </div>
      </div>

      {/* 1. SEÇÃO PRINCIPAL: RESERVA DE EMERGÊNCIA (8 Meses de Renda Salarial = R$ 55.200) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-2xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pilar de Segurança Familiar
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  8 Meses Salariais
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Reserva de Emergência ({formatCurrency(emergencyTarget)})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="emergency-settings-btn"
              onClick={onOpenEmergencySettings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Parâmetros</span>
            </button>
          </div>
        </div>

        {/* Banner de Meta Atingida se concluída */}
        {isEmergencyMet ? (
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-300 shrink-0" />
              <div>
                <h4 className="font-black text-base">Meta da Reserva de Emergência Concluída!</h4>
                <p className="text-xs text-emerald-100">
                  Os R$ 55.200 foram alcançados. 70% das próximas rendas extraordinárias serão automaticamente redirecionados para a <strong>Compra da Nova Casa</strong>.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl whitespace-nowrap">
              100% Blindado
            </span>
          </div>
        ) : null}

        {/* Dashboard Banner da Reserva */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Saldo Atual Consolidado
              </span>
              <h4 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(currentEmergencyValue)}
              </h4>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Meta Salarial (8 × {formatCurrency(emergencySettings.familySalaryIncome || 6900)})
              </span>
              <h4 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {formatCurrency(emergencyTarget)}
              </h4>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${emergencyPercentage}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>{emergencyPercentage.toFixed(1)}% da meta atingida</span>
              <span>
                {isEmergencyMet
                  ? 'Meta completa!'
                  : `Faltam ${formatCurrency(emergencyRemaining)} (${remainingMonthsCount} meses est.)`}
              </span>
            </div>
          </div>

          {/* KPI Metrics: Detailed Origin Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-xs">
            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Aportes Ricardo</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(ricardoResContributions)}
              </span>
            </div>

            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Aportes Ellen</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(ellenResContributions)}
              </span>
            </div>

            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Renda Extra (70%)</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(extraordinaryResContributions)}
              </span>
            </div>

            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Rendimentos</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(yieldResTotal)}
              </span>
            </div>

            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Meses Restantes</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEmergencyMet ? '0 meses' : `~${remainingMonthsCount} meses`}
              </span>
            </div>

            <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Data Conclusão</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {isEmergencyMet ? 'Concluída' : formattedEstimatedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Aportes Fixos Obrigatórios Mensais (R$ 500 Ricardo + R$ 500 Ellen) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Aportes Fixos Mensais — {formatMonthYearBR(selectedMonth)} (R$ 500 por pessoa)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Total Fixo: R$ 1.000 / mês
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Ricardo */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Ricardo (Aporte R$ 500)
                  </span>
                </div>
                {renderStatusBadge(emergencySettings.ricardoStatus)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Status no Mês Atual:</span>
                <select
                  value={emergencySettings.ricardoStatus || 'programado'}
                  onChange={(e) => setMonthlyAporteStatus('Ricardo', e.target.value as MonthlyAporteStatus)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                >
                  <option value="programado">Programado</option>
                  <option value="realizado">Realizado</option>
                  <option value="parcial">Parcial</option>
                  <option value="nao_realizado">Não Realizado</option>
                </select>
              </div>

              <button
                onClick={() => handleOpenCofrinhoModal('cof-reserva', 'movement')}
                className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Aporte de R$ 500 p/ Ricardo</span>
              </button>
            </div>

            {/* Card Ellen */}
            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Ellen (Aporte R$ 500)
                  </span>
                </div>
                {renderStatusBadge(emergencySettings.ellenStatus)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Status no Mês Atual:</span>
                <select
                  value={emergencySettings.ellenStatus || 'programado'}
                  onChange={(e) => setMonthlyAporteStatus('Ellen', e.target.value as MonthlyAporteStatus)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                >
                  <option value="programado">Programado</option>
                  <option value="realizado">Realizado</option>
                  <option value="parcial">Parcial</option>
                  <option value="nao_realizado">Não Realizado</option>
                </select>
              </div>

              <button
                onClick={() => handleOpenCofrinhoModal('cof-reserva', 'movement')}
                className="w-full py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Aporte de R$ 500 p/ Ellen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO DE COFRINHOS ESTRUTURAIS & RENDIMENTOS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gestão Patrimonial
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                Taxa CDI Base: {globalCofrinhoSettings.cdiAnnualRate.toFixed(2)}% a.a.
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Cofrinhos e Metas Estruturadas
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCdiSettingsOpen(!isCdiSettingsOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Ajustar Taxa CDI</span>
            </button>

            <button
              onClick={handleApplyYield}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Aplicar Rendimento do Mês</span>
            </button>
          </div>
        </div>

        {/* CDI Adjustment Inline Card */}
        {isCdiSettingsOpen && (
          <form onSubmit={handleSaveCdiRate} className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-indigo-600" />
                Configurar Parâmetros de Rentabilidade Econômica
              </span>
              <button
                type="button"
                onClick={() => setIsCdiSettingsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Taxa Selic / CDI Anual Oficial (% ao ano)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={tempCdiRate}
                  onChange={(e) => setTempCdiRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  Salvar Nova Taxa CDI
                </button>
              </div>
            </div>
          </form>
        )}

        {appliedYieldSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Rendimento mensal do CDI calculado e creditado com sucesso em todos os cofrinhos ativos!</span>
          </div>
        )}

        {/* Cofrinhos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cofrinhos.map((cof) => {
            const pct = cof.targetAmount ? Math.min(100, (cof.currentBalance / cof.targetAmount) * 100) : 0;
            const cofAnnualRate = calculateAnnualRate(
              globalCofrinhoSettings.cdiAnnualRate,
              cof.yieldType,
              cof.cdiPercentage || 100,
              cof.customAnnualRate || 0
            );
            const monthlyYieldEst = calculateMonthlyYieldDetails(
              cof.currentBalance,
              cofAnnualRate,
              0,
              0,
              globalCofrinhoSettings.defaultIncomeTaxRate || 15
            );

            return (
              <div
                key={cof.id}
                className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xs">
                      {getCofrinhoIcon(cof.id, cof.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {cof.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {cof.objective || cof.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCofrinhoModal(cof.id, 'edit')}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                    title="Editar configurações"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Values & Targets */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(cof.currentBalance)}
                    </span>
                    {cof.targetAmount ? (
                      <span className="text-xs text-slate-500 font-medium">
                        Meta: {formatCurrency(cof.targetAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sem teto fixo</span>
                    )}
                  </div>

                  {cof.targetAmount && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cof.color || '#3b82f6',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{pct.toFixed(1)}% atingido</span>
                        <span>Faltam {formatCurrency(Math.max(0, cof.targetAmount - cof.currentBalance))}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Yield & Investment Info */}
                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Aplicação:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {cof.institution || 'Tesouro / CDB'} ({cof.applicationType || '100% CDI'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Rentabilidade:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {cof.yieldType === 'none' ? 'Sem rendimento' : `${cofAnnualRate.toFixed(2)}% a.a. (~+${formatCurrency(monthlyYieldEst.netYield)}/mês)`}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCofrinhoModal(cof.id, 'movement')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Aporte / Retirada
                    </button>
                  </div>

                  {(cof.type === 'manutencao' || cof.id === 'cof-manutencao') && (
                    <button
                      onClick={() => handleOpenCofrinhoModal(cof.id, 'transfer')}
                      className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SIMULADOR DE PROJEÇÃO DE JUROS COMPOSTOS (6, 12, 24, 36 e 60 Meses) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Inteligência Patrimonial
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Projeção de Juros Compostos (CDI a {globalCofrinhoSettings.cdiAnnualRate.toFixed(2)}% a.a.)
              </h3>
            </div>
          </div>
          <span className="text-xs text-slate-500">
            Considerando o saldo consolidado atual de {formatCurrency(cofrinhos.reduce((s, c) => s + c.currentBalance, 0))} + Aportes de R$ 1.000/mês
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[6, 12, 24, 36, 60].map((months) => {
            const currentTotalBalance = cofrinhos.reduce((s, c) => s + c.currentBalance, 0);
            const projection = calculateCompoundInterestProjection(
              currentTotalBalance,
              1000,
              globalCofrinhoSettings.cdiAnnualRate,
              months,
              globalCofrinhoSettings.defaultIncomeTaxRate || 15
            );

            return (
              <div
                key={months}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {months} Meses ({months / 12 >= 1 ? `${months / 12} ano${months / 12 > 1 ? 's' : ''}` : `${months}m`})
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    +{formatCurrency(projection.totalNetInterest)} juros
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block">Saldo Projetado Líquido</span>
                  <span className="text-base font-black text-indigo-700 dark:text-indigo-300">
                    {formatCurrency(projection.finalBalance)}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Aportes: {formatCurrency(projection.totalContributed)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CRÉDITO DE REFORMA DA CASA (R$ 80.000) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Crédito & Obra Imobiliária
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Crédito de Reforma da Casa (R$ 80.000)
              </h3>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-full">
            Parcela: R$ 1.500/mês (nas faturas)
          </span>
        </div>

        <div className="p-5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-xs block">Valor Total do Crédito</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(currentMonthSummary.renovationCreditTotal)}
              </span>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-xs block">Liberado / Utilizado</span>
              <span className="text-xl font-black text-purple-700 dark:text-purple-300">
                {formatCurrency(currentMonthSummary.renovationCreditWithdrawn)}
              </span>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-xs block">Saldo a Liberar</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(currentMonthSummary.renovationCreditAvailable)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{
                  width: `${(currentMonthSummary.renovationCreditWithdrawn / currentMonthSummary.renovationCreditTotal) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {((currentMonthSummary.renovationCreditWithdrawn / currentMonthSummary.renovationCreditTotal) * 100).toFixed(1)}% do crédito executado
              </span>
              <span>
                Disponível para novas etapas: {formatCurrency(currentMonthSummary.renovationCreditAvailable)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. HISTÓRICO DETALHADO DE MOVIMENTAÇÕES */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Histórico Detalhado de Movimentações
          </h3>

          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveSubTab('cofrinhos')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'cofrinhos'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Cofrinhos
            </button>
            <button
              onClick={() => setActiveSubTab('emergency')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'emergency'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Reserva de Emergência
            </button>
            <button
              onClick={() => setActiveSubTab('extraordinary')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'extraordinary'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Rendas Extras (70/20/10)
            </button>
          </div>
        </div>

        {/* Movements List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {cofrinhoMovements
            .filter((mov) => {
              if (activeSubTab === 'emergency') return mov.cofrinhoId === 'cof-reserva';
              if (activeSubTab === 'extraordinary') return mov.isExtraordinaryShare;
              if (activeSubTab === 'cofrinhos') return true;
              return true;
            })
            .map((mov) => {
              const cof = cofrinhos.find((c) => c.id === mov.cofrinhoId);
              const personColors = getPersonBadgeColor(mov.person);
              const isAporte = mov.type === 'aporte' || mov.type === 'rendimento';

              return (
                <div
                  key={mov.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-xs font-bold ${
                        mov.type === 'aporte'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : mov.type === 'retirada'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {mov.type === 'aporte' ? (
                        <Plus className="w-4 h-4" />
                      ) : mov.type === 'retirada' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {cof?.name || 'Cofrinho'} ({mov.type.toUpperCase()})
                        </span>
                        {mov.isExtraordinaryShare && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                            Renda Extra 70/20/10
                          </span>
                        )}
                        {mov.isDemo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{formatDateBR(mov.date)}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${personColors.badge}`}>
                          {mov.person}
                        </span>
                        {mov.notes && <span>• {mov.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-black ${
                        isAporte ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isAporte ? '+' : '-'} {formatCurrency(mov.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Deseja excluir esta movimentação?')) {
                          deleteCofrinhoMovement(mov.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modais de Cofrinho e Renda Extraordinária */}
      <CofrinhoModal
        isOpen={isCofrinhoModalOpen}
        onClose={() => setIsCofrinhoModalOpen(false)}
        defaultCofrinhoId={selectedCofrinhoIdForModal}
        initialMode={cofrinhoModalInitialMode}
      />

      <ExtraordinaryIncomeModal
        isOpen={isExtraordinaryModalOpen}
        onClose={() => setIsExtraordinaryModalOpen(false)}
      />
    </div>
  );
};
