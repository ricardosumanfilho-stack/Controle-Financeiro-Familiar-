import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  pushLocalDataToSupabase,
  pullDataFromSupabase,
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
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const finance = useFinance();
  const [activeTab, setActiveTab] = useState<'migration' | 'sync' | 'guide'>('migration');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [isSyncingPull, setIsSyncingPull] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const configured = isSupabaseConfigured();
      setIsConfigured(configured);
      setTestResult(null);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handlePushData = async () => {
    setIsSyncingPush(true);
    setSyncStatus(null);
    const checklistsMap: Record<string, any> = {};
    finance.closingChecklists.forEach((c) => {
      checklistsMap[c.monthKey] = c;
    });

    const res = await pushLocalDataToSupabase({
      cards: finance.cards,
      transactions: finance.transactions,
      installmentPurchases: finance.installmentPurchases,
      cardSubscriptions: finance.cardSubscriptions,
      groceryTrips: finance.groceryTrips,
      groceryMonthPlans: [finance.groceryPlan],
      shoppingLists: finance.shoppingLists,
      stockItems: finance.stockItems,
      cestaBasicaRecords: finance.cestaBasicaRecords,
      cofrinhos: finance.cofrinhos,
      cofrinhoMovements: finance.cofrinhoMovements,
      emergencyContributions: finance.emergencyContributions,
      investmentContributions: finance.investmentContributions,
      renovationExpenses: finance.renovationExpenses,
      monthlyClosingChecklists: checklistsMap,
      salarySettings: finance.salarySettings,
      emergencySettings: finance.emergencySettings,
      houseFundSettings: finance.houseFundSettings,
      futureRentSettings: finance.futureRentSettings,
      globalCofrinhoSettings: finance.globalCofrinhoSettings,
    });
    setSyncStatus(res);
    setIsSyncingPush(false);
  };

  const handlePullData = async () => {
    if (!window.confirm('Deseja carregar os dados do Supabase? Isso mesclará os dados remotos no seu aplicativo local.')) {
      return;
    }
    setIsSyncingPull(true);
    setSyncStatus(null);
    const res = await pullDataFromSupabase();
    if (res.success && res.data) {
      // Importar dados baixados usando importBackupJSON
      const imported = finance.importBackupJSON(JSON.stringify(res.data));
      if (imported) {
        setSyncStatus({
          success: true,
          message: 'Dados baixados e sincronizados com sucesso no aplicativo!',
        });
      } else {
        setSyncStatus({
          success: false,
          message: 'Dados recebidos do Supabase, mas formato incompatível com o leitor local.',
        });
      }
    } else {
      setSyncStatus({
        success: false,
        message: res.message || 'Falha ao baixar dados do Supabase.',
      });
    }
    setIsSyncingPull(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Integração Supabase & Migrations
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Banco de dados relacional na nuvem com migrations prontas e sincronização
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
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Status da Conexão:</span>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Configurado (Variáveis detectadas)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5" />
                Aguardando VITE_SUPABASE_URL e KEY
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* Feedback Alert if tested */}
        {testResult && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{testResult.message}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2">
          <button
            onClick={() => setActiveTab('migration')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
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

          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Sincronização Nuvem
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Como Conectar (Passo a Passo)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ABA 1: MIGRATION SQL */}
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
                    Inclui criação de chaves primárias, chaves estrangeiras, índices de busca, triggers e Row Level Security (RLS).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado para Área de Transferência!' : 'Copiar Migration SQL'}
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar .sql
                  </button>
                </div>
              </div>

              {/* Lista das 16 tabelas criadas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5" />
                  Tabelas Inclusas nesta Migration ({tablesList.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {tablesList.map((t) => (
                    <div
                      key={t.name}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.name}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prévia do Código SQL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Prévia do Código SQL (Pronto para executar no Supabase):
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    PostgreSQL 15+ / Supabase
                  </span>
                </div>
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
                  <pre>{SUPABASE_MIGRATION_SQL}</pre>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: SINCRONIZAÇÃO */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Push */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Enviar Dados Locais para o Supabase (Push)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Envia todas as transações cadastradas, compras parceladas, faturas, cofrinhos com CDI e planejamentos para o banco na nuvem.
                    </p>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      Registros locais a enviar:
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
                        <li><strong>{finance.transactions.length}</strong> transações</li>
                        <li><strong>{finance.cards.length}</strong> cartões de crédito</li>
                        <li><strong>{finance.cofrinhos.length}</strong> cofrinhos e reservas</li>
                        <li><strong>{finance.installmentPurchases.length}</strong> compras parceladas</li>
                        <li><strong>{finance.groceryTrips.length}</strong> compras de supermercado</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={handlePushData}
                    disabled={isSyncingPush || !isConfigured}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                  >
                    {isSyncingPush ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sincronizando com Supabase...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        Subir Dados Agora
                      </>
                    )}
                  </button>
                </div>

                {/* Pull */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <DownloadCloud className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Baixar Dados do Supabase (Pull)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Carrega os registros salvos no banco de dados do Supabase e sincroniza diretamente na interface do seu aplicativo.
                    </p>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      Ideal para:
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
                        <li>Restaurar dados em outro dispositivo ou navegador</li>
                        <li>Sincronizar lançamentos feitos por outros membros da família</li>
                        <li>Garantir backup dos dados em caso de limpeza de cache</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={handlePullData}
                    disabled={isSyncingPull || !isConfigured}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                  >
                    {isSyncingPull ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Baixando Dados...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-4 h-4" />
                        Baixar Dados do Supabase
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sync status alert */}
              {syncStatus && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                    syncStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  {syncStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">{syncStatus.message}</div>
                    {syncStatus.details && (
                      <div className="text-[11px] opacity-90">
                        Total gravado: {Object.entries(syncStatus.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: GUIA PASSO A PASSO */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Instruções de Configuração Rápida
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Siga os 3 passos abaixo para conectar seu projeto Supabase em menos de 2 minutos.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                    Criar projeto no Supabase
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">supabase.com</a>, faça login e clique em <strong>New project</strong>. Escolha um nome (ex: <code>gestao-financeira</code>) e defina a senha do banco PostgreSQL.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                    Executar a Migration no SQL Editor
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    No painel do Supabase, vá em <strong>SQL Editor</strong> no menu lateral esquerdo, clique em <strong>New query</strong>, clique no botão <strong>Copiar Migration SQL</strong> desta tela, cole no editor e aperte <strong>Run</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                    Adicionar as Variáveis de Ambiente
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    Vá em <strong>Project Settings &gt; API</strong> no Supabase e copie a <strong>Project URL</strong> e a <strong>anon public key</strong>. Declare no seu arquivo <code>.env</code> ou painel de configurações:
                  </p>
                  <div className="ml-8 p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px]">
                    VITE_SUPABASE_URL=https://seu-projeto.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
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
