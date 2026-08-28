import { google } from 'googleapis';

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters';
export const GSC_SITE_URL = 'sc-domain:rafaelmarcos.tech';

function readCredentials() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Falta GSC_SERVICE_ACCOUNT_JSON. Define la variable de entorno o el GitHub Secret.');

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON no contiene JSON válido.');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON no contiene client_email y private_key.');
  }
  return credentials;
}

export function createGscAuth() {
  const credentials = readCredentials();
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [GSC_SCOPE],
  });
}

export function createGscClients() {
  const auth = createGscAuth();
  return {
    webmasters: google.webmasters({ version: 'v3', auth }),
    searchconsole: google.searchconsole({ version: 'v1', auth }),
  };
}
