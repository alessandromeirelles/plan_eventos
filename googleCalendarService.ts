
import { PlanEvent, User } from './types';

// Declare global variables for Google API Client and Google Identity Services
// to fix "Cannot find name" TypeScript errors.
declare const gapi: any;
declare const google: any;

// Credenciais oficiais fornecidas pelo usuário
const CLIENT_ID = '810529146566-3v71cbn992oil13l0vnnjci0kc7cojqj.apps.googleusercontent.com';
const API_KEY = process.env.API_KEY; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

let tokenClient: any;
let gapiInited = false;
let gsiInited = false;

export const initGoogleScripts = (callback: (isInited: boolean) => void) => {
  const checkInit = () => {
    if (gapiInited && gsiInited) callback(true);
  };

  const loadGapi = () => {
    if (typeof gapi === 'undefined') return;
    gapi.load('client', async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      checkInit();
    });
  };

  const loadGsi = () => {
    if (typeof google === 'undefined') return;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', 
    });
    gsiInited = true;
    checkInit();
  };

  loadGapi();
  loadGsi();
};

export const signInWithGoogle = (): Promise<User | null> => {
  return new Promise((resolve) => {
    if (!tokenClient) {
      console.error("Google Scripts não carregados");
      return resolve(null);
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        resolve(null);
        return;
      }
      
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${resp.access_token}` }
        });
        const data = await response.json();
        
        resolve({
          email: data.email,
          name: data.name,
          photo: data.picture
        });
      } catch (err) {
        resolve(null);
      }
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const syncEventToGoogle = async (event: PlanEvent): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!tokenClient) return resolve(false);

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        resolve(false);
        return;
      }

      try {
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

        const request = (gapi.client as any).calendar.events.insert({
          'calendarId': 'primary',
          'resource': googleEvent,
        });

        request.execute(() => resolve(true));
      } catch (err) {
        resolve(false);
      }
    };

    tokenClient.requestAccessToken({ prompt: '' });
  });
};
