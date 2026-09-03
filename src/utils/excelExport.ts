import XLSX from 'xlsx-js-style';
import {
  Transaction,
  GroceryTrip,
  CreditCard,
  Cofrinho,
  CofrinhoMovement,
  RenovationExpense,
  MonthSummary,
  FutureRentSettings,
  InstallmentPurchase,
  MonthlyClosingChecklist,
  SalarySettings,
  EmergencyFundSettings,
  GroceryMonthPlan,
} from '../types';
import { formatDateBR, formatMonthYearBR, getMonthKey } from './formatters';

export interface ExportExcelFullParams {
  monthKey: string;
  summary: MonthSummary;
  transactions: Transaction[];
  cards: CreditCard[];
  cofrinhos: Cofrinho[];
  cofrinhoMovements?: CofrinhoMovement[];
  groceryTrips: GroceryTrip[];
  groceryPlan?: GroceryMonthPlan;
  renovationExpenses: RenovationExpense[];
  futureRent?: FutureRentSettings;
  installmentPurchases?: InstallmentPurchase[];
  closingChecklists?: MonthlyClosingChecklist[];
  salarySettings?: SalarySettings;
  emergencySettings?: EmergencyFundSettings;
  person1Name?: string;
  person2Name?: string;
}

const CHECKLIST_DEFINITIONS = [
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
    title: 'Rendas Extraordinárias & Regra 70/20/10',
    description: 'Conferir freelas, bônus, 13º e aplicar 70% Reserva/Casa, 20% Compra Casa Nova, 10% Lazer.',
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
    description: 'Verificar se o valor total da fatura respeitou o teto combinado de R$ 500 e efetuar o pagamento integral.',
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
    description: 'Aplicar a rentabilidade mensal aos cofrinhos e ao fundo da casa.',
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

// Visual Style definitions for ExcelJS-Style
const STYLES = {
  // Main Title Bar (Deep Emerald)
  mainTitle: {
    font: { name: 'Segoe UI', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '064E3B' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'medium', color: { rgb: '047857' } },
      bottom: { style: 'medium', color: { rgb: '047857' } },
      left: { style: 'thin', color: { rgb: '047857' } },
      right: { style: 'thin', color: { rgb: '047857' } },
    },
  },
  // Subtitle / Info Row (Soft Mint)
  subHeader: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: '065F46' } },
    fill: { fgColor: { rgb: 'ECFDF5' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'A7F3D0' } },
      bottom: { style: 'thin', color: { rgb: 'A7F3D0' } },
      left: { style: 'thin', color: { rgb: 'A7F3D0' } },
      right: { style: 'thin', color: { rgb: 'A7F3D0' } },
    },
  },
  // Section Banner (Dark Slate)
  sectionHeader: {
    font: { name: 'Segoe UI', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: '334155' } },
      bottom: { style: 'thin', color: { rgb: '334155' } },
      left: { style: 'thin', color: { rgb: '334155' } },
      right: { style: 'thin', color: { rgb: '334155' } },
    },
  },
  // Table Column Header (Emerald 600)
  tableHeaderEmerald: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '059669' } },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '047857' } },
      bottom: { style: 'medium', color: { rgb: '047857' } },
      left: { style: 'thin', color: { rgb: '047857' } },
      right: { style: 'thin', color: { rgb: '047857' } },
    },
  },
  // Secondary Table Header (Slate 700)
  tableHeaderSlate: {
    font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '334155' } },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '1E293B' } },
      bottom: { style: 'medium', color: { rgb: '1E293B' } },
      left: { style: 'thin', color: { rgb: '1E293B' } },
      right: { style: 'thin', color: { rgb: '1E293B' } },
    },
  },
  // Regular Data Row (Even)
  dataEven: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } },
    },
  },
  // Regular Data Row (Odd Zebra)
  dataOdd: {
    font: { name: 'Segoe UI', sz: 9.5, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'F8FAFC' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } },
    },
  },
  // Summary & Totals Row (Accounting Style)
  totalRow: {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'E2E8F0' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: '64748B' } },
      bottom: { style: 'double', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    },
  },
  // Key Highlight Row (Positive Surplus / Important Balance)
  highlightPositiveRow: {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '065F46' } },
    fill: { fgColor: { rgb: 'D1FAE5' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: '10B981' } },
      bottom: { style: 'double', color: { rgb: '059669' } },
      left: { style: 'thin', color: { rgb: '6EE7B7' } },
      right: { style: 'thin', color: { rgb: '6EE7B7' } },
    },
  },
  // Key Highlight Row (Deficit / Alert)
  highlightNegativeRow: {
    font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '991B1B' } },
    fill: { fgColor: { rgb: 'FEE2E2' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'EF4444' } },
      bottom: { style: 'double', color: { rgb: 'DC2626' } },
      left: { style: 'thin', color: { rgb: 'FCA5A5' } },
      right: { style: 'thin', color: { rgb: 'FCA5A5' } },
    },
  },
  // Positive Status Badge / Pill
  statusSuccess: {
    font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '166534' } },
    fill: { fgColor: { rgb: 'DCFCE7' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '86EFAC' } },
      bottom: { style: 'thin', color: { rgb: '86EFAC' } },
      left: { style: 'thin', color: { rgb: '86EFAC' } },
      right: { style: 'thin', color: { rgb: '86EFAC' } },
    },
  },
  // Negative / Warning Status Badge
  statusDanger: {
    font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '991B1B' } },
    fill: { fgColor: { rgb: 'FEE2E2' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FCA5A5' } },
      bottom: { style: 'thin', color: { rgb: 'FCA5A5' } },
      left: { style: 'thin', color: { rgb: 'FCA5A5' } },
      right: { style: 'thin', color: { rgb: 'FCA5A5' } },
    },
  },
  // Attention / Warning Badge
  statusWarning: {
    font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '9A3412' } },
    fill: { fgColor: { rgb: 'FFEDD5' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FDBA74' } },
      bottom: { style: 'thin', color: { rgb: 'FDBA74' } },
      left: { style: 'thin', color: { rgb: 'FDBA74' } },
      right: { style: 'thin', color: { rgb: 'FDBA74' } },
    },
  },
  // Neutral / Info Badge
  statusInfo: {
    font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '334155' } },
    fill: { fgColor: { rgb: 'F1F5F9' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    },
  },
};

