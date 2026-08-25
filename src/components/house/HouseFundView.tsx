import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyBR } from '../../utils/formatters';
import {
  Home,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  PieChart,
  ShieldCheck,
  Zap,
  Calculator,
  Building2,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const HouseFundView: React.FC = () => {
  const {
    houseFundSettings,
    updateHouseFundSettings,
    cofrinhos,
    totalEmergencyFund,
    emergencySettings,
    selectedMonth,
  } = useFinance();

  const [activeScenario, setActiveScenario] = useState<'conservative' | 'moderate' | 'accelerated'>('moderate');
  const [customDownPayment, setCustomDownPayment] = useState<number>(houseFundSettings.targetDownPayment);
  const [customMonthlyAporte, setCustomMonthlyAporte] = useState<number>(houseFundSettings.monthlyContributionModerate);

  const houseCof = cofrinhos.find((c) => c.type === 'casa');
  const houseFundBalance = houseCof ? houseCof.currentBalance : 0;
  const houseFundYield = houseCof ? (houseCof.accumulatedYield || 0) : 0;
  const houseFundMonthlyYield = houseCof ? (houseCof.monthlyYield || 0) : 0;

  const isEmergencyCompleted = totalEmergencyFund >= emergencySettings.targetAmount;
  const emergencyRemaining = Math.max(0, emergencySettings.targetAmount - totalEmergencyFund);

  const targetDownPayment = customDownPayment || 120000;
  const remainingForDownPayment = Math.max(0, targetDownPayment - houseFundBalance);
  const percentCompleted = Math.min(100, (houseFundBalance / targetDownPayment) * 100);

  // Projeção dos 3 cenários
  // Taxas mensais a partir de taxas anuais (ex: 10% a.a. -> ~0.797% a.m.)
  const getMonthlyRate = (annualRate: number) => Math.pow(1 + annualRate / 100, 1 / 12) - 1;

  const scenariosConfig = {
    conservative: {
      name: 'Conservador',
      description: 'Apenas aportes fixos (R$ 1.000/mês pós-reserva: R$ 500 Ricardo + R$ 500 Ellen)',
      monthlyContribution: houseFundSettings.monthlyContributionConservative || 1000,
      annualRate: houseFundSettings.annualRateConservative || 9.5,
      color: '#3b82f6', // blue
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    moderate: {
      name: 'Intermediário',
      description: 'Aportes fixos (R$ 1.000) + média estimada de 70% das rendas extraordinárias (~R$ 700/mês)',
      monthlyContribution: houseFundSettings.monthlyContributionModerate || 1700,
      annualRate: houseFundSettings.annualRateModerate || 10.5,
      color: '#10b981', // emerald
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    accelerated: {
      name: 'Acelerado',
      description: 'Aportes fixos + rendas extras + economia gerada com faturas e mercado abaixo do teto',
      monthlyContribution: houseFundSettings.monthlyContributionAccelerated || 2400,
      annualRate: houseFundSettings.annualRateAccelerated || 11.5,
      color: '#8b5cf6', // purple
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
  };

  // Cálculo de projeção mês a mês para até 60 meses
  const projectionData = React.useMemo(() => {
    const data: Array<{
      month: string;
      mesNumero: number;
      conservador: number;
      intermediario: number;
      acelerado: number;
      metaEntrada: number;
    }> = [];

    let balCons = houseFundBalance;
    let balMod = houseFundBalance;
    let balAcc = houseFundBalance;

    const rCons = getMonthlyRate(scenariosConfig.conservative.annualRate);
    const rMod = getMonthlyRate(scenariosConfig.moderate.annualRate);
    const rAcc = getMonthlyRate(scenariosConfig.accelerated.annualRate);

    const baseDate = new Date();

    for (let i = 0; i <= 48; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      if (i > 0) {
        balCons = balCons * (1 + rCons) + scenariosConfig.conservative.monthlyContribution;
        balMod = balMod * (1 + rMod) + scenariosConfig.moderate.monthlyContribution;
        balAcc = balAcc * (1 + rAcc) + scenariosConfig.accelerated.monthlyContribution;
      }

      data.push({
        month: monthLabel,
        mesNumero: i,
        conservador: Math.round(balCons),
        intermediario: Math.round(balMod),
        acelerado: Math.round(balAcc),
        metaEntrada: targetDownPayment,
      });
    }

    return data;
  }, [houseFundBalance, targetDownPayment, scenariosConfig]);

  // Calcular meses restantes para cada cenário
  const calculateMonthsToGoal = (monthlyAporte: number, annualRate: number) => {
    const r = getMonthlyRate(annualRate);
    let bal = houseFundBalance;
    let months = 0;
    while (bal < targetDownPayment && months < 240) {
      bal = bal * (1 + r) + monthlyAporte;
      months++;
    }
    return months;
  };

  const monthsCons = calculateMonthsToGoal(scenariosConfig.conservative.monthlyContribution, scenariosConfig.conservative.annualRate);
  const monthsMod = calculateMonthsToGoal(scenariosConfig.moderate.monthlyContribution, scenariosConfig.moderate.annualRate);
  const monthsAcc = calculateMonthsToGoal(scenariosConfig.accelerated.monthlyContribution, scenariosConfig.accelerated.annualRate);

  const getEstimatedDate = (monthsCount: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsCount);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Building2 className="w-3.5 h-3.5" />
              Objetivo Estratégico da Família
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Compra da Nova Casa
            </h2>
            <p className="text-sm sm:text-base text-indigo-200/80 leading-relaxed">
              Fundo independente e blindado para a conquista do imóvel próprio. Acompanhe a meta de entrada, simule cenários com rendimento composto e visualize a data estimada da chave.
            </p>
          </div>

          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[220px]">
            <div className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">
              Status da Reserva de Emergência
            </div>
            <div className="mt-1 flex items-center gap-2">
              {isEmergencyCompleted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300 text-sm">8 Meses Concluídos</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300 text-sm">
                    {((totalEmergencyFund / emergencySettings.targetAmount) * 100).toFixed(0)}% Atingida
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-indigo-300/80 mt-1">
              {isEmergencyCompleted
                ? 'Fluxo liberado: 100% dos aportes fixos e 70% extras direcionados para a Casa.'
                : `Faltam ${formatCurrencyBR(emergencyRemaining)} para liberar o redirecionamento total.`}
            </p>
          </div>
        </div>
      </div>

      {/* Regra de Transição e Redirecionamento */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Regras do Fundo da Casa & Reserva de Emergência
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>Antes de atingir 8 meses de reserva:</strong> O Fundo da Casa pode receber aportes voluntários, transferências do Cofrinho Casa/Manutenção e parte dos 20% extras.
              <br />
              <strong>Depois de atingir os 8 meses (R$ 55.200):</strong> Redirecionamento automático dos R$ 500 mensais de Ricardo, R$ 500 mensais de Ellen e 70% de todas as rendas extraordinárias para este fundo.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Acumulado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valor Acumulado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrencyBR(houseFundBalance)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Rendimento acum.:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              +{formatCurrencyBR(houseFundYield)}
            </span>
          </div>
        </div>

        {/* Meta da Entrada */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Meta da Entrada
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrencyBR(targetDownPayment)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Imóvel total est.:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrencyBR(houseFundSettings.estimatedPropertyTotal || 400000)}
            </span>
          </div>
        </div>

        {/* Percentual Concluído */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Progresso da Entrada
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {percentCompleted.toFixed(1)}%
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>

        {/* Valor Restante */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valor Restante
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-200">
            {formatCurrencyBR(remainingForDownPayment)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Previsão Intermediária:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {monthsMod} meses ({getEstimatedDate(monthsMod)})
            </span>
          </div>
        </div>
      </div>

      {/* Cenários Comparativos Interativos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Simulador dos Três Cenários de Conquista
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Escolha um cenário para comparar o tempo necessário para acumular os {formatCurrencyBR(targetDownPayment)} de entrada.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveScenario('conservative')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeScenario === 'conservative'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Conservador
            </button>
            <button
              onClick={() => setActiveScenario('moderate')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeScenario === 'moderate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Intermediário
            </button>
            <button
              onClick={() => setActiveScenario('accelerated')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeScenario === 'accelerated'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Acelerado
            </button>
          </div>
        </div>

        {/* Grid dos 3 Cenários */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conservador */}
          <div
            onClick={() => setActiveScenario('conservative')}
            className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${
              activeScenario === 'conservative'
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                1. Conservador
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {scenariosConfig.conservative.annualRate}% a.a.
              </span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrencyBR(scenariosConfig.conservative.monthlyContribution)}
              <span className="text-xs font-normal text-slate-500"> /mês</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 min-h-[36px]">
              {scenariosConfig.conservative.description}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tempo estimado:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{monthsCons} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Conclusão:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">{getEstimatedDate(monthsCons)}</span>
              </div>
            </div>
          </div>

          {/* Intermediário (Recomendado) */}
          <div
            onClick={() => setActiveScenario('moderate')}
            className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative ${
              activeScenario === 'moderate'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              Recomendado
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                2. Intermediário
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {scenariosConfig.moderate.annualRate}% a.a.
              </span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrencyBR(scenariosConfig.moderate.monthlyContribution)}
              <span className="text-xs font-normal text-slate-500"> /mês</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 min-h-[36px]">
              {scenariosConfig.moderate.description}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tempo estimado:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{monthsMod} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Conclusão:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{getEstimatedDate(monthsMod)}</span>
              </div>
            </div>
          </div>

          {/* Acelerado */}
          <div
            onClick={() => setActiveScenario('accelerated')}
            className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${
              activeScenario === 'accelerated'
                ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                3. Acelerado
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {scenariosConfig.accelerated.annualRate}% a.a.
              </span>
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrencyBR(scenariosConfig.accelerated.monthlyContribution)}
              <span className="text-xs font-normal text-slate-500"> /mês</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 min-h-[36px]">
              {scenariosConfig.accelerated.description}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tempo estimado:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{monthsAcc} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Conclusão:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 capitalize">{getEstimatedDate(monthsAcc)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Projeção Comparativo */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Projeção de Acumulação no Tempo (Próximos 48 Meses)
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Conservador
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Intermediário
              </span>
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Acelerado
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrencyBR(Number(value)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conservador"
                  name="Conservador"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCons)"
                />
                <Area
                  type="monotone"
                  dataKey="intermediario"
                  name="Intermediário"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMod)"
                />
                <Area
                  type="monotone"
                  dataKey="acelerado"
                  name="Acelerado"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAcc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
