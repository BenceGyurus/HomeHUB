import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

let _db: Database.Database | null = null;

function getDbPath(): string {
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) return ':memory:';

  const preferredPath = process.env.DATABASE_PATH || './data/homehub.db';
  const resolved = path.isAbsolute(preferredPath) 
    ? preferredPath 
    : path.resolve(process.cwd(), preferredPath);

  const dbDir = path.dirname(resolved);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.db(`Adatbázis mappa létrehozva: ${dbDir}`);
    }
    // Test write permission on directory
    fs.accessSync(dbDir, fs.constants.W_OK);
    return resolved;
  } catch (err) {
    logger.warn('DB', `Nem sikerült írni a(z) "${dbDir}" mappába: ${err}. Tartalék könyvtár keresése...`);
    const fallbacks = [
      path.resolve(process.cwd(), 'homehub.db'),
      '/tmp/homehub.db',
    ];
    for (const fb of fallbacks) {
      try {
        const fbDir = path.dirname(fb);
        if (!fs.existsSync(fbDir)) fs.mkdirSync(fbDir, { recursive: true });
        fs.accessSync(fbDir, fs.constants.W_OK);
        logger.db(`Írható tartalék adatbázis kiválasztva: ${fb}`);
        return fb;
      } catch {}
    }
    return resolved;
  }
}

function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = getDbPath();
  logger.db(`Adatbázis megnyitása: ${dbPath}`);
  
  try {
    _db = new Database(dbPath, { timeout: 10000 });
  } catch (err: any) {
    logger.error('DB', `Hiba a(z) "${dbPath}" megnyitásakor: ${err.message}. Memória adatbázis használata.`);
    _db = new Database(':memory:');
  }

  // Configure pragmas for concurrency and durability
  try {
    _db.pragma('journal_mode = WAL');
    _db.pragma('busy_timeout = 5000');
    logger.db(`WAL mód és 5000ms busy_timeout bekapcsolva.`);
  } catch (e: any) {
    logger.warn('DB', `Nem sikerült beállítani a WAL módot: ${e.message}`);
  }

  // Initialize schema
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon_url TEXT,
      custom_icon TEXT,
      launch_url TEXT,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT 1,
      is_imported BOOLEAN DEFAULT 0,
      authentik_slug TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      authentik_pk TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_groups (
      app_id INTEGER,
      group_id INTEGER,
      PRIMARY KEY (app_id, group_id),
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      color TEXT
    );
  `);

  try {
    const adminCount = _db.prepare('SELECT count(*) as count FROM users WHERE is_admin = 1').get() as { count: number };
    if (adminCount && adminCount.count === 0) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin', 10);
      _db.prepare('INSERT OR IGNORE INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)').run('admin', hash);
      logger.db(`Alapértelmezett admin felhasználó létrehozva (admin / admin).`);
    }
  } catch (e) {
    // Ignore if already initialized
  }

  return _db;
}

const db = {
  prepare: (query: string) => getDb().prepare(query),
  exec: (query: string) => getDb().exec(query),
  transaction: (fn: any) => getDb().transaction(fn),
  close: () => {
    if (_db) {
      _db.close();
      _db = null;
    }
  }
};

export default db;
