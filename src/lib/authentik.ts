import db from './db';
import { logger } from './logger';

export const normalizeUrl = (url?: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
};

const getAuthentikConfig = (override?: { url?: string; token?: string }) => {
  if (override?.url && override?.token) {
    return {
      url: normalizeUrl(override.url),
      token: override.token.trim(),
    };
  }

  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>);
  
  return {
    url: normalizeUrl(override?.url || settings.authentik_api_url || process.env.AUTHENTIK_API_URL),
    token: (override?.token || settings.authentik_api_token || process.env.AUTHENTIK_API_TOKEN || '').trim()
  };
};

export async function testAuthentikConnection(customUrl?: string, customToken?: string) {
  const { url, token } = getAuthentikConfig({ url: customUrl, token: customToken });
  logger.authentik(`Kapcsolatteszt kezdeményezése a(z) ${url || '[NINCS URL]'} végpontra... (Token hossz: ${token ? token.length : 0} karakter)`);

  if (!url) {
    logger.error('AUTHENTIK', 'Kapcsolatteszt meghiúsult: Hiányzó API URL');
    throw new Error("Add meg az Authentik API URL címet!");
  }
  if (!token) {
    logger.error('AUTHENTIK', 'Kapcsolatteszt meghiúsult: Hiányzó API Token');
    throw new Error("Add meg az Authentik API Bearer Tokent!");
  }

  const startTime = Date.now();
  try {
    const targetUrl = `${url}/api/v3/core/applications/`;
    logger.authentik(`HTTP GET kérés küldése: ${targetUrl}`);

    const res = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const elapsed = Date.now() - startTime;
    logger.authentik(`Authentik válasz érkezett: HTTP ${res.status} ${res.statusText} (${elapsed}ms)`);

    if (res.status === 401) {
      logger.error('AUTHENTIK', `Authentik 401 Unauthorized: Érvénytelen vagy lejárt Bearer token.`);
      throw new Error("Érvénytelen vagy lejárt API Token (401 Unauthorized)");
    }
    if (res.status === 403) {
      logger.error('AUTHENTIK', `Authentik 403 Forbidden: A megadott tokennek nincs jogosultsága az alkalmazások listázására.`);
      throw new Error("Nincs megfelelő jogosultságod a lekéréshez (403 Forbidden)");
    }
    if (!res.ok) {
      const bodyPreview = await res.text().catch(() => '');
      logger.error('AUTHENTIK', `Authentik HTTP hiba (${res.status}): ${bodyPreview.slice(0, 200)}`);
      throw new Error(`Authentik szerver hiba: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const count = Array.isArray(data.results) ? data.results.length : 0;
    logger.authentik(`Sikeres kapcsolat! ${count} alkalmazás található az Authentikben.`);
    return { success: true, count };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    logger.error('AUTHENTIK', `Authentik kérés sikertelen (${elapsed}ms): ${err.message}`);
    if (err.cause?.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
      throw new Error(`Nem sikerült elérni a szervert: ${url} (Hálózati / DNS hiba)`);
    }
    throw err;
  }
}

export async function fetchAuthentikApps(customUrl?: string, customToken?: string) {
  const { url, token } = getAuthentikConfig({ url: customUrl, token: customToken });
  if (!url || !token) throw new Error("Authentik API nincs konfigurálva");

  logger.authentik(`Alkalmazások lekérése: ${url}/api/v3/core/applications/`);
  const res = await fetch(`${url}/api/v3/core/applications/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    logger.error('AUTHENTIK', `Alkalmazások lekérése sikertelen: HTTP ${res.status}`);
    throw new Error(`Authentik API hiba: ${res.status}`);
  }
  const data = await res.json();
  const apps = data.results || [];
  logger.authentik(`${apps.length} alkalmazás sikeresen beolvasva Authentikből.`);
  return apps;
}

export async function fetchAuthentikGroups(customUrl?: string, customToken?: string) {
  const { url, token } = getAuthentikConfig({ url: customUrl, token: customToken });
  if (!url || !token) throw new Error("Authentik API nincs konfigurálva");

  logger.authentik(`Csoportok lekérése: ${url}/api/v3/core/groups/`);
  const res = await fetch(`${url}/api/v3/core/groups/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    logger.error('AUTHENTIK', `Csoportok lekérése sikertelen: HTTP ${res.status}`);
    throw new Error(`Authentik API hiba: ${res.status}`);
  }
  const data = await res.json();
  const groups = data.results || [];
  logger.authentik(`${groups.length} csoport sikeresen beolvasva Authentikből.`);
  return groups;
}

export async function syncGroups(customUrl?: string, customToken?: string) {
  logger.authentik(`Csoportok szinkronizálásának indítása...`);
  const groups = await fetchAuthentikGroups(customUrl, customToken);
  const insert = db.prepare('INSERT OR REPLACE INTO groups (authentik_pk, name) VALUES (?, ?)');
  
  const transaction = db.transaction((groupsList: any[]) => {
    for (const group of groupsList) {
      insert.run(group.pk, group.name);
    }
  });
  
  transaction(groups);
  logger.authentik(`${groups.length} csoport sikeresen elmentve az SQLite adatbázisba.`);
  return groups.length;
}
