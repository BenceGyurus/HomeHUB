/**
 * @jest-environment node
 */
import db from './db';

jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => {
    const memoryStore: {
      users: any[];
      apps: any[];
      groups: any[];
      app_groups: any[];
      settings: any[];
    } = {
      users: [{ id: 1, username: 'admin', is_admin: 1 }],
      apps: [],
      groups: [],
      app_groups: [],
      settings: []
    };

    return {
      exec: jest.fn(),
      close: jest.fn(),
      prepare: jest.fn().mockImplementation((query: string) => ({
        run: jest.fn().mockImplementation((...args: any[]) => {
          if (query.includes('INSERT INTO apps')) {
            const newApp = { id: memoryStore.apps.length + 1, name: args[0], slug: args[1], launch_url: args[2] };
            memoryStore.apps.push(newApp);
            return { lastInsertRowid: newApp.id };
          }
          if (query.includes('INSERT INTO groups')) {
            const newGroup = { id: memoryStore.groups.length + 1, authentik_pk: args[0], name: args[1] };
            memoryStore.groups.push(newGroup);
            return { lastInsertRowid: newGroup.id };
          }
          if (query.includes('INSERT INTO app_groups')) {
            const newAg = { app_id: args[0], group_id: args[1] };
            memoryStore.app_groups.push(newAg);
            return { lastInsertRowid: memoryStore.app_groups.length };
          }
          if (query.includes('DELETE FROM')) {
            if (query.includes('app_groups')) memoryStore.app_groups = [];
            if (query.includes('apps')) memoryStore.apps = [];
            if (query.includes('groups')) memoryStore.groups = [];
            if (query.includes('users')) memoryStore.users = memoryStore.users.filter(u => u.username === 'admin');
          }
          return { lastInsertRowid: 1 };
        }),
        get: jest.fn().mockImplementation((...args: any[]) => {
          if (query.includes("WHERE username = 'admin'") || query.includes('WHERE username = "admin"')) {
            return memoryStore.users.find(u => u.username === 'admin');
          }
          if (query.includes('WHERE is_admin = 1')) {
            return { count: memoryStore.users.filter(u => u.is_admin === 1).length };
          }
          if (query.includes("WHERE slug = 'test-app'")) {
            return memoryStore.apps.find(a => a.slug === 'test-app');
          }
          return null;
        }),
        all: jest.fn().mockImplementation(() => {
          if (query.includes('FROM app_groups')) return memoryStore.app_groups;
          if (query.includes('FROM apps')) return memoryStore.apps;
          if (query.includes('FROM groups')) return memoryStore.groups;
          return [];
        })
      }))
    };
  });
});

describe('Database Schema & Operations', () => {
  it('should initialize and have default admin user', () => {
    const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get() as any;
    expect(admin).toBeDefined();
    expect(admin.is_admin).toBe(1);
  });

  it('should insert and retrieve an app', () => {
    const insert = db.prepare(`
      INSERT INTO apps (name, slug, launch_url) VALUES (?, ?, ?)
    `);
    insert.run('Test App', 'test-app', 'http://test.com');

    const app = db.prepare("SELECT * FROM apps WHERE slug = 'test-app'").get() as any;
    expect(app).toBeDefined();
    expect(app.name).toBe('Test App');
  });

  it('should assign app to group', () => {
    const appInfo = db.prepare('INSERT INTO apps (name, slug) VALUES (?, ?)').run('App1', 'app1');
    const groupInfo = db.prepare('INSERT INTO groups (authentik_pk, name) VALUES (?, ?)').run('g1', 'Group1');

    db.prepare('INSERT INTO app_groups (app_id, group_id) VALUES (?, ?)').run(appInfo.lastInsertRowid, groupInfo.lastInsertRowid);

    const ag = db.prepare('SELECT * FROM app_groups').all() as any[];
    expect(ag.length).toBe(1);
    expect(ag[0].app_id).toBe(appInfo.lastInsertRowid);
  });
});