const SUCCESS_KEYWORDS = [
  'POSITIVO',
  'SOBRA DE CAIXA',
  'DENTRO DA META',
  'DENTRO DO TETO',
  'CUMPRIDO',
  '[X] CONCLUÍDO',
  'FECHADO',
  'FECHAMENTO CONCLUÍDO',
  'PAGO',
  'RECEBIDO',
  'CONFORME PREVISTO',
  'SIM',
  'ATIVA',
  'ATIVO',
  'AUTORIZADO',
  'EXCELENTE',
];

const DANGER_KEYWORDS = [
  'NEGATIVO',
  'DÉFICIT',
  'ACIMA DO LIMITE',
  'ESTOUROU',
  'PENDENTE',
  '[ ] PENDENTE',
  'ABAIXO',
  'ATENÇÃO',
  'RECUSADO',
  'EM ANDAMENTO',
  'NÃO',
  'CANCELADO',
];

const WARNING_KEYWORDS = [
  'EM ANÁLISE',
  'PARCIAL',
  'REGULAR',
  'ATENÇÃO',
  'VARIÁVEL',
];

/**
 * Applies sophisticated visual formatting, borders, colors and number formats to worksheets
 */
function formatWorksheet(
  ws: XLSX.WorkSheet,
  colWidths: number[],
  currencyCols: number[] = [],
  percentCols: number[] = [],
  centerCols: number[] = []
) {
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const rowsConfig: { hpt: number }[] = [];

  for (let R = range.s.r; R <= range.e.r; ++R) {
    const firstCellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
    const firstCell = ws[firstCellRef];
    const firstVal = firstCell ? String(firstCell.v || '').trim() : '';

    // Classify row type
    const isMainTitle = R === 0;
    const isSubHeader = R === 1 || R === 2;
    const isSectionHeader =
      /^[0-9]\.\s+[A-ZÁ-Ú\s]+/.test(firstVal) ||
      /^(PAINEL|HISTÓRICO|MAPA|REGISTRO|RESUMO|ANOTAÇÕES|VALIDAÇÃO)/.test(firstVal);
    
    // Check if it's a table header row (e.g. ID, Data, Linha, Cartão, Fundo, etc.)
    const isTableHeader =
      !isSectionHeader &&
      !isMainTitle &&
      !isSubHeader &&
      (firstVal === 'ID' ||
        firstVal === 'Linha / Classificação Financeira' ||
        firstVal === 'Meta / Compromisso' ||
        firstVal === 'Fundo / Cofrinho' ||
        firstVal === 'Cartão' ||
        firstVal === 'Meta Orçada Mensal (R$)' ||
        firstVal === 'Total Investido em Reforma (R$)' ||
        firstVal === 'Nº' ||
        firstVal === 'Linha / Conta');

    const isTotalRow =
      firstVal.startsWith('(=) TOTAL') ||
      firstVal.startsWith('(=) RESULTADO') ||
      firstVal.startsWith('TOTAL DE') ||
      firstVal.startsWith('SALDO LÍQUIDO') ||
      firstVal.startsWith('TOTAL ACUMULADO') ||
      firstVal.startsWith('TAXA DE POUPANÇA');

    const isHighlightPositive =
      firstVal.includes('SOBRA DE CAIXA') ||
      (firstVal.startsWith('SALDO LÍQUIDO') && typeof firstCell?.v === 'number' && firstCell.v >= 0);

    const isHighlightNegative =
      firstVal.includes('DÉFICIT') ||
      (firstVal.startsWith('SALDO LÍQUIDO') && typeof firstCell?.v === 'number' && firstCell.v < 0);

    // Set row height based on hierarchy
    if (isMainTitle) {
      rowsConfig[R] = { hpt: 28 };
    } else if (isSubHeader) {
      rowsConfig[R] = { hpt: 20 };
    } else if (isSectionHeader) {
      rowsConfig[R] = { hpt: 24 };
    } else if (isTableHeader) {
      rowsConfig[R] = { hpt: 22 };
    } else if (isTotalRow) {
      rowsConfig[R] = { hpt: 22 };
    } else if (!firstVal && R > 2) {
      rowsConfig[R] = { hpt: 12 }; // Spacer row
    } else {
      rowsConfig[R] = { hpt: 19 }; // Standard data row
    }

    const isOddDataRow = R % 2 === 1;

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = ws[cellRef];

      // If cell is undefined on title/section rows, create an empty styled cell for continuous banner
      if (!cell && (isMainTitle || isSubHeader || isSectionHeader || isTableHeader || isTotalRow)) {
        ws[cellRef] = { t: 's', v: '' };
        cell = ws[cellRef];
      }

      if (!cell) continue;

      const cellValStr = String(cell.v ?? '').trim();
      const upperVal = cellValStr.toUpperCase();

      // Determine Base Cell Style
      if (isMainTitle) {
        cell.s = { ...STYLES.mainTitle };
      } else if (isSubHeader) {
        cell.s = { ...STYLES.subHeader };
      } else if (isSectionHeader) {
        cell.s = { ...STYLES.sectionHeader };
      } else if (isTableHeader) {
        cell.s = { ...STYLES.tableHeaderEmerald };
      } else if (isHighlightPositive) {
        cell.s = { ...STYLES.highlightPositiveRow };
      } else if (isHighlightNegative) {
        cell.s = { ...STYLES.highlightNegativeRow };
      } else if (isTotalRow) {
        cell.s = { ...STYLES.totalRow };
      } else {
        // Regular Data row with zebra background
        cell.s = isOddDataRow ? { ...STYLES.dataOdd } : { ...STYLES.dataEven };

        // Check if cell is a status badge
        const isSuccess = SUCCESS_KEYWORDS.some((kw) => upperVal.includes(kw));
        const isDanger = DANGER_KEYWORDS.some((kw) => upperVal.includes(kw));
        const isWarning = WARNING_KEYWORDS.some((kw) => upperVal.includes(kw));

        if (isSuccess && !isTotalRow && !currencyCols.includes(C)) {
          cell.s = { ...STYLES.statusSuccess };
        } else if (isDanger && !isTotalRow && !currencyCols.includes(C)) {
          cell.s = { ...STYLES.statusDanger };
        } else if (isWarning && !isTotalRow && !currencyCols.includes(C)) {
          cell.s = { ...STYLES.statusWarning };
        }
      }

      // Apply Number and Currency Formatting
      if (cell.t === 'n' && typeof cell.v === 'number') {
        if (percentCols.includes(C)) {
          cell.z = '0.0%';
          cell.s.alignment = { ...cell.s.alignment, horizontal: 'right' };
        } else if (currencyCols.includes(C)) {
          cell.z = '"R$" #,##0.00;[Red]("R$" #,##0.00);"-"';
          cell.s.alignment = { ...cell.s.alignment, horizontal: 'right' };
        } else {
          // Plain integer / counter
          cell.s.alignment = { ...cell.s.alignment, horizontal: 'center' };
        }
      } else if (centerCols.includes(C) || /^\d{2}\/\d{2}\/\d{4}$/.test(cellValStr) || /^\d{4}-\d{2}$/.test(cellValStr)) {
        // Date / ID / Code
        cell.s.alignment = { ...cell.s.alignment, horizontal: 'center' };
      }
    }
  }

  ws['!rows'] = rowsConfig;
}

