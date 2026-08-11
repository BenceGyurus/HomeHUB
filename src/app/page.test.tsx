import { render, screen } from '@testing-library/react';
import Home from './page';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';
import '@testing-library/jest-dom';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.prepare('DELETE FROM app_groups').run();
    db.prepare('DELETE FROM apps').run();
    db.prepare('DELETE FROM groups').run();
  });

  it('renders all visible apps for admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true, name: 'Admin' } });
    db.prepare('INSERT INTO apps (name, slug, is_visible) VALUES (?, ?, 1)').run('AdminApp', 'admin-app');

    const jsx = await Home();
    render(jsx);

    expect(screen.getByText('Üdv, Admin')).toBeInTheDocument();
    expect(screen.getByText('AdminApp')).toBeInTheDocument();
  });

  it('renders no apps if user has no group access', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ 
      user: { provider: 'authentik', groups: ['GroupA'] } 
    });
    // App exists but not assigned to GroupA
    db.prepare('INSERT INTO apps (name, slug, is_visible) VALUES (?, ?, 1)').run('SecretApp', 'secret');
    db.prepare('INSERT INTO groups (name, authentik_pk) VALUES (?, ?)').run('GroupB', 'gb');
    
    const jsx = await Home();
    render(jsx);

    expect(screen.queryByText('SecretApp')).not.toBeInTheDocument();
    expect(screen.getByText('Nincs megjeleníthető alkalmazás.')).toBeInTheDocument();
  });

  it('renders apps assigned to user group', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ 
      user: { provider: 'authentik', groups: ['GroupA'] } 
    });
    
    const app = db.prepare('INSERT INTO apps (name, slug, is_visible) VALUES (?, ?, 1)').run('AllowedApp', 'allowed');
    const group = db.prepare('INSERT INTO groups (name, authentik_pk) VALUES (?, ?)').run('GroupA', 'ga');
    db.prepare('INSERT INTO app_groups (app_id, group_id) VALUES (?, ?)').run(app.lastInsertRowid, group.lastInsertRowid);
    
    const jsx = await Home();
    render(jsx);

    expect(screen.getByText('AllowedApp')).toBeInTheDocument();
  });
});
