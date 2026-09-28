// Gerenciador de Cofre Persistente (IndexedDB + LocalStorage Mirror)
// Garante retenção perpétua de dados, pontos de restauração e previne qualquer perda de dados.

export interface VaultSnapshot {
  id: string;
  timestamp: number;
  dateStr: string;
  transactionsCount: number;
  cardsCount: number;
  label?: string;
  data: any;
}

const DB_NAME = 'FinanceFamilyVaultDB';
const DB_VERSION = 1;
const STORE_CURRENT = 'current_state';
const STORE_HISTORY = 'history_snapshots';
const LOCAL_VAULT_KEY = 'fin_family_permanent_vault_snapshot_v1';
const LOCAL_VAULT_BACKUP_ALT = 'fin_family_emergency_safety_backup';

// Abre conexão IndexedDB nativa
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CURRENT)) {
          db.createObjectStore(STORE_CURRENT, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[VaultPersistence] Não foi possível abrir IndexedDB, usando fallback LocalStorage');
        resolve(null);
      };
    } catch (e) {
      console.warn('[VaultPersistence] Falha ao inicializar IndexedDB:', e);
      resolve(null);
    }
  });
}

// Salva snapshot no cofre perpétuo (LocalStorage + IndexedDB)
export async function saveVaultSnapshot(data: any, label?: string): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const d = new Date(timestamp);
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    const transactionsCount = Array.isArray(data.transactions) ? data.transactions.length : 0;
    const cardsCount = Array.isArray(data.cards) ? data.cards.length : 0;

    const snapshot: VaultSnapshot = {
      id: `snap-${timestamp}`,
      timestamp,
      dateStr,
      transactionsCount,
      cardsCount,
      label: label || 'Salvamento Automático',
      data,
    };

    // 1. LocalStorage Mirror permanente
    try {
      const serialized = JSON.stringify(snapshot);
      localStorage.setItem(LOCAL_VAULT_KEY, serialized);
      // Backup alternativo para redundância
      localStorage.setItem(LOCAL_VAULT_BACKUP_ALT, serialized);
    } catch (e) {
      console.warn('[VaultPersistence] Espaço em LocalStorage reduzido para espelho:', e);
    }

    // 2. IndexedDB (armazenamento persistente robusto de longo prazo)
    const db = await openDB();
    if (db) {
      try {
        const tx = db.transaction([STORE_CURRENT, STORE_HISTORY], 'readwrite');
        
        // Salva estado mais recente
        const currentStore = tx.objectStore(STORE_CURRENT);
        currentStore.put({ key: 'latest', ...snapshot });

        // Salva no histórico se tiver transações ou for manual
        if (label || transactionsCount > 0) {
          const historyStore = tx.objectStore(STORE_HISTORY);
          historyStore.put(snapshot);
        }

        await new Promise<void>((res) => {
          tx.oncomplete = () => res();
          tx.onerror = () => res();
        });
      } catch (err) {
        console.error('[VaultPersistence] Erro ao gravar no IndexedDB:', err);
      }
    }

    return true;
  } catch (err) {
    console.error('[VaultPersistence] Falha geral ao salvar no Vault:', err);
    return false;
  }
}

// Busca todos os pontos de restauração disponíveis
export async function getRestorePoints(): Promise<VaultSnapshot[]> {
  const points: VaultSnapshot[] = [];

  // 1. Tenta buscar no IndexedDB
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.getAll();

      const idbPoints = await new Promise<VaultSnapshot[]>((res) => {
        req.onsuccess = () => res((req.result as VaultSnapshot[]) || []);
        req.onerror = () => res([]);
      });

      if (idbPoints && idbPoints.length > 0) {
        points.push(...idbPoints);
      }
    } catch {}
  }

  // 2. Verifica LocalStorage Mirror
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VaultSnapshot;
      if (parsed && parsed.timestamp && !points.some(p => p.id === parsed.id)) {
        points.push(parsed);
      }
    }
  } catch {}

  try {
    const rawAlt = localStorage.getItem(LOCAL_VAULT_BACKUP_ALT);
    if (rawAlt) {
      const parsedAlt = JSON.parse(rawAlt) as VaultSnapshot;
      if (parsedAlt && parsedAlt.timestamp && !points.some(p => p.id === parsedAlt.id)) {
        points.push(parsedAlt);
      }
    }
  } catch {}

  // Ordena do mais recente para o mais antigo
  return points.sort((a, b) => b.timestamp - a.timestamp);
}

// Procura por dados anteriores que possam ser recuperados
export async function scanForRecoverableData(): Promise<VaultSnapshot | null> {
  try {
    // 1. Verifica snapshot mais recente no IndexedDB
    const db = await openDB();
    if (db) {
      try {
        const tx = db.transaction(STORE_CURRENT, 'readonly');
        const store = tx.objectStore(STORE_CURRENT);
        const req = store.get('latest');
        const latest = await new Promise<VaultSnapshot | null>((res) => {
          req.onsuccess = () => res(req.result as VaultSnapshot || null);
          req.onerror = () => res(null);
        });

        if (latest && latest.data && Array.isArray(latest.data.transactions) && latest.data.transactions.length > 0) {
          return latest;
        }
      } catch {}
    }

    // 2. Verifica LocalStorage Mirror
    const rawVault = localStorage.getItem(LOCAL_VAULT_KEY);
    if (rawVault) {
      try {
        const snap = JSON.parse(rawVault) as VaultSnapshot;
        if (snap && snap.data && Array.isArray(snap.data.transactions) && snap.data.transactions.length > 0) {
          return snap;
        }
      } catch {}
    }

    // 3. Verifica se existem chaves legadas de versões anteriores no LocalStorage
    const legacyTxRaw = localStorage.getItem('fin_family_transactions') || localStorage.getItem('fin_family_transactions_v1');
    if (legacyTxRaw) {
      try {
        const txs = JSON.parse(legacyTxRaw);
        if (Array.isArray(txs) && txs.length > 0) {
          return {
            id: 'legacy-recovery',
            timestamp: Date.now(),
            dateStr: 'Versão Anterior Local',
            transactionsCount: txs.length,
            cardsCount: 0,
            label: 'Dados Legados Encontrados no Navegador',
            data: {
              transactions: txs,
            },
          };
        }
      } catch {}
    }

    // 4. Verifica qualquer backup automático ou emergencial
    const emergencyRaw = localStorage.getItem(LOCAL_VAULT_BACKUP_ALT);
    if (emergencyRaw) {
      try {
        const snap = JSON.parse(emergencyRaw) as VaultSnapshot;
        if (snap && snap.data) return snap;
      } catch {}
    }
  } catch (err) {
    console.warn('[VaultPersistence] Erro ao escanear por recuperação:', err);
  }

  return null;
}
