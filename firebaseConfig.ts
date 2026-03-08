import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAekpCCHBGQucdgSJ6OyKs_8Y63SOgJRY4",
  authDomain: "planeventos0102.firebaseapp.com",
  databaseURL: "https://planeventos0102-default-rtdb.firebaseio.com",
  projectId: "planeventos0102",
  storageBucket: "planeventos0102.firebasestorage.app",
  messagingSenderId: "795125816021",
  appId: "1:795125816021:web:efac776edaadc017de205c",
  measurementId: "G-RJPEBN3M68"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const getErrorMessage = (error: any) => {
  const code = error?.code || '';
  if (code === 'auth/invalid-credential') return 'E-mail ou senha incorretos.';
  if (code === 'auth/email-already-in-use') return 'Este e-mail já está cadastrado.';
  if (code === 'auth/weak-password') return 'A senha deve ter pelo menos 6 caracteres.';
  if (code === 'auth/user-not-found') return 'Usuário não encontrado.';
  if (code === 'auth/wrong-password') return 'Senha incorreta.';
  if (code === 'auth/unauthorized-domain') {
    const domain = window.location.hostname;
    return `Domínio não autorizado. Adicione ${domain} aos domínios autorizados no Console do Firebase (Authentication > Settings > Authorized domains).`;
  }
  if (code === 'auth/network-request-failed') {
    const domain = window.location.hostname;
    return `Erro de conexão. Verifique se o domínio ${domain} está autorizado no Console do Firebase. Se estiver usando o modo de visualização, abra o app em uma nova guia.`;
  }
  return error?.message || 'Erro ao conectar com o servidor.';
};
