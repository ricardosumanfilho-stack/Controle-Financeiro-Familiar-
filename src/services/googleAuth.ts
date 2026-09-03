import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const STORAGE_TOKEN_KEY = 'fin_google_sheets_access_token';

function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
}

// In-memory token storage
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Try to restore from sessionStorage
try {
  const stored = sessionStorage.getItem(STORAGE_TOKEN_KEY);
  if (stored) {
    cachedAccessToken = stored;
  }
} catch {
  // Ignore sessionStorage errors
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || sessionStorage.getItem(STORAGE_TOKEN_KEY);
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      } catch {
        // Ignore
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = createGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso da conta Google. Verifique se concedeu as permissões solicitadas.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem(STORAGE_TOKEN_KEY, credential.accessToken);
    } catch {
      // Ignore
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Acesso Google cancelado ou janela fechada pelo usuário.');
      return null;
    }
    console.error('Erro no Google Sign-In:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const switchGoogleAccount = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    // 1. Sign out first to ensure session reset
    await logout();
  } catch (e) {
    console.warn('Erro ao deslogar antes de trocar de conta:', e);
  }

  // 2. Trigger fresh sign-in with forced account selection
  return googleSignIn();
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = sessionStorage.getItem(STORAGE_TOKEN_KEY);
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {
    // Ignore
  }
  return null;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  } catch {
    // Ignore
  }
};

export const logout = async () => {
  try {
    await firebaseSignOut(auth);
  } finally {
    cachedAccessToken = null;
    try {
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {
      // Ignore
    }
  }
};

