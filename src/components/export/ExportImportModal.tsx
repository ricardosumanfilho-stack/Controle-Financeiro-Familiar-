import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useFinance } from '../../context/FinanceContext';
import { Download, Upload, Trash2, RefreshCw, FileSpreadsheet, FileJson, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGoogleSheets?: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose, onOpenGoogleSheets }) => {
  const {
    exportBackupJSON,
    importBackupJSON,
    exportTransactionsCSV,
    exportGroceryCSV,
    exportExcelFull,
    hasDemoData,
    clearDemoData,
    restoreDemoData,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importBackupJSON(content);
      if (ok) {
        setImportStatus({ success: true, message: 'Dados restaurados com sucesso!' });
      } else {
        setImportStatus({ success: false, message: 'Arquivo JSON inválido ou incompatível.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciamento de Dados & Exportação"
      subtitle="Exporte relatórios em CSV/JSON, restaure backups ou controle dados de demonstração"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Status notification */}
        {importStatus && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            {importStatus.message}
          </div>
        )}

        {/* Seção de Demonstração */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Dados de Demonstração
              </h4>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                hasDemoData
                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {hasDemoData ? 'Demonstração Ativa' : 'Sem dados de demonstração'}
            </span>
          </div>

          <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
            Os dados de demonstração incluem exemplos práticos de salários de Ricardo e Ellen, despesas de Família, parcelamentos de cartões com limite de R$ 500, gastos de supermercado com meta de R$ 1.000, investimentos e reserva de emergência.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {hasDemoData ? (
              <button
                type="button"
                id="clear-demo-btn"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Apagar Dados de Demonstração
              </button>
            ) : (
              <button
                type="button"
                id="restore-demo-btn"
                onClick={() => {
                  restoreDemoData();
                  setImportStatus({ success: true, message: 'Dados de demonstração restaurados com sucesso!' });
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar Dados de Exemplo
              </button>
            )}
          </div>
        </div>

        {/* Seção de Exportação */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Exportar Relatórios e Backups
          </h4>

          {/* Google Sheets Primary Banner */}
          {onOpenGoogleSheets && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Sincronização Direta com Google Sheets
                  </h5>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90">
                    Gera planilha estruturada com 7 abas formatadas na sua conta Google Drive
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="modal-open-sheets-btn"
                onClick={() => {
                  onClose();
                  onOpenGoogleSheets();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Abrir Google Sheets</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              id="export-excel-full-btn"
              onClick={exportExcelFull}
              className="flex flex-col items-center text-center p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all group"
            >
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl mb-2 group-hover:scale-105 transition-transform shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Planilha Excel (.xlsx)
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                8 abas formatadas & coerentes para PC
              </span>
            </button>

            <button
              type="button"
              id="export-json-btn"
              onClick={exportBackupJSON}
              className="flex flex-col items-center text-center p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            >
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl mb-2 group-hover:scale-105 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Backup JSON
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Restauração de sistema e dados
              </span>
            </button>

            <button
              type="button"
              id="export-tx-csv-btn"
              onClick={exportTransactionsCSV}
              className="flex flex-col items-center text-center p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            >
              <div className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl mb-2 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Lançamentos (CSV)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tabela simples para planilhas
              </span>
            </button>

            <button
              type="button"
              id="export-grocery-csv-btn"
              onClick={exportGroceryCSV}
              className="flex flex-col items-center text-center p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            >
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl mb-2 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Supermercado (CSV)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Compras e cupons de desconto
              </span>
            </button>
          </div>
        </div>

        {/* Seção de Importação */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Restaurar Backup
          </h4>
          <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2.5 bg-slate-200 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Carregar arquivo de backup JSON
                </p>
                <p className="text-[11px] text-slate-500">
                  Substitui os registros atuais pelos dados do arquivo
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              id="import-backup-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-xl shadow-xs transition-colors shrink-0"
            >
              Selecionar Arquivo
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearDemoData();
          setImportStatus({ success: true, message: 'Dados de demonstração removidos com sucesso!' });
        }}
        title="Apagar Dados de Demonstração"
        message="Deseja realmente apagar todos os registros de demonstração? Seus lançamentos personalizados criados serão mantidos intactos."
        confirmText="Sim, Apagar Demonstração"
        cancelText="Cancelar"
        confirmVariant="danger"
      />
    </Modal>
  );
};
