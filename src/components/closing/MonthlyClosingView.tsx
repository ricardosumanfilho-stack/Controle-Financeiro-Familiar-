import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyBR, formatMonthYearBR } from '../../utils/formatters';
import {
  CheckSquare,
  Square,
  Lock,
  Unlock,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Shield,
  Save,
} from 'lucide-react';

interface ChecklistItemDef {
  id: string;
  category: string;
  title: string;
  description: string;
}

const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: 'salario_ricardo',
    category: 'Receitas',
    title: 'Salário & Adiantamento - Ricardo',
    description: 'Conferir se o adiantamento (dia 20) e o saldo de salário (dia 05) caíram na conta.',
  },
  {
    id: 'salario_ellen',
    category: 'Receitas',
    title: 'Salário & Adiantamento - Ellen',
    description: 'Verificar os proventos mensais e conferir valor líquido recebido.',
  },
  {
    id: 'rendas_extraordinarias',
    category: 'Receitas',
    title: 'Rendas Extraordinárias & 70/20/10',
    description: 'Conferir freelas, bônus, reembolsos e aplicar 70% Reserva/Casa, 20% Manutenção, 10% Lazer.',
  },
  {
    id: 'reserva_ricardo_500',
    category: 'Investimentos',
    title: 'Aporte Ricardo na Reserva (R$ 500,00)',
    description: 'Garantir a transferência mensal obrigatória de R$ 500 de Ricardo para a reserva de emergência.',
  },
  {
    id: 'reserva_ellen_500',
    category: 'Investimentos',
    title: 'Aporte Ellen na Reserva (R$ 500,00)',
    description: 'Garantir a transferência mensal obrigatória de R$ 500 de Ellen para a reserva de emergência.',
  },
  {
    id: 'fatura_ricardo',
    category: 'Cartões',
    title: 'Fatura de Cartão de Ricardo (Meta R$ 500,00)',
    description: 'Verificar se o valor total da fatura respeitou o teto combinado e efetuar o pagamento integral.',
  },
  {
    id: 'fatura_ellen',
    category: 'Cartões',
    title: 'Fatura de Cartão de Ellen (Meta R$ 500,00)',
    description: 'Verificar se a fatura de Ellen está rigorosamente dentro do teto de R$ 500 e quitada.',
  },
  {
    id: 'parcelas_futuras',
    category: 'Cartões',
    title: 'Conferência de Parcelamentos',
    description: 'Checar parcelas debitadas no mês e atualizar status de compras parceladas que estão terminando.',
  },
  {
    id: 'supermercado_ricardo_semanal',
    category: 'Alimentação',
    title: 'Transferências Semanais de Mercado - Ricardo',
    description: 'Conferir se os R$ 150/semana de Ricardo foram transferidos para a conta de compras.',
  },
  {
    id: 'supermercado_ellen_mensal',
    category: 'Alimentação',
    title: 'Aporte Mensal de Mercado - Ellen',
    description: 'Conferir a transferência de R$ 400 de Ellen no início do mês para compras gerais.',
  },
  {
    id: 'compras_supermercado_detalhadas',
    category: 'Alimentação',
    title: 'Lançamento dos Cupons e Economia do Supermercado',
    description: 'Conferir se todas as notas fiscais de mercado foram cadastradas com os descontos obtidos.',
  },
  {
    id: 'rendimentos_cofrinhos',
    category: 'Patrimônio',
    title: 'Crédito de Rendimentos dos Cofrinhos (CDI)',
    description: 'Aplicar a rentabilidade mensal aos cofrinhos e fundo da casa.',
  },
  {
    id: 'credito_reforma',
    category: 'Reforma',
    title: 'Comprovantes de Reforma da Casa',
    description: 'Reunir notas de serviços/materiais de reforma e protocolar com o proprietário para abatimento.',
  },
  {
    id: 'saldos_bancarios',
    category: 'Conciliação',
    title: 'Conciliação Final de Contas & Cofrinhos',
    description: 'Verificar se o saldo calculado bate com o extrato real das contas bancárias.',
  },
];

interface MonthlyClosingViewProps {
  onOpenGoogleSheets?: () => void;
}

