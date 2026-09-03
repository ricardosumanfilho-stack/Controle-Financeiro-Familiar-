import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { addMonthsToKey, formatMonthYearBR } from '../../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Wallet,
  FileSpreadsheet,
  Sun,
  Moon,
  Database,
  CheckCircle2,
  RefreshCw,
  Cloud,
  AlertCircle,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface NavbarProps {
  onOpenNewTransaction: () => void;
  onOpenExportImport: () => void;
  onOpenGoogleSheets: () => void;
  onOpenSupabase?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTransaction,
  onOpenExportImport,
  onOpenGoogleSheets,
  onOpenSupabase,
}) => {
  const {
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    alerts,
    theme,
    isDarkMode,
    toggleTheme,
    saveStatus,
    lastSavedTime,
    forceSaveNow,
  } = useFinance();

  const handlePrevMonth = () => {
    setSelectedMonth(addMonthsToKey(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonthsToKey(selectedMonth, 1));
  };

  const navItems: { id: ActiveTab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Lançamentos' },
    { id: 'cards', label: 'Cartões' },
    { id: 'grocery', label: 'Supermercado' },
    { id: 'budget', label: 'Orçamento Pessoal' },
    { id: 'goals', label: 'Metas & Cofrinhos' },
    { id: 'house', label: 'Nova Casa' },
    { id: 'renovation', label: 'Reforma & Aluguel' },
    { id: 'closing', label: 'Fechamento' },
    { id: 'alerts', label: 'Alertas', badge: alerts.length > 0 ? alerts.length : undefined },
    { id: 'settings', label: 'Configurações' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with Brand, Month Picker, and Quick Actions */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight tracking-tight">
                  Gestão Financeira
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Ricardo, Ellen & Família
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200 dark:border-slate-700/80">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[120px] sm:min-w-[140px] text-center capitalize">
              {formatMonthYearBR(selectedMonth)}
            </span>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Auto-save Status Indicator */}
            <button
              id="auto-save-status-btn"
              type="button"
              onClick={forceSaveNow}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                saveStatus === 'saving'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse'
                  : saveStatus === 'synced_cloud'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : saveStatus === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              title={`Salvo automaticamente ${lastSavedTime ? `às ${lastSavedTime}` : ''}. Clique para forçar gravação.`}
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : saveStatus === 'synced_cloud' ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className="hidden md:inline">
                {saveStatus === 'saving'
                  ? 'Salvando...'
                  : saveStatus === 'synced_cloud'
                  ? 'Nuvem OK'
                  : saveStatus === 'error'
                  ? 'Erro'
                  : 'Salvo'}
              </span>
              {lastSavedTime && (
                <span className="text-[10px] opacity-70 font-mono hidden xl:inline">
                  {lastSavedTime}
                </span>
              )}
            </button>

            {/* Dark/Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center shadow-xs cursor-pointer"
              title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              id="nav-supabase-btn"
              onClick={onOpenSupabase}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-colors shadow-xs cursor-pointer"
              title="Integração Supabase & Migrations"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Supabase</span>
            </button>

            <button
              id="nav-sheets-btn"
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Sincronizar com Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Google Sheets</span>
              <span className="sm:hidden">Sheets</span>
            </button>

            <button
              id="nav-export-btn"
              onClick={onOpenExportImport}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Exportar dados ou gerenciar demo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            <button
              id="nav-new-tx-btn"
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden lg:flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`desktop-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white leading-tight">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
