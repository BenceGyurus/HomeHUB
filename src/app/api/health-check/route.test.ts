/**
 * @jest-environment node
 */
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    prepare: jest.fn().mockImplementation((query: string) => ({
      all: jest.fn().mockImplementation(() => {
        if (query.includes('FROM settings')) return [];
        return [];
      }),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }))
  }
}));

describe('Health Check API Route', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockImplementation(() => {
        if (query.includes('FROM settings')) return [];
        return [];
      }),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }));
  });

  it('rejects unauthenticated requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/health-check', {
      method: 'POST',
      body: JSON.stringify({ appIds: [1] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('probes app health for authenticated user', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'testuser' }
    });

    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockImplementation(() => {
        if (query.includes('FROM settings')) return [];
        if (query.includes('FROM apps')) {
          return [
            { id: 1, name: 'Immich', launch_url: 'https://immich.example.com', healthcheck_url: 'https://immich.example.com/api/ping' },
            { id: 2, name: 'OfflineApp', launch_url: 'http://non-existent-domain-12345.com', healthcheck_url: null },
          ];
        }
        return [];
      }),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }));

    // Mock global fetch for health probing
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('immich')) {
        return Promise.resolve({
          status: 200,
          ok: true,
        });
      }
      return Promise.reject(new Error('Connection refused'));
    }) as any;

    const req = new NextRequest('http://localhost/api/health-check', {
      method: 'POST',
      body: JSON.stringify({ appIds: [1, 2] }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results[1].status).toBe('online');
    expect(data.results[2].status).toBe('offline');
  });
});
