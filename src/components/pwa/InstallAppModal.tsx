import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Share,
  PlusSquare,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'ios' | 'android' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'auto'
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg shrink-0 flex items-center justify-center">
              <img src="/pwa-192x192.png" alt="Ícone Finanças" className="w-full h-full rounded-xl object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> App Oficial Instalável
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Baixar Aplicativo no Celular
              </h2>
              <p className="text-xs text-white/90 mt-0.5">
                Acesse rápido sem precisar digitar endereço na web
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Quick highlights */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-lg">⚡</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Mais Rápido</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Carregamento instantâneo</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-lg">📱</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Tela Cheia</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Sem barras do navegador</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-lg">🔒</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Cofre Seguro</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Dados salvos com segurança</p>
            </div>
          </div>

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Aplicativo já instalado neste dispositivo!
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Você já está usando o aplicativo em modo independente.
                </p>
              </div>
            </div>
          )}

          {/* Direct 1-Click install button (Chromium / Android / Desktop) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-center space-y-2">
              <p className="text-xs text-blue-950 dark:text-blue-200 font-bold">
                Seu navegador suporta instalação direta com 1 clique:
              </p>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Instalar Aplicativo Agora
              </button>
            </div>
          )}

          {/* Device Tabs Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Como instalar no seu aparelho:
              </span>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Android
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                Computador
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" /> Passo a Passo no Android (Chrome / Samsung / Brave):
                </h4>
                <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 list-decimal list-inside">
                  <li className="leading-relaxed">
                    Toque no menu com <strong>três pontinhos (⋮)</strong> no canto superior direito do seu navegador.
                  </li>
                  <li className="leading-relaxed">
                    Procure e toque na opção <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Confirme tocando em <strong>&quot;Instalar&quot;</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Pronto! O ícone de <strong>Finanças</strong> aparecerá na tela inicial e gaveta de apps como um aplicativo nativo.
                  </li>
                </ol>
              </div>
            )}

            {/* iOS Safari Instructions */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500" /> Passo a Passo no iPhone ou iPad (Safari):
                </h4>
                <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 list-decimal list-inside">
                  <li className="leading-relaxed">
                    No <strong>Safari</strong>, toque no botão de <strong>Compartilhar</strong>{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded text-[11px] font-bold">
                      <Share className="w-3 h-3 inline mr-1" /> Compartilhar
                    </span>{' '}
                    (o ícone de quadrado com seta para cima na barra inferior).
                  </li>
                  <li className="leading-relaxed">
                    Role as opções para baixo e toque em{' '}
                    <strong className="text-blue-600 dark:text-blue-400">
                      &quot;Adicionar à Tela de Início&quot;
                    </strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-500 align-text-bottom" />.
                  </li>
                  <li className="leading-relaxed">
                    Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito.
                  </li>
                  <li className="leading-relaxed">
                    Feito! O app agora abre em <strong>tela cheia</strong>, sem a barra de pesquisa do Safari.
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {activeTab === 'desktop' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-500" /> No Computador (Chrome / Edge / Opera):
                </h4>
                <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 list-decimal list-inside">
                  <li className="leading-relaxed">
                    Olhe para a <strong>barra de endereço</strong> (onde fica a URL do site) no canto direito.
                  </li>
                  <li className="leading-relaxed">
                    Clique no ícone de <strong>computador com seta para baixo ⤓</strong> (&quot;Instalar Gestão Financeira&quot;).
                  </li>
                  <li className="leading-relaxed">
                    Clique em <strong>&quot;Instalar&quot;</strong>.
                  </li>
                  <li className="leading-relaxed">
                    O app terá sua própria janela dedicada na barra de tarefas do Windows ou Dock do Mac.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>PWA seguro • Sem anúncios</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
