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

jest.mock('@/lib/db', () => {
  let appsTable: any[] = [];
  let groupsTable: any[] = [];
  let appGroupsTable: any[] = [];

  return {
    __esModule: true,
    default: {
      _reset: () => {
        appsTable = [];
        groupsTable = [];
        appGroupsTable = [];
      },
      _setApps: (apps: any[]) => { appsTable = apps; },
      _setGroups: (groups: any[]) => { groupsTable = groups; },
      _setAppGroups: (ag: any[]) => { appGroupsTable = ag; },
      prepare: (query: string) => ({
        all: (...params: any[]) => {
          if (query.includes('FROM apps WHERE is_visible = 1')) {
            return appsTable.filter(a => a.is_visible === 1);
          }
          if (query.includes('FROM groups WHERE name IN')) {
            return groupsTable.filter(g => params.includes(g.name));
          }
          if (query.includes('FROM app_groups WHERE group_id IN')) {
            return appGroupsTable.filter(ag => params.includes(ag.group_id));
          }
          return [];
        },
        get: () => null,
        run: () => ({ lastInsertRowid: 1 })
      })
    }
  };
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db as any)._reset();
  });

  it('renders all visible apps for admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true, name: 'Admin' } });
    (db as any)._setApps([{ id: 1, name: 'AdminApp', slug: 'admin-app', is_visible: 1 }]);

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
    (db as any)._setApps([{ id: 1, name: 'SecretApp', slug: 'secret', is_visible: 1 }]);
    (db as any)._setGroups([{ id: 2, name: 'GroupB', authentik_pk: 'gb' }]);
    
    const jsx = await Home();
    render(jsx);

    expect(screen.queryByText('SecretApp')).not.toBeInTheDocument();
    expect(screen.getByText('Nincs megjeleníthető alkalmazás.')).toBeInTheDocument();
  });

  it('renders apps assigned to user group', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ 
      user: { provider: 'authentik', groups: ['GroupA'] } 
    });
    
    (db as any)._setApps([{ id: 1, name: 'AllowedApp', slug: 'allowed', is_visible: 1 }]);
    (db as any)._setGroups([{ id: 1, name: 'GroupA', authentik_pk: 'ga' }]);
    (db as any)._setAppGroups([{ app_id: 1, group_id: 1 }]);
    
    const jsx = await Home();
    render(jsx);

    expect(screen.getByText('AllowedApp')).toBeInTheDocument();
  });
});
