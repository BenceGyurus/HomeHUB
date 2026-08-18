/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/db', () => {
  let userRecord: any = null;

  return {
    __esModule: true,
    default: {
      _setUser: (u: any) => { userRecord = u; },
      _getUser: () => userRecord,
      prepare: (query: string) => ({
        all: () => [],
        get: (username: string) => {
          if (userRecord && userRecord.username === username) {
            return userRecord;
          }
          return null;
        },
        run: (...params: any[]) => {
          if (query.includes('UPDATE users SET password_hash')) {
            userRecord.password_hash = params[0];
          }
          return { changes: 1 };
        }
      })
    }
  };
});

describe('Change Password API Route', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db as any)._setUser({
      id: 1,
      username: 'admin',
      password_hash: bcrypt.hashSync('oldpassword', 10),
      is_admin: 1,
    });
  });

  it('rejects unauthorized users', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword: 'new' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('rejects mismatched new passwords', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword1',
        confirmPassword: 'mismatchpassword',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('nem egyeznek');
  });

  it('rejects wrong current password', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('helytelen');
  });

  it('successfully updates password when current password matches', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpassword',
        newPassword: 'brandnewpassword',
        confirmPassword: 'brandnewpassword',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify hash changed
    const updatedUser = (db as any)._getUser();
    expect(bcrypt.compareSync('brandnewpassword', updatedUser.password_hash)).toBe(true);
  });
});
