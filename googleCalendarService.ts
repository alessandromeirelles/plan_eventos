
import { PlanEvent, User } from './types';

// Declare global variables for Google API Client and Google Identity Services
// to fix "Cannot find name" TypeScript errors.
declare const gapi: any;
declare const google: any;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '810529146566-3v71cbn992oil13l0vnnjci0kc7cojqj.apps.googleusercontent.com';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

let tokenClient: any;
let gapiInited = false;
let gsiInited = false;
let isInitialized = false;

// Token response queue to handle multiple concurrent requests
type TokenCallback = (resp: any) => void;
let pendingCallbacks: TokenCallback[] = [];

// Memory-based caching
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number | null = null;

export const initGoogleScripts = (callback: (isInited: boolean) => void) => {
  if (isInitialized) {
    callback(true);
    return;
  }

  const checkInit = () => {
    if (gapiInited && gsiInited) {
      isInitialized = true;
      callback(true);
    }
  };

  const loadGapi = () => {
    if (typeof gapi === 'undefined') return;
    gapi.load('client', async () => {
      try {
        const initConfig: any = {
          discoveryDocs: [DISCOVERY_DOC],
        };
        if (API_KEY && API_KEY.trim() !== '' && API_KEY !== 'undefined') {
          initConfig.apiKey = API_KEY;
        }
        await gapi.client.init(initConfig);
        gapiInited = true;
        checkInit();
      } catch (err) {
        console.error("GAPI init error", err);
      }
    });
  };

  const loadGsi = () => {
    if (typeof google === 'undefined') return;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        // Dispatch response to all pending callbacks
        pendingCallbacks.forEach(cb => cb(resp));
        pendingCallbacks = [];
      },
    });
    gsiInited = true;
    checkInit();
  };

  loadGapi();
  loadGsi();
};

export const getAccessToken = async (interactive = false): Promise<string> => {
  // Check memory cache (valid for at least another 60 seconds)
  if (cachedAccessToken && tokenExpiryTime && (tokenExpiryTime - Date.now() > 60000)) {
    return cachedAccessToken;
  }

  return new Promise((resolve, reject) => {
    const handleResponse = (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      cachedAccessToken = resp.access_token;
      const expiresIn = resp.expires_in ? parseInt(resp.expires_in, 10) : 3600;
      tokenExpiryTime = Date.now() + expiresIn * 1000;
      resolve(resp.access_token);
    };

    pendingCallbacks.push(handleResponse);
    tokenClient.requestAccessToken(interactive ? { prompt: 'consent' } : { prompt: 'none' });
  });
};

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const token = await getAccessToken(true);
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    
    return {
      email: data.email,
      name: data.name,
      photo: data.picture
    };
  } catch (err) {
    console.error("Sign-in failed", err);
    return null;
  }
};

export const syncEventToGoogle = async (event: PlanEvent): Promise<boolean> => {
  try {
    const token = await getAccessToken(true);
    
    const googleEvent = {
      'summary': event.title,
      'location': event.location || 'Local a definir',
      'description': `Evento PlanEventos. Tipo: ${event.type}. R$ ${event.value}`,
      'start': {
        'date': event.date,
        'timeZone': 'America/Sao_Paulo'
      },
      'end': {
        'date': event.date,
        'timeZone': 'America/Sao_Paulo'
      },
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    });

    return response.ok;
  } catch (err) {
    console.error("Sync failed", err);
    return false;
  }
};
