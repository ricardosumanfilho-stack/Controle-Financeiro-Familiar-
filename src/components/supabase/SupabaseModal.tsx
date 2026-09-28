import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  getSupabaseCredentials,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  generateGitHubDirectUrl,
} from '../../services/supabase';
import { SUPABASE_MIGRATION_SQL } from '../../services/supabaseMigrationSql';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  ExternalLink,
  Code2,
  Table,
  ShieldCheck,
  FileCode,
  Clock,
  Play,
  Pause,
  Github,
  Link2,
  Key,
  Sliders,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const {
    isSupabaseConnected,
    supabaseAutoSyncEnabled,
    setSupabaseAutoSyncEnabled,
    supabaseSyncInterval,
    setSupabaseSyncInterval,
    supabaseNextSyncSeconds,
    supabaseLastSyncTime,
    supabaseSyncStatus,
    supabaseSyncError,
    syncWithSupabase,
    reconnectSupabase,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'sync' | 'github' | 'credentials' | 'migration'>('sync');

  // Credenciais manuais
  const [inputUrl, setInputUrl] = useState('');
  const [inputAnonKey, setInputAnonKey] = useState('');
  const [credentialsSource, setCredentialsSource] = useState<'url' | 'storage' | 'env' | 'none'>('none');
  const [credSavedMessage, setCredSavedMessage] = useState<string | null>(null);

  // Status de Teste de Conexão
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableCount?: number } | null>(null);

  // Status de Ações Manuais
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [manualActionResult, setManualActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // GitHub Link generator
  const [customGitHubUrl, setCustomGitHubUrl] = useState('');
  const [generatedGitHubLink, setGeneratedGitHubLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setInputUrl(creds.url);
      setInputAnonKey(creds.anonKey);
      setCredentialsSource(creds.source);
      setTestResult(null);
      setManualActionResult(null);
      setCredSavedMessage(null);

      // Gera link pré-configurado
      const autoLink = generateGitHubDirectUrl();
      setGeneratedGitHubLink(autoLink);
    }
  }, [isOpen]);

  useEffect(() => {
    if (customGitHubUrl.trim()) {
      const link = generateGitHubDirectUrl(customGitHubUrl.trim());
      setGeneratedGitHubLink(link);
    } else {
      const autoLink = generateGitHubDirectUrl();
      setGeneratedGitHubLink(autoLink);
    }
  }, [customGitHubUrl]);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    if (!inputUrl.trim() || !inputAnonKey.trim()) {
      setCredSavedMessage('Preencha a URL e a Chave Anon antes de salvar.');
      return;
    }
    const success = setSupabaseCredentials(inputUrl, inputAnonKey);
    if (success) {
      reconnectSupabase();
      const updated = getSupabaseCredentials();
      setCredentialsSource(updated.source);
      setCredSavedMessage('Credenciais salvas com sucesso! Conexão ativada.');
      setGeneratedGitHubLink(generateGitHubDirectUrl(customGitHubUrl || undefined));
      setTimeout(() => setCredSavedMessage(null), 4000);
    }
  };

  const handleClearCredentials = () => {
    clearSupabaseCredentials();
    setInputUrl('');
    setInputAnonKey('');
    setCredentialsSource('none');
    reconnectSupabase();
    setCredSavedMessage('Credenciais locais removidas.');
    setTestResult(null);
    setGeneratedGitHubLink('');
    setTimeout(() => setCredSavedMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
    reconnectSupabase();
  };

  const handleManualSync = async (direction: 'both' | 'pull' | 'push') => {
    setIsManualSyncing(true);
    setManualActionResult(null);
    const res = await syncWithSupabase(direction);
    setManualActionResult(res);
    setIsManualSyncing(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedGitHubLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEnv = () => {
    const creds = getSupabaseCredentials();
    const envContent = `VITE_SUPABASE_URL=${creds.url || 'https://seu-projeto.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${creds.anonKey || 'sua-chave-anon-publica'}\n`;
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleDownloadEnv = () => {
    const creds = getSupabaseCredentials();
    const envContent = `# Configuração de Banco de Dados Supabase\nVITE_SUPABASE_URL=${creds.url || 'https://seu-projeto.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${creds.anonKey || 'sua-chave-anon-publica'}\n`;
    const element = document.createElement('a');
    const file = new Blob([envContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = '.env';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_MIGRATION_SQL], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = '20260903000001_create_finance_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const tablesList = [
    { name: 'app_settings', desc: 'Configurações de salários, reservas e metas' },
    { name: 'credit_cards', desc: 'Cartões de crédito, limites e vencimentos' },
    { name: 'installment_purchases', desc: 'Parcelas ativas e antecipações' },
    { name: 'card_subscriptions', desc: 'Assinaturas e seguros fixos' },
    { name: 'transactions', desc: 'Receitas, despesas e transferências' },
    { name: 'grocery_trips', desc: 'Compras de supermercado e economia' },
    { name: 'grocery_month_plans', desc: 'Planejamento semanal/mensal de mercado' },
    { name: 'shopping_lists', desc: 'Listas semanais de supermercado' },
    { name: 'stock_items', desc: 'Controle de despensa e estoque' },
    { name: 'cesta_basica_records', desc: 'Cesta básica da Ellen e economia' },
    { name: 'cofrinhos', desc: 'Contas CDI, reserva e metas da casa' },
    { name: 'cofrinho_movements', desc: 'Aportes, retiradas e rendimentos' },
    { name: 'emergency_contributions', desc: 'Histórico de aportes na reserva' },
    { name: 'investment_contributions', desc: 'Aportes R$ 500 / pessoa' },
    { name: 'renovation_expenses', desc: 'Reforma e créditos com proprietário' },
    { name: 'monthly_closing_checklists', desc: 'Checklists de fechamento mensal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-black shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Supabase & Sincronização em Tempo Real
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sincronização bidirecional com Timer e Integração transparente com GitHub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span>
            {isSupabaseConnected ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conectado (Fonte: {credentialsSource === 'url' ? 'Link/URL' : credentialsSource === 'storage' ? 'Local' : 'Ambiente .env'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5" />
                Não Configurado (Insira credenciais na aba &quot;Credenciais&quot;)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-500' : ''}`} />
              {isTesting ? 'Testando Conexão...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`mx-6 mt-3 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{testResult.message}</div>
          </div>
        )}

        {/* Tabs Navigator */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/40 dark:bg-slate-900/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Timer & Sincronização
            {supabaseAutoSyncEnabled && isSupabaseConnected && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {supabaseNextSyncSeconds}s
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'github'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Github className="w-4 h-4" />
            Integração GitHub
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
              Link Único
            </span>
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'credentials'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" />
            Credenciais & Conexão
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'migration'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Script de Migration SQL
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              16 tabelas
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ABA 1: TIMER & SINCRONIZAÇÃO */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Card do Timer Principal */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 dark:to-slate-800/40 border border-emerald-500/20 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                      <Clock className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Timer de Sincronização Contínua
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Mantém seus dados sincronizados entre este ambiente e o link do GitHub automaticamente.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Auto-Sync */}
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 pl-2">
                      Auto-Sync com Timer:
                    </span>
                    <button
                      onClick={() => setSupabaseAutoSyncEnabled(!supabaseAutoSyncEnabled)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        supabaseAutoSyncEnabled
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {supabaseAutoSyncEnabled ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Ativado
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          Pausado
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Contador Regressivo & Seletor de Intervalo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-500/10">
                  <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-emerald-500/20">
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 min-w-[50px] text-center">
                      {supabaseNextSyncSeconds}s
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Próxima Sincronização
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {supabaseAutoSyncEnabled && isSupabaseConnected
                          ? `Executa a cada ${supabaseSyncInterval}s em segundo plano`
                          : 'Temporizador pausado'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Intervalo:
                    </span>
                    <select
                      value={supabaseSyncInterval}
                      onChange={(e) => setSupabaseSyncInterval(Number(e.target.value))}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value={15}>15 segundos (Alta frequência)</option>
                      <option value={30}>30 segundos</option>
                      <option value={60}>60 segundos (1 minuto - Recomendado)</option>
                      <option value={120}>2 minutos</option>
                      <option value={300}>5 minutos</option>
                      <option value={600}>10 minutos</option>
                    </select>
                  </div>
                </div>

                {/* Sincronização Inteligente por Foco de Aba */}
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-emerald-500/5 px-3.5 py-2.5 rounded-xl border border-emerald-500/10">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Sincronização ao focar:</strong> Sempre que você alternar entre a aba do GitHub e esta aba, os dados são atualizados imediatamente na hora em que a janela ganha foco.
                  </span>
                </div>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ações de Sincronização Manual Imediata
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleManualSync('both')}
                    disabled={isManualSyncing || !isSupabaseConnected}
                    className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <ArrowUpDown className={`w-5 h-5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                    <span>Sincronizar Tudo Agora</span>
                    <span className="text-[10px] font-normal opacity-90">(Puxa novidades & envia locais)</span>
                  </button>

                  <button
                    onClick={() => handleManualSync('push')}
                    disabled={isManualSyncing || !isSupabaseConnected}
                    className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5 text-indigo-500" />
                    <span>Enviar para Nuvem (Push)</span>
                    <span className="text-[10px] font-normal text-slate-500">(Grava estado local no Supabase)</span>
                  </button>

                  <button
                    onClick={() => handleManualSync('pull')}
                    disabled={isManualSyncing || !isSupabaseConnected}
                    className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <DownloadCloud className="w-5 h-5 text-emerald-500" />
                    <span>Baixar da Nuvem (Pull)</span>
                    <span className="text-[10px] font-normal text-slate-500">(Recarrega dados mais recentes)</span>
                  </button>
                </div>
              </div>

              {/* Feedback de Ação Manual */}
              {manualActionResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    manualActionResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {manualActionResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{manualActionResult.message}</span>
                </div>
              )}

              {/* Registro do Histórico de Sincronização */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Última sincronização bem-sucedida: </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {supabaseLastSyncTime || 'Nenhuma nesta sessão'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  {supabaseSyncStatus === 'syncing' ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sincronizando...
                    </span>
                  ) : supabaseSyncStatus === 'success' ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Nuvem Atualizada
                    </span>
                  ) : supabaseSyncStatus === 'error' ? (
                    <span className="text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Erro ({supabaseSyncError || 'Falha'})
                    </span>
                  ) : (
                    <span className="text-slate-400">Aguardando timer</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: INTEGRAÇÃO GITHUB */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-slate-50 dark:to-slate-800/40 border border-purple-500/20 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Como funciona a Integração com o GitHub?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      O código do GitHub e este ambiente conectam-se ao mesmo banco de dados PostgreSQL no Supabase.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Quando você ou sua família abrem o aplicativo pelo link do GitHub (ou GitHub Pages / Vercel), qualquer alteração feita lá é enviada para o Supabase. Graças ao <strong>Timer de Sincronização</strong>, este ambiente busca essas alterações e vice-versa sem que você precise exportar arquivos manualmente!
                </p>
              </div>

              {/* Gerador de Link Direto com Credenciais Embutidas */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Gerador de Link com Conexão Automática
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gere um link já com as chaves do Supabase embutidas na URL. Quem abrir esse link (no GitHub Pages, celular ou outro navegador) já inicia conectado ao banco de dados:
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    URL Base do seu app (ex: seu GitHub Pages ou deixe em branco para URL atual):
                  </label>
                  <input
                    type="text"
                    value={customGitHubUrl}
                    onChange={(e) => setCustomGitHubUrl(e.target.value)}
                    placeholder="https://seu-usuario.github.io/gestao-financeira/"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono break-all select-all flex items-center justify-between gap-3">
                  <span className="truncate">{generatedGitHubLink || 'Configure as credenciais primeiro'}</span>
                  <button
                    onClick={handleCopyLink}
                    disabled={!generatedGitHubLink}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>

                {generatedGitHubLink && (
                  <div className="flex justify-end">
                    <a
                      href={generatedGitHubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold"
                    >
                      Testar link abrindo em nova aba
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Secrets do GitHub & Arquivo .env */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-500" />
                    Configurar Variáveis no Repositório do GitHub (.env)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyEnv}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedEnv ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedEnv ? 'Copiado' : 'Copiar .env'}
                    </button>
                    <button
                      onClick={handleDownloadEnv}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Baixar .env
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Para que o deploy no GitHub (Pages ou Actions) compile com o Supabase ativo por padrão, configure as variáveis de ambiente nos Secrets do repositório:
                </p>

                <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1">
                  <div>VITE_SUPABASE_URL={inputUrl || 'https://seu-projeto.supabase.co'}</div>
                  <div>VITE_SUPABASE_ANON_KEY={inputAnonKey || 'sua-chave-anon-publica'}</div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                  No GitHub: Vá em <strong>Settings &gt; Secrets and variables &gt; Actions</strong> e adicione essas 2 chaves.
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: CREDENCIAIS & CONEXÃO */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Configuração das Credenciais do Supabase
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Insira ou altere a URL do seu projeto e a chave anônima pública (anon public key).
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project URL (VITE_SUPABASE_URL):
                    </label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://exemplo.supabase.co"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Anon Public Key (VITE_SUPABASE_ANON_KEY):
                    </label>
                    <textarea
                      rows={3}
                      value={inputAnonKey}
                      onChange={(e) => setInputAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {credSavedMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                    {credSavedMessage}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCredentials}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      Salvar Credenciais
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {isTesting ? 'Testando...' : 'Testar Conexão'}
                    </button>
                  </div>

                  {credentialsSource === 'storage' && (
                    <button
                      onClick={handleClearCredentials}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      Limpar Credenciais Salvas
                    </button>
                  )}
                </div>
              </div>

              {/* Guia de onde pegar as chaves no Supabase */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Onde encontrar essas credenciais no Supabase:
                </h4>
                <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal pl-4">
                  <li>Acesse o painel do seu projeto no Supabase (supabase.com/dashboard).</li>
                  <li>Clique no ícone de engrenagem <strong>Project Settings</strong> no menu lateral.</li>
                  <li>Clique na aba <strong>API</strong>.</li>
                  <li>Copie o campo <strong>Project URL</strong> e o campo <strong>anon public key</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ABA 4: SCRIPT DE MIGRATION SQL */}
          {activeTab === 'migration' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      supabase/migrations/20260903000001_create_finance_schema.sql
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inclui criação de chaves primárias, chaves estrangeiras, índices de busca, triggers e Row Level Security (RLS) para 16 tabelas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'SQL Copiado!' : 'Copiar SQL'}
                  </button>

                  <button
                    onClick={handleDownloadSql}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Migration .sql
                  </button>
                </div>
              </div>

              {/* 16 Tabelas List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  16 Tabelas Relacionais Mapeadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {tablesList.map((t) => (
                    <div
                      key={t.name}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Table className="w-3 h-3 text-slate-400" />
                        {t.name}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={t.desc}>
                        {t.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SQL Code Preview */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">Preview da Migration SQL</span>
                  <span>PostgreSQL 15+</span>
                </div>
                <pre className="p-4 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-56 leading-relaxed select-all">
                  {SUPABASE_MIGRATION_SQL.slice(0, 1600)}
                  {'\n\n-- ... [clique em "Copiar SQL" para ver as 16 tabelas completas com RLS e triggers]'}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold"
          >
            Acessar Dashboard do Supabase
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
