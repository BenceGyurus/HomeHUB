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

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    prepare: jest.fn().mockImplementation((query: string) => ({
      all: jest.fn().mockImplementation(() => []),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }))
  }
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  hashSync: jest.fn(),
}));

describe('Change Password API Route (Hardened)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }));
  });

  it('rejects unauthenticated requests (403)', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'old', newPassword: 'newpass123', confirmPassword: 'newpass123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('SEC-01: rejects requests without currentPassword', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword: 'newpass123', confirmPassword: 'newpass123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('kötelező');
  });

  it('SEC-07: rejects passwords shorter than 8 characters', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'oldpw', newPassword: '12345', confirmPassword: '12345' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('8');
  });

  it('rejects wrong current password', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue({ id: 1, username: 'admin', password_hash: '$2b$10$hashed' }),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }));

    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'wrongpw', newPassword: 'newpass1234', confirmPassword: 'newpass1234' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('helytelen');
  });

  it('successfully changes password with correct current password', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { name: 'admin', isAdmin: true }
    });

    (db.prepare as jest.Mock).mockImplementation((query: string) => ({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue({ id: 1, username: 'admin', password_hash: '$2b$10$hashed' }),
      run: jest.fn().mockReturnValue({ changes: 1 }),
    }));

    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('$2b$12$newhash');

    const req = new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'admin', newPassword: 'newpass1234', confirmPassword: 'newpass1234' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
