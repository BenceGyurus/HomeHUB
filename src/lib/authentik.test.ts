/**
 * @jest-environment node
 */
import { fetchAuthentikApps, fetchAuthentikGroups, syncGroups } from './authentik';
import db from './db';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    prepare: jest.fn(),
    transaction: jest.fn()
  }
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Authentik Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db.prepare as jest.Mock).mockReturnValue({
      all: jest.fn().mockReturnValue([
        { key: 'authentik_api_url', value: 'http://fake' },
        { key: 'authentik_api_token', value: 'token123' }
      ]),
      run: jest.fn(),
      get: jest.fn()
    });
    (db.transaction as jest.Mock).mockImplementation((fn) => fn);
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
    const mockRun = jest.fn();
    (db.prepare as jest.Mock).mockReturnValue({
      all: jest.fn().mockReturnValue([
        { key: 'authentik_api_url', value: 'http://fake' },
        { key: 'authentik_api_token', value: 'token123' }
      ]),
      run: mockRun,
      get: jest.fn()
    });
    (db.transaction as jest.Mock).mockImplementation((fn) => fn);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ pk: 'uuid1', name: 'Group1' }] })
    });

    const count = await syncGroups();
    expect(count).toBe(1);
    expect(mockRun).toHaveBeenCalledWith('uuid1', 'Group1');
  });
});
