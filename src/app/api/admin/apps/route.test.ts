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

describe('Admin Apps API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.prepare('DELETE FROM apps').run();
  });

  it('GET should return 403 if not admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: false } });
    
    const req = new NextRequest('http://localhost/api/admin/apps');
    const res = await GET();
    
    expect(res.status).toBe(403);
  });

  it('GET should return apps if admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true } });
    db.prepare('INSERT INTO apps (name, slug) VALUES (?, ?)').run('Test', 'test');
    
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Test');
  });

  it('POST should insert app if admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true } });
    
    const req = new NextRequest('http://localhost/api/admin/apps', {
      method: 'POST',
      body: JSON.stringify({ name: 'NewApp', slug: 'new-app', is_visible: true })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    
    const app = db.prepare("SELECT * FROM apps WHERE slug = 'new-app'").get() as any;
    expect(app).toBeDefined();
    expect(app.name).toBe('NewApp');
    expect(app.is_visible).toBe(1);
  });
});
