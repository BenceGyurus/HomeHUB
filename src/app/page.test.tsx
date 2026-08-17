import { render, screen } from '@testing-library/react';
import Home from './page';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';
import '@testing-library/jest-dom';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>;
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
          if (query.includes('FROM app_groups ag')) {
            return appGroupsTable.map(ag => {
              const group = groupsTable.find(g => g.id === ag.group_id);
              return {
                app_id: ag.app_id,
                group_name: group?.name || '',
                authentik_pk: group?.authentik_pk || '',
              };
            });
          }
          return [];
        },
        get: () => null,
        run: () => ({ lastInsertRowid: 1 })
      })
    }
  };
});

describe('Dashboard Page Access Control', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db as any)._reset();
  });

  it('renders locked view with login prompt for unauthenticated guest', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    (db as any)._setApps([{ id: 1, name: 'SecretApp', slug: 'secret-app', is_visible: 1 }]);

    const jsx = await Home();
    render(jsx);

    expect(screen.getByText(/Hozzáférés Zárolva/)).toBeInTheDocument();
    expect(screen.queryByText('SecretApp')).not.toBeInTheDocument();
  });

  it('renders all visible apps for admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { isAdmin: true, name: 'Admin' } });
    (db as any)._setApps([{ id: 1, name: 'AdminApp', slug: 'admin-app', is_visible: 1 }]);

    const jsx = await Home();
    render(jsx);

    expect(screen.getAllByText(/Admin/).length).toBeGreaterThan(0);
    expect(screen.getByText('AdminApp')).toBeInTheDocument();
  });

  it('renders apps assigned to user group for authenticated user', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ 
      user: { name: 'User1', provider: 'authentik', groups: ['MediaGroup'] } 
    });
    
    (db as any)._setApps([
      { id: 1, name: 'Plex', slug: 'plex', is_visible: 1 },
      { id: 2, name: 'Router', slug: 'router', is_visible: 1 }
    ]);
    (db as any)._setGroups([
      { id: 1, name: 'MediaGroup', authentik_pk: 'pk_media' },
      { id: 2, name: 'NetworkGroup', authentik_pk: 'pk_network' }
    ]);
    (db as any)._setAppGroups([
      { app_id: 1, group_id: 1 },
      { app_id: 2, group_id: 2 }
    ]);
    
    const jsx = await Home();
    render(jsx);

    expect(screen.getByText('Plex')).toBeInTheDocument();
    expect(screen.queryByText('Router')).not.toBeInTheDocument();
  });
});
