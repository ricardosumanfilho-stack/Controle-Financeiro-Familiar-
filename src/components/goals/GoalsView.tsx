import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ConfirmModal } from '../common/ConfirmModal';
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
  ArrowDownLeft,
  Settings2,
  Percent,
  Calculator,
  AlertTriangle,
  XCircle,
  HelpCircle,
  User,
  Users,
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
    ricardoEmergencyFund,
    ellenEmergencyFund,
    salarySettings,
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
  const [reservaViewTab, setReservaViewTab] = useState<'both' | 'ricardo' | 'ellen'>('both');
  const [cofrinhoFilterMode, setCofrinhoFilterMode] = useState<'demais' | 'todos'>('demais');
  const [isCofrinhoModalOpen, setIsCofrinhoModalOpen] = useState(false);
  const [selectedCofrinhoIdForModal, setSelectedCofrinhoIdForModal] = useState<string>('cof-reserva');
  const [cofrinhoModalInitialMode, setCofrinhoModalInitialMode] = useState<'movement' | 'transfer' | 'edit'>('movement');
  const [cofrinhoModalInitialMovType, setCofrinhoModalInitialMovType] = useState<'aporte' | 'retirada' | 'rendimento'>('aporte');
  const [isExtraordinaryModalOpen, setIsExtraordinaryModalOpen] = useState(false);
  const [isCdiSettingsOpen, setIsCdiSettingsOpen] = useState(false);
  const [tempCdiRate, setTempCdiRate] = useState(globalCofrinhoSettings.cdiAnnualRate);
  const [appliedYieldSuccess, setAppliedYieldSuccess] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);

  const handleOpenCofrinhoModal = (
    id: string = 'cof-reserva',
    mode: 'movement' | 'transfer' | 'edit' = 'movement',
    movType: 'aporte' | 'retirada' | 'rendimento' = 'aporte'
  ) => {
    setSelectedCofrinhoIdForModal(id);
    setCofrinhoModalInitialMode(mode);
    setCofrinhoModalInitialMovType(movType);
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

  // ==========================================
  // RESERVA DE EMERGÊNCIA SEPARADA & CONSOLIDADA
  // ==========================================

  // 1. Identificação dos Cofrinhos Individuais de Reserva
  const ricardoResCof = cofrinhos.find(
    (c) => c.id === 'cof-reserva' || (c.type === 'reserva' && c.person === 'Ricardo')
  );
  const ellenResCof = cofrinhos.find(
    (c) => c.id === 'cof-reserva-ellen' || (c.type === 'reserva' && c.person === 'Ellen')
  );

  const ricardoCofId = ricardoResCof?.id || 'cof-reserva';
  const ellenCofId = ellenResCof?.id || 'cof-reserva-ellen';

  // 2. Saldos Atuais Individuais
  const ricardoBalance = ricardoResCof ? ricardoResCof.currentBalance : (ricardoEmergencyFund || 0);
  const ellenBalance = ellenResCof ? ellenResCof.currentBalance : (ellenEmergencyFund || 0);

  // 3. Saldo Total Consolidado (Soma das Duas Reservas)
  const currentEmergencyValue = ricardoBalance + ellenBalance;

  // 4. Metas Salariais (Base oficial: Ricardo R$ 5.300 x 8 = R$ 42.400 | Ellen R$ 1.600 x 8 = R$ 12.800 | Total = R$ 55.200)
  const ricardoSalary = salarySettings.ricardoNetSalary || salarySettings.salaryRicardo || 5300;
  const ellenSalary = salarySettings.ellenNetSalary || salarySettings.salaryEllen || 1600;
  const ricardoTarget = ricardoResCof?.targetAmount || (8 * ricardoSalary);
  const ellenTarget = ellenResCof?.targetAmount || (8 * ellenSalary);
  const emergencyTarget = emergencySettings.targetAmount || (ricardoTarget + ellenTarget) || 55200;

  // 5. Percentuais Individuais e Consolidado
  const ricardoPercentage = ricardoTarget > 0 ? Math.min(100, (ricardoBalance / ricardoTarget) * 100) : 0;
  const ellenPercentage = ellenTarget > 0 ? Math.min(100, (ellenBalance / ellenTarget) * 100) : 0;
  const emergencyPercentage = emergencyTarget > 0 ? Math.min(100, (currentEmergencyValue / emergencyTarget) * 100) : 0;

  // 6. Valores Restantes
  const ricardoRemaining = Math.max(0, ricardoTarget - ricardoBalance);
  const ellenRemaining = Math.max(0, ellenTarget - ellenBalance);
  const emergencyRemaining = Math.max(0, emergencyTarget - currentEmergencyValue);

  const isRicardoMet = ricardoBalance >= ricardoTarget;
  const isEllenMet = ellenBalance >= ellenTarget;
  const isEmergencyMet = currentEmergencyValue >= emergencyTarget;

  // 7. Movimentações por Pessoa / Cofrinho
  const ricardoMovements = cofrinhoMovements.filter((m) => m.cofrinhoId === ricardoCofId);
  const ricardoResContributions = ricardoMovements
    .filter((m) => m.type === 'aporte')
    .reduce((s, m) => s + m.amount, 0);
  const ricardoYieldTotal = ricardoMovements
    .filter((m) => m.type === 'rendimento')
    .reduce((s, m) => s + m.amount, 0);
  const ricardoWithdrawTotal = ricardoMovements
    .filter((m) => m.type === 'retirada')
    .reduce((s, m) => s + m.amount, 0);

  const ellenMovements = cofrinhoMovements.filter((m) => m.cofrinhoId === ellenCofId);
  const ellenResContributions = ellenMovements
    .filter((m) => m.type === 'aporte')
    .reduce((s, m) => s + m.amount, 0);
  const ellenYieldTotal = ellenMovements
    .filter((m) => m.type === 'rendimento')
    .reduce((s, m) => s + m.amount, 0);
  const ellenWithdrawTotal = ellenMovements
    .filter((m) => m.type === 'retirada')
    .reduce((s, m) => s + m.amount, 0);

  // Rendas extraordinárias direcionadas para qualquer uma das reservas
  const extraordinaryResContributions = cofrinhoMovements
    .filter((m) => (m.cofrinhoId === ricardoCofId || m.cofrinhoId === ellenCofId) && m.isExtraordinaryShare)
    .reduce((s, m) => s + m.amount, 0);

  const yieldResTotal = ricardoYieldTotal + ellenYieldTotal;

  // 8. Rentabilidade Mensal Automática baseada no CDI para cada Reserva
  const ricardoAnnualRate = calculateAnnualRate(
    globalCofrinhoSettings.cdiAnnualRate,
    ricardoResCof?.yieldType || 'cdi_100',
    ricardoResCof?.cdiPercentage || 100,
    ricardoResCof?.customAnnualRate || 0
  );
  const ricardoMonthlyYieldEst = calculateMonthlyYieldDetails(
    ricardoBalance,
    ricardoAnnualRate,
    0,
    0,
    globalCofrinhoSettings.defaultIncomeTaxRate || 15
  );

  const ellenAnnualRate = calculateAnnualRate(
    globalCofrinhoSettings.cdiAnnualRate,
    ellenResCof?.yieldType || 'cdi_100',
    ellenResCof?.cdiPercentage || 100,
    ellenResCof?.customAnnualRate || 0
  );
  const ellenMonthlyYieldEst = calculateMonthlyYieldDetails(
    ellenBalance,
    ellenAnnualRate,
    0,
    0,
    globalCofrinhoSettings.defaultIncomeTaxRate || 15
  );

  const totalMonthlyYieldEstimated = ricardoMonthlyYieldEst.netYield + ellenMonthlyYieldEst.netYield;

  // 9. Estimativa de Tempo de Conclusão Consolidada (Aporte fixo familiar R$ 1.000/mês + rendimentos)
  const monthlyFixedAporte = (emergencySettings.ricardoMonthlyObligation || 500) + (emergencySettings.ellenMonthlyObligation || 500);
  const monthlyRateCDI = Math.pow(1 + (globalCofrinhoSettings.cdiAnnualRate / 100), 1 / 12) - 1;

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
            Reserva de Emergência (Ricardo & Ellen) • Fundo Compra da Casa Nova • Lazer e Viagens • Rendimento CDI
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

      {/* 1. SEÇÃO PRINCIPAL: RESERVA DE EMERGÊNCIA — JANELAS SEPARADAS E DASHBOARD CONSOLIDADA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Cabeçalho da Seção com Navegação de Abas */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-2xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pilar de Segurança Familiar
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  8 Meses Salariais (Meta R$ 55.200)
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Reserva de Emergência Familiar
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Janelas: Ambas / Ricardo / Ellen */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setReservaViewTab('both')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  reservaViewTab === 'both'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Ambas as Janelas</span>
              </button>
              <button
                type="button"
                onClick={() => setReservaViewTab('ricardo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  reservaViewTab === 'ricardo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Janela Ricardo</span>
              </button>
              <button
                type="button"
                onClick={() => setReservaViewTab('ellen')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  reservaViewTab === 'ellen'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Janela Ellen</span>
              </button>
            </div>

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
                <h4 className="font-black text-base">Meta da Reserva Familiar Blindada com Sucesso!</h4>
                <p className="text-xs text-emerald-100">
                  Os {formatCurrency(emergencyTarget)} foram alcançados somando as reservas de Ricardo e Ellen. 70% das próximas rendas extraordinárias serão direcionadas para a <strong>Compra da Nova Casa</strong>.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl whitespace-nowrap">
              100% Blindado
            </span>
          </div>
        ) : null}

        {/* DASHBOARD CONSOLIDADA (TOTAL DAS DUAS RESERVAS) */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Dashboard Consolidada — Total das Duas Reservas
            </span>
            <span className="text-xs font-medium text-slate-500">
              Ricardo ({((ricardoBalance / (currentEmergencyValue || 1)) * 100).toFixed(0)}%) + Ellen ({((ellenBalance / (currentEmergencyValue || 1)) * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Saldo Atual Consolidado (Total Ricardo + Ellen)
              </span>
              <div className="flex flex-wrap items-baseline gap-3 mt-0.5">
                <h4 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(currentEmergencyValue)}
                </h4>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    Ricardo: {formatCurrency(ricardoBalance)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    Ellen: {formatCurrency(ellenBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Meta Salarial Total (8 × {formatCurrency(emergencySettings.familySalaryIncome || (ricardoSalary + ellenSalary))})
              </span>
              <h4 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {formatCurrency(emergencyTarget)}
              </h4>
            </div>
          </div>

          {/* Progress bar consolidada */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${emergencyPercentage}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>{emergencyPercentage.toFixed(1)}% da meta familiar atingida</span>
              <span>
                {isEmergencyMet
                  ? 'Meta completa!'
                  : `Faltam ${formatCurrency(emergencyRemaining)} no total (${remainingMonthsCount} meses est.)`}
              </span>
            </div>
          </div>

          {/* KPI Metrics: Detailed Origin Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-xs">
            <div className="p-2.5 bg-white/85 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Aportes Ricardo</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(ricardoResContributions)}
              </span>
            </div>

            <div className="p-2.5 bg-white/85 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Aportes Ellen</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(ellenResContributions)}
              </span>
            </div>

            <div className="p-2.5 bg-white/85 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Renda Extra (70%)</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(extraordinaryResContributions)}
              </span>
            </div>

            <div className="p-2.5 bg-white/85 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Rendimentos Totais</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(yieldResTotal)}
              </span>
            </div>

            <div className="p-2.5 bg-white/85 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Rend. Mensal Est.</span>
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                +{formatCurrency(totalMonthlyYieldEstimated)}/mês
              </span>
            </div>

            <div className="p-2.5 bg-white/85 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block">Previsão Conclusão</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {isEmergencyMet ? 'Concluída' : `~${remainingMonthsCount}m (${formattedEstimatedDate})`}
              </span>
            </div>
          </div>
        </div>

        {/* AS DUAS JANELAS SEPARADAS (RICARDO e ELLEN) */}
        <div className={`grid gap-6 ${reservaViewTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* ===================================================== */}
          {/* JANELA 1: RESERVA DE EMERGÊNCIA — RICARDO */}
          {/* ===================================================== */}
          {(reservaViewTab === 'both' || reservaViewTab === 'ricardo') && (
            <div className="p-5 bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white dark:from-blue-950/20 dark:via-slate-900/80 dark:to-slate-900 border-2 border-blue-200/80 dark:border-blue-900/60 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

              {/* Header da Janela */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Titular: Ricardo
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                        8 Meses Salariais
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      Reserva de Emergência — Ricardo
                    </h4>
                  </div>
                </div>

                {renderStatusBadge(emergencySettings.ricardoStatus)}
              </div>

              {/* Valores Principais */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Saldo Atual do Ricardo
                  </span>
                  <h5 className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">
                    {formatCurrency(ricardoBalance)}
                  </h5>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Meta Individual (8 × {formatCurrency(ricardoSalary)})
                  </span>
                  <h6 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(ricardoTarget)}
                  </h6>
                </div>
              </div>

              {/* Barra de Progresso Individual Ricardo */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${ricardoPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {ricardoPercentage.toFixed(1)}% atingido
                  </span>
                  <span>
                    {isRicardoMet ? 'Meta individual batida!' : `Faltam ${formatCurrency(ricardoRemaining)}`}
                  </span>
                </div>
              </div>

              {/* Informações da Aplicação & Rentabilidade */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Instituição / Aplicação:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {ricardoResCof?.institution || 'Tesouro Direto / Sofisa'} • {ricardoResCof?.applicationType || 'Tesouro Selic / CDB 100% CDI'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rentabilidade Estimada:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(ricardoMonthlyYieldEst.netYield)} / mês (CDI {ricardoAnnualRate.toFixed(2)}% a.a.)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rendimentos Acumulados:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    +{formatCurrency(ricardoYieldTotal)}
                  </span>
                </div>
              </div>

              {/* Controle do Aporte Obrigatório Mensal de R$ 500 */}
              <div className="p-3 bg-blue-100/40 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Aporte Mensal Fixo: R$ 500,00
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Status no Mês:</span>
                    <select
                      value={emergencySettings.ricardoStatus || 'programado'}
                      onChange={(e) => setMonthlyAporteStatus('Ricardo', e.target.value as MonthlyAporteStatus)}
                      className="px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold"
                    >
                      <option value="programado">Programado</option>
                      <option value="realizado">Realizado</option>
                      <option value="parcial">Parcial</option>
                      <option value="nao_realizado">Não Realizado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Específicos da Janela do Ricardo */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenCofrinhoModal(ricardoCofId, 'movement', 'aporte')}
                  className="py-2 px-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aporte Ricardo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCofrinhoModal(ricardoCofId, 'movement', 'retirada')}
                  className="py-2 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-amber-500" />
                  <span>Resgatar Saldo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCofrinhoModal(ricardoCofId, 'edit')}
                  className="py-2 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Ajustar Saldo</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* JANELA 2: RESERVA DE EMERGÊNCIA — ELLEN */}
          {/* ===================================================== */}
          {(reservaViewTab === 'both' || reservaViewTab === 'ellen') && (
            <div className="p-5 bg-gradient-to-br from-rose-50/50 via-slate-50/30 to-white dark:from-rose-950/20 dark:via-slate-900/80 dark:to-slate-900 border-2 border-rose-200/80 dark:border-rose-900/60 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />

              {/* Header da Janela */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Titular: Ellen
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold">
                        8 Meses Salariais
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      Reserva de Emergência — Ellen
                    </h4>
                  </div>
                </div>

                {renderStatusBadge(emergencySettings.ellenStatus)}
              </div>

              {/* Valores Principais */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Saldo Atual da Ellen
                  </span>
                  <h5 className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300">
                    {formatCurrency(ellenBalance)}
                  </h5>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Meta Individual (8 × {formatCurrency(ellenSalary)})
                  </span>
                  <h6 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(ellenTarget)}
                  </h6>
                </div>
              </div>

              {/* Barra de Progresso Individual Ellen */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-rose-600 h-full rounded-full transition-all"
                    style={{ width: `${ellenPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {ellenPercentage.toFixed(1)}% atingido
                  </span>
                  <span>
                    {isEllenMet ? 'Meta individual batida!' : `Faltam ${formatCurrency(ellenRemaining)}`}
                  </span>
                </div>
              </div>

              {/* Informações da Aplicação & Rentabilidade */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Instituição / Aplicação:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {ellenResCof?.institution || 'Nubank / Sofisa'} • {ellenResCof?.applicationType || 'Caixinhas Reserva / CDB 100% CDI'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rentabilidade Estimada:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(ellenMonthlyYieldEst.netYield)} / mês (CDI {ellenAnnualRate.toFixed(2)}% a.a.)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rendimentos Acumulados:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    +{formatCurrency(ellenYieldTotal)}
                  </span>
                </div>
              </div>

              {/* Controle do Aporte Obrigatório Mensal de R$ 500 */}
              <div className="p-3 bg-rose-100/40 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    Aporte Mensal Fixo: R$ 500,00
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Status no Mês:</span>
                    <select
                      value={emergencySettings.ellenStatus || 'programado'}
                      onChange={(e) => setMonthlyAporteStatus('Ellen', e.target.value as MonthlyAporteStatus)}
                      className="px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold"
                    >
                      <option value="programado">Programado</option>
                      <option value="realizado">Realizado</option>
                      <option value="parcial">Parcial</option>
                      <option value="nao_realizado">Não Realizado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Específicos da Janela da Ellen */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenCofrinhoModal(ellenCofId, 'movement', 'aporte')}
                  className="py-2 px-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aporte Ellen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCofrinhoModal(ellenCofId, 'movement', 'retirada')}
                  className="py-2 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-amber-500" />
                  <span>Resgatar Saldo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCofrinhoModal(ellenCofId, 'edit')}
                  className="py-2 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Ajustar Saldo</span>
                </button>
              </div>
            </div>
          )}
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
              Demais Cofrinhos e Metas Estruturadas
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro: Demais Metas vs Todos */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setCofrinhoFilterMode('demais')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  cofrinhoFilterMode === 'demais'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Metas Específicas ({cofrinhos.filter((c) => c.type !== 'reserva').length})
              </button>
              <button
                type="button"
                onClick={() => setCofrinhoFilterMode('todos')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  cofrinhoFilterMode === 'todos'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Todos ({cofrinhos.length})
              </button>
            </div>

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
          {(cofrinhoFilterMode === 'demais' ? cofrinhos.filter((c) => c.type !== 'reserva') : cofrinhos).map((cof) => {
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
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCofrinhoModal(cof.id, 'movement', 'aporte')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      title="Registrar aporte"
                    >
                      <Plus className="w-3.5 h-3.5" /> Aporte
                    </button>

                    <span className="text-slate-300 dark:text-slate-700">|</span>

                    <button
                      onClick={() => handleOpenCofrinhoModal(cof.id, 'movement', 'retirada')}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                      title="Registrar resgate de saldo"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Resgate
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCofrinhoModal(cof.id, 'transfer')}
                      className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                      title="Transferir entre cofrinhos"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir
                    </button>

                    <span className="text-slate-300 dark:text-slate-700">|</span>

                    <button
                      onClick={() => handleOpenCofrinhoModal(cof.id, 'edit')}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline flex items-center gap-0.5"
                      title="Ajustar saldo e parâmetros"
                    >
                      <Settings2 className="w-3.5 h-3.5" /> Ajustar
                    </button>
                  </div>
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
              if (activeSubTab === 'emergency') return mov.cofrinhoId === 'cof-reserva' || mov.cofrinhoId === 'cof-reserva-ellen';
              if (activeSubTab === 'extraordinary') return mov.isExtraordinaryShare;
              if (activeSubTab === 'cofrinhos') return true;
              return true;
            })
            .map((mov, index) => {
              const cof = cofrinhos.find((c) => c.id === mov.cofrinhoId);
              const personColors = getPersonBadgeColor(mov.person);
              const isAporte = mov.type === 'aporte' || mov.type === 'rendimento';

              return (
                <div
                  key={mov.id ? `${mov.id}-${index}` : `mov-${index}`}
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
                          {cof?.name || 'Cofrinho'} ({(mov.type || 'aporte').toUpperCase()})
                        </span>
                        {mov.isExtraordinaryShare && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                            Renda Extra 70/20/10
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
                      onClick={() => setMovementToDelete(mov.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                      title="Excluir Movimentação"
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
        initialMovType={cofrinhoModalInitialMovType}
      />

      <ExtraordinaryIncomeModal
        isOpen={isExtraordinaryModalOpen}
        onClose={() => setIsExtraordinaryModalOpen(false)}
      />

      {movementToDelete && (
        <ConfirmModal
          isOpen={Boolean(movementToDelete)}
          onClose={() => setMovementToDelete(null)}
          onConfirm={() => {
            if (movementToDelete) {
              deleteCofrinhoMovement(movementToDelete);
              setMovementToDelete(null);
            }
          }}
          title="Excluir Movimentação"
          message="Tem certeza que deseja excluir esta movimentação do cofrinho? Os saldos serão recalculados automaticamente."
          confirmText="Sim, Excluir Movimentação"
          cancelText="Cancelar"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};
