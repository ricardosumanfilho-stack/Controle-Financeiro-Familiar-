import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  ShoppingCart,
  Target,
  Home,
  Wrench,
  CheckSquare,
  Bell,
  Settings,
  MoreHorizontal,
  X,
  Users,
} from 'lucide-react';
import { ActiveTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, alerts } = useFinance();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lançam.', icon: Receipt },
    { id: 'cards', label: 'Cartões', icon: CreditCard },
    { id: 'grocery', label: 'Mercado', icon: ShoppingCart },
    { id: 'house', label: 'Casa', icon: Home },
  ];

  const moreItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'goals', label: 'Metas & Cofrinhos', icon: Target },
    { id: 'budget', label: 'Orçamento Pessoal', icon: Users },
    { id: 'renovation', label: 'Reforma & Aluguel', icon: Wrench },
    { id: 'closing', label: 'Fechamento Mensal', icon: CheckSquare },
    { id: 'alerts', label: 'Central de Alertas', icon: Bell, badge: alerts.length > 0 ? alerts.length : undefined },
    { id: 'settings', label: 'Configurações & Dados', icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMoreOpen(false);
  };

  const isMoreActive = moreItems.some((item) => item.id === activeTab);

  return (
    <>
      {/* Drawer / Popover de Mais Opções no Mobile */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 pb-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Menu de Funcionalidades
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors relative ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
        <nav className="flex items-center justify-around h-16 px-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] touch-manipulation transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/60 scale-110'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Botão Mais */}
          <button
            id="bottom-nav-more"
            onClick={() => setIsMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] touch-manipulation transition-colors ${
              isMoreActive || isMoreOpen
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all relative ${
                isMoreActive || isMoreOpen
                  ? 'bg-blue-50 dark:bg-blue-950/60 scale-110'
                  : 'bg-transparent'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
              Mais
            </span>
          </button>
        </nav>
      </div>
    </>
  );
};
