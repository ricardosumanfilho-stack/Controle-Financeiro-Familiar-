import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyBR } from '../../utils/formatters';
import {
  Settings,
  DollarSign,
  Shield,
  CreditCard,
  ShoppingCart,
  Building2,
  Home,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Sun,
  Moon,
  Database,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenGoogleSheets?: () => void;
  onOpenSupabase?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenGoogleSheets, onOpenSupabase }) => {
  const {
    theme,
    setTheme,
    isDarkMode,
    toggleTheme,
    salarySettings,
    updateSalarySettings,
    emergencySettings,
    updateEmergencySettings,
    globalCofrinhoSettings,
    updateGlobalCofrinhoSettings,
    houseFundSettings,
    updateHouseFundSettings,
    futureRentSettings,
    updateFutureRentSettings,
    cards,
    updateCard,
    hasDemoData,
    clearDemoData,
    restoreDemoData,
    exportExcelFull,
    exportTransactionsCSV,
    exportGroceryCSV,
    exportBackupJSON,
    importBackupJSON,
  } = useFinance();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Persons local state
  const [person1, setPerson1] = useState(salarySettings.person1Name || 'Ricardo');
  const [person2, setPerson2] = useState(salarySettings.person2Name || 'Ellen');

  // Salaries local state
  const [ricardoBase, setRicardoBase] = useState(salarySettings.ricardoNetSalary || salarySettings.salaryRicardo || 5300);
  const [ellenBase, setEllenBase] = useState(salarySettings.ellenNetSalary || salarySettings.salaryEllen || 1600);

  // Emergency local state
  const [emergencyTargetMonths, setEmergencyTargetMonths] = useState(emergencySettings.targetMonths || 8);
  const [emergencyTargetAmount, setEmergencyTargetAmount] = useState(emergencySettings.targetAmount || 55200);

  // House fund local state
  const [targetDownPayment, setTargetDownPayment] = useState(houseFundSettings.targetDownPayment);
  const [estimatedPropertyTotal, setEstimatedPropertyTotal] = useState(houseFundSettings.estimatedPropertyTotal);

  // Rent local state
  const [grossRent, setGrossRent] = useState(futureRentSettings.grossRentAmount);
  const [rentStartDate, setRentStartDate] = useState(futureRentSettings.startDate);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    updateSalarySettings({
      person1Name: person1.trim() || 'Ricardo',
      person2Name: person2.trim() || 'Ellen',
      salaryRicardo: ricardoBase,
      ricardoNetSalary: ricardoBase,
      ricardoAdvanceSalary: ricardoBase * 0.4,
      ricardoMainSalary: ricardoBase * 0.6,
      salaryEllen: ellenBase,
      ellenNetSalary: ellenBase,
      ellenAdvanceSalary: ellenBase * 0.4,
      ellenMainSalary: ellenBase * 0.6,
    });

    updateEmergencySettings({
      targetMonths: emergencyTargetMonths,
      targetAmount: emergencyTargetAmount,
      familySalaryIncome: ricardoBase + ellenBase,
      monthlyLivingCost: ricardoBase + ellenBase,
    });

    updateHouseFundSettings({
      targetDownPayment,
      estimatedPropertyTotal,
    });

    updateFutureRentSettings({
      grossRentAmount: grossRent,
      startDate: rentStartDate,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJSON(content);
        if (success) {
          alert('Backup importado com sucesso!');
        } else {
          alert('Erro ao importar backup. Verifique a estrutura do arquivo JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold mb-2">
            <Settings className="w-3.5 h-3.5" />
            Parâmetros Globais do Sistema
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Configurações & Gestão de Dados
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ajuste os valores base de salários, metas de reserva, tetos de gastos e efetue backups completos da aplicação.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Configurações salvas com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Bloco: Tema e Aparência */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              Tema & Modo de Visualização
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {isDarkMode ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Alterne entre o tema Claro e o tema Escuro conforme a sua preferência de iluminação e conforto visual.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <button
              type="button"
              id="theme-select-light"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                !isDarkMode
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${!isDarkMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Modo Claro (Light Mode)</h4>
                  {!isDarkMode && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Selecionado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Fundo claro com alto contraste, ideal para ambientes bem iluminados ou uso diurno.
                </p>
              </div>
            </button>

            <button
              type="button"
              id="theme-select-dark"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                isDarkMode
                  ? 'border-blue-500 bg-blue-950/40 text-white ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? 'bg-indigo-950/80 text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Modo Escuro (Dark Mode)</h4>
                  {isDarkMode && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Selecionado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Tons de ardósia escuros com descanso visual, ideal para uso noturno prolongado.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Bloco 0: Responsáveis Familiares (Nomes Editáveis) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Responsáveis Familiares (Configuração de Nomes)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              Personalizável
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Defina o nome dos responsáveis financeiros da família. Esses nomes serão usados em todos os lançamentos, cartões, relatórios e filtros.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nome do Responsável 1
              </label>
              <input
                type="text"
                value={person1}
                onChange={(e) => setPerson1(e.target.value)}
                placeholder="Ex: Ricardo"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nome do Responsável 2
              </label>
              <input
                type="text"
                value={person2}
                onChange={(e) => setPerson2(e.target.value)}
                placeholder="Ex: Ellen"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Bloco 1: Salários e Proventos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Salários Base Recorrentes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Salário Base Líquido - {person1} (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={ricardoBase}
                onChange={(e) => setRicardoBase(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Adiantamento (40%): {formatCurrencyBR(ricardoBase * 0.4)} | Saldo (60%): {formatCurrencyBR(ricardoBase * 0.6)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Salário Base Líquido - {person2} (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={ellenBase}
                onChange={(e) => setEllenBase(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Adiantamento (40%): {formatCurrencyBR(ellenBase * 0.4)} | Saldo (60%): {formatCurrencyBR(ellenBase * 0.6)}
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Reserva de Emergência & Fundo da Casa */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Metas de Patrimônio: Reserva & Casa Própria
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Meses da Reserva Alvo
              </label>
              <input
                type="number"
                value={emergencyTargetMonths}
                onChange={(e) => setEmergencyTargetMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Valor Alvo da Reserva (R$)
              </label>
              <input
                type="number"
                step="100"
                value={emergencyTargetAmount}
                onChange={(e) => setEmergencyTargetAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Meta Entrada da Casa (R$)
              </label>
              <input
                type="number"
                step="1000"
                value={targetDownPayment}
                onChange={(e) => setTargetDownPayment(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Imóvel Total Estimado (R$)
              </label>
              <input
                type="number"
                step="5000"
                value={estimatedPropertyTotal}
                onChange={(e) => setEstimatedPropertyTotal(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Aluguel Futuro */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Parâmetros do Aluguel Futuro
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Valor Bruto do Aluguel (R$/mês)
              </label>
              <input
                type="number"
                step="10"
                value={grossRent}
                onChange={(e) => setGrossRent(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Data de Início do Pagamento
              </label>
              <input
                type="text"
                value={rentStartDate}
                onChange={(e) => setRentStartDate(e.target.value)}
                placeholder="2027-01"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar Parâmetros */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Todos os Parâmetros
          </button>
        </div>
      </form>

      {/* Bloco 4: Centro de Exportação & Importação de Dados */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Exportação, Backups e Integrações
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sincronize com o Google Sheets em tempo real, exporte para Excel (.xlsx) ou faça backup integral de segurança.
          </p>
        </div>

        {/* Google Sheets Featured Card */}
        {onOpenGoogleSheets && (
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Integração com Google Sheets & Google Drive
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Nativo
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Gera automaticamente planilhas com 7 abas formatadas na sua conta Google (Resumo Geral, Lançamentos, Cartões, Supermercado, Cofrinhos, Reforma e Fechamento).
                </p>
              </div>
            </div>

            <button
              type="button"
              id="settings-open-sheets-btn"
              onClick={onOpenGoogleSheets}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sincronizar Google Sheets</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {onOpenSupabase && (
            <button
              type="button"
              onClick={onOpenSupabase}
              className="flex flex-col items-start p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors text-left sm:col-span-2 lg:col-span-4"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Integração Supabase & Migrations
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        PostgreSQL
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sincronize com o banco de dados na nuvem, visualize e copie o script de migrations com 16 tabelas e RLS.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  Gerenciar Supabase
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={exportExcelFull}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Pasta Excel Completa (.xlsx)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Exporta todas as abas, resumos, compras e créditos de reforma.
            </span>
          </button>

          <button
            type="button"
            onClick={exportTransactionsCSV}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Lançamentos (.csv)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Extrato completo de receitas, despesas e faturas.
            </span>
          </button>

          <button
            type="button"
            onClick={exportBackupJSON}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-3">
              <Download className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Backup Completo (.json)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Salva todo o estado da aplicação em arquivo estruturado.
            </span>
          </button>

          <label className="cursor-pointer flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Restaurar Backup (.json)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Carrega arquivo de backup previamente salvo.
            </span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>

        {/* Gerenciamento de Demo */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Dados Demonstrativos da Família
            </div>
            <div className="text-[11px] text-slate-500">
              {hasDemoData
                ? 'Os dados de exemplo estão ativos para simulação e teste de todos os recursos.'
                : 'Apenas os seus dados cadastrados estão ativos na base de dados.'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasDemoData ? (
              <button
                type="button"
                onClick={clearDemoData}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover Dados de Exemplo
              </button>
            ) : (
              <button
                type="button"
                onClick={restoreDemoData}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-blue-900/50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Dados de Exemplo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