export const MonthlyClosingView: React.FC<MonthlyClosingViewProps> = ({ onOpenGoogleSheets }) => {
  const {
    selectedMonth,
    closingChecklists,
    toggleClosingChecklistItem,
    toggleMonthClosed,
    updateClosingNotes,
    currentMonthSummary,
    exportExcelFull,
  } = useFinance();

  const currentChecklist = closingChecklists.find((c) => c.monthKey === selectedMonth) || {
    monthKey: selectedMonth,
    checkedItems: {},
    isClosed: false,
    notes: '',
  };

  const [notes, setNotes] = useState(currentChecklist.notes || '');

  const totalItemsCount = CHECKLIST_ITEMS.length;
  const completedItemsCount = CHECKLIST_ITEMS.filter(
    (item) => currentChecklist.checkedItems[item.id]
  ).length;
  const progressPercent = Math.round((completedItemsCount / totalItemsCount) * 100);

  const handleNotesBlur = () => {
    updateClosingNotes(selectedMonth, notes);
  };

  // Agrupar itens do checklist por categoria
  const categories = Array.from(new Set(CHECKLIST_ITEMS.map((item) => item.category)));

  const totalIncome = currentMonthSummary.totalIncome;
  const totalExpense = currentMonthSummary.totalExpense;
  const totalInvested = currentMonthSummary.totalInvested;
  const netSavings = currentMonthSummary.availableBalance + totalInvested;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5" />
              Competência: {formatMonthYearBR(selectedMonth)}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Fechamento Mensal & Prestação de Contas
            </h2>
            <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">
              Checklist operacional para garantir que todas as regras, transferências, limites de cartão e metas de investimento da família foram rigorosamente executadas no mês.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => toggleMonthClosed(selectedMonth)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all ${
                currentChecklist.isClosed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {currentChecklist.isClosed ? (
                <>
                  <Lock className="w-4 h-4" />
                  Mês Fechado (Reabrir)
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Concluir Fechamento do Mês
                </>
              )}
            </button>

            {onOpenGoogleSheets && (
              <button
                id="closing-sheets-btn"
                onClick={onOpenGoogleSheets}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
                title="Sincronizar Fechamento no Google Sheets"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Salvar no Google Sheets</span>
              </button>
            )}

            <button
              onClick={exportExcelFull}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 transition-colors"
              title="Exportar pasta de trabalho Excel completa (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportar Fechamento (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Resumo do Status do Fechamento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Status do Mês
          </span>
          <div className="mt-2 flex items-center gap-2">
            {currentChecklist.isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" /> MÊS FECHADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Unlock className="w-4 h-4" /> EM ANDAMENTO
              </span>
            )}
          </div>
          {currentChecklist.closedAt && (
            <p className="text-[11px] text-slate-400 mt-2">
              Fechado em: {new Date(currentChecklist.closedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Progresso do Checklist
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {completedItemsCount} / {totalItemsCount}
            <span className="text-xs font-semibold text-slate-400 ml-1.5">({progressPercent}%)</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Poupado no Mês
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrencyBR(netSavings)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Investimentos fixos + sobras de caixa
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Taxa de Poupança Familiar
          </span>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {savingsRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Percentual da renda total guardada
          </p>
        </div>
      </div>

      {/* Checklist e DRE Sintética */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist Operacional (2 Colunas) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              Checklist de Tarefas & Conferências
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Clique no item para marcar/desmarcar
            </span>
          </div>

          <div className="space-y-6">
            {categories.map((cat) => {
              const itemsInCat = CHECKLIST_ITEMS.filter((i) => i.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                    {cat}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {itemsInCat.map((item) => {
                      const isChecked = !!currentChecklist.checkedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleClosingChecklistItem(selectedMonth, item.id)}
                          className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            )}
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div
                              className={`text-xs font-bold leading-tight ${
                                isChecked
                                  ? 'text-emerald-900 dark:text-emerald-300 line-through opacity-80'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anotações do Fechamento */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Observações & Decisões Financeiras do Mês
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Neste mês conseguimos economizar R$ 120 no supermercado e antecipar 1 parcela de Ricardo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              As anotações são salvas automaticamente e incluídas no relatório exportado.
            </p>
          </div>
        </div>

        {/* DRE Sintética / Resumo do Mês */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Demonstrativo do Mês
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Receitas Recorrentes (Salários)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrencyBR(currentMonthSummary.recurringIncome)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Rendas Extraordinárias</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrencyBR(currentMonthSummary.extraordinaryIncome)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between font-bold bg-slate-50 dark:bg-slate-800/40 px-2 rounded-lg">
                <span>Total de Receitas</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyBR(totalIncome)}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Despesas Recorrentes (Fixas + Assinaturas)</span>
                  {currentMonthSummary.cardSubscriptionsTotal !== undefined && currentMonthSummary.cardSubscriptionsTotal > 0 && (
                    <span className="block text-[11px] text-purple-600 dark:text-purple-400">
                      • Inclui {formatCurrencyBR(currentMonthSummary.cardSubscriptionsTotal)} em assinaturas recorrentes nos cartões
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  -{formatCurrencyBR(currentMonthSummary.recurringExpense)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Despesas Extraordinárias / Lazer</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  -{formatCurrencyBR(currentMonthSummary.extraordinaryExpense)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Aportes Reserva / Investimentos</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  -{formatCurrencyBR(totalInvested)}
                </span>
              </div>

              <div className="py-2.5 flex justify-between font-bold bg-slate-50 dark:bg-slate-800/40 px-2 rounded-lg">
                <span>Total de Saídas</span>
                <span className="text-rose-600 dark:text-rose-400">
                  -{formatCurrencyBR(totalExpense + totalInvested)}
                </span>
              </div>

              <div className="py-3 flex justify-between font-extrabold text-sm sm:text-base border-t-2 border-slate-200 dark:border-slate-700">
                <span>Saldo Livre Final</span>
                <span className={currentMonthSummary.availableBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatCurrencyBR(currentMonthSummary.availableBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Rápidos de Cumprimento de Metas */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Metas Combinadas do Mês
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span>Fatura Ricardo (Teto R$ 500)</span>
                <span className={`font-bold ${currentMonthSummary.ricardoInvoiceTotal <= 500 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrencyBR(currentMonthSummary.ricardoInvoiceTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span>Fatura Ellen (Teto R$ 500)</span>
                <span className={`font-bold ${currentMonthSummary.ellenInvoiceTotal <= 500 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrencyBR(currentMonthSummary.ellenInvoiceTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50">
                <span className="font-semibold text-purple-900 dark:text-purple-200">Total Faturas (Teto R$ 1.000)</span>
                <span className={`font-bold ${(currentMonthSummary.ricardoInvoiceTotal + currentMonthSummary.ellenInvoiceTotal) <= 1000 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrencyBR(currentMonthSummary.ricardoInvoiceTotal + currentMonthSummary.ellenInvoiceTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span>Supermercado (Teto R$ 1.000)</span>
                <span className={`font-bold ${currentMonthSummary.groceryActualSpent <= currentMonthSummary.groceryGoal ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrencyBR(currentMonthSummary.groceryActualSpent)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Informativo de Backup para Pastas do PC */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Backup Coerente para PC (.xlsx)
              </h4>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400/90 leading-relaxed">
              O arquivo de fechamento é exportado com formatação profissional, largura de colunas ajustadas e 8 abas organizadas:
            </p>
            <ul className="text-[11px] text-emerald-800/90 dark:text-emerald-400/90 space-y-1 list-disc list-inside">
              <li><b>01_DRE_e_Resumo:</b> DRE executivo, metas e reserva.</li>
              <li><b>02_Lancamentos_Mes:</b> Extrato com totais consolidados.</li>
              <li><b>03_Historico_Completo:</b> Backup de todo o caixa.</li>
              <li><b>04_Cofrinhos_e_Metas:</b> Saldos, CDI e aportes.</li>
              <li><b>05_Cartoes_Parcelas:</b> Faturas e saldo devedor.</li>
              <li><b>06_Supermercado:</b> Histórico e economias de cupons.</li>
              <li><b>07_Reforma_Aluguel:</b> Benfeitorias e compensações.</li>
              <li><b>08_Checklist_Fechamento:</b> Prestação de contas auditada.</li>
            </ul>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              <button
                type="button"
                onClick={exportExcelFull}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Baixar Planilha do Mês (.xlsx)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
