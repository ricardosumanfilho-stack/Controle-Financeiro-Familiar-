import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import {
  initAuth,
  googleSignIn,
  switchGoogleAccount,
  logout,
  getAccessToken,
} from '../../services/googleAuth';
import {
  listUserSpreadsheets,
  exportToGoogleSheets,
  readTransactionsFromGoogleSheet,
  DriveSpreadsheetFile,
} from '../../services/googleSheets';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Plus,
  Search,
  Upload,
  AlertTriangle,
  LogOut,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { formatMonthYearBR } from '../../utils/formatters';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    selectedMonth,
    currentMonthSummary,
    transactions,
    cards,
    cardSubscriptions,
    cofrinhos,
    groceryTrips,
    renovationExpenses,
    futureRentSettings,
    salarySettings,
    emergencySettings,
    houseFundSettings,
    addTransaction,
  } = useFinance();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>(
    `Gestão Financeira Familiar - ${selectedMonth}`
  );
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    url?: string;
    rowsSynced?: number;
    message?: string;
  } | null>(null);

  const [activeMode, setActiveMode] = useState<'create' | 'existing' | 'import'>('create');
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Update default title when selected month changes
  useEffect(() => {
    setCustomTitle(`Gestão Financeira Familiar - ${selectedMonth}`);
  }, [selectedMonth]);

  // Auth listener
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );

    // Also check token in memory
    getAccessToken().then((t) => {
      if (t) setToken(t);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Fetch spreadsheets if connected
  useEffect(() => {
    if (token && (activeMode === 'existing' || activeMode === 'import')) {
      handleLoadSpreadsheets();
    }
  }, [token, activeMode]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setSyncResult(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        setSyncResult({
          success: true,
          message: `Conectado com sucesso como ${res.user.displayName || res.user.email}!`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setSyncResult({
        success: false,
        message: err.message || 'Falha ao autenticar com a conta Google.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsAuthenticating(true);
    setSyncResult(null);
    setSpreadsheets([]);
    try {
      const res = await switchGoogleAccount();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        setSyncResult({
          success: true,
          message: `Conta alterada com sucesso para ${res.user.displayName || res.user.email}!`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setSyncResult({
        success: false,
        message: err.message || 'Falha ao trocar de conta Google.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setToken(null);
    setSpreadsheets([]);
    setSyncResult(null);
  };

  const handleLoadSpreadsheets = async () => {
    if (!token) return;
    setIsLoadingSpreadsheets(true);
    try {
      const list = await listUserSpreadsheets(token);
      setSpreadsheets(list);
      if (list.length > 0 && !selectedSpreadsheetId) {
        setSelectedSpreadsheetId(list[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  const handleExportToNewSpreadsheet = async () => {
    if (!token) {
      handleSignIn();
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await exportToGoogleSheets(token, {
        monthKey: selectedMonth,
        summary: currentMonthSummary,
        transactions,
        cards,
        cardSubscriptions,
        cofrinhos,
        groceryTrips,
        renovationExpenses,
        futureRent: futureRentSettings,
        salarySettings,
        emergencySettings,
        houseFundSettings,
        customTitle: customTitle.trim() || `Gestão Financeira Familiar - ${selectedMonth}`,
      });

      setSyncResult({
        success: true,
        url: result.url,
        rowsSynced: result.rowsSynced,
        message: `Planilha criada e sincronizada com sucesso no Google Drive com 7 abas formatadas!`,
      });
    } catch (err: any) {
      console.error(err);
      setSyncResult({
        success: false,
        message: err.message || 'Erro ao sincronizar dados com o Google Sheets.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportToExistingSpreadsheet = async () => {
    if (!token) {
      handleSignIn();
      return;
    }
    if (!selectedSpreadsheetId) {
      setSyncResult({
        success: false,
        message: 'Por favor, selecione uma planilha existente.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await exportToGoogleSheets(token, {
        monthKey: selectedMonth,
        summary: currentMonthSummary,
        transactions,
        cards,
        cardSubscriptions,
        cofrinhos,
        groceryTrips,
        renovationExpenses,
        futureRent: futureRentSettings,
        salarySettings,
        emergencySettings,
        houseFundSettings,
        existingSpreadsheetId: selectedSpreadsheetId,
      });

      setSyncResult({
        success: true,
        url: result.url,
        rowsSynced: result.rowsSynced,
        message: `Planilha existente atualizada com sucesso!`,
      });
    } catch (err: any) {
      console.error(err);
      setSyncResult({
        success: false,
        message: err.message || 'Erro ao atualizar planilha no Google Sheets.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePreviewImport = async () => {
    if (!token || !selectedSpreadsheetId) return;
    setIsImporting(true);
    setSyncResult(null);
    try {
      const rows = await readTransactionsFromGoogleSheet(token, selectedSpreadsheetId, 'Lancamentos');
      setImportPreview(rows);
    } catch (err: any) {
      console.error(err);
      setSyncResult({
        success: false,
        message: err.message || 'Erro ao ler dados da planilha.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.length === 0) return;
    const confirmed = window.confirm(
      `Deseja realmente importar ${importPreview.length} lançamento(s) da planilha para o aplicativo?`
    );
    if (!confirmed) return;

    let addedCount = 0;
    importPreview.forEach((tx) => {
      if (tx.description && tx.amount) {
        addTransaction({
          date: tx.date || new Date().toISOString().split('T')[0],
          competenceMonth: tx.competenceMonth || selectedMonth,
          description: tx.description,
          type: tx.type || 'expense',
          category: tx.category || 'Outros',
          subcategory: tx.subcategory,
          person: tx.person || 'Família',
          amount: tx.amount,
          isRecurring: !!tx.isRecurring,
          paid: tx.paid !== false,
          paymentMethod: tx.paymentMethod || 'Outros',
          accountOrPot: tx.accountOrPot,
          notes: tx.notes,
        });
        addedCount++;
      }
    });

    setImportPreview(null);
    setSyncResult({
      success: true,
      message: `${addedCount} lançamento(s) importado(s) com sucesso da planilha Google!`,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Integração com Google Sheets"
      subtitle="Sincronize relatórios financeiros, cofrinhos, cartões e fechamento diretamente na sua conta Google"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Google Account Status Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentUser ? (
              <>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-blue-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {currentUser.displayName || 'Usuário Google'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Conectado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Conta Google não conectada
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Conecte para sincronizar dados em tempo real no Google Drive & Sheets
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  disabled={isAuthenticating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors border border-blue-200 dark:border-blue-800 disabled:opacity-50"
                  title="Trocar para outra conta Google"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-spin' : ''}`} />
                  <span>Trocar de Conta</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Desconectar
                </button>
              </>
            ) : (
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs text-xs font-bold transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isAuthenticating ? 'Conectando...' : 'Conectar com Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Account selection tips */}
        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200/90 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dica de Acesso com outra Conta:</span> Se quiser usar outra conta Google pessoal ou profissional, clique em <span className="font-semibold text-blue-600 dark:text-blue-400">"Trocar de Conta"</span> acima. Na janela de autorização do Google, certifique-se de marcar a caixa concedendo acesso ao Google Drive / Google Sheets para permitir a criação das planilhas.
          </div>
        </div>

        {/* Sync notification message */}
        {syncResult && (
          <div
            className={`p-3.5 rounded-2xl flex items-start justify-between gap-3 text-xs ${
              syncResult.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{syncResult.message}</p>
                {syncResult.rowsSynced && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Total de {syncResult.rowsSynced} linhas geradas/atualizadas nas 7 abas.
                  </p>
                )}
              </div>
            </div>

            {syncResult.url && (
              <a
                href={syncResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-xs transition-colors"
              >
                <span>Abrir no Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Action Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveMode('create')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors relative ${
              activeMode === 'create'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Criar Nova Planilha
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('existing')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors relative ${
              activeMode === 'existing'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Atualizar Planilha Existente
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('import')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors relative ${
              activeMode === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Importar do Sheets
          </button>
        </div>

        {/* Tab 1: Criar Nova Planilha */}
        {activeMode === 'create' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Título da Planilha no Google Drive
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="Ex: Gestão Financeira Familiar - 2026-08"
              />
            </div>

            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Estrutura das 7 Abas Automáticas:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-blue-800 dark:text-blue-300/90 font-medium">
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg">📊 1. Resumo Geral</span>
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg">📝 2. Lançamentos</span>
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg">💳 3. Cartões e Faturas</span>
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg">🛒 4. Supermercado</span>
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg">🎯 5. Cofrinhos e Metas</span>
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg">🔨 6. Reforma e Aluguel</span>
                <span className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded-lg col-span-2 sm:col-span-1">✅ 7. Fechamento Mensal</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="export-new-sheets-btn"
                onClick={handleExportToNewSpreadsheet}
                disabled={isSyncing}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isSyncing ? 'Sincronizando...' : 'Criar & Sincronizar no Google Sheets'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Atualizar Planilha Existente */}
        {activeMode === 'existing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecione uma planilha do seu Google Drive
              </label>
              <button
                type="button"
                onClick={handleLoadSpreadsheets}
                disabled={isLoadingSpreadsheets || !token}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingSpreadsheets ? 'animate-spin' : ''}`} />
                Atualizar Lista
              </button>
            </div>

            {spreadsheets.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
                {spreadsheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    type="button"
                    onClick={() => setSelectedSpreadsheetId(sheet.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      selectedSpreadsheetId === sheet.id
                        ? 'bg-blue-50 dark:bg-blue-950/70 border border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs truncate">{sheet.name}</span>
                    </div>
                    {sheet.modifiedTime && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(sheet.modifiedTime).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="text-xs text-slate-500">
                  {token
                    ? 'Nenhuma planilha encontrada recentemente no Google Drive.'
                    : 'Conecte sua conta Google acima para listar suas planilhas.'}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Ou insira o ID / URL da planilha manualmente:
              </label>
              <input
                type="text"
                value={selectedSpreadsheetId}
                onChange={(e) => setSelectedSpreadsheetId(e.target.value.trim())}
                placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="update-sheets-btn"
                onClick={handleExportToExistingSpreadsheet}
                disabled={isSyncing || !selectedSpreadsheetId}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isSyncing ? 'Atualizando...' : 'Atualizar Dados nesta Planilha'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Importar do Google Sheets */}
        {activeMode === 'import' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Leia transações da aba <strong>Lancamentos</strong> de uma planilha do Google Sheets para adicionar no aplicativo.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Planilha de Origem:
              </label>
              <select
                value={selectedSpreadsheetId}
                onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">Selecione uma planilha...</option>
                {spreadsheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviewImport}
                disabled={!selectedSpreadsheetId || isImporting}
                className="px-4 py-2 text-xs font-bold bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Lendo...' : 'Pré-visualizar Registros'}</span>
              </button>
            </div>

            {importPreview && (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {importPreview.length} registro(s) encontrado(s) na planilha
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                  >
                    Importar Todos
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importPreview.slice(0, 10).map((row, i) => (
                    <div
                      key={i}
                      className="p-2 text-[11px] bg-white dark:bg-slate-900 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-semibold truncate max-w-[180px]">{row.description}</span>
                      <span className="text-slate-500">{row.date}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        R$ {Number(row.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {importPreview.length > 10 && (
                    <p className="text-[10px] text-center text-slate-400 pt-1">
                      + {importPreview.length - 10} outros registros...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500">
            Competência atual: <strong>{formatMonthYearBR(selectedMonth)}</strong>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
