const SecretSanitizer = require('./SecretSanitizer');

class Logger {
  constructor() {
    this.eventCount = 0;
    this.historyBuckets = [0, 0, 0, 0, 0, 0, 0, 0];
    this.isPaused = false;
    this.pausedBuffer = [];
    this.currentFilter = 'ALL';
    this.cliOutputHandler = null;
  }

  setCliHandler(handler) {
    this.cliOutputHandler = handler;
  }

  setTuiPane(pane) {
    if (pane && typeof pane.log === 'function') {
      this.cliOutputHandler = (line) => pane.log(line);
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.pausedBuffer.length > 0) {
      for (const line of this.pausedBuffer) {
        if (this.cliOutputHandler) {
          this.cliOutputHandler(line);
        } else {
          console.log(line);
        }
      }
      this.pausedBuffer = [];
    }
    return this.isPaused;
  }

  setFilter(filterName) {
    this.currentFilter = (filterName || 'ALL').toUpperCase();
    return this.currentFilter;
  }

  formatTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }

  recordEvent() {
    this.eventCount++;
    this.historyBuckets[this.historyBuckets.length - 1]++;
  }

  shiftBuckets() {
    this.historyBuckets.shift();
    this.historyBuckets.push(0);
  }

  log(tag, message, ansiBadge = '\x1b[107m\x1b[30m') {
    this.recordEvent();

    if (this.currentFilter !== 'ALL' && tag !== this.currentFilter && tag !== 'SYS') {
      return;
    }

    const time = this.formatTime();
    let sanitizedMsg = SecretSanitizer.sanitize(message);

    // Strip legacy blessed color codes: {red-fg}, {#FFFFFF-fg}, {bold}, etc.
    sanitizedMsg = sanitizedMsg.replace(/\{[^{}]+\}/g, '');

    const timeFormatted = `\x1b[90m[${time}]\x1b[0m`;
    const badgeFormatted = `${ansiBadge}\x1b[1m ${tag} \x1b[0m`;
    // Text inside of logs is always pure, crisp bright white: \x1b[1m\x1b[97m
    const formatted = `${timeFormatted} ${badgeFormatted} \x1b[1m\x1b[97m${sanitizedMsg}\x1b[0m`;

    if (this.isPaused) {
      this.pausedBuffer.push(formatted);
      return;
    }

    if (this.cliOutputHandler) {
      this.cliOutputHandler(formatted);
    } else {
      console.log(formatted);
    }
  }

  cmd(msg) {
    this.log('CMD', msg, '\x1b[106m\x1b[30m');
  }

  info(msg) {
    this.log('INF', msg, '\x1b[104m\x1b[30m');
  }

  success(msg) {
    this.log('OK', msg, '\x1b[102m\x1b[30m');
  }

  warn(msg) {
    this.log('WRN', msg, '\x1b[103m\x1b[30m');
  }

  error(msg) {
    this.log('ERR', msg, '\x1b[101m\x1b[30m');
  }

  snipe(msg) {
    this.log('SNP', msg, '\x1b[105m\x1b[30m');
  }

  afk(msg) {
    this.log('AFK', msg, '\x1b[103m\x1b[30m');
  }

  msg(msg) {
    this.log('MSG', msg, '\x1b[107m\x1b[30m');
  }

  agent(msg) {
    this.log('AGT', msg, '\x1b[106m\x1b[30m');
  }

  sec(msg) {
    this.log('SEC', msg, '\x1b[101m\x1b[30m');
  }
}

module.exports = new Logger();
module.exports.Logger = Logger;
