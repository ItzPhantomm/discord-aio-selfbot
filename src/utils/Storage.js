const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

/**
 * Storage (SQLite Edition)
 * High-performance, zero-latency synchronous SQLite storage replacing the flat JSON file.
 * Features dedicated indexed tables for snipes, edit-snipes, autoresponders, and todos,
 * plus a fast indexed key-value table for general properties.
 */
class Storage {
  constructor(dbPath = path.join(__dirname, '../../data/flaw.db')) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.initTables();
    this.migrateFromJsonIfPresent();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS snipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        author_tag TEXT,
        author_id TEXT,
        author_avatar TEXT,
        content TEXT,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_snipes_chan_time ON snipes (channel_id, timestamp DESC);

      CREATE TABLE IF NOT EXISTS edit_snipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        author_tag TEXT,
        author_id TEXT,
        old_content TEXT,
        new_content TEXT,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_editsnipes_chan_time ON edit_snipes (channel_id, timestamp DESC);

      CREATE TABLE IF NOT EXISTS autoresponders (
        trigger TEXT PRIMARY KEY,
        reply TEXT NOT NULL,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS autoreactions (
        trigger TEXT PRIMARY KEY,
        emoji TEXT NOT NULL,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
  }

  migrateFromJsonIfPresent() {
    const jsonPath = path.join(__dirname, '../../data/storage.json');
    if (!fs.existsSync(jsonPath)) return;

    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(raw);

      // Check if kv_store already has data
      const count = this.db.prepare('SELECT count(*) as count FROM kv_store').get().count;
      if (count > 0) return; // Already migrated

      const insertKv = this.db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)');
      const insertSnipe = this.db.prepare(`
        INSERT INTO snipes (channel_id, author_tag, author_id, author_avatar, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertAutoresponder = this.db.prepare('INSERT OR REPLACE INTO autoresponders (trigger, reply, created_at) VALUES (?, ?, ?)');
      const insertTodo = this.db.prepare('INSERT INTO todos (text, completed, created_at) VALUES (?, 0, ?)');

      const tx = this.db.transaction(() => {
        for (const [k, v] of Object.entries(data)) {
          if (k === 'snipes' && typeof v === 'object' && v !== null) {
            for (const [chanId, list] of Object.entries(v)) {
              if (Array.isArray(list)) {
                for (const s of list) {
                  insertSnipe.run(chanId, s.author?.tag, s.author?.id, s.author?.avatar, s.content, s.timestamp || Date.now());
                }
              }
            }
          } else if (k === 'autoresponders' && typeof v === 'object' && v !== null) {
            for (const [trig, rep] of Object.entries(v)) {
              insertAutoresponder.run(trig, rep, Date.now());
            }
          } else if (k === 'todos' && Array.isArray(v)) {
            for (const item of v) {
              const text = typeof item === 'string' ? item : item.text;
              if (text) insertTodo.run(text, Date.now());
            }
          } else {
            insertKv.run(k, JSON.stringify(v));
          }
        }
      });
      tx();
    } catch {}
  }

  // --- High-Performance Typed API ---

  addSnipe(channelId, snipe) {
    const stmt = this.db.prepare(`
      INSERT INTO snipes (channel_id, author_tag, author_id, author_avatar, content, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      channelId,
      snipe.author?.tag || 'Unknown',
      snipe.author?.id || null,
      snipe.author?.avatar || null,
      snipe.content || '',
      snipe.timestamp || Date.now()
    );

    // Prune channel snipes older than top 20
    this.db.prepare(`
      DELETE FROM snipes WHERE id NOT IN (
        SELECT id FROM snipes WHERE channel_id = ? ORDER BY timestamp DESC LIMIT 20
      ) AND channel_id = ?
    `).run(channelId, channelId);
  }

  getChannelSnipes(channelId, limit = 20) {
    const rows = this.db.prepare(`
      SELECT author_tag, author_id, author_avatar, content, timestamp
      FROM snipes WHERE channel_id = ? ORDER BY timestamp DESC LIMIT ?
    `).all(channelId, limit);

    return rows.map(r => ({
      author: { tag: r.author_tag, id: r.author_id, avatar: r.author_avatar },
      content: r.content,
      timestamp: r.timestamp
    }));
  }

  addEditSnipe(channelId, editSnipe) {
    const stmt = this.db.prepare(`
      INSERT INTO edit_snipes (channel_id, author_tag, author_id, old_content, new_content, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      channelId,
      editSnipe.author?.tag || 'Unknown',
      editSnipe.author?.id || null,
      editSnipe.oldContent || '',
      editSnipe.newContent || '',
      editSnipe.timestamp || Date.now()
    );

    this.db.prepare(`
      DELETE FROM edit_snipes WHERE id NOT IN (
        SELECT id FROM edit_snipes WHERE channel_id = ? ORDER BY timestamp DESC LIMIT 20
      ) AND channel_id = ?
    `).run(channelId, channelId);
  }

  getChannelEditSnipes(channelId, limit = 20) {
    const rows = this.db.prepare(`
      SELECT author_tag, author_id, old_content, new_content, timestamp
      FROM edit_snipes WHERE channel_id = ? ORDER BY timestamp DESC LIMIT ?
    `).all(channelId, limit);

    return rows.map(r => ({
      author: { tag: r.author_tag, id: r.author_id },
      oldContent: r.old_content,
      newContent: r.new_content,
      timestamp: r.timestamp
    }));
  }

  // --- Universal Backwards-Compatible API (get, set, delete, has, push) ---

  get(key, defaultValue = null) {
    if (key === 'snipes') {
      const channels = this.db.prepare('SELECT DISTINCT channel_id FROM snipes').all();
      const res = {};
      for (const { channel_id } of channels) {
        res[channel_id] = this.getChannelSnipes(channel_id);
      }
      return Object.keys(res).length > 0 ? res : defaultValue;
    }

    if (key === 'editSnipes') {
      const channels = this.db.prepare('SELECT DISTINCT channel_id FROM edit_snipes').all();
      const res = {};
      for (const { channel_id } of channels) {
        res[channel_id] = this.getChannelEditSnipes(channel_id);
      }
      return Object.keys(res).length > 0 ? res : defaultValue;
    }

    if (key === 'autoresponders') {
      const rows = this.db.prepare('SELECT trigger, reply FROM autoresponders').all();
      const res = {};
      for (const r of rows) res[r.trigger] = r.reply;
      return Object.keys(res).length > 0 ? res : defaultValue;
    }

    if (key === 'autoreactions') {
      const rows = this.db.prepare('SELECT trigger, emoji FROM autoreactions').all();
      const res = {};
      for (const r of rows) res[r.trigger] = r.emoji;
      return Object.keys(res).length > 0 ? res : defaultValue;
    }

    if (key === 'todos') {
      const rows = this.db.prepare('SELECT text FROM todos ORDER BY id ASC').all();
      return rows.length > 0 ? rows.map(r => r.text) : (Array.isArray(defaultValue) ? defaultValue : []);
    }

    // Default KV store
    const row = this.db.prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
    if (!row) return defaultValue;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }

  set(key, value) {
    if (key === 'snipes' && typeof value === 'object' && value !== null) {
      const insert = this.db.prepare(`
        INSERT INTO snipes (channel_id, author_tag, author_id, author_avatar, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const tx = this.db.transaction(() => {
        this.db.prepare('DELETE FROM snipes').run();
        for (const [chanId, list] of Object.entries(value)) {
          if (Array.isArray(list)) {
            for (const s of list) {
              insert.run(chanId, s.author?.tag, s.author?.id, s.author?.avatar, s.content, s.timestamp || Date.now());
            }
          }
        }
      });
      tx();
      return value;
    }

    if (key === 'autoresponders' && typeof value === 'object' && value !== null) {
      const insert = this.db.prepare('INSERT OR REPLACE INTO autoresponders (trigger, reply, created_at) VALUES (?, ?, ?)');
      const tx = this.db.transaction(() => {
        this.db.prepare('DELETE FROM autoresponders').run();
        for (const [trig, rep] of Object.entries(value)) {
          insert.run(trig, rep, Date.now());
        }
      });
      tx();
      return value;
    }

    if (key === 'todos' && Array.isArray(value)) {
      const insert = this.db.prepare('INSERT INTO todos (text, completed, created_at) VALUES (?, 0, ?)');
      const tx = this.db.transaction(() => {
        this.db.prepare('DELETE FROM todos').run();
        for (const item of value) {
          const text = typeof item === 'string' ? item : item.text;
          if (text) insert.run(text, Date.now());
        }
      });
      tx();
      return value;
    }

    // Default KV store
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    this.db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)').run(key, serialized);
    return value;
  }

  delete(key) {
    if (key === 'snipes') {
      this.db.prepare('DELETE FROM snipes').run();
      return true;
    }
    if (key === 'editSnipes') {
      this.db.prepare('DELETE FROM edit_snipes').run();
      return true;
    }
    if (key === 'autoresponders') {
      this.db.prepare('DELETE FROM autoresponders').run();
      return true;
    }
    if (key === 'todos') {
      this.db.prepare('DELETE FROM todos').run();
      return true;
    }

    const res = this.db.prepare('DELETE FROM kv_store WHERE key = ?').run(key);
    return res.changes > 0;
  }

  has(key) {
    return this.get(key) !== null;
  }

  push(key, item) {
    if (key === 'todos') {
      const text = typeof item === 'string' ? item : item.text;
      if (text) {
        this.db.prepare('INSERT INTO todos (text, completed, created_at) VALUES (?, 0, ?)').run(text, Date.now());
      }
      return this.get('todos');
    }

    const current = this.get(key, []);
    if (Array.isArray(current)) {
      current.push(item);
      this.set(key, current);
      return current;
    }
    return [item];
  }
}

module.exports = new Storage();
module.exports.Storage = Storage;
