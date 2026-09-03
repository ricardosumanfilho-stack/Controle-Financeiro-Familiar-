import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Person, MonthlyAporteStatus } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { ShieldCheck, Settings, CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'contribution' | 'settings';
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  mode = 'contribution',
}) => {
  const {
    addEmergencyContribution,
    emergencySettings,
    updateEmergencySettings,
    selectedMonth,
    cofrinhos,
    setMonthlyAporteStatus,
    person1Name,
    person2Name,
  } = useFinance();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  // Contribution state
  const [person, setPerson] = useState<Person>(p1);
  const [amount, setAmount] = useState('500');
  const [institution, setInstitution] = useState('Tesouro Selic 2029 / CDB 100% CDI');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<MonthlyAporteStatus>('realizado');
  const [notes, setNotes] = useState('');

  // Settings state
  const [targetMonths, setTargetMonths] = useState(emergencySettings.targetMonths || 8);
  const [familySalaryIncome, setFamilySalaryIncome] = useState(emergencySettings.familySalaryIncome || 6900);
  const [ricardoObligation, setRicardoObligation] = useState(emergencySettings.ricardoMonthlyObligation || 500);
  const [ellenObligation, setEllenObligation] = useState(emergencySettings.ellenMonthlyObligation || 500);
  const [redirectWhenCompleted, setRedirectWhenCompleted] = useState(
    emergencySettings.redirectWhenCompleted !== false
  );
  const [redirectTargetCofrinhoId, setRedirectTargetCofrinhoId] = useState(
    emergencySettings.redirectTargetCofrinhoId || 'cof-casa'
  );

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setTargetMonths(emergencySettings.targetMonths || 8);
      setFamilySalaryIncome(emergencySettings.familySalaryIncome || 6900);
      setRicardoObligation(emergencySettings.ricardoMonthlyObligation || 500);
      setEllenObligation(emergencySettings.ellenMonthlyObligation || 500);
      setRedirectWhenCompleted(emergencySettings.redirectWhenCompleted !== false);
      setRedirectTargetCofrinhoId(emergencySettings.redirectTargetCofrinhoId || 'cof-casa');
    }
  }, [isOpen, selectedMonth, emergencySettings]);

  const calculatedTarget = familySalaryIncome * targetMonths;

  const handleSubmitContribution = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Informe um valor de aporte válido.');
      return;
    }

    addEmergencyContribution({
      person,
      amount: numAmount,
      institution: institution.trim() || 'Tesouro Selic',
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
      status,
    });

    if (person === 'Ricardo' || person === 'Ellen') {
      setMonthlyAporteStatus(person, status);
    }

    onClose();
  };

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencySettings({
      targetMonths: Number(targetMonths),
      familySalaryIncome: Number(familySalaryIncome),
      monthlyLivingCost: Number(familySalaryIncome),
      targetAmount: Number(calculatedTarget),
      ricardoMonthlyObligation: Number(ricardoObligation),
      ellenMonthlyObligation: Number(ellenObligation),
      redirectWhenCompleted,
      redirectTargetCofrinhoId,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'contribution'
          ? 'Registrar Aporte — Reserva de Emergência'
          : 'Configurar Parâmetros da Reserva de Emergência'
      }
      subtitle={
        mode === 'contribution'
          ? 'Aporte mensal de segurança familiar (Meta mensal: R$ 500 Ricardo + R$ 500 Ellen)'
          : 'Cálculo automático de 8 meses de salário familiar e regras de redirecionamento'
      }
    >
      {mode === 'contribution' ? (
        <form onSubmit={handleSubmitContribution} className="space-y-4">
          {/* Origem */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Titular do Aporte
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[p1, p2].map((p, idx) => {
                const active = person === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setPerson(p);
                      setAmount('500');
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
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

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Valores Rápidos:</span>
            <button
              type="button"
              onClick={() => setAmount('500')}
              className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-200 font-semibold"
            >
              R$ 500 (Aporte Fixo)
            </button>
            <button
              type="button"
              onClick={() => setAmount('1000')}
              className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-200 font-semibold"
            >
              R$ 1.000 (Ambos)
            </button>
          </div>

          {/* Valor & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor do Aporte (R$)
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data do Aporte
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Status do Aporte Mensal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Status do Aporte Mensal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'programado', label: 'Programado', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-300' },
                { id: 'realizado', label: 'Realizado', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-300' },
                { id: 'parcial', label: 'Parcial', icon: AlertTriangle, color: 'text-blue-600 bg-blue-50 border-blue-300' },
                { id: 'nao_realizado', label: 'Não Realizado', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-300' },
              ].map((st) => {
                const active = status === st.id;
                const Icon = st.icon;
                return (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setStatus(st.id as MonthlyAporteStatus)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? `${st.color} font-bold shadow-2xs dark:bg-slate-800`
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Instituição / Aplicação
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Tesouro Direto Selic 2029, Sofisa Direto 110% CDI, Nubank"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Aporte mensal fixo programado após pagamento do adiantamento"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              Salvar Aporte
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmitSettings} className="space-y-4">
          {/* Target Months and Family Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Meses de Cobertura Almejados
              </label>
              <input
                type="number"
                min="1"
                max="24"
                required
                value={targetMonths}
                onChange={(e) => setTargetMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Padrão estrutural: 8 meses
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Renda Salarial Familiar Base (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={familySalaryIncome}
                onChange={(e) => setFamilySalaryIncome(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ricardo R$ 5.300 + Ellen R$ 1.600 = R$ 6.900
              </span>
            </div>
          </div>

          {/* Calculated Meta Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 block">
                Meta Automática Calculada
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(calculatedTarget)}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {targetMonths} × {formatCurrency(familySalaryIncome)}
            </span>
          </div>

          {/* Monthly Obligations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Aporte Mensal Ricardo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ricardoObligation}
                onChange={(e) => setRicardoObligation(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Aporte Mensal Ellen (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ellenObligation}
                onChange={(e) => setEllenObligation(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
              />
            </div>
          </div>

          {/* Redirection Rule when Completed */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="redirect-rule-check"
                checked={redirectWhenCompleted}
                onChange={(e) => setRedirectWhenCompleted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="redirect-rule-check" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <strong>Redirecionar automaticamente 70% da renda extraordinária</strong> para outro cofrinho quando a reserva atingir a meta total ({formatCurrency(calculatedTarget)}).
              </label>
            </div>

            {redirectWhenCompleted && (
              <div className="pl-7">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Cofrinho de Destino do Redirecionamento:
                </label>
                <select
                  value={redirectTargetCofrinhoId}
                  onChange={(e) => setRedirectTargetCofrinhoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {cofrinhos
                    .filter((c) => c.type !== 'reserva')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCurrency(c.currentBalance)})
                      </option>
                    ))}
                </select>
              </div>
            )}
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
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
