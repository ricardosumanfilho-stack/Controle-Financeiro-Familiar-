import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Sparkles, Trash2, Info } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface DemoBannerProps {
  onOpenExportImport: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onOpenExportImport }) => {
  const { hasDemoData, clearDemoData } = useFinance();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!hasDemoData) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-b border-amber-300/40 dark:border-amber-700/40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>
              <strong className="font-semibold">Modo de Demonstração Ativo:</strong> Exibindo dados de exemplo para Ricardo, Ellen e Família com faturas de R$ 500, mercado de R$ 1.000 e investimentos.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="banner-details-btn"
              onClick={onOpenExportImport}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-amber-500/20 rounded-lg transition-colors font-medium text-[11px]"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Gerenciar</span>
            </button>

            <button
              type="button"
              id="banner-clear-demo-btn"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-2xs text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Apagar Dados Demo</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={clearDemoData}
        title="Apagar Dados de Demonstração"
        message="Deseja realmente apagar todos os registros de demonstração? Seus dados personalizados criados permanecerão intactos."
        confirmText="Sim, Apagar Dados Demo"
        cancelText="Cancelar"
        confirmVariant="danger"
      />
    </>
  );
};
