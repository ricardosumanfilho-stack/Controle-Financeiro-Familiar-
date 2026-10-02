import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600/95 text-white px-4 py-2.5 text-xs font-semibold shadow-xl backdrop-blur-sm border border-amber-400/40 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline: Dados locais ativos. Conecte-se para sincronizar.</span>
    </div>
  );
};
