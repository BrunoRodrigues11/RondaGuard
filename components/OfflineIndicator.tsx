
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface OfflineIndicatorProps {
  onSyncComplete?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncComplete }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      checkAndSync();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending items
    // Since api.getRounds returns merged list, we need to inspect localStorage directly or add a specific method.
    // For simplicity, we'll assume if we are mounting, we check sync.
    if (navigator.onLine) {
        checkAndSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkAndSync = async () => {
    if (isSyncing) return;

    try {
        setIsSyncing(true);
        const count = await api.syncOfflineData();
        if (count > 0) {
            setPendingCount(count);
            setTimeout(() => setPendingCount(0), 3000); // Hide count message after 3s
            if (onSyncComplete) onSyncComplete();
        }
    } catch (e) {
        console.error("Erro na sincronização:", e);
    } finally {
        setIsSyncing(false);
    }
  };

  if (!isOffline && !isSyncing && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-3 z-50 flex items-center justify-center gap-3 transition-colors duration-300 shadow-lg ${
        isOffline 
            ? 'bg-red-600 text-white' 
            : isSyncing 
                ? 'bg-blue-600 text-white' 
                : 'bg-green-600 text-white'
    }`}>
      {isOffline && (
        <>
            <WifiOff size={20} />
            <span className="font-medium text-sm">Você está offline. As rondas serão salvas localmente e sincronizadas quando a conexão retornar.</span>
        </>
      )}

      {isSyncing && (
        <>
            <RefreshCw size={20} className="animate-spin" />
            <span className="font-medium text-sm">Conexão restaurada. Sincronizando dados pendentes...</span>
        </>
      )}

      {!isOffline && !isSyncing && pendingCount > 0 && (
        <>
             <Wifi size={20} />
             <span className="font-medium text-sm">{pendingCount} registros sincronizados com sucesso!</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
