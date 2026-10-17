/**
 * Active CLI Brand Banner
 * High-impact ANSI monochrome & obsidian status banner.
 */

class Banner {
  static render(client, commandHandler, frontend = null) {
    const isOnline = Boolean(client?.user);
    const tag = isOnline ? client.user.tag : 'Connecting / Offline';
    const id = isOnline ? client.user.id : 'N/A';
    const ping = isOnline && client.ws && client.ws.ping >= 0 ? Math.round(client.ws.ping) : 0;
    const guilds = isOnline && client.guilds ? client.guilds.cache.size : 0;
    const dms = isOnline && client.channels ? client.channels.cache.filter(c => c.type === 'DM').size : 0;
    const cmdsCount = commandHandler ? commandHandler.commands.size : 663;

    const frontendOnline = Boolean(frontend?.bot?.user);
    const frontendTag = frontendOnline ? frontend.bot.user.tag : 'Connecting...';

    const isFastMode = Boolean(client?.config?.fastMode || client?.selfClient?.config?.fastMode);
    const modeBadge = isFastMode ? '\x1b[1m\x1b[92mFast Mode (Instant Text)\x1b[0m' : '\x1b[90mNormal Mode (Human Typing)\x1b[0m';

    const w = 76;
    const border = '━'.repeat(w);

    console.log(`\x1b[90m${border}\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m ⚡ FLAW // COMMAND CENTER ENGINE\x1b[0m`);
    console.log(`\x1b[90m${border}\x1b[0m`);

    const statusBadge = isOnline ? '\x1b[42m\x1b[30m\x1b[1m ONLINE \x1b[0m' : '\x1b[41m\x1b[30m\x1b[1m OFFLINE \x1b[0m';
    console.log(` ${statusBadge}  \x1b[1m\x1b[37m${tag}\x1b[0m \x1b[90m(${id})\x1b[0m`);
    console.log(` \x1b[90m│\x1b[0m Ping: \x1b[1m\x1b[36m${ping}ms\x1b[0m │ Guilds: \x1b[1m\x1b[37m${guilds}\x1b[0m │ Open DMs: \x1b[1m\x1b[37m${dms}\x1b[0m │ Commands: \x1b[1m\x1b[32m${cmdsCount}\x1b[0m`);
    console.log(` \x1b[90m│\x1b[0m Mode: ${modeBadge} │ Security: \x1b[32mSecret Sanitizer\x1b[0m`);
    console.log(` \x1b[90m│\x1b[0m User App Frontend: \x1b[1m\x1b[92m/flaw\x1b[0m (\x1b[1m\x1b[37m${frontendTag}\x1b[0m)`);
    console.log(`\x1b[90m${border}\x1b[0m`);
    console.log(` \x1b[90mOutput Stream:\x1b[0m Pure Live Output │ \x1b[1m\x1b[96mnpm run console\x1b[0m: Interactive CLI │ \x1b[1m\x1b[96mnpm run agent:cli\x1b[0m: AI Chat`);
    console.log(`\x1b[90m${border}\x1b[0m\n`);
  }
}

module.exports = Banner;
