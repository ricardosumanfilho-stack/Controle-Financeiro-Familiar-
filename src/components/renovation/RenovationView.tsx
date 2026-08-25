import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyBR, formatDateBR } from '../../utils/formatters';
import { RenovationExpense, Person } from '../../types';
import {
  Wrench,
  FileCheck,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Building,
  ArrowRight,
  TrendingDown,
  Info,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const RenovationView: React.FC = () => {
  const {
    renovationExpenses,
    addRenovationExpense,
    updateRenovationExpense,
    deleteRenovationExpense,
    futureRentSettings,
    updateFutureRentSettings,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidBy, setPaidBy] = useState<Person>('Ricardo');
  const [receiptDescription, setReceiptDescription] = useState('');
  const [ownerAuthorized, setOwnerAuthorized] = useState<'sim' | 'pendente' | 'nao'>('sim');
  const [requestedAmount, setRequestedAmount] = useState<number | ''>('');
  const [acceptedAmount, setAcceptedAmount] = useState<number | ''>('');
  const [underAnalysisAmount, setUnderAnalysisAmount] = useState<number | ''>('');
  const [alreadyCompensatedAmount, setAlreadyCompensatedAmount] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  const [activeTabSub, setActiveTabSub] = useState<'expenses' | 'rent_schedule'>('expenses');

  const totalSpent = renovationExpenses.reduce((sum, r) => sum + r.amount, 0);
  const totalAccepted = renovationExpenses.reduce((sum, r) => sum + r.acceptedAmount, 0);
  const totalUnderAnalysis = renovationExpenses.reduce((sum, r) => sum + r.underAnalysisAmount, 0);
  const totalCompensated = renovationExpenses.reduce((sum, r) => sum + r.alreadyCompensatedAmount, 0);
  const remainingCredit = totalAccepted - totalCompensated;

  const handleOpenNew = () => {
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setAmount('');
    setPaidBy('Ricardo');
    setReceiptDescription('');
    setOwnerAuthorized('sim');
    setRequestedAmount('');
    setAcceptedAmount('');
    setUnderAnalysisAmount(0);
    setAlreadyCompensatedAmount(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleEdit = (r: RenovationExpense) => {
    setEditingId(r.id);
    setDate(r.date);
    setDescription(r.description);
    setAmount(r.amount);
    setPaidBy(r.paidBy);
    setReceiptDescription(r.receiptDescription || '');
    setOwnerAuthorized(r.ownerAuthorized);
    setRequestedAmount(r.requestedAmount);
    setAcceptedAmount(r.acceptedAmount);
    setUnderAnalysisAmount(r.underAnalysisAmount);
    setAlreadyCompensatedAmount(r.alreadyCompensatedAmount);
    setNotes(r.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || typeof amount !== 'number' || amount <= 0) return;

    const payload = {
      date,
      description: description.trim(),
      amount,
      paidBy,
      receiptDescription: receiptDescription.trim() || undefined,
      ownerAuthorized,
      requestedAmount: typeof requestedAmount === 'number' ? requestedAmount : amount,
      acceptedAmount: typeof acceptedAmount === 'number' ? acceptedAmount : (ownerAuthorized === 'sim' ? amount : 0),
      underAnalysisAmount: typeof underAnalysisAmount === 'number' ? underAnalysisAmount : 0,
      alreadyCompensatedAmount: typeof alreadyCompensatedAmount === 'number' ? alreadyCompensatedAmount : 0,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      updateRenovationExpense(editingId, payload);
    } else {
      addRenovationExpense(payload);
    }
    setIsModalOpen(false);
  };

  // Simulação Mês a Mês do Aluguel Futuro (A partir de Jan/2027)
  const rentSimulation = React.useMemo(() => {
    const months: Array<{
      monthLabel: string;
      grossRent: number;
      creditDeduction: number;
      netRentPayable: number;
      remainingCreditAfter: number;
    }> = [];

    let currentCredit = remainingCredit;
    const monthlyRent = futureRentSettings.grossRentAmount || 800;
    const [startYear, startMonth] = (futureRentSettings.startDate || '2027-01').split('-').map(Number);

    for (let i = 0; i < 24; i++) {
      const d = new Date(startYear, startMonth - 1 + i, 10);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      let deduction = 0;
      if (futureRentSettings.compensationMethod === 'total') {
        deduction = Math.min(currentCredit, monthlyRent);
      } else {
        const fixed = futureRentSettings.fixedMonthlyCompensation || 400;
        deduction = Math.min(currentCredit, Math.min(monthlyRent, fixed));
      }

      currentCredit = Math.max(0, currentCredit - deduction);
      const netPayable = monthlyRent - deduction;

      months.push({
        monthLabel: label,
        grossRent: monthlyRent,
        creditDeduction: deduction,
        netRentPayable: netPayable,
        remainingCreditAfter: currentCredit,
      });

      if (currentCredit <= 0 && i >= 12) break; // Para quando o crédito acabar e já tiver mostrado pelo menos 1 ano
    }

    return months;
  }, [remainingCredit, futureRentSettings]);

  const monthsOfFreeRent = (futureRentSettings.grossRentAmount > 0 && remainingCredit > 0)
    ? (remainingCredit / futureRentSettings.grossRentAmount).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
              <Wrench className="w-3.5 h-3.5" />
              Compensação Contratual de Benfeitorias
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reforma & Futuro Aluguel
            </h2>
            <p className="text-sm sm:text-base text-amber-200/80 leading-relaxed">
              Controle rigoroso de todos os gastos com a reforma da casa atual. As despesas aprovadas pelo proprietário geram <strong>crédito de compensação integral</strong> contra o aluguel futuro que se inicia em <strong>Janeiro de 2027</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleOpenNew}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nova Despesa de Reforma
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gasto */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Investido na Reforma
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrencyBR(totalSpent)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {renovationExpenses.length} itens lançados com recibo
          </div>
        </div>

        {/* Crédito Aprovado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Crédito Aceito p/ Aluguel
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrencyBR(totalAccepted)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Acordo formal com proprietário
          </div>
        </div>

        {/* Em Análise */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Em Análise / Pendente
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {formatCurrencyBR(totalUnderAnalysis)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Aguardando avaliação final
          </div>
        </div>

        {/* Saldo de Crédito Disponível */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo de Crédito Disponível
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {formatCurrencyBR(remainingCredit)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Equivale a <strong>{monthsOfFreeRent} meses</strong> de aluguel (R$ {futureRentSettings.grossRentAmount}/mês)
          </div>
        </div>
      </div>

      {/* Tabs Internas: Despesas vs Cronograma de Compensação */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTabSub('expenses')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTabSub === 'expenses'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Despesas de Reforma & Comprovantes ({renovationExpenses.length})
        </button>
        <button
          onClick={() => setActiveTabSub('rent_schedule')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTabSub === 'rent_schedule'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Simulador de Compensação do Aluguel (Jan/2027)
        </button>
      </div>

      {/* Conteúdo da Tab 1: Lista de Despesas */}
      {activeTabSub === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Lançamentos da Reforma a Compensar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Todas as notas fiscais, recibos e autorizações para prestação de contas com o locador.
              </p>
            </div>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Reforma
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Descrição da Benfeitoria</th>
                  <th className="py-3.5 px-4">Quem Pagou</th>
                  <th className="py-3.5 px-4">Comprovante</th>
                  <th className="py-3.5 px-4 text-right">Valor Pago</th>
                  <th className="py-3.5 px-4 text-center">Status Aceite</th>
                  <th className="py-3.5 px-4 text-right">Crédito Aceito</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {renovationExpenses.map((item) => {
                  const isAccepted = item.ownerAuthorized === 'sim';
                  const isPending = item.ownerAuthorized === 'pendente';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateBR(item.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.description}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.paidBy === 'Ricardo'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {item.paidBy}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {item.receiptDescription || 'Recibo em mãos'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrencyBR(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Aceito
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" /> Em Análise
                          </span>
                        )}
                        {item.ownerAuthorized === 'nao' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <XCircle className="w-3 h-3" /> Não Aceito
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrencyBR(item.acceptedAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar despesa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRenovationExpense(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Tab 2: Simulador do Aluguel Futuro */}
      {activeTabSub === 'rent_schedule'}
      {activeTabSub === 'rent_schedule' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-600" />
                Cronograma de Abatimento no Aluguel Futuro (A partir de 2027)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Aluguel estipulado em <strong>R$ {futureRentSettings.grossRentAmount.toFixed(2)}/mês</strong> com início em <strong>{futureRentSettings.startDate}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500">Forma de Compensação:</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {futureRentSettings.compensationMethod === 'total' ? 'Abatimento 100% até zerar crédito' : 'Abatimento parcelado'}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mês Competência</th>
                  <th className="py-3 px-4 text-right">Aluguel Bruto</th>
                  <th className="py-3 px-4 text-right">Abatimento de Reforma</th>
                  <th className="py-3 px-4 text-right">Aluguel Líquido a Pagar</th>
                  <th className="py-3 px-4 text-right">Crédito Remanescente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rentSimulation.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {row.monthLabel}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrencyBR(row.grossRent)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      -{formatCurrencyBR(row.creditDeduction)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      {row.netRentPayable === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          R$ 0,00 (100% ISENTO)
                        </span>
                      ) : (
                        formatCurrencyBR(row.netRentPayable)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-semibold">
                      {formatCurrencyBR(row.remainingCreditAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Adicionar / Editar Despesa de Reforma */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingId ? 'Editar Despesa de Reforma' : 'Nova Despesa de Reforma da Casa'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Descrição da Obra / Serviço
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma hidráulica, troca de registros e válvula"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setAmount(val);
                      if (typeof val === 'number') {
                        setRequestedAmount(val);
                        if (ownerAuthorized === 'sim') setAcceptedAmount(val);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Quem Realizou o Pagamento
                  </label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value as Person)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Ricardo">Ricardo</option>
                    <option value="Ellen">Ellen</option>
                    <option value="Família">Família</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Aceite do Proprietário
                  </label>
                  <select
                    value={ownerAuthorized}
                    onChange={(e) => {
                      const auth = e.target.value as 'sim' | 'pendente' | 'nao';
                      setOwnerAuthorized(auth);
                      if (auth === 'sim' && typeof amount === 'number') {
                        setAcceptedAmount(amount);
                        setUnderAnalysisAmount(0);
                      } else if (auth === 'pendente' && typeof amount === 'number') {
                        setAcceptedAmount(0);
                        setUnderAnalysisAmount(amount);
                      } else {
                        setAcceptedAmount(0);
                        setUnderAnalysisAmount(0);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="sim">Sim (Aprovado / A Compensar)</option>
                    <option value="pendente">Em Análise / Pendente</option>
                    <option value="nao">Não Autorizado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Comprovante / Recibo / Nota Fiscal
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF 4829 Leroy Merlin + Recibo Encanador"
                  value={receiptDescription}
                  onChange={(e) => setReceiptDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Observações adicionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais combinados com o proprietário..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors"
                >
                  {editingId ? 'Salvar Alterações' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
