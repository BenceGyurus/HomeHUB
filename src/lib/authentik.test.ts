/**
 * @jest-environment node
 */
import { fetchAuthentikApps, fetchAuthentikGroups, syncGroups } from './authentik';
import db from './db';

// Mock global fetch
global.fetch = jest.fn();

describe('Authentik Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.prepare('DELETE FROM settings').run();
    db.prepare('DELETE FROM groups').run();
    
    // Set up dummy config in DB
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('authentik_api_url', 'http://fake');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('authentik_api_token', 'token123');
  });

  it('fetchAuthentikApps should return apps on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ name: 'App1', slug: 'app1' }] })
    });

    const apps = await fetchAuthentikApps();
    expect(apps.length).toBe(1);
    expect(apps[0].name).toBe('App1');
    expect(global.fetch).toHaveBeenCalledWith('http://fake/api/v3/core/applications/', expect.any(Object));
  });

  it('fetchAuthentikApps should throw error if fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    await expect(fetchAuthentikApps()).rejects.toThrow('Authentik API hiba: 401');
  });

  it('syncGroups should fetch groups and insert into db', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ pk: 'uuid1', name: 'Group1' }] })
    });

    const count = await syncGroups();
    expect(count).toBe(1);

    const group = db.prepare("SELECT * FROM groups WHERE authentik_pk = 'uuid1'").get() as any;
    expect(group).toBeDefined();
    expect(group.name).toBe('Group1');
  });
});
