import * as XLSX from 'xlsx';
import {
  Transaction,
  GroceryTrip,
  CreditCard,
  Cofrinho,
  RenovationExpense,
  MonthSummary,
  FutureRentSettings,
} from '../types';
import { formatCurrency, formatDateBR, getMonthKey } from './formatters';

export function exportFullWorkbookExcel({
  monthKey,
  summary,
  transactions,
  cards,
  cofrinhos,
  groceryTrips,
  renovationExpenses,
  futureRent,
}: {
  monthKey: string;
  summary: MonthSummary;
  transactions: Transaction[];
  cards: CreditCard[];
  cofrinhos: Cofrinho[];
  groceryTrips: GroceryTrip[];
  renovationExpenses: RenovationExpense[];
  futureRent: FutureRentSettings;
}) {
  const wb = XLSX.utils.book_new();

  // 1. Resumo do Mês
  const summaryData = [
    ['RELATÓRIO FINANCEIRO FAMILIAR', `Competência: ${monthKey}`],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    [],
    ['Métrica', 'Valor (R$)', 'Status / Observação'],
    ['Receita Total', summary.totalIncome, 'Salários + Rendas Extras'],
    ['Receitas Recorrentes', summary.recurringIncome, 'Salário Ricardo + Ellen'],
    ['Receitas Extraordinárias', summary.extraordinaryIncome, 'Regra 70/20/10'],
    ['Despesas Totais', summary.totalExpense, 'Gastos Realizados'],
    ['Despesas Recorrentes', summary.recurringExpense, 'Contas Fixas & Moradia'],
    ['Despesas Extraordinárias', summary.extraordinaryExpense, 'Gastos Pontuais'],
    ['Saldo Líquido do Mês', summary.balance, summary.balance >= 0 ? 'POSITIVO' : 'NEGATIVO'],
    ['Saldo Acumulado', summary.cumulativeBalance, 'Disponível'],
    [],
    ['RESERVA DE EMERGÊNCIA (8 Meses)', '', ''],
    ['Meta da Reserva', summary.emergencyFundTarget, 'R$ 6.900 × 8 meses = R$ 55.200'],
    ['Acumulado na Reserva', summary.emergencyFundCurrent, `${summary.emergencyFundPercentage.toFixed(1)}% Concluído`],
    ['Aporte Ricardo', summary.investmentRicardo, 'Meta: R$ 500,00'],
    ['Aporte Ellen', summary.investmentEllen, 'Meta: R$ 500,00'],
    [],
    ['FATURAS DE CARTÃO (Meta R$ 500/pessoa)', '', ''],
    ['Fatura Ricardo', summary.ricardoInvoiceTotal, summary.ricardoInvoiceTotal <= 500 ? 'Dentro da Meta' : 'Acima da Meta'],
    ['Fatura Ellen', summary.ellenInvoiceTotal, summary.ellenInvoiceTotal <= 500 ? 'Dentro da Meta' : 'Acima da Meta'],
    [],
    ['SUPERMERCADO (Meta R$ 1.000/mês)', '', ''],
    ['Meta Orçada', summary.groceryGoal, 'R$ 1.000,00'],
    ['Total Gasto', summary.groceryActualSpent, summary.groceryActualSpent <= 1000 ? 'Dentro da Meta' : 'Ultrapassou'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo_Geral');

  // 2. Lançamentos
  const txRows = transactions.map((t) => ({
    ID: t.id,
    Data: t.date,
    Competência: t.competenceMonth || getMonthKey(t.date),
    Descrição: t.description,
    Tipo: t.type.toUpperCase(),
    Categoria: t.category,
    Subcategoria: t.subcategory || '',
    Responsável: t.person,
    'Valor (R$)': t.amount,
    Recorrente: t.isRecurring ? 'Sim' : 'Não',
    Status: t.paid ? 'Pago' : 'Pendente',
    'Forma de Pagamento': t.paymentMethod,
    'Conta / Cofrinho': t.accountOrPot || '',
    Observações: t.notes || '',
  }));
  const wsTransactions = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Lancamentos');

  // 3. Cofrinhos e Metas
  const cofRows = cofrinhos.map((c) => ({
    ID: c.id,
    Nome: c.name,
    Tipo: c.type,
    Responsável: c.person,
    Instituição: c.institution,
    Aplicação: c.applicationType,
    'Saldo Atual (R$)': c.currentBalance,
    'Meta (R$)': c.targetAmount || 0,
    'Rendimento do Mês (R$)': c.monthlyYield,
    'Rendimento Acumulado (R$)': c.accumulatedYield,
    'Tipo Rendimento': c.yieldType,
    'Taxa CDI / Anual': c.cdiPercentage ? `${c.cdiPercentage}% CDI` : `${c.customAnnualRate || 0}% a.a.`,
    Status: c.status,
    Observações: c.notes || '',
  }));
  const wsCofrinhos = XLSX.utils.json_to_sheet(cofRows);
  XLSX.utils.book_append_sheet(wb, wsCofrinhos, 'Cofrinhos_e_Metas');

  // 4. Supermercado
  const grocRows = groceryTrips.map((g) => ({
    ID: g.id,
    Data: g.date,
    Estabelecimento: g.storeName,
    Responsável: g.person,
    'Total Gasto (R$)': g.totalAmount,
    'Economia Promoções (R$)': g.promoSavings || g.promotionalSavings || 0,
    'Economia App/CPF (R$)': g.cpfAppSavings || g.appOrCpfSavings || 0,
    'Economia Cartão (R$)': g.cardSavings || g.storeCardSavings || 0,
    'Forma Pagamento': g.paymentMethod,
    Observações: g.notes || '',
  }));
  const wsGrocery = XLSX.utils.json_to_sheet(grocRows);
  XLSX.utils.book_append_sheet(wb, wsGrocery, 'Supermercado');

  // 5. Reforma e Futuro Aluguel
  const renovRows = renovationExpenses.map((r) => ({
    ID: r.id,
    Data: r.date,
    Descrição: r.description,
    'Valor Pago (R$)': r.amount,
    'Quem Pagou': r.paidBy,
    'Autorização Proprietário': r.ownerAuthorized.toUpperCase(),
    'Valor Solicitado (R$)': r.requestedAmount,
    'Valor Aceito (R$)': r.acceptedAmount,
    'Em Análise (R$)': r.underAnalysisAmount,
    'Já Compensado (R$)': r.alreadyCompensatedAmount,
    'Saldo a Compensar (R$)': r.acceptedAmount - r.alreadyCompensatedAmount,
    Comprovante: r.receiptDescription || '',
    Observações: r.notes || '',
  }));
  const wsRenov = XLSX.utils.json_to_sheet(renovRows);
  XLSX.utils.book_append_sheet(wb, wsRenov, 'Reforma_e_Aluguel');

  // Write file
  XLSX.writeFile(wb, `Gestao_Financeira_Familiar_${monthKey}.xlsx`);
}
