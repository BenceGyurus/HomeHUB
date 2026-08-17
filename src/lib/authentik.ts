import db from './db';

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
  if (!url) throw new Error("Add meg az Authentik API URL címet!");
  if (!token) throw new Error("Add meg az Authentik API Bearer Tokent!");

  try {
    const res = await fetch(`${url}/api/v3/core/applications/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (res.status === 401) {
      throw new Error("Érvénytelen vagy lejárt API Token (401 Unauthorized)");
    }
    if (res.status === 403) {
      throw new Error("Nincs megfelelő jogosultságod a lekéréshez (403 Forbidden)");
    }
    if (!res.ok) {
      throw new Error(`Authentik szerver hiba: HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const count = Array.isArray(data.results) ? data.results.length : 0;
    return { success: true, count };
  } catch (err: any) {
    if (err.cause?.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
      throw new Error(`Nem sikerült elérni a szervert: ${url} (Hálózati / DNS hiba)`);
    }
    throw err;
  }
}

export async function fetchAuthentikApps(customUrl?: string, customToken?: string) {
  const { url, token } = getAuthentikConfig({ url: customUrl, token: customToken });
  if (!url || !token) throw new Error("Authentik API nincs konfigurálva");

  const res = await fetch(`${url}/api/v3/core/applications/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Authentik API hiba: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function fetchAuthentikGroups(customUrl?: string, customToken?: string) {
  const { url, token } = getAuthentikConfig({ url: customUrl, token: customToken });
  if (!url || !token) throw new Error("Authentik API nincs konfigurálva");

  const res = await fetch(`${url}/api/v3/core/groups/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Authentik API hiba: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function syncGroups(customUrl?: string, customToken?: string) {
  const groups = await fetchAuthentikGroups(customUrl, customToken);
  const insert = db.prepare('INSERT OR REPLACE INTO groups (authentik_pk, name) VALUES (?, ?)');
  
  const transaction = db.transaction((groupsList: any[]) => {
    for (const group of groupsList) {
      insert.run(group.pk, group.name);
    }
  });
  
  transaction(groups);
  return groups.length;
}
