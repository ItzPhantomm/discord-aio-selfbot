const fs = require('fs');
const path = require('path');

class Storage {
  constructor(filePath = path.join(__dirname, '../../data/storage.json')) {
    this.filePath = filePath;
    this.data = {};
    this.isWriting = false;
    this.pendingWrite = false;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = {};
        this.save();
      }
    } catch (err) {
      this.data = {};
    }
  }

  // Atomic write queue preventing race conditions and incomplete disk syncs
  save() {
    if (this.isWriting) {
      this.pendingWrite = true;
      return;
    }

    try {
      this.isWriting = true;
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Storage atomic write error:', err);
    } finally {
      this.isWriting = false;
      if (this.pendingWrite) {
        this.pendingWrite = false;
        this.save();
      }
    }
  }

  get(key, defaultValue = null) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
    return value;
  }

  delete(key) {
    if (this.data[key] !== undefined) {
      delete this.data[key];
      this.save();
      return true;
    }
    return false;
  }

  has(key) {
    return this.data[key] !== undefined;
  }

  push(key, item) {
    if (!Array.isArray(this.data[key])) {
      this.data[key] = [];
    }
    this.data[key].push(item);
    this.save();
    return this.data[key];
  }
}

module.exports = new Storage();
module.exports.Storage = Storage;
