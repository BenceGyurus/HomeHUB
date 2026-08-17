/**
 * @jest-environment node
 */
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    prepare: jest.fn()
  }
}));

describe('Admin Apps API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockImplementation(() => {
        if (query.includes('FROM settings')) return [];
        if (query.includes('FROM apps')) return [{ id: 1, name: 'Test', slug: 'test' }];
        return [];
      }),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
    }));
  });

  it('GET should return 403 if not admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: false } });
    
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('GET should return apps if admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true } });
    
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Test');
  });

  it('POST should insert app if admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true } });
    const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 1 });
    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue(null),
      run: mockRun
    }));
    
    const req = new NextRequest('http://localhost/api/admin/apps', {
      method: 'POST',
      body: JSON.stringify({ name: 'NewApp', slug: 'new-app', is_visible: true })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalled();
  });
});
