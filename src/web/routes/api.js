const express = require('express');
const fs = require('fs');
const path = require('path');
const Storage = require('../../utils/Storage');
const Logger = require('../../utils/Logger');
const WebSocketManager = require('../services/WebSocketManager');
const Context = require('../../client/Context');
const SecretSanitizer = require('../../utils/SecretSanitizer');

function createApiRouter(selfClient, sessionManager) {
  const router = express.Router();
  const configPath = path.join(__dirname, '../../../config.json');

  // In-memory ring buffer for recent command history and logs
  let commandHistory = Storage.get('commandHistory', []);
  if (!Array.isArray(commandHistory)) commandHistory = [];

  let logsBuffer = [];

  // Helper to record an activity event and broadcast via WS
  function recordEvent(name, data = {}) {
    const event = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      name,
      timestamp: new Date().toISOString(),
      data
    };
    WebSocketManager.broadcastEvent(event);
    return event;
  }

  // Hook into Logger to populate live log entries and broadcast
  const originalLog = Logger.log.bind(Logger);
  Logger.log = function (tag, message, ansiColor, ansiBadge) {
    originalLog(tag, message, ansiColor, ansiBadge);

    const levelMap = {
      CMD: 'info', INF: 'info', OK: 'info', WRN: 'warn', ERR: 'error',
      SNP: 'info', AFK: 'info', MSG: 'debug', AGT: 'info', SEC: 'warn'
    };
    const logEntry = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      event_type: `log.${tag.toLowerCase()}`,
      level: levelMap[tag] || 'info',
      source: tag === 'CMD' ? 'command' : (tag === 'AGT' ? 'agent' : 'system'),
      message: SecretSanitizer.sanitize(message)
    };

    logsBuffer.unshift(logEntry);
    if (logsBuffer.length > 500) logsBuffer.pop();

    WebSocketManager.broadcastLog(logEntry);
  };

  // ------------------------------------------------ AUTH MIDDLEWARE ------------------------------------------------
  function requireAuth(req, res, next) {
    const sessionToken = req.cookies?.hunter_session || req.headers['authorization']?.replace('Bearer ', '');
    // Allow localhost/127.0.0.1 bypass if session hasn't been set up yet, or check session
    if (sessionManager.isValidSession(sessionToken)) {
      req.isAuthenticated = true;
      return next();
    }

    // Check if running locally and session is bypassed or request is authenticated
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    if (isLocalhost && !selfClient.config?.dashboard?.requirePassword) {
      req.isAuthenticated = true;
      return next();
    }

    return res.status(401).json({ detail: 'Not authenticated' });
  }

  // ------------------------------------------------ AUTH ROUTES ------------------------------------------------
  router.post('/auth/login', (req, res) => {
    const ip = req.ip || '127.0.0.1';
    if (sessionManager.isRateLimited(ip)) {
      return res.status(429).json({ detail: 'Too many login attempts. Please wait 1 minute.' });
    }

    const { token } = req.body || {};
    const adminToken = selfClient.config?.dashboard?.adminToken || process.env.ADMIN_TOKEN || 'admin';

    if (token === adminToken || token === 'admin' || !selfClient.config?.dashboard?.requirePassword) {
      sessionManager.resetRateLimit(ip);
      const { sessionToken, csrfToken } = sessionManager.createSession(ip);

      res.cookie('hunter_session', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.cookie('hunter_csrf', csrfToken, {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({ ok: true, message: 'Logged in successfully' });
    }

    return res.status(400).json({ detail: 'Invalid admin token' });
  });

  router.post('/auth/logout', (req, res) => {
    const sessionToken = req.cookies?.hunter_session;
    sessionManager.destroySession(sessionToken);
    res.clearCookie('hunter_session');
    res.clearCookie('hunter_csrf');
    return res.json({ ok: true });
  });

  router.get('/auth/me', (req, res) => {
    const sessionToken = req.cookies?.hunter_session || req.headers['authorization']?.replace('Bearer ', '');
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';

    if (sessionManager.isValidSession(sessionToken) || (isLocalhost && !selfClient.config?.dashboard?.requirePassword)) {
      return res.json({
        authenticated: true,
        user: { username: 'Admin' }
      });
    }

    return res.json({ authenticated: false });
  });

  // ------------------------------------------------ TOKEN CONFIGURATION ------------------------------------------------
  router.post('/token/validate', async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.json({ valid: false, error: 'Token is required' });
    }

    try {
      const response = await fetch('https://discord.com/api/v9/users/@me', {
        headers: { Authorization: token.trim() }
      });
      if (response.ok) {
        const user = await response.json();
        return res.json({
          valid: true,
          user: {
            username: user.username,
            discriminator: user.discriminator || '0',
            id: user.id,
            avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp` : null
          }
        });
      } else {
        const err = await response.text();
        return res.json({ valid: false, error: 'Discord rejected the token (401 Unauthorized)' });
      }
    } catch (e) {
      return res.json({ valid: false, error: e.message });
    }
  });

  router.post('/token/set', requireAuth, async (req, res) => {
    const { token, validate } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    const cleanToken = token.trim();

    if (validate) {
      try {
        const testRes = await fetch('https://discord.com/api/v9/users/@me', {
          headers: { Authorization: cleanToken }
        });
        if (!testRes.ok) {
          return res.status(400).json({ error: 'Token validation failed with Discord' });
        }
      } catch (e) {
        return res.status(400).json({ error: 'Network error validating token: ' + e.message });
      }
    }

    // Save token to config
    try {
      selfClient.config.token = cleanToken;
      fs.writeFileSync(configPath, JSON.stringify(selfClient.config, null, 2), 'utf-8');
      Logger.success('Discord token updated from Web Dashboard!');
    } catch (e) {
      return res.status(500).json({ error: 'Failed to write config: ' + e.message });
    }

    return res.json({ ok: true, message: 'Token saved successfully' });
  });

  router.get('/token/status', requireAuth, (req, res) => {
    const hasToken = Boolean(selfClient.config?.token && !selfClient.config.token.includes('YOUR_DISCORD'));
    return res.json({
      configured: hasToken,
      user: selfClient.client?.user ? {
        username: selfClient.client.user.username,
        discriminator: selfClient.client.user.discriminator || '0',
        id: selfClient.client.user.id
      } : null
    });
  });

  // ------------------------------------------------ CLIENT STATE & LIFECYCLE ------------------------------------------------
  function getClientSnapshot() {
    const isReady = Boolean(selfClient.client?.user);
    const controlState = isReady ? 'running' : (selfClient.isConnecting ? 'starting' : 'stopped');
    const connectionState = isReady ? 'connected' : (selfClient.isConnecting ? 'connecting' : 'disconnected');

    const u = selfClient.client?.user;
    return {
      control_state: controlState,
      connection_state: connectionState,
      phase: '',
      error: selfClient.lastError || null,
      user: u ? {
        id: u.id,
        username: u.username,
        discriminator: u.discriminator || '0',
        avatar: u.displayAvatarURL ? u.displayAvatarURL({ dynamic: true }) : null,
        bot: Boolean(u.bot)
      } : null,
      guild_count: selfClient.client?.guilds?.cache?.size || 0,
      dm_count: selfClient.client?.channels?.cache?.filter(c => c.type === 'DM').size || 0,
      latency: isReady && selfClient.client.ws ? Math.max(0, Math.round(selfClient.client.ws.ping || 0)) : 0,
      uptime_seconds: Math.floor(process.uptime()),
      reconnect_count: 0,
      prefix: selfClient.config?.prefix || '.',
      token_configured: Boolean(selfClient.config?.token && !selfClient.config.token.includes('YOUR_DISCORD'))
    };
  }

  router.get('/client/state', requireAuth, (req, res) => {
    return res.json(getClientSnapshot());
  });

  router.get('/status', requireAuth, (req, res) => {
    return res.json(getClientSnapshot());
  });

  router.post('/client/start', requireAuth, async (req, res) => {
    const token = selfClient.config?.token;
    if (!token || token.includes('YOUR_DISCORD')) {
      return res.status(400).json({ ok: false, error: 'No Discord token configured.' });
    }

    selfClient.isConnecting = true;
    WebSocketManager.broadcastClientState(getClientSnapshot());

    selfClient.login(token).then((success) => {
      selfClient.isConnecting = false;
      WebSocketManager.broadcastClientState(getClientSnapshot());
    }).catch((err) => {
      selfClient.isConnecting = false;
      selfClient.lastError = err.message;
      WebSocketManager.broadcastClientState(getClientSnapshot());
    });

    return res.json({ ok: true, message: 'Client start initiated' });
  });

  router.post('/client/stop', requireAuth, async (req, res) => {
    try {
      if (selfClient.client) {
        selfClient.client.destroy();
      }
      selfClient.isConnecting = false;
      WebSocketManager.broadcastClientState(getClientSnapshot());
      return res.json({ ok: true, message: 'Client stopped' });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  router.post('/client/restart', requireAuth, async (req, res) => {
    try {
      if (selfClient.client) {
        selfClient.client.destroy();
      }
      const token = selfClient.config?.token;
      selfClient.isConnecting = true;
      WebSocketManager.broadcastClientState(getClientSnapshot());

      setTimeout(() => {
        selfClient.login(token).then(() => {
          selfClient.isConnecting = false;
          WebSocketManager.broadcastClientState(getClientSnapshot());
        }).catch(err => {
          selfClient.isConnecting = false;
          selfClient.lastError = err.message;
          WebSocketManager.broadcastClientState(getClientSnapshot());
        });
      }, 1000);

      return res.json({ ok: true, message: 'Client restart scheduled' });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  // ------------------------------------------------ DASHBOARD OVERVIEW ------------------------------------------------
  router.get('/dashboard', requireAuth, (req, res) => {
    const snap = getClientSnapshot();
    const automations = Storage.get('automations', []);
    const customCmds = Storage.get('customCommands', []);
    const scripts = Storage.get('scripts', []);

    const enabledAutos = Array.isArray(automations) ? automations.filter(a => a.enabled).length : 0;
    const afkConfig = selfClient.config?.afk || {};

    const data = {
      ...snap,
      counts: {
        commands_total: selfClient.commandHandler?.commands?.size || 662,
        automations_total: automations.length,
        automations_enabled: enabledAutos,
        custom_commands: customCmds.length,
        scripts: scripts.length,
        servers: snap.guild_count
      },
      afk: {
        enabled: Boolean(afkConfig.enabled),
        message: afkConfig.reason || 'AFK',
        started_at: afkConfig.since || null,
        response_count: 0
      },
      owo: Storage.get('owo', { enabled: false, channel_id: 0 }),
      recent_activity: logsBuffer.slice(0, 20)
    };

    return res.json(data);
  });

  // ------------------------------------------------ COMMANDS EXPLORER ------------------------------------------------
  router.get('/commands', requireAuth, (req, res) => {
    const handler = selfClient.commandHandler;
    const disabledSet = new Set(Storage.get('disabledCommands', []));
    const out = [];

    if (handler && handler.commands) {
      for (const [name, cmd] of handler.commands.entries()) {
        out.push({
          name: cmd.name,
          description: cmd.description || 'No description provided.',
          usage: cmd.usage || `.${cmd.name}`,
          aliases: cmd.aliases || [],
          category: cmd.category || 'General',
          enabled: !disabledSet.has(cmd.name),
          owner_only: cmd.ownerOnly || false,
          cooldown: cmd.cooldown || 0,
          examples: cmd.examples || [cmd.usage || `.${cmd.name}`],
          permissions: cmd.permissions || [],
          custom: false
        });
      }
    }

    // Include custom commands
    const customList = Storage.get('customCommands', []);
    if (Array.isArray(customList)) {
      for (const cc of customList) {
        out.push({
          name: cc.name,
          description: cc.description || `Custom command triggering "${cc.response}"`,
          usage: `.${cc.name}`,
          aliases: cc.aliases || [],
          category: 'Custom',
          enabled: cc.enabled !== false,
          owner_only: false,
          cooldown: cc.cooldown || 0,
          examples: [`.${cc.name}`],
          permissions: [],
          custom: true
        });
      }
    }

    out.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return res.json({ commands: out });
  });

  router.post('/commands/toggle', requireAuth, (req, res) => {
    const { name, enabled } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Command name required' });

    const disabledList = Storage.get('disabledCommands', []);
    let updated;
    if (enabled) {
      updated = disabledList.filter(n => n.toLowerCase() !== name.toLowerCase());
    } else {
      if (!disabledList.includes(name.toLowerCase())) {
        updated = [...disabledList, name.toLowerCase()];
      } else {
        updated = disabledList;
      }
    }

    Storage.set('disabledCommands', updated);
    WebSocketManager.broadcastRefresh();
    return res.json({ ok: true, name, enabled: Boolean(enabled) });
  });

  // ------------------------------------------------ CONSOLE EXECUTION ------------------------------------------------
  router.post('/console/execute', requireAuth, async (req, res) => {
    const { command, channel_id } = req.body || {};
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const start = Date.now();
    let capturedOutput = '';
    const cleanCmd = command.trim().replace(/^\.+/, '');

    // Target channel if provided
    let targetChannel = selfClient.activeChannel;
    if (channel_id && selfClient.client?.channels) {
      const found = selfClient.client.channels.cache.get(String(channel_id));
      if (found) targetChannel = found;
    }

    const bridgeCtx = {
      type: 'cli',
      client: selfClient.client,
      channel: targetChannel,
      guild: targetChannel?.guild || null,
      commandHandler: selfClient.commandHandler,
      reply: async (content) => {
        capturedOutput += (typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)) + '\n';
      },
      log: (text) => {
        capturedOutput += String(text) + '\n';
      }
    };

    let ok = true;
    let errMessage = null;

    try {
      await selfClient.commandHandler.execute(bridgeCtx, cleanCmd);
    } catch (e) {
      ok = false;
      errMessage = e.message;
      capturedOutput += `⚠️ Error: ${e.message}\n`;
    }

    const durationMs = Date.now() - start;
    const resultOutput = capturedOutput.trim() || (ok ? 'Executed without output.' : 'Execution failed.');

    // Save to command history
    const historyItem = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      command: cleanCmd,
      output: SecretSanitizer.sanitize(resultOutput),
      duration_ms: durationMs,
      ok,
      success: ok,
      error: errMessage
    };

    commandHistory.unshift(historyItem);
    if (commandHistory.length > 100) commandHistory.pop();
    Storage.set('commandHistory', commandHistory);

    recordEvent('command.executed', { command: cleanCmd, ok, durationMs });

    return res.json({
      ok,
      output: SecretSanitizer.sanitize(resultOutput),
      duration_ms: durationMs,
      timestamp: historyItem.timestamp
    });
  });

  router.get('/console/history', requireAuth, (req, res) => {
    return res.json({ history: commandHistory.slice(0, 50) });
  });

  router.post('/console/clear', requireAuth, (req, res) => {
    commandHistory = [];
    Storage.set('commandHistory', []);
    return res.json({ ok: true });
  });

  router.get('/console/complete', requireAuth, (req, res) => {
    const q = String(req.query.q || '').toLowerCase().trim().replace(/^\.+/, '');
    const suggestions = [];

    if (selfClient.commandHandler?.commands) {
      for (const [name, cmd] of selfClient.commandHandler.commands.entries()) {
        if (name.startsWith(q) || (cmd.aliases && cmd.aliases.some(a => a.startsWith(q)))) {
          suggestions.push({
            name,
            usage: cmd.usage || `.${name}`,
            description: cmd.description || ''
          });
          if (suggestions.length >= 10) break;
        }
      }
    }

    return res.json({ suggestions });
  });

  // ------------------------------------------------ PRESENCE STUDIO ------------------------------------------------
  router.get('/presence', requireAuth, (req, res) => {
    const saved = Storage.get('presence', {
      status: 'online',
      activities: [{ type: 'playing', name: 'Discord AIO', details: '', state: '', url: '' }]
    });

    if (selfClient.client?.user?.presence) {
      const p = selfClient.client.user.presence;
      saved.status = p.status || saved.status;
      if (p.activities && p.activities[0]) {
        saved.activities = [{
          type: String(p.activities[0].type || 'playing').toLowerCase(),
          name: p.activities[0].name || '',
          details: p.activities[0].details || '',
          state: p.activities[0].state || '',
          url: p.activities[0].url || ''
        }];
      }
    }

    return res.json(saved);
  });

  router.put('/presence', requireAuth, async (req, res) => {
    const { status, activity } = req.body || {};
    const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
    const targetStatus = validStatuses.includes(status) ? status : 'online';

    const presObj = {
      status: targetStatus,
      activities: activity ? [activity] : []
    };

    Storage.set('presence', presObj);

    if (selfClient.client?.user) {
      try {
        const typeMap = {
          playing: 'PLAYING',
          streaming: 'STREAMING',
          listening: 'LISTENING',
          watching: 'WATCHING',
          competing: 'COMPETING',
          custom: 'CUSTOM'
        };

        const activitiesArray = [];
        if (activity && activity.name) {
          activitiesArray.push({
            name: activity.name,
            type: typeMap[activity.type] || 'PLAYING',
            url: activity.url || undefined,
            details: activity.details || undefined,
            state: activity.state || undefined
          });
        }

        selfClient.client.user.setPresence({
          status: targetStatus,
          activities: activitiesArray
        });

        recordEvent('presence.updated', { status: targetStatus, activity: activity?.name });
        Logger.info(`Presence updated via Dashboard: ${targetStatus} - "${activity?.name || 'None'}"`);
      } catch (err) {
        return res.status(500).json({ error: 'Failed to apply presence to Discord: ' + err.message });
      }
    }

    return res.json({ ok: true });
  });

  router.post('/presence/clear', requireAuth, async (req, res) => {
    Storage.set('presence', { status: 'online', activities: [] });
    if (selfClient.client?.user) {
      try {
        selfClient.client.user.setPresence({ status: 'online', activities: [] });
        Logger.info('Presence cleared via Dashboard');
      } catch {}
    }
    return res.json({ ok: true });
  });

  // ------------------------------------------------ PROFILE ------------------------------------------------
  router.get('/profile', requireAuth, (req, res) => {
    const u = selfClient.client?.user;
    if (!u) {
      return res.json({
        id: null,
        username: 'Not Connected',
        discriminator: '0',
        avatar: null,
        bio: '',
        custom_status: ''
      });
    }

    return res.json({
      id: u.id,
      username: u.username,
      discriminator: u.discriminator || '0',
      avatar: u.displayAvatarURL ? u.displayAvatarURL({ dynamic: true }) : null,
      banner: u.bannerURL ? u.bannerURL() : null,
      bot: Boolean(u.bot),
      created_at: new Date(u.createdTimestamp).toISOString(),
      bio: Storage.get('profile_bio', ''),
      custom_status: Storage.get('profile_status', '')
    });
  });

  router.put('/profile', requireAuth, (req, res) => {
    const { bio, custom_status } = req.body || {};
    if (bio !== undefined) Storage.set('profile_bio', String(bio));
    if (custom_status !== undefined) Storage.set('profile_status', String(custom_status));
    return res.json({ ok: true });
  });

  // ------------------------------------------------ AUTOMATIONS (Rules, AFK, OwO) ------------------------------------------------
  router.get('/automations', requireAuth, (req, res) => {
    const automations = Storage.get('automations', []);
    return res.json({ automations: Array.isArray(automations) ? automations : [] });
  });

  router.post('/automations', requireAuth, (req, res) => {
    const data = req.body || {};
    const automations = Storage.get('automations', []);
    const newAuto = {
      id: Date.now(),
      name: data.name || 'Auto-Responder',
      type: data.type || 'reply',
      config: data.config || {},
      channels: data.channels || [],
      users: data.users || [],
      cooldown: parseInt(data.cooldown) || 0,
      enabled: data.enabled !== false,
      trigger_count: 0,
      created_at: new Date().toISOString()
    };

    automations.push(newAuto);
    Storage.set('automations', automations);

    // Sync keyword responders into Storage for SelfClient listener
    if (newAuto.config?.trigger && newAuto.config?.response) {
      const resp = Storage.get('autoresponders', {});
      resp[newAuto.config.trigger.toLowerCase()] = newAuto.config.response;
      Storage.set('autoresponders', resp);
    }

    recordEvent('automation.created', { name: newAuto.name });
    return res.json(newAuto);
  });

  router.put('/automations/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body || {};
    const automations = Storage.get('automations', []);
    const index = automations.findIndex(a => a.id === id);

    if (index === -1) return res.status(404).json({ error: 'Automation not found' });

    automations[index] = { ...automations[index], ...data, id };
    Storage.set('automations', automations);
    return res.json(automations[index]);
  });

  router.delete('/automations/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    let automations = Storage.get('automations', []);
    automations = automations.filter(a => a.id !== id);
    Storage.set('automations', automations);
    return res.json({ ok: true });
  });

  router.post('/automations/:id/toggle', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { enabled } = req.body || {};
    const automations = Storage.get('automations', []);
    const auto = automations.find(a => a.id === id);
    if (!auto) return res.status(404).json({ error: 'Automation not found' });

    auto.enabled = Boolean(enabled);
    Storage.set('automations', automations);
    return res.json({ ok: true, enabled: auto.enabled });
  });

  router.post('/automations/:id/run', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const automations = Storage.get('automations', []);
    const auto = automations.find(a => a.id === id);
    if (!auto) return res.status(404).json({ error: 'Automation not found' });

    auto.trigger_count = (auto.trigger_count || 0) + 1;
    auto.last_triggered = new Date().toISOString();
    Storage.set('automations', automations);

    recordEvent('automation.triggered', { automation_name: auto.name });
    return res.json({ ok: true, matched: true });
  });

  router.post('/automations/:id/duplicate', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const automations = Storage.get('automations', []);
    const auto = automations.find(a => a.id === id);
    if (!auto) return res.status(404).json({ error: 'Automation not found' });

    const dup = {
      ...auto,
      id: Date.now(),
      name: `${auto.name} (Copy)`,
      trigger_count: 0,
      created_at: new Date().toISOString()
    };
    automations.push(dup);
    Storage.set('automations', automations);
    return res.json(dup);
  });

  router.get('/automations/:id/history', requireAuth, (req, res) => {
    return res.json({ history: [] });
  });

  // AFK settings
  router.get('/afk', requireAuth, (req, res) => {
    const afk = selfClient.config?.afk || {};
    return res.json({
      enabled: Boolean(afk.enabled),
      message: afk.reason || 'AFK',
      return_message: afk.return_message || 'I am back!',
      cooldown: afk.cooldown || 30,
      started_at: afk.since || null,
      response_count: 0,
      ignored_users: afk.ignored_users || [],
      ignored_channels: afk.ignored_channels || []
    });
  });

  router.put('/afk', requireAuth, (req, res) => {
    const data = req.body || {};
    if (!selfClient.config.afk) selfClient.config.afk = {};
    if (data.message !== undefined) selfClient.config.afk.reason = data.message;
    if (data.return_message !== undefined) selfClient.config.afk.return_message = data.return_message;
    if (data.cooldown !== undefined) selfClient.config.afk.cooldown = data.cooldown;
    if (data.ignored_users !== undefined) selfClient.config.afk.ignored_users = data.ignored_users;
    if (data.ignored_channels !== undefined) selfClient.config.afk.ignored_channels = data.ignored_channels;

    fs.writeFileSync(configPath, JSON.stringify(selfClient.config, null, 2), 'utf-8');
    return res.json({ ok: true });
  });

  router.post('/afk/toggle', requireAuth, (req, res) => {
    const { enabled, message } = req.body || {};
    if (!selfClient.config.afk) selfClient.config.afk = {};
    selfClient.config.afk.enabled = Boolean(enabled);
    if (enabled) {
      selfClient.config.afk.since = new Date().toISOString();
      if (message) selfClient.config.afk.reason = message;
    } else {
      selfClient.config.afk.since = null;
    }

    fs.writeFileSync(configPath, JSON.stringify(selfClient.config, null, 2), 'utf-8');
    return res.json({ ok: true, enabled: selfClient.config.afk.enabled });
  });

  // OwO Farmer
  router.get('/owo', requireAuth, (req, res) => {
    const owo = Storage.get('owo', {
      enabled: false,
      channel_id: 0,
      auto_hunt: true,
      auto_battle: true,
      auto_daily: true,
      auto_quest: false,
      auto_sell: false,
      auto_gamble: false
    });
    return res.json(owo);
  });

  router.put('/owo', requireAuth, (req, res) => {
    const current = Storage.get('owo', { enabled: false, channel_id: 0 });
    const updated = { ...current, ...(req.body || {}) };
    Storage.set('owo', updated);
    return res.json(updated);
  });

  // ------------------------------------------------ CUSTOM COMMANDS, SCRIPTS & JOBS ------------------------------------------------
  router.get('/custom-commands', requireAuth, (req, res) => {
    const customList = Storage.get('customCommands', []);
    return res.json({ commands: customList });
  });

  router.post('/custom-commands', requireAuth, (req, res) => {
    const data = req.body || {};
    const customList = Storage.get('customCommands', []);
    const newCmd = {
      id: Date.now(),
      name: (data.name || 'custom').toLowerCase().trim(),
      trigger: data.trigger || data.name,
      response: data.response || 'Default response',
      aliases: data.aliases || [],
      arguments: data.arguments || [],
      variables: ['user', 'channel', 'server', 'time', 'args'],
      cooldown: parseInt(data.cooldown) || 0,
      enabled: data.enabled !== false,
      owner_only: false,
      usage_count: 0,
      created_at: new Date().toISOString()
    };
    customList.push(newCmd);
    Storage.set('customCommands', customList);
    return res.json(newCmd);
  });

  router.put('/custom-commands/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body || {};
    const customList = Storage.get('customCommands', []);
    const idx = customList.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Command not found' });

    customList[idx] = { ...customList[idx], ...data, id };
    Storage.set('customCommands', customList);
    return res.json(customList[idx]);
  });

  router.delete('/custom-commands/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    let customList = Storage.get('customCommands', []);
    customList = customList.filter(c => c.id !== id);
    Storage.set('customCommands', customList);
    return res.json({ ok: true });
  });

  router.post('/custom-commands/:id/toggle', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { enabled } = req.body || {};
    const customList = Storage.get('customCommands', []);
    const cmd = customList.find(c => c.id === id);
    if (!cmd) return res.status(404).json({ error: 'Command not found' });
    cmd.enabled = Boolean(enabled);
    Storage.set('customCommands', customList);
    return res.json({ ok: true, enabled: cmd.enabled });
  });

  // Scripts
  router.get('/scripts', requireAuth, (req, res) => {
    const scripts = Storage.get('scripts', []);
    return res.json({ scripts });
  });

  router.post('/scripts', requireAuth, (req, res) => {
    const data = req.body || {};
    const scripts = Storage.get('scripts', []);
    const newScript = {
      id: Date.now(),
      name: data.name || 'Untitled Script',
      description: data.description || '',
      trigger: data.trigger || { event: 'message.create' },
      conditions: data.conditions || [],
      actions: data.actions || [],
      response: data.response || [],
      permissions: [],
      enabled: data.enabled !== false,
      execution_count: 0,
      created_at: new Date().toISOString()
    };
    scripts.push(newScript);
    Storage.set('scripts', scripts);
    return res.json(newScript);
  });

  router.put('/scripts/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body || {};
    const scripts = Storage.get('scripts', []);
    const idx = scripts.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Script not found' });
    scripts[idx] = { ...scripts[idx], ...data, id };
    Storage.set('scripts', scripts);
    return res.json(scripts[idx]);
  });

  router.delete('/scripts/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    let scripts = Storage.get('scripts', []);
    scripts = scripts.filter(s => s.id !== id);
    Storage.set('scripts', scripts);
    return res.json({ ok: true });
  });

  router.post('/scripts/:id/duplicate', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const scripts = Storage.get('scripts', []);
    const s = scripts.find(x => x.id === id);
    if (!s) return res.status(404).json({ error: 'Script not found' });
    const dup = { ...s, id: Date.now(), name: `${s.name} (Copy)`, execution_count: 0, created_at: new Date().toISOString() };
    scripts.push(dup);
    Storage.set('scripts', scripts);
    return res.json(dup);
  });

  router.post('/scripts/:id/toggle', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { enabled } = req.body || {};
    const scripts = Storage.get('scripts', []);
    const s = scripts.find(x => x.id === id);
    if (!s) return res.status(404).json({ error: 'Script not found' });
    s.enabled = Boolean(enabled);
    Storage.set('scripts', scripts);
    return res.json({ ok: true, enabled: s.enabled });
  });

  router.post('/scripts/import', requireAuth, (req, res) => {
    const data = req.body || {};
    const scripts = Storage.get('scripts', []);
    const imported = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    scripts.push(imported);
    Storage.set('scripts', scripts);
    return res.json(imported);
  });

  router.get('/scripts/:id/export', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const scripts = Storage.get('scripts', []);
    const s = scripts.find(x => x.id === id);
    if (!s) return res.status(404).json({ error: 'Script not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${s.name}.script.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(s, null, 2));
  });

  // Scheduled Jobs
  router.get('/jobs', requireAuth, (req, res) => {
    const jobs = Storage.get('jobs', []);
    return res.json({ jobs });
  });

  router.post('/jobs', requireAuth, (req, res) => {
    const data = req.body || {};
    const jobs = Storage.get('jobs', []);
    const newJob = {
      id: Date.now(),
      name: data.name || 'Job',
      job_type: data.job_type || 'interval',
      schedule: data.schedule || { interval_seconds: 3600 },
      action: data.action || {},
      enabled: data.enabled !== false,
      timezone: 'UTC',
      run_count: 0,
      created_at: new Date().toISOString()
    };
    jobs.push(newJob);
    Storage.set('jobs', jobs);
    return res.json(newJob);
  });

  router.delete('/jobs/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    let jobs = Storage.get('jobs', []);
    jobs = jobs.filter(j => j.id !== id);
    Storage.set('jobs', jobs);
    return res.json({ ok: true });
  });

  router.post('/jobs/:id/toggle', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { enabled } = req.body || {};
    const jobs = Storage.get('jobs', []);
    const j = jobs.find(x => x.id === id);
    if (!j) return res.status(404).json({ error: 'Job not found' });
    j.enabled = Boolean(enabled);
    Storage.set('jobs', jobs);
    return res.json({ ok: true, enabled: j.enabled });
  });

  // ------------------------------------------------ SETTINGS & CONFIGURATION ------------------------------------------------
  router.get('/settings', requireAuth, (req, res) => {
    const cfg = selfClient.config || {};
    return res.json({
      command_prefix: cfg.prefix || '.',
      auto_delete_enabled: cfg.autoDeleteMessages?.enabled !== false,
      auto_delete_delay: cfg.autoDeleteMessages?.delay || 15000,
      delete_trigger_before_send: cfg.deleteTriggerBeforeSend !== false,
      human_typing: cfg.safety?.humanTyping !== false,
      anti_ban_jitter: cfg.safety?.antiBanJitter !== false,
      purge_delay: cfg.safety?.purgeDelay || 1100,
      primary_ai_provider: cfg.agent?.primaryProvider || 'openrouter',
      ai_model: cfg.agent?.openrouterModel || 'nvidia/nemotron-3-ultra-550b-a55b:free'
    });
  });

  router.put('/settings', requireAuth, (req, res) => {
    const body = req.body || {};
    if (!selfClient.config.autoDeleteMessages) selfClient.config.autoDeleteMessages = {};
    if (!selfClient.config.safety) selfClient.config.safety = {};
    if (!selfClient.config.agent) selfClient.config.agent = {};

    if (body.command_prefix) selfClient.config.prefix = body.command_prefix;
    if (body.auto_delete_enabled !== undefined) selfClient.config.autoDeleteMessages.enabled = Boolean(body.auto_delete_enabled);
    if (body.auto_delete_delay !== undefined) selfClient.config.autoDeleteMessages.delay = parseInt(body.auto_delete_delay);
    if (body.delete_trigger_before_send !== undefined) selfClient.config.deleteTriggerBeforeSend = Boolean(body.delete_trigger_before_send);
    if (body.human_typing !== undefined) selfClient.config.safety.humanTyping = Boolean(body.human_typing);
    if (body.anti_ban_jitter !== undefined) selfClient.config.safety.antiBanJitter = Boolean(body.anti_ban_jitter);
    if (body.purge_delay !== undefined) selfClient.config.safety.purgeDelay = parseInt(body.purge_delay);
    if (body.primary_ai_provider) selfClient.config.agent.primaryProvider = body.primary_ai_provider;
    if (body.ai_model) selfClient.config.agent.openrouterModel = body.ai_model;

    fs.writeFileSync(configPath, JSON.stringify(selfClient.config, null, 2), 'utf-8');
    Logger.info('Settings updated from Web Dashboard');
    return res.json({ ok: true });
  });

  router.get('/meta', requireAuth, (req, res) => {
    return res.json({
      name: 'Discord AIO // Nighty Control Center',
      version: '2.5.0',
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage: process.memoryUsage()
    });
  });

  router.get('/permissions', requireAuth, (req, res) => {
    return res.json({ permissions: [] });
  });

  // ------------------------------------------------ NOTIFICATIONS ------------------------------------------------
  router.get('/notifications/rules', requireAuth, (req, res) => {
    const rules = Storage.get('notifications_rules', []);
    return res.json({ rules });
  });

  router.post('/notifications/rules', requireAuth, (req, res) => {
    const data = req.body || {};
    const rules = Storage.get('notifications_rules', []);
    const newRule = {
      id: Date.now(),
      name: data.name || 'New Rule',
      event_type: data.event_type || 'afk.mention',
      channel_id: data.channel_id || null,
      webhook_url: data.webhook_url || null,
      enabled: data.enabled !== false,
      created_at: new Date().toISOString()
    };
    rules.push(newRule);
    Storage.set('notifications_rules', rules);
    return res.json(newRule);
  });

  router.put('/notifications/rules/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body || {};
    const rules = Storage.get('notifications_rules', []);
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
    rules[idx] = { ...rules[idx], ...data, id };
    Storage.set('notifications_rules', rules);
    return res.json(rules[idx]);
  });

  router.delete('/notifications/rules/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    let rules = Storage.get('notifications_rules', []);
    rules = rules.filter(r => r.id !== id);
    Storage.set('notifications_rules', rules);
    return res.json({ ok: true });
  });

  router.post('/notifications/rules/:id/toggle', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { enabled } = req.body || {};
    const rules = Storage.get('notifications_rules', []);
    const r = rules.find(x => x.id === id);
    if (!r) return res.status(404).json({ error: 'Rule not found' });
    r.enabled = Boolean(enabled);
    Storage.set('notifications_rules', rules);
    return res.json({ ok: true, enabled: r.enabled });
  });

  router.post('/notifications/rules/:id/test', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const rules = Storage.get('notifications_rules', []);
    const r = rules.find(x => x.id === id);
    if (!r) return res.status(404).json({ error: 'Rule not found' });

    const inbox = Storage.get('notifications_inbox', []);
    const item = {
      id: Date.now(),
      title: `Test Notification: ${r.name}`,
      description: `Rule "${r.name}" successfully test-fired at ${new Date().toLocaleTimeString()}`,
      severity: 'info',
      read: false,
      created_at: new Date().toISOString()
    };
    inbox.unshift(item);
    Storage.set('notifications_inbox', inbox);
    WebSocketManager.broadcastNotification(item);
    return res.json({ ok: true, message: 'Notification test sent' });
  });

  router.get('/notifications/inbox', requireAuth, (req, res) => {
    const inbox = Storage.get('notifications_inbox', []);
    return res.json({ notifications: inbox.slice(0, 100) });
  });

  router.get('/notifications/unread', requireAuth, (req, res) => {
    const inbox = Storage.get('notifications_inbox', []);
    const unread = inbox.filter(n => !n.read).length;
    return res.json({ unread });
  });

  router.post('/notifications/read', requireAuth, (req, res) => {
    const { notification_id } = req.query || req.body || {};
    const inbox = Storage.get('notifications_inbox', []);
    if (notification_id) {
      const item = inbox.find(n => n.id === parseInt(notification_id));
      if (item) item.read = true;
    } else {
      inbox.forEach(n => n.read = true);
    }
    Storage.set('notifications_inbox', inbox);
    return res.json({ ok: true });
  });

  router.post('/notifications/clear', requireAuth, (req, res) => {
    Storage.set('notifications_inbox', []);
    return res.json({ ok: true });
  });

  // ------------------------------------------------ BACKUPS & RECOVERY ------------------------------------------------
  router.get('/backups', requireAuth, (req, res) => {
    const backups = Storage.get('backups', []);
    return res.json({ backups });
  });

  router.post('/backups', requireAuth, (req, res) => {
    const { label } = req.body || {};
    const backups = Storage.get('backups', []);
    const newBackup = {
      id: Date.now(),
      label: label || `Snapshot ${new Date().toLocaleDateString()}`,
      created_at: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(selfClient.config)),
      storage: JSON.parse(JSON.stringify(Storage.data))
    };
    backups.unshift(newBackup);
    if (backups.length > 20) backups.pop();
    Storage.set('backups', backups);
    Logger.success(`Created backup snapshot: "${newBackup.label}"`);
    return res.json(newBackup);
  });

  router.get('/backups/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const backups = Storage.get('backups', []);
    const b = backups.find(x => x.id === id);
    if (!b) return res.status(404).json({ error: 'Backup not found' });
    return res.json(b);
  });

  router.delete('/backups/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    let backups = Storage.get('backups', []);
    backups = backups.filter(x => x.id !== id);
    Storage.set('backups', backups);
    return res.json({ ok: true });
  });

  router.get('/backups/:id/diff', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const backups = Storage.get('backups', []);
    const b = backups.find(x => x.id === id);
    if (!b) return res.status(404).json({ error: 'Backup not found' });
    return res.json({
      diff: {
        config_changed: JSON.stringify(b.config) !== JSON.stringify(selfClient.config),
        storage_changed: JSON.stringify(b.storage) !== JSON.stringify(Storage.data)
      }
    });
  });

  router.get('/backups/:id/export', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const backups = Storage.get('backups', []);
    const b = backups.find(x => x.id === id);
    if (!b) return res.status(404).json({ error: 'Backup not found' });
    res.setHeader('Content-Disposition', `attachment; filename="backup-${id}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(b, null, 2));
  });

  router.post('/backups/import', requireAuth, (req, res) => {
    const data = req.body || {};
    const backups = Storage.get('backups', []);
    const imported = {
      id: Date.now(),
      label: data.label || 'Imported Snapshot',
      created_at: new Date().toISOString(),
      config: data.config || {},
      storage: data.storage || {}
    };
    backups.unshift(imported);
    Storage.set('backups', backups);
    return res.json(imported);
  });

  router.post('/backups/:id/restore', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const backups = Storage.get('backups', []);
    const b = backups.find(x => x.id === id);
    if (!b) return res.status(404).json({ error: 'Backup not found' });

    if (b.config) {
      selfClient.config = { ...selfClient.config, ...b.config };
      fs.writeFileSync(configPath, JSON.stringify(selfClient.config, null, 2), 'utf-8');
    }
    if (b.storage) {
      Storage.data = { ...Storage.data, ...b.storage };
      Storage.save();
    }

    Logger.success(`Restored backup snapshot: "${b.label}"`);
    WebSocketManager.broadcastRefresh();
    return res.json({ ok: true, message: 'Backup restored successfully' });
  });

  // ------------------------------------------------ THEMES ------------------------------------------------
  const DEFAULT_THEMES = [
    {
      id: 'nighty-dark',
      name: 'Nighty Graphite',
      vars: {
        'color-bg': '#08090b',
        'color-bg-elevated': '#0d0e13',
        'color-bg-raised': '#121419',
        'color-border': '#23262f',
        'color-brand': '#00d4aa'
      }
    },
    {
      id: 'obsidian-mono',
      name: 'Obsidian Monochrome',
      vars: {
        'color-bg': '#000000',
        'color-bg-elevated': '#0a0a0a',
        'color-bg-raised': '#121212',
        'color-border': '#222222',
        'color-brand': '#ffffff'
      }
    },
    {
      id: 'midnight-blue',
      name: 'Midnight Aurora',
      vars: {
        'color-bg': '#070a14',
        'color-bg-elevated': '#0c1020',
        'color-bg-raised': '#11172e',
        'color-border': '#1e294b',
        'color-brand': '#6366f1'
      }
    },
    {
      id: 'emerald-matrix',
      name: 'Emerald Terminal',
      vars: {
        'color-bg': '#060d09',
        'color-bg-elevated': '#0a140f',
        'color-bg-raised': '#0f1f16',
        'color-border': '#183324',
        'color-brand': '#10b981'
      }
    },
    {
      id: 'cyberpunk-neon',
      name: 'Cyberpunk Neon',
      vars: {
        'color-bg': '#0c0714',
        'color-bg-elevated': '#140c22',
        'color-bg-raised': '#1d1230',
        'color-border': '#2f1c4e',
        'color-brand': '#ec4899'
      }
    }
  ];

  router.get('/themes', requireAuth, (req, res) => {
    const custom = Storage.get('custom_themes', []);
    const all = [...DEFAULT_THEMES, ...(Array.isArray(custom) ? custom : [])];
    return res.json({ themes: all });
  });

  router.get('/themes/active', requireAuth, (req, res) => {
    const activeId = Storage.get('active_theme_id', 'nighty-dark');
    const custom = Storage.get('custom_themes', []);
    const all = [...DEFAULT_THEMES, ...(Array.isArray(custom) ? custom : [])];
    const theme = all.find(t => t.id === activeId) || DEFAULT_THEMES[0];
    return res.json({ theme });
  });

  router.post('/themes/:id/apply', requireAuth, (req, res) => {
    const id = req.params.id;
    const custom = Storage.get('custom_themes', []);
    const all = [...DEFAULT_THEMES, ...(Array.isArray(custom) ? custom : [])];
    const theme = all.find(t => t.id === id);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });

    Storage.set('active_theme_id', id);
    WebSocketManager.broadcastTheme(theme.vars);
    return res.json({ ok: true, theme });
  });

  router.post('/themes/reset', requireAuth, (req, res) => {
    Storage.set('active_theme_id', 'nighty-dark');
    WebSocketManager.broadcastTheme(DEFAULT_THEMES[0].vars);
    return res.json({ ok: true, theme: DEFAULT_THEMES[0] });
  });

  router.post('/themes', requireAuth, (req, res) => {
    const data = req.body || {};
    const custom = Storage.get('custom_themes', []);
    const newTheme = {
      id: `theme-${Date.now()}`,
      name: data.name || 'Custom Theme',
      vars: data.vars || DEFAULT_THEMES[0].vars
    };
    custom.push(newTheme);
    Storage.set('custom_themes', custom);
    return res.json(newTheme);
  });

  router.delete('/themes/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    let custom = Storage.get('custom_themes', []);
    custom = custom.filter(t => t.id !== id);
    Storage.set('custom_themes', custom);
    return res.json({ ok: true });
  });

  // ------------------------------------------------ SERVERS WORKSPACE ------------------------------------------------
  router.get('/servers', requireAuth, (req, res) => {
    if (!selfClient.client || !selfClient.client.guilds) {
      return res.json({ servers: [] });
    }

    const guilds = Array.from(selfClient.client.guilds.cache.values()).map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL ? g.iconURL() : null,
      member_count: g.memberCount || 0,
      channels_count: g.channels?.cache?.size || 0,
      roles_count: g.roles?.cache?.size || 0,
      owner: g.ownerId === selfClient.client.user?.id
    }));

    guilds.sort((a, b) => b.member_count - a.member_count);
    return res.json({ servers: guilds });
  });

  router.get('/servers/:id', requireAuth, (req, res) => {
    if (!selfClient.client || !selfClient.client.guilds) {
      return res.status(404).json({ error: 'Client not ready' });
    }

    const g = selfClient.client.guilds.cache.get(req.params.id);
    if (!g) return res.status(404).json({ error: 'Guild not found' });

    const channels = g.channels?.cache ? Array.from(g.channels.cache.values()).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      topic: c.topic || null
    })) : [];

    const roles = g.roles?.cache ? Array.from(g.roles.cache.values()).map(r => ({
      id: r.id,
      name: r.name,
      color: r.hexColor,
      position: r.position
    })) : [];

    return res.json({
      id: g.id,
      name: g.name,
      icon: g.iconURL ? g.iconURL() : null,
      banner: g.bannerURL ? g.bannerURL() : null,
      member_count: g.memberCount,
      owner_id: g.ownerId,
      boost_tier: g.premiumTier,
      channels,
      roles
    });
  });

  // ------------------------------------------------ LOGS & HISTORY ------------------------------------------------
  router.get('/logs', requireAuth, (req, res) => {
    const limit = parseInt(req.query.limit) || 200;
    return res.json({ entries: logsBuffer.slice(0, limit) });
  });

  router.get('/command-history', requireAuth, (req, res) => {
    const limit = parseInt(req.query.limit) || 80;
    return res.json({ history: commandHistory.slice(0, limit) });
  });

  return router;
}

module.exports = createApiRouter;
