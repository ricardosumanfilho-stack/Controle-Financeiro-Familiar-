import {
  Transaction,
  TransactionType,
  PaymentMethod,
  GroceryTrip,
  CreditCard,
  CardSubscription,
  Cofrinho,
  RenovationExpense,
  MonthSummary,
  FutureRentSettings,
  SalarySettings,
  EmergencyFundSettings,
  HouseFundSettings,
} from '../types';
import { formatCurrency, formatDateBR, getMonthKey } from '../utils/formatters';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface SyncOptions {
  monthKey: string;
  summary: MonthSummary;
  transactions: Transaction[];
  cards: CreditCard[];
  cardSubscriptions?: CardSubscription[];
  cofrinhos: Cofrinho[];
  groceryTrips: GroceryTrip[];
  renovationExpenses: RenovationExpense[];
  futureRent: FutureRentSettings;
  salarySettings?: SalarySettings;
  emergencySettings?: EmergencyFundSettings;
  houseFundSettings?: HouseFundSettings;
  existingSpreadsheetId?: string;
  customTitle?: string;
}

// Helper to format API errors
function handleApiError(err: any, status?: number, defaultMsg?: string): Error {
  if (status === 401 || err?.status === 401) {
    return new Error(
      'Sessão do Google expirada ou não autorizada. Por favor, clique em "Trocar de Conta" ou reconecte sua conta Google no topo.'
    );
  }
  if (status === 403 || err?.status === 403) {
    return new Error(
      'Permissão negada (403). Certifique-se de marcar todas as caixas de permissão (Google Drive e Google Sheets) ao autorizar a conta no Google.'
    );
  }
  return new Error(err?.error?.message || err?.message || defaultMsg || 'Erro na comunicação com a API do Google.');
}

