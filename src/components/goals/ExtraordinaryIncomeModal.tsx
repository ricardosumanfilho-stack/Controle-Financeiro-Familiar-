import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Person } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Sparkles,
  ShieldCheck,
  Home,
  Palmtree,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface ExtraordinaryIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  'Hora extra',
  'Diária de viagem (saldo)',
  'PLR / Bônus',
  '13º Salário',
  'Férias (saldo extra)',
  'Restituição Imposto de Renda',
  'Bonificação por meta',
  'Renda extra freelance',
];

export const ExtraordinaryIncomeModal: React.FC<ExtraordinaryIncomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    distributeExtraordinaryIncome,
    globalCofrinhoSettings,
    emergencySettings,
    totalEmergencyFund,
    selectedMonth,
  } = useFinance();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('1500');
  const [person, setPerson] = useState<Person>('Ricardo');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    resAmount: number;
    casaAmount: number;
    lazerAmount: number;
    redirected: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('1500');
      setPerson('Ricardo');
      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setNotes('');
      setSuccessInfo(null);
    }
  }, [isOpen, selectedMonth]);

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;

  const resPct = (globalCofrinhoSettings.extraordinaryReservaPercentage || 70) / 100;
  const casaPct = (globalCofrinhoSettings.extraordinaryCasaManutencaoPercentage || 20) / 100;
  const lazerPct = (globalCofrinhoSettings.extraordinaryLazerPercentage || 10) / 100;

  const calcResAmount = Math.round(numAmount * resPct * 100) / 100;
  const calcCasaAmount = Math.round(numAmount * casaPct * 100) / 100;
  const calcLazerAmount = Math.round((numAmount - calcResAmount - calcCasaAmount) * 100) / 100;

  const isEmergencyMet = totalEmergencyFund >= emergencySettings.targetAmount;
  const willRedirect = isEmergencyMet && globalCofrinhoSettings.redirectAfterEmergencyMet;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Informe a descrição da renda extraordinária.');
      return;
    }
    if (numAmount <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    const res = distributeExtraordinaryIncome({
      description: description.trim(),
      amount: numAmount,
      person,
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
    });

    setSuccessInfo({
      resAmount: res.resAmount,
      casaAmount: res.casaAmount,
      lazerAmount: res.lazerAmount,
      redirected: res.redirected,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Divisão de Renda Extraordinária"
      subtitle="Distribuição estratégica da regra 70% Reserva / 20% Casa e Manutenção / 10% Lazer"
    >
      {successInfo ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Renda Distribuída com Sucesso!
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              O valor total de <strong>{formatCurrency(numAmount)}</strong> foi creditado e separado nos respectivos cofrinhos:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 block">
                70% {successInfo.redirected ? 'Nova Casa' : 'Reserva'}
              </span>
              <span className="text-base font-black text-emerald-800 dark:text-emerald-100">
                {formatCurrency(successInfo.resAmount)}
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 block">
                20% Casa/Manutenção
              </span>
              <span className="text-base font-black text-amber-800 dark:text-amber-100">
                {formatCurrency(successInfo.casaAmount)}
              </span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300 block">
                10% Cofrinho Lazer
              </span>
              <span className="text-base font-black text-purple-800 dark:text-purple-100">
                {formatCurrency(successInfo.lazerAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl transition-colors mt-2"
          >
            Concluir e Voltar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Sugestões Rápidas de Origem
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDescription(item)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    description === item
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Descrição do Recebimento Extraordinário
            </label>
            <input
              type="text"
              required
              placeholder="Ex: PLR 1º Semestre, Hora Extra Fevereiro, Restituição IRPF"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Responsible Person */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Quem recebeu?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Ricardo', 'Ellen', 'Família'] as Person[]).map((p) => {
                const active = person === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPerson(p)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      active
                        ? p === 'Ricardo'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : p === 'Ellen'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor Total Recebido (R$)
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data do Crédito
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Real-time Visual Split Breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Divisão Automática Calculada
              </span>
              <span className="text-xs text-slate-500">
                Regra 70 / 20 / 10
              </span>
            </div>

            <div className="space-y-2">
              {/* 70% Card */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                    {willRedirect ? <Home className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        70% — {willRedirect ? 'Compra da Nova Casa' : 'Reserva de Emergência'}
                      </span>
                      {willRedirect && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                          Meta 100% Batida
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {willRedirect
                        ? 'Redirecionado porque a Reserva de Emergência já atingiu R$ 55.200'
                        : 'Fortalecimento da segurança financeira familiar'}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(calcResAmount)}
                </span>
              </div>

              {/* 20% Card */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-lg">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      20% — Casa e Manutenção
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Zelo do lar, manutenção do carro, reformas ou patrimônio
                    </span>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(calcCasaAmount)}
                </span>
              </div>

              {/* 10% Card */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-lg">
                    <Palmtree className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      10% — Cofrinho Lazer
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Passeios, restaurantes, viagens de férias e momentos de lazer
                    </span>
                  </div>
                </div>
                <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                  {formatCurrency(calcLazerAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-xl text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Reembolsos corporativos de despesas não configuram renda extraordinária e devem ser registrados como reembolso padrão, não aplicando a regra 70/20/10.
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Depositado na conta corrente de Ricardo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <span>Distribuir Renda 70/20/10</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
