/**
 * @jest-environment node
 */
import db from './db';

describe('Database', () => {
  beforeEach(() => {
    // Clear tables before each test
    db.prepare('DELETE FROM app_groups').run();
    db.prepare('DELETE FROM apps').run();
    db.prepare('DELETE FROM groups').run();
    db.prepare("DELETE FROM users WHERE username != 'admin'").run();
  });

  it('should create default admin user', () => {
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