// 1. List user spreadsheets from Google Drive
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=30`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw handleApiError(err, res.status, 'Falha ao buscar planilhas do Google Drive.');
  }

  const data = await res.json();
  return data.files || [];
}

// 2. Create a new Google Spreadsheet with predefined sheets
export async function createFinanceSpreadsheet(
  accessToken: string,
  title: string
): Promise<{ id: string; webViewLink: string }> {
  const body = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'Resumo_Geral', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Lancamentos', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Cartoes_e_Faturas', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Supermercado', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Cofrinhos_e_Metas', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Reforma_e_Aluguel', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Fechamento_Mensal', gridProperties: { frozenRowCount: 1 } } },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw handleApiError(err, res.status, 'Falha ao criar planilha no Google Sheets.');
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    webViewLink: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

// 3. Ensure required sheets exist in an existing spreadsheet
export async function ensureSheetsExist(
  accessToken: string,
  spreadsheetId: string,
  requiredTitles: string[]
): Promise<void> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaRes.ok) return;

  const metaData = await metaRes.json();
  const existingSheetTitles = (metaData.sheets || []).map((s: any) => s.properties?.title);

  const missingTitles = requiredTitles.filter((t) => !existingSheetTitles.includes(t));
  if (missingTitles.length === 0) return;

  const requests = missingTitles.map((title) => ({
    addSheet: {
      properties: {
        title,
        gridProperties: { frozenRowCount: 1 },
      },
    },
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
}

// 4. Export all financial data to a Google Sheet (New or Existing)
export async function exportToGoogleSheets(
  accessToken: string,
  options: SyncOptions
): Promise<{ spreadsheetId: string; url: string; rowsSynced: number }> {
  let targetSpreadsheetId = options.existingSpreadsheetId;
  let webViewUrl = '';

  const sheetTitles = [
    'Resumo_Geral',
    'Lancamentos',
    'Cartoes_e_Faturas',
    'Supermercado',
    'Cofrinhos_e_Metas',
    'Reforma_e_Aluguel',
    'Fechamento_Mensal',
  ];

  if (!targetSpreadsheetId) {
    const title = options.customTitle || `Gestão Financeira Familiar - ${options.monthKey}`;
    const created = await createFinanceSpreadsheet(accessToken, title);
    targetSpreadsheetId = created.id;
    webViewUrl = created.webViewLink;
  } else {
    await ensureSheetsExist(accessToken, targetSpreadsheetId, sheetTitles);
    webViewUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`;
  }

  // Prepare data arrays
  const { summary, monthKey, transactions, cards, cofrinhos, groceryTrips, renovationExpenses, futureRent } = options;

  // Tab 1: Resumo_Geral
  const resumoRows: (string | number)[][] = [
    ['MÉTRICA / INDICADOR', 'VALOR (R$)', 'STATUS / META', 'RESPONSÁVEL / DETALHES'],
    ['Competência do Relatório', monthKey, 'Ativo', 'Gestão Ricardo & Ellen'],
    ['Data da Sincronização', new Date().toLocaleString('pt-BR'), 'Sincronizado', 'Google Sheets Sync'],
    ['---', '---', '---', '---'],
    ['RECEITA TOTAL DO MÊS', summary.totalIncome, 'Recebido', 'Família'],
    ['Salário Líquido Ricardo', summary.incomeByPerson?.['Ricardo'] || 5300, 'R$ 5.300 / mês', 'Ricardo'],
    ['Salário Líquido Ellen', summary.incomeByPerson?.['Ellen'] || 1600, 'R$ 1.600 / mês', 'Ellen'],
    ['Rendas Extraordinárias', summary.extraordinaryIncome, 'Regra 70/20/10', '70% Reserva, 20% Desejos, 10% Livre'],
    ['---', '---', '---', '---'],
    ['DESPESAS TOTAIS DO MÊS', summary.totalExpense, summary.totalExpense <= summary.totalIncome ? 'Dentro da Renda' : 'Deficitário', 'Família'],
    ['Despesas Recorrentes (Fixas/Moradia)', summary.recurringExpense, 'Orçamento', 'Essenciais'],
    ['Despesas Extraordinárias/Variáveis', summary.extraordinaryExpense, 'Controle', 'Variáveis'],
    ['Saldo Líquido Mensal', summary.balance, summary.balance >= 0 ? 'POSITIVO' : 'NEGATIVO', 'Disponível'],
    ['Saldo Acumulado', summary.cumulativeBalance, 'Caixa Total', 'Patrimônio de Curto Prazo'],
    ['---', '---', '---', '---'],
    ['RESERVA DE EMERGÊNCIA (8 Meses)', summary.emergencyFundCurrent, `${summary.emergencyFundPercentage.toFixed(1)}% atingido`, `Meta: R$ ${summary.emergencyFundTarget.toLocaleString('pt-BR')}`],
    ['Aporte Ricardo na Reserva/Invest.', summary.investmentRicardo, summary.investmentRicardo >= 500 ? 'Meta Cumprida (R$ 500)' : 'Pendente', 'Ricardo'],
    ['Aporte Ellen na Reserva/Invest.', summary.investmentEllen, summary.investmentEllen >= 500 ? 'Meta Cumprida (R$ 500)' : 'Pendente', 'Ellen'],
    ['---', '---', '---', '---'],
    ['FATURA CARTÃO RICARDO', summary.ricardoInvoiceTotal, summary.ricardoInvoiceTotal <= 500 ? 'Dentro da Meta (R$ 500)' : 'Acima da Meta', 'Ricardo'],
    ['FATURA CARTÃO ELLEN', summary.ellenInvoiceTotal, summary.ellenInvoiceTotal <= 500 ? 'Dentro da Meta (R$ 500)' : 'Acima da Meta', 'Ellen'],
    ['---', '---', '---', '---'],
    ['SUPERMERCADO FAMILIAR', summary.groceryActualSpent, summary.groceryActualSpent <= summary.groceryGoal ? 'Dentro da Meta (R$ 1.000)' : 'Estourou Meta', 'Meta: R$ 1.000,00'],
  ];

  // Tab 2: Lancamentos
  const lancamentosRows: (string | number)[][] = [
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
      'Recorrente',
      'Status',
      'Forma de Pagamento',
      'Conta / Cofrinho',
      'Parcela',
      'Observações',
    ],
    ...transactions.map((t) => [
      t.id,
      t.date,
      t.competenceMonth || getMonthKey(t.date),
      t.description,
      (t.type || 'despesa').toUpperCase(),
      t.category,
      t.subcategory || '',
      t.person,
      t.amount,
      t.isRecurring ? 'SIM' : 'NÃO',
      t.paid ? 'PAGO' : 'PENDENTE',
      t.paymentMethod,
      t.accountOrPot || '',
      t.installmentInfo ? `${t.installmentInfo.current}/${t.installmentInfo.total}` : '-',
      t.notes || '',
    ]),
  ];

  // Tab 3: Cartoes_e_Faturas
  const cartoesRows: (string | number)[][] = [
    [
      'Cartão / Fatura',
      'Titular',
      'Banco / Bandeira',
      'Meta de Teto Mensal (R$)',
      'Total Gasto no Mês (R$)',
      'Status da Meta',
      '% Utilizado do Teto',
      'Dia Fechamento',
      'Dia Vencimento',
    ],
    ...cards.map((c) => {
      const cardTxs = transactions.filter((t) => t.cardId === c.id && (t.competenceMonth || getMonthKey(t.date)) === monthKey);
      const txSpent = cardTxs.reduce((sum, t) => sum + t.amount, 0);
      const cardSubs = (options.cardSubscriptions || []).filter(
        (sub) =>
          sub.cardId === c.id &&
          sub.status !== 'paused' &&
          sub.status !== 'cancelled' &&
          sub.isActive !== false &&
          (!sub.startMonth || sub.startMonth <= monthKey) &&
          (!sub.endMonth || sub.endMonth >= monthKey)
      );
      const subsSpent = cardSubs.reduce((sum, sub) => sum + sub.amount, 0);
      const spent = txSpent + subsSpent;
      const limit = c.monthlyLimitGoal || 500;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return [
        c.name,
        c.person,
        c.brand || c.name || '',
        limit,
        spent,
        spent <= limit ? 'DENTRO DA META' : 'ACIMA DA META',
        `${pct.toFixed(1)}%`,
        c.closingDay,
        c.dueDay,
      ];
    }),
  ];

  // Tab 4: Supermercado
  const supermercadoRows: (string | number)[][] = [
    [
      'ID',
      'Data',
      'Estabelecimento',
      'Responsável',
      'Semana do Mês',
      'Total Gasto (R$)',
      'Economia Promoções (R$)',
      'Economia App/CPF (R$)',
      'Economia Cartão (R$)',
      'Forma Pagamento',
      'Qtd Itens Registrados',
      'Observações',
    ],
    ...groceryTrips.map((g) => {
      const day = parseInt(g.date.split('-')[2] || '1', 10);
      const weekNum = Math.min(5, Math.ceil(day / 7));
      return [
        g.id,
        g.date,
        g.storeName,
        g.person,
        `Semana ${weekNum}`,
        g.totalAmount,
        g.promoSavings || g.promotionalSavings || 0,
        g.cpfAppSavings || g.appOrCpfSavings || 0,
        g.cardSavings || g.storeCardSavings || 0,
        g.paymentMethod,
        g.products?.length || g.items?.length || 0,
        g.notes || '',
      ];
    }),
  ];

  // Tab 5: Cofrinhos_e_Metas
  const cofrinhosRows: (string | number)[][] = [
    [
      'ID',
      'Nome do Cofrinho',
      'Tipo de Meta',
      'Responsável',
      'Instituição Financeira',
      'Tipo Aplicação',
      'Saldo Atual (R$)',
      'Meta Alvo (R$)',
      '% Concluído',
      'Rendimento do Mês (R$)',
      'Rendimento Acumulado (R$)',
      'Taxa de Rentabilidade',
      'Status',
    ],
    ...cofrinhos.map((c) => {
      const pct = c.targetAmount && c.targetAmount > 0 ? (c.currentBalance / c.targetAmount) * 100 : 100;
      return [
        c.id,
        c.name,
        c.type,
        c.person,
        c.institution,
        c.applicationType,
        c.currentBalance,
        c.targetAmount || 0,
        `${pct.toFixed(1)}%`,
        c.monthlyYield,
        c.accumulatedYield,
        c.cdiPercentage ? `${c.cdiPercentage}% CDI` : `${c.customAnnualRate || 0}% a.a.`,
        c.status,
      ];
    }),
  ];

  // Tab 6: Reforma_e_Aluguel
  const reformaRows: (string | number)[][] = [
    [
      'ID',
      'Data',
      'Descrição da Benfeitoria',
      'Quem Pagou',
      'Valor Pago (R$)',
      'Autorização do Proprietário',
      'Valor Aceito (R$)',
      'Valor em Análise (R$)',
      'Já Compensado (R$)',
      'Saldo a Compensar em 2027 (R$)',
      'Comprovante / Nota',
      'Observações',
    ],
    ...renovationExpenses.map((r) => [
      r.id,
      r.date,
      r.description,
      r.paidBy,
      r.amount,
      (r.ownerAuthorized || 'pendente').toUpperCase(),
      r.acceptedAmount,
      r.underAnalysisAmount,
      r.alreadyCompensatedAmount,
      r.acceptedAmount - r.alreadyCompensatedAmount,
      r.receiptDescription || '',
      r.notes || '',
    ]),
  ];

  // Tab 7: Fechamento_Mensal
  const fechamentoRows: (string | number)[][] = [
    ['ITEM DO FECHAMENTO MENSAL', 'STATUS', 'VALOR APURADO (R$)', 'DETALHES / REGRA DE CONTROLE'],
    ['1. Salários & Adiantamentos Confirmados', 'CONCLUÍDO', summary.recurringIncome, 'Ricardo (R$ 5.300) + Ellen (R$ 1.600)'],
    ['2. Rendas Extras com Rateio 70/20/10', summary.extraordinaryIncome > 0 ? 'APLICADO' : 'SEM EXTRAS', summary.extraordinaryIncome, '70% Reserva/Casa, 20% Desejos, 10% Livre'],
    ['3. Aporte Ricardo na Reserva/Investimentos', summary.investmentRicardo >= 500 ? 'CONCLUÍDO' : 'PENDENTE', summary.investmentRicardo, 'Meta: R$ 500,00'],
    ['4. Aporte Ellen na Reserva/Investimentos', summary.investmentEllen >= 500 ? 'CONCLUÍDO' : 'PENDENTE', summary.investmentEllen, 'Meta: R$ 500,00'],
    ['5. Fatura Cartão Ricardo (Meta R$ 500)', summary.ricardoInvoiceTotal <= 500 ? 'META CUMPRIDA' : 'ACIMA DA META', summary.ricardoInvoiceTotal, 'Meta: Máx R$ 500,00'],
    ['6. Fatura Cartão Ellen (Meta R$ 500)', summary.ellenInvoiceTotal <= 500 ? 'META CUMPRIDA' : 'ACIMA DA META', summary.ellenInvoiceTotal, 'Meta: Máx R$ 500,00'],
    ['7. Supermercado Semanal + Cesta Básica', summary.groceryActualSpent <= 1000 ? 'DENTRO DO LIMITE' : 'ESTOUROU LIMITE', summary.groceryActualSpent, 'Ricardo R$ 150/sem + Ellen R$ 400'],
    ['8. Créditos de Reforma Lançados', 'REGISTRADO', renovationExpenses.reduce((acc, r) => acc + r.acceptedAmount, 0), 'Compensação a partir de Janeiro/2027'],
    ['---', '---', '---', '---'],
    ['SALDO LÍQUIDO FINAL DO MÊS', summary.balance >= 0 ? 'POSITIVO' : 'DEFICITÁRIO', summary.balance, 'Disponível para aportes adicionais'],
  ];

  // Batch Update Values in Google Sheets
  const updateData = [
    { range: 'Resumo_Geral!A1', values: resumoRows },
    { range: 'Lancamentos!A1', values: lancamentosRows },
    { range: 'Cartoes_e_Faturas!A1', values: cartoesRows },
    { range: 'Supermercado!A1', values: supermercadoRows },
    { range: 'Cofrinhos_e_Metas!A1', values: cofrinhosRows },
    { range: 'Reforma_e_Aluguel!A1', values: reformaRows },
    { range: 'Fechamento_Mensal!A1', values: fechamentoRows },
  ];

  // Clear existing values and update
  for (const item of updateData) {
    // Clear sheet contents first to prevent leftover rows
    const sheetName = item.range.split('!')[0];
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z500:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => {});
  }

  // Batch update values
  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateData,
    }),
  });

  if (!batchRes.ok) {
    const err = await batchRes.json().catch(() => ({}));
    throw handleApiError(err, batchRes.status, 'Falha ao sincronizar dados na planilha do Google Sheets.');
  }

  const totalRows = updateData.reduce((sum, item) => sum + item.values.length, 0);

  return {
    spreadsheetId: targetSpreadsheetId,
    url: webViewUrl,
    rowsSynced: totalRows,
  };
}