export function exportFullWorkbookExcel({
  monthKey,
  summary,
  transactions,
  cards,
  cofrinhos,
  cofrinhoMovements = [],
  groceryTrips,
  groceryPlan,
  renovationExpenses,
  futureRent,
  installmentPurchases = [],
  closingChecklists = [],
  salarySettings,
  emergencySettings,
  person1Name = 'Ricardo',
  person2Name = 'Ellen',
}: ExportExcelFullParams) {
  const wb = XLSX.utils.book_new();

  const p1 = person1Name || 'Ricardo';
  const p2 = person2Name || 'Ellen';

  const currentChecklist = closingChecklists.find((c) => c.monthKey === monthKey) || {
    monthKey,
    checkedItems: {},
    isClosed: false,
    notes: '',
  };

  const totalChecklistItems = CHECKLIST_DEFINITIONS.length;
  const completedChecklistItems = CHECKLIST_DEFINITIONS.filter(
    (item) => currentChecklist.checkedItems[item.id]
  ).length;
  const checklistPercent = Math.round((completedChecklistItems / totalChecklistItems) * 100);

  const monthTransactions = transactions.filter((t) => {
    const comp = t.competenceMonth || getMonthKey(t.date);
    return comp === monthKey;
  });

  const monthGroceryTrips = groceryTrips.filter((g) => getMonthKey(g.date) === monthKey);
  const groceryPromoTotal = monthGroceryTrips.reduce((sum, g) => sum + (g.promoSavings || g.promotionalSavings || 0), 0);
  const groceryCpfTotal = monthGroceryTrips.reduce((sum, g) => sum + (g.cpfAppSavings || g.appOrCpfSavings || 0), 0);
  const groceryCardTotal = monthGroceryTrips.reduce((sum, g) => sum + (g.cardSavings || g.storeCardSavings || 0), 0);
  const groceryTotalSavings = groceryPromoTotal + groceryCpfTotal + groceryCardTotal;

  const monthIncome = summary.totalIncome || monthTransactions
    .filter((t) => t.type === 'receita' || t.type === 'rendimento')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = summary.totalExpense || monthTransactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthInvested = summary.totalInvested || 0;
  const netSavings = summary.availableBalance + monthInvested;
  const savingsRate = monthIncome > 0 ? (netSavings / monthIncome) * 100 : 0;

  // ==========================================
  // ABA 1: DRE & RESUMO EXECUTIVO DO FECHAMENTO
  // ==========================================
  const dreData: any[][] = [
    ['RELATÓRIO FINANCEIRO FAMILIAR & FECHAMENTO MENSAL', '', '', '', ''],
    [`Competência: ${formatMonthYearBR(monthKey)}`, `Mês Referência: ${monthKey}`, '', `Data do Backup: ${new Date().toLocaleString('pt-BR')}`, ''],
    [`Titulares: ${p1} & ${p2}`, `Status: ${currentChecklist.isClosed ? 'FECHADO' : 'EM ANDAMENTO'}`, '', `Checklist: ${completedChecklistItems}/${totalChecklistItems} (${checklistPercent}%)`, ''],
    [],
    ['1. DEMONSTRATIVO DE RESULTADOS (DRE DO MÊS)', '', '', '', ''],
    ['Linha / Classificação Financeira', 'Orçado / Meta (R$)', 'Realizado no Mês (R$)', 'Diferença / Status', 'Regra & Observações Operacionais'],
    ['(+) Receitas Recorrentes (Salários)', summary.recurringIncome, summary.recurringIncome, 'Conforme Previsto', `Proventos fixos de ${p1} e ${p2}`],
    ['(+) Rendas Extraordinárias', 0, summary.extraordinaryIncome, summary.extraordinaryIncome > 0 ? 'Recebido' : 'Sem extras', 'Freelas/Bônus/13º - Aplicada Regra 70/20/10'],
    ['(=) TOTAL DE RECEITAS (A)', summary.recurringIncome, monthIncome, monthIncome >= summary.recurringIncome ? 'Positivo' : 'Abaixo', 'Total de Entradas no Mês'],
    [],
    ['(-) Despesas Recorrentes (Contas Fixas & Moradia)', summary.recurringExpense, summary.recurringExpense, 'Fixas', 'Aluguel, luz, internet, água, saúde e seguros'],
    ['(-) Despesas Extraordinárias / Variáveis', 0, summary.extraordinaryExpense, 'Variável', 'Gastos eventuais e imprevistos do mês'],
    ['(-) Faturas de Cartão de Crédito', 1000, summary.ricardoInvoiceTotal + summary.ellenInvoiceTotal, (summary.ricardoInvoiceTotal + summary.ellenInvoiceTotal) <= 1000 ? 'Dentro do Teto' : 'Estourou', `Meta combinada de R$ 500 (${p1}) + R$ 500 (${p2})`],
    ['(-) Supermercado & Alimentação Familiar', summary.groceryGoal || 1000, summary.groceryActualSpent, summary.groceryActualSpent <= (summary.groceryGoal || 1000) ? 'Dentro da Meta' : 'Estourou', `Meta mensal de R$ 1.000 (R$ 150/sem ${p1} + R$ 400 ${p2})`],
    ['(=) TOTAL DE DESPESAS OPERACIONAIS (B)', (summary.recurringExpense + 1000 + (summary.groceryGoal || 1000)), monthExpense, monthExpense <= (summary.totalIncome) ? 'Controlado' : 'Atenção', 'Total de Saídas Correntes'],
    [],
    ['(-) Aporte Reserva de Emergência', 1000, (summary.investmentRicardo + summary.investmentEllen), 'Meta Mensal', `R$ 500 ${p1} + R$ 500 ${p2} (+ 70% das rendas extras)`],
    ['(-) Aporte Fundo Compra da Casa Nova', 0, summary.extraordinaryIncome * 0.2, '20% Renda Extra', 'Entrada e aquisição da casa própria'],
    ['(-) Aporte Cofrinho Lazer e Viagens', 0, summary.extraordinaryIncome * 0.1, '10% Renda Extra', 'Passeios, viagens e momentos livres de culpa'],
    ['(=) TOTAL DE APORTES E INVESTIMENTOS (C)', 1000, monthInvested, 'Poupado', 'Total direcionado aos cofrinhos e patrimônio'],
    [],
    ['(=) RESULTADO LÍQUIDO DO MÊS (A - B - C)', 0, summary.availableBalance, summary.availableBalance >= 0 ? 'SOBRA DE CAIXA (POSITIVO)' : 'DÉFICIT (NEGATIVO)', 'Saldo livre restante na conta corrente'],
    ['TAXA DE POUPANÇA FAMILIAR', 0, savingsRate / 100, savingsRate >= 20 ? 'Excelente (≥20%)' : 'Regular', '% da renda total poupada no mês'],
    [],
    ['2. CUMPRIMENTO DAS METAS OPERACIONAIS DO CASAL', '', '', '', ''],
    ['Meta / Compromisso', 'Teto / Meta Estipulada (R$)', 'Valor Realizado (R$)', 'Status de Cumprimento', 'Responsável'],
    [`Fatura de Cartão - ${p1}`, 500, summary.ricardoInvoiceTotal, summary.ricardoInvoiceTotal <= 500 ? 'DENTRO DA META' : 'ACIMA DO LIMITE', p1],
    [`Fatura de Cartão - ${p2}`, 500, summary.ellenInvoiceTotal, summary.ellenInvoiceTotal <= 500 ? 'DENTRO DA META' : 'ACIMA DO LIMITE', p2],
    ['Supermercado Familiar', summary.groceryGoal || 1000, summary.groceryActualSpent, summary.groceryActualSpent <= (summary.groceryGoal || 1000) ? 'DENTRO DA META' : 'ACIMA DO LIMITE', 'Família'],
    [`Aporte Obrigatório Reserva - ${p1}`, 500, summary.investmentRicardo, summary.investmentRicardo >= 500 ? 'CUMPRIDO' : 'PENDENTE', p1],
    [`Aporte Obrigatório Reserva - ${p2}`, 500, summary.investmentEllen, summary.investmentEllen >= 500 ? 'CUMPRIDO' : 'PENDENTE', p2],
    [],
    ['3. POSIÇÃO PATRIMONIAL & RESERVA DE EMERGÊNCIA (CDI)', '', '', '', ''],
    ['Fundo / Cofrinho', 'Meta Total (R$)', 'Saldo Acumulado (R$)', '% Concluído', 'Instituição / Rendimento'],
    ['Reserva de Emergência (8 Meses)', summary.emergencyFundTarget || 55200, summary.emergencyFundCurrent, summary.emergencyFundTarget > 0 ? (summary.emergencyFundCurrent / summary.emergencyFundTarget) : 0, 'C6 Bank (CDB 102% CDI)'],
    ['Fundo Compra da Casa Nova', 150000, cofrinhos.find(c => c.id === 'cof-casa' || c.type === 'casa')?.currentBalance || 0, 0, 'C6 Bank (CDB 102% CDI)'],
    ['Cofrinho Lazer e Viagens', 6000, cofrinhos.find(c => c.id === 'cof-lazer' || c.type === 'lazer')?.currentBalance || 0, 0, 'C6 Bank (CDB 102% CDI)'],
    ['TOTAL ACUMULADO EM COFRINHOS', 211200, cofrinhos.reduce((sum, c) => sum + c.currentBalance, 0), 0, 'Patrimônio Total da Família'],
    [],
    ['4. ANOTAÇÕES & DECISÕES FINANCEIRAS REGISTRADAS NO FECHAMENTO', '', '', '', ''],
    ['Observações do Casal:', currentChecklist.notes || 'Nenhuma anotação específica registrada para este mês.', '', '', ''],
    ['Data de Fechamento:', currentChecklist.closedAt ? new Date(currentChecklist.closedAt).toLocaleString('pt-BR') : 'Mês ainda em aberto', '', '', ''],
  ];

  const wsDre = XLSX.utils.aoa_to_sheet(dreData);
  formatWorksheet(wsDre, [42, 22, 22, 26, 46], [1, 2], [3], [3]);
  XLSX.utils.book_append_sheet(wb, wsDre, '01_DRE_e_Resumo');

  // ==========================================
  // ABA 2: LANÇAMENTOS DO MÊS SELECIONADO
  // ==========================================
  const txMonthHeader = [
    ['EXTRATO DE LANÇAMENTOS DO MÊS', `Competência: ${formatMonthYearBR(monthKey)}`, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR'), '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    [
      'ID',
      'Data',
      'Competência',
      'Descrição',
      'Tipo',
      'Categoria',
      'Subcategoria',
      'Responsável',
      'Valor (R$)',
      'Recorrente?',
      'Status',
      'Forma de Pagamento',
      'Conta / Cofrinho / Cartão',
      'Observações',
    ],
  ];

  const txMonthRows = monthTransactions.map((t) => [
    t.id,
    formatDateBR(t.date),
    t.competenceMonth || getMonthKey(t.date),
    t.description,
    (t.type || 'despesa').toUpperCase(),
    t.category,
    t.subcategory || '',
    t.person,
    t.amount,
    t.isRecurring ? 'Sim' : 'Não',
    t.paid ? 'Pago' : 'Pendente',
    t.paymentMethod,
    t.accountOrPot || '',
    t.notes || '',
  ]);

  // Totais do mês
  const txMonthTotals = [
    [],
    ['TOTAL DE RECEITAS NO MÊS', '', '', '', '', '', '', '', monthIncome, '', '', '', '', ''],
    ['TOTAL DE DESPESAS NO MÊS', '', '', '', '', '', '', '', monthExpense, '', '', '', '', ''],
    ['TOTAL DE INVESTIMENTOS NO MÊS', '', '', '', '', '', '', '', monthInvested, '', '', '', '', ''],
    ['SALDO LÍQUIDO DO MÊS', '', '', '', '', '', '', '', summary.availableBalance, '', '', '', '', ''],
  ];

  const wsTxMonth = XLSX.utils.aoa_to_sheet([...txMonthHeader, ...txMonthRows, ...txMonthTotals]);
  formatWorksheet(wsTxMonth, [14, 12, 14, 32, 16, 20, 18, 16, 18, 12, 12, 20, 26, 32], [8], [], [0, 1, 2, 4, 7, 9, 10]);
  XLSX.utils.book_append_sheet(wb, wsTxMonth, '02_Lancamentos_Mes');

  // ==========================================
  // ABA 3: HISTÓRICO COMPLETO DE LANÇAMENTOS (BACKUP GERAL)
  // ==========================================
  const txAllHeader = [
    ['HISTÓRICO COMPLETO DE LANÇAMENTOS & FLUXO DE CAIXA (BACKUP GERAL)', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR'), `Total de Registros: ${transactions.length}`, '', '', '', '', '', '', '', '', '', '', ''],
    [],
    [
      'ID',
      'Data',
      'Competência',
      'Descrição',
      'Tipo',
      'Categoria',
      'Subcategoria',
      'Responsável',
      'Valor (R$)',
      'Recorrente?',
      'Status',
      'Forma de Pagamento',
      'Conta / Cofrinho / Cartão',
      'Observações',
    ],
  ];

  const sortedAllTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  const txAllRows = sortedAllTransactions.map((t) => [
    t.id,
    formatDateBR(t.date),
    t.competenceMonth || getMonthKey(t.date),
    t.description,
    (t.type || 'despesa').toUpperCase(),
    t.category,
    t.subcategory || '',
    t.person,
    t.amount,
    t.isRecurring ? 'Sim' : 'Não',
    t.paid ? 'Pago' : 'Pendente',
    t.paymentMethod,
    t.accountOrPot || '',
    t.notes || '',
  ]);

  const wsTxAll = XLSX.utils.aoa_to_sheet([...txAllHeader, ...txAllRows]);
  formatWorksheet(wsTxAll, [14, 12, 14, 32, 16, 20, 18, 16, 18, 12, 12, 20, 26, 32], [8], [], [0, 1, 2, 4, 7, 9, 10]);
  XLSX.utils.book_append_sheet(wb, wsTxAll, '03_Historico_Completo');

  // ==========================================
  // ABA 4: COFRINHOS, RESERVA & RENDIMENTOS CDI
  // ==========================================
  const cofHeader = [
    ['METAS, COFRINHOS & RESERVA DE EMERGÊNCIA (CDI)', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR'), '', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['PAINEL DE SALDOS E METAS', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'ID',
      'Nome do Cofrinho',
      'Tipo',
      'Responsável',
      'Instituição',
      'Aplicação',
      'Taxa / Rendimento',
      'Saldo Atual (R$)',
      'Meta (R$)',
      '% Concluído',
      'Rendimento Mês (R$)',
      'Rendimento Acumulado (R$)',
      'Status',
    ],
  ];

  const cofRows = cofrinhos.map((c) => {
    const target = c.targetAmount || 0;
    const progress = target > 0 ? (c.currentBalance / target) : 0;
    const rateLabel = c.cdiPercentage ? `${c.cdiPercentage}% CDI` : `${c.customAnnualRate || 0}% a.a.`;
    return [
      c.id,
      c.name,
      (c.type || 'outro').toUpperCase(),
      c.person,
      c.institution,
      c.applicationType,
      rateLabel,
      c.currentBalance,
      target,
      progress,
      c.monthlyYield || 0,
      c.accumulatedYield || 0,
      (c.status || 'ativo').toUpperCase(),
    ];
  });

  const movHeader = [
    [],
    ['HISTÓRICO DE MOVIMENTAÇÕES DOS COFRINHOS (APORTES, RESGATES & RENDIMENTOS)', '', '', '', '', '', '', ''],
    [
      'ID',
      'Data',
      'Cofrinho',
      'Tipo de Operação',
      'Valor (R$)',
      'Responsável',
      'Subfinalidade / Detalhe',
      'Observações',
    ],
  ];

  const movRows = cofrinhoMovements.map((m) => {
    const cof = cofrinhos.find((c) => c.id === m.cofrinhoId);
    return [
      m.id,
      formatDateBR(m.date),
      cof?.name || m.cofrinhoId,
      (m.type || 'aporte').toUpperCase(),
      m.amount,
      m.person || '',
      m.subPurpose || '',
      m.notes || '',
    ];
  });

  const wsCofrinhos = XLSX.utils.aoa_to_sheet([...cofHeader, ...cofRows, ...movHeader, ...movRows]);
  formatWorksheet(wsCofrinhos, [14, 30, 16, 16, 18, 22, 18, 18, 18, 14, 20, 22, 14], [4, 7, 8, 10, 11], [9], [0, 1, 2, 3, 5, 6, 12]);
  XLSX.utils.book_append_sheet(wb, wsCofrinhos, '04_Cofrinhos_e_Metas');

  // ==========================================
  // ABA 5: CARTÕES DE CRÉDITO & PARCELAMENTOS
  // ==========================================
  const cardsHeader = [
    ['CONTROLE DE CARTÕES DE CRÉDITO & COMPRAS PARCELADAS', '', '', '', '', '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR'), '', '', '', '', ''],
    [],
    ['FATURAS DO MÊS (META R$ 500,00 POR PESSOA)', '', '', '', '', '', ''],
    [
      'Cartão',
      'Titular',
      'Dia Fechamento',
      'Dia Vencimento',
      'Meta Máxima (R$)',
      'Total Gasto no Mês (R$)',
      'Status do Teto',
    ],
  ];

  const cardRows = cards.map((c) => {
    const spent = c.person === p1 ? summary.ricardoInvoiceTotal : c.person === p2 ? summary.ellenInvoiceTotal : 0;
    return [
      c.name,
      c.person,
      c.closingDay,
      c.dueDay,
      c.monthlyLimitGoal || 500,
      spent,
      spent <= (c.monthlyLimitGoal || 500) ? 'DENTRO DA META' : 'ACIMA DO LIMITE',
    ];
  });

  const installHeader = [
    [],
    ['MAPA DE COMPRAS PARCELADAS ATIVAS', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'ID',
      'Descrição da Compra',
      'Responsável',
      'Cartão / Origem',
      'Valor Total (R$)',
      'Parcela Atual',
      'Total Parcelas',
      'Valor Parcela (R$)',
      'Parcelas Restantes',
      'Saldo Devedor Restante (R$)',
      'Data da Compra',
      'Primeiro Vencimento',
      'Mês Fim Quitação',
      'Categoria',
      'Status',
    ],
  ];

  const installRows = installmentPurchases.map((inst) => {
    const current = inst.currentInstallment || 1;
    const total = inst.totalInstallments || 1;
    const remaining = inst.remainingInstallments !== undefined ? inst.remainingInstallments : Math.max(0, total - current + 1);
    const balanceRemaining = remaining * inst.installmentAmount;
    const card = cards.find((c) => c.id === inst.cardId);

    return [
      inst.id,
      inst.description,
      inst.person,
      card?.name || 'Cartão de Crédito',
      inst.totalAmount,
      current,
      total,
      inst.installmentAmount,
      remaining,
      balanceRemaining,
      inst.purchaseDate ? formatDateBR(inst.purchaseDate) : '',
      inst.firstDueDate || '',
      inst.lastDueDate || '',
      inst.category,
      (inst.status || 'ativa').toUpperCase(),
    ];
  });

  const wsCards = XLSX.utils.aoa_to_sheet([...cardsHeader, ...cardRows, ...installHeader, ...installRows]);
  formatWorksheet(wsCards, [14, 30, 16, 20, 18, 14, 14, 18, 16, 22, 14, 16, 16, 18, 14], [4, 5, 7, 9], [], [0, 1, 2, 3, 5, 6, 8, 10, 11, 12, 14]);
  XLSX.utils.book_append_sheet(wb, wsCards, '05_Cartoes_Parcelas');

  // ==========================================
  // ABA 6: SUPERMERCADO & ECONOMIA INTELIGENTE
  // ==========================================
  const grocerySummaryHeader = [
    ['GESTÃO DE SUPERMERCADO & ECONOMIA INTELIGENTE', `Competência: ${formatMonthYearBR(monthKey)}`, '', '', '', '', '', '', '', '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR'), '', '', '', '', '', '', '', '', ''],
    [],
    ['RESUMO DO ORÇAMENTO DE SUPERMERCADO', '', '', '', '', '', '', '', '', '', ''],
    ['Meta Orçada Mensal (R$)', 'Total Gasto no Mês (R$)', 'Saldo / Economia (R$)', 'Economia em Promoções (R$)', 'Economia App/CPF (R$)', 'Economia Cartão (R$)', 'Economia Total Gerada (R$)'],
    [
      summary.groceryGoal || 1000,
      summary.groceryActualSpent,
      (summary.groceryGoal || 1000) - summary.groceryActualSpent,
      groceryPromoTotal,
      groceryCpfTotal,
      groceryCardTotal,
      groceryTotalSavings,
    ],
    [],
    ['HISTÓRICO DAS IDAS AO SUPERMERCADO NO MÊS', '', '', '', '', '', '', '', '', '', ''],
    [
      'ID',
      'Data',
      'Estabelecimento / Supermercado',
      'Responsável',
      'Valor Pago (R$)',
      'Economia Promoção (R$)',
      'Economia App/CPF (R$)',
      'Economia Cartão (R$)',
      'Economia Total (R$)',
      'Forma de Pagamento',
      'Observações',
    ],
  ];

  const groceryRows = monthGroceryTrips.map((g) => {
    const promo = g.promoSavings || g.promotionalSavings || 0;
    const cpf = g.cpfAppSavings || g.appOrCpfSavings || 0;
    const card = g.cardSavings || g.storeCardSavings || 0;
    const totalSav = promo + cpf + card;

    return [
      g.id,
      formatDateBR(g.date),
      g.storeName,
      g.person,
      g.totalAmount,
      promo,
      cpf,
      card,
      totalSav,
      g.paymentMethod,
      g.notes || '',
    ];
  });

  const wsGrocery = XLSX.utils.aoa_to_sheet([...grocerySummaryHeader, ...groceryRows]);
  formatWorksheet(wsGrocery, [14, 12, 28, 16, 18, 20, 20, 20, 20, 20, 32], [0, 1, 2, 3, 4, 5, 6, 7, 8], [], [0, 1, 3]);
  XLSX.utils.book_append_sheet(wb, wsGrocery, '06_Supermercado');

  // ==========================================
  // ABA 7: REFORMA DA CASA & CRÉDITO DE ALUGUEL
  // ==========================================
  const totalRenovPaid = renovationExpenses.reduce((sum, r) => sum + r.amount, 0);
  const totalRenovAccepted = renovationExpenses.reduce((sum, r) => sum + r.acceptedAmount, 0);
  const totalRenovCompensated = renovationExpenses.reduce((sum, r) => sum + r.alreadyCompensatedAmount, 0);
  const remainingCompensation = totalRenovAccepted - totalRenovCompensated;

  const renovHeader = [
    ['FUNDO DE REFORMA DA CASA & CRÉDITO DE ALUGUEL (COMPENSAÇÃO A PARTIR DE JAN/2027)', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR'), '', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['PAINEL DE CRÉDITO DE ALUGUEL & BENFEITORIAS', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Investido em Reforma (R$)', 'Total Aprovado pelo Proprietário (R$)', 'Valor Já Compensado (R$)', 'Saldo Atual a Compensar (R$)', 'Previsão de Início das Compensações', 'Valor do Aluguel Bruto (R$)'],
    [
      totalRenovPaid,
      totalRenovAccepted,
      totalRenovCompensated,
      remainingCompensation,
      futureRent?.startDate ? `${futureRent.startDate} (Jan/2027)` : '2027-01 (Jan/2027)',
      futureRent?.grossRentAmount || 800,
    ],
    [],
    ['REGISTRO DETALHADO DE DESPESAS DE REFORMA & NOTAS FISCAIS', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'ID',
      'Data',
      'Descrição da Benfeitoria / Obra',
      'Valor Pago (R$)',
      'Quem Pagou',
      'Autorização Proprietário',
      'Valor Solicitado (R$)',
      'Valor Aceito (R$)',
      'Em Análise (R$)',
      'Já Compensado (R$)',
      'Saldo a Compensar (R$)',
      'Comprovante / Recibo',
      'Observações',
    ],
  ];

  const renovRows = renovationExpenses.map((r) => [
    r.id,
    formatDateBR(r.date),
    r.description,
    r.amount,
    r.paidBy,
    (r.ownerAuthorized || 'pendente').toUpperCase(),
    r.requestedAmount,
    r.acceptedAmount,
    r.underAnalysisAmount,
    r.alreadyCompensatedAmount,
    r.acceptedAmount - r.alreadyCompensatedAmount,
    r.receiptDescription || '',
    r.notes || '',
  ]);

  const wsRenov = XLSX.utils.aoa_to_sheet([...renovHeader, ...renovRows]);
  formatWorksheet(wsRenov, [14, 12, 34, 18, 16, 22, 20, 20, 18, 18, 20, 26, 32], [0, 1, 2, 3, 5, 6, 7, 8, 9, 10], [], [0, 1, 4, 5]);
  XLSX.utils.book_append_sheet(wb, wsRenov, '07_Reforma_Aluguel');

  // ==========================================
  // ABA 8: CHECKLIST OPERACIONAL & PRESTAÇÃO DE CONTAS
  // ==========================================
  const checkHeader = [
    ['CHECKLIST OPERACIONAL DE FECHAMENTO MENSAL & PRESTAÇÃO DE CONTAS', `Competência: ${formatMonthYearBR(monthKey)}`, '', '', '', ''],
    ['Status Geral do Mês', currentChecklist.isClosed ? 'FECHAMENTO CONCLUÍDO COM SUCESSO' : 'FECHAMENTO EM ANDAMENTO / ABERTO', '', '', '', ''],
    ['Conferência Operacional', `${completedChecklistItems} de ${totalChecklistItems} itens validados (${checklistPercent}%)`, '', '', '', ''],
    [],
    [
      'Nº',
      'Categoria',
      'Item / Tarefa Operacional',
      'Instrução & Detalhamento de Conferência',
      'Status de Execução',
      'Data de Conferência',
    ],
  ];

  const checkRows = CHECKLIST_DEFINITIONS.map((item, idx) => {
    const isChecked = !!currentChecklist.checkedItems[item.id];
    return [
      idx + 1,
      item.category,
      item.title,
      item.description,
      isChecked ? '[X] CONCLUÍDO' : '[ ] PENDENTE',
      currentChecklist.closedAt ? formatDateBR(currentChecklist.closedAt.slice(0, 10)) : 'Pendente',
    ];
  });

  const checkNotes = [
    [],
    ['ANOTAÇÕES E DECISÕES DO FECHAMENTO', '', '', '', '', ''],
    ['Observações Gerais:', currentChecklist.notes || 'Nenhuma anotação registrada.', '', '', '', ''],
    ['Validação dos Titulares:', `Fechamento financeiro familiar conferido por ${p1} & ${p2}.`, '', '', '', ''],
  ];

  const wsChecklist = XLSX.utils.aoa_to_sheet([...checkHeader, ...checkRows, ...checkNotes]);
  formatWorksheet(wsChecklist, [6, 18, 38, 65, 20, 20], [], [], [0, 1, 4, 5]);
  XLSX.utils.book_append_sheet(wb, wsChecklist, '08_Checklist_Fechamento');

  // ==========================================
  // GRAVAÇÃO E DOWNLOAD DO ARQUIVO .XLSX
  // Nome coerente para organizar em pastas do PC:
  // Fechamento_Financeiro_Ricardo_Ellen_AAAA_MM.xlsx
  // ==========================================
  const safeMonthKey = monthKey.replace('-', '_');
  const safeP1 = p1.replace(/\s+/g, '_');
  const safeP2 = p2.replace(/\s+/g, '_');
  const fileName = `Fechamento_Financeiro_${safeP1}_${safeP2}_${safeMonthKey}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

