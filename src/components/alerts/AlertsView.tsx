import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AppAlert, ActiveTab } from '../../types';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Building,
  Check,
  Filter,
  Sparkles,
  Zap,
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { alerts, dismissAlert, setActiveTab } = useFinance();
  const [filterType, setFilterType] = useState<'all' | 'danger' | 'warning' | 'info' | 'success'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const getAlertIcon = (type: AppAlert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
  };

  const getAlertBg = (type: AppAlert['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50';
      case 'warning':
        return 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50';
      case 'success':
        return 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50';
      case 'info':
      default:
        return 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Zap className="w-3.5 h-3.5" />
              Monitoramento Inteligente & Regras do Casal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Central de Alertas & Notificações
            </h2>
            <p className="text-sm sm:text-base text-indigo-200/80 leading-relaxed">
              O motor de regras monitora continuamente as metas de cartão (R$ 500), aportes fixos (R$ 500 cada), orçamento de mercado, saldo negativo e antecipação de parcelas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[140px]">
              <div className="text-2xl font-black text-white">
                {alerts.length}
              </div>
              <div className="text-xs text-indigo-200 font-semibold uppercase tracking-wider mt-0.5">
                Alertas Ativos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Severidade */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('danger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'danger'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Críticos ({alerts.filter((a) => a.type === 'danger').length})
          </button>
          <button
            onClick={() => setFilterType('warning')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'warning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            Atenção ({alerts.filter((a) => a.type === 'warning').length})
          </button>
          <button
            onClick={() => setFilterType('info')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'info'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            Informativos ({alerts.filter((a) => a.type === 'info').length})
          </button>
          <button
            onClick={() => setFilterType('success')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'success'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Conquistas ({alerts.filter((a) => a.type === 'success').length})
          </button>
        </div>
      </div>

      {/* Lista de Alertas Ativos */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tudo em ordem! Nenhum alerta pendente nesta categoria.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              O orçamento familiar está cumprindo os tetos e regras programadas para o período.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all ${getAlertBg(alert.type)} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {alert.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {alert.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {alert.actionTab && (
                  <button
                    onClick={() => setActiveTab(alert.actionTab as ActiveTab)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
                  >
                    <span>{alert.actionLabel || 'Ver Detalhes'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                  title="Dispensar alerta"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Regras Financeiras da Família (Guia de Diretrizes) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Guia de Regras Financeiras do Casal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Meta de Fatura: R$ 500 cada
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              O teto mensal para despesas individuais no cartão é de R$ 500 para Ricardo e R$ 500 para Ellen.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Aporte Mensal: R$ 500 cada
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Investimento fixo todo dia 05 para a Reserva de Emergência (e Casa após conclusão dos 8 meses).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Distribuição 70% / 20% / 10%
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Rendas extraordinárias são particionadas: 70% Reserva/Casa, 20% Casa/Manutenção e 10% Lazer.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-indigo-500" />
              Supermercado Estruturado
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Ricardo aporta R$ 150/semana e Ellen R$ 400/mês, totalizando R$ 1.000/mês para alimentação da casa.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-purple-500" />
              Crédito de Reforma
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Notas fiscais de reforma são guardadas e validadas com o proprietário para abater no aluguel a partir de 2027.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              Reserva Blindada (8 meses)
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              A reserva de R$ 55.200 protege contra imprevistos e nunca deve ser misturada com o Fundo da Casa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