// 5. Read / Import transactions from a Google Sheet
export async function readTransactionsFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'Lancamentos'
): Promise<Partial<Transaction>[]> {
  const range = encodeURIComponent(`${sheetName}!A2:O200`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw handleApiError(err, res.status, 'Não foi possível ler a aba da planilha.');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, idx) => {
    const date = row[1] || new Date().toISOString().split('T')[0];
    const competence = row[2] || getMonthKey(date);
    const description = row[3] || `Transação importada ${idx + 1}`;
    const typeStr = (row[4] || 'despesa').toLowerCase();
    let type: TransactionType = 'despesa';
    if (typeStr.includes('receita') || typeStr.includes('income')) {
      type = 'receita';
    } else if (typeStr.includes('invest')) {
      type = 'investimento';
    } else if (typeStr.includes('transf')) {
      type = 'transferencia';
    } else if (typeStr.includes('rend')) {
      type = 'rendimento';
    }

    const category = row[5] || 'Outros';
    const subcategory = row[6] || undefined;
    const person = row[7] === 'Ellen' ? 'Ellen' : row[7] === 'Ricardo' ? 'Ricardo' : 'Família';
    const amountVal = parseFloat(String(row[8]).replace(',', '.')) || 0;
    const isRecurring = String(row[9]).toUpperCase() === 'SIM';
    const paid = String(row[10]).toUpperCase() !== 'PENDENTE';
    const paymentMethod = (row[11] || 'pix') as PaymentMethod;
    const accountOrPot = row[12] || undefined;
    const notes = row[14] || undefined;

    return {
      date,
      competenceMonth: competence,
      description,
      type,
      category,
      subcategory,
      person,
      amount: amountVal,
      isRecurring,
      paid,
      paymentMethod,
      accountOrPot,
      notes,
    };
  });
}
