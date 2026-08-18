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

describe('Health Check API Route (Hardened)', () => {
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

  it('SEC-06: blocks dangerous metadata URLs', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockImplementation(() => {
        if (query.includes('FROM settings')) return [];
        if (query.includes('FROM apps')) {
          return [
            { id: 1, name: 'MetadataProbe', launch_url: 'http://169.254.169.254/latest/meta-data/', healthcheck_url: null },
            { id: 2, name: 'LocalhostProbe', launch_url: 'http://localhost:8080', healthcheck_url: null },
          ];
        }
        return [];
      }),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }));

    const req = new NextRequest('http://localhost/api/health-check', {
      method: 'POST',
      body: JSON.stringify({ appIds: [1, 2] }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Both dangerous URLs should be blocked (reported as offline)
    expect(data.results[1].status).toBe('offline');
    expect(data.results[2].status).toBe('offline');
  });
});
