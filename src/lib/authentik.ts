import db from './db';

const getAuthentikConfig = () => {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>);
  
  return {
    url: settings.authentik_api_url || process.env.AUTHENTIK_API_URL,
    token: settings.authentik_api_token || process.env.AUTHENTIK_API_TOKEN
  };
};

export async function fetchAuthentikApps() {
  const { url, token } = getAuthentikConfig();
  if (!url || !token) throw new Error("Authentik API nem konfigurált");

  const res = await fetch(`${url}/api/v3/core/applications/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) throw new Error("Authentik API hiba: " + res.status);
  const data = await res.json();
  return data.results || [];
}

export async function fetchAuthentikGroups() {
  const { url, token } = getAuthentikConfig();
  if (!url || !token) throw new Error("Authentik API nem konfigurált");

  const res = await fetch(`${url}/api/v3/core/groups/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) throw new Error("Authentik API hiba: " + res.status);
  const data = await res.json();
  return data.results || [];
}

export async function syncGroups() {
  const groups = await fetchAuthentikGroups();
  const insert = db.prepare('INSERT OR REPLACE INTO groups (authentik_pk, name) VALUES (?, ?)');
  
  const transaction = db.transaction((groupsList) => {
    for (const group of groupsList) {
      insert.run(group.pk, group.name);
    }
  });
  
  transaction(groups);
  return groups.length;
}
