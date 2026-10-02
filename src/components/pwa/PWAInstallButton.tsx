import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';
import { Download, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'drawer' | 'card' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  // If running in standalone mode on mobile and rendered in navbar, don't clutter the header
  if (isInstalled && variant === 'navbar') {
    return null;
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          type="button"
          id="pwa-install-nav-btn"
          onClick={handleClick}
          className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-xs cursor-pointer ${className}`}
          title="Baixar e instalar aplicativo no celular ou computador"
          aria-label="Baixar e instalar aplicativo"
        >
          <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Baixar App</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          type="button"
          id="pwa-install-drawer-btn"
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-emerald-600/10 border border-blue-500/30 text-slate-800 dark:text-slate-100 hover:border-blue-500/50 transition-all cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black flex items-center gap-1.5">
                Baixar Aplicativo no Celular
                <span className="px-1.5 py-0.2 rounded-md bg-blue-500 text-white text-[9px] font-bold">
                  {isIOS ? 'iOS' : 'PWA'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Instale na tela inicial sem lojas de apps
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
            {isInstalled ? 'Ver Como' : 'Instalar'}
          </span>
        </button>
      )}

      {variant === 'card' && (
        <div
          onClick={handleClick}
          className={`p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-xs cursor-pointer hover:border-indigo-400 transition-all ${className}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Instalar no Celular (Android & iPhone)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tenha o sistema como um app independente na tela inicial.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
            >
              Baixar App
            </button>
          </div>
        </div>
      )}

      <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
