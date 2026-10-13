/**
 * Account Presets, Presence & Direct Message Controls
 */

module.exports = [
  {
    name: 'statuspreset',
    category: 'User',
    description: 'Apply comprehensive presence & status preset (studying, gaming, busy, sleeping, afk, stealth)',
    usage: '.statuspreset <studying|gaming|busy|sleeping|afk|stealth>',
    run: async (ctx, args) => {
      if (!ctx.client?.user) return;
      const preset = args[0]?.toLowerCase();
      if (!preset) return ctx.reply('❌ Choose preset: `studying`, `gaming`, `busy`, `sleeping`, `afk`, `stealth`.');

      switch (preset) {
        case 'studying':
          ctx.client.user.setStatus('idle');
          ctx.client.user.setActivity('Focus & Study Mode', { type: 'COMPETING' });
          return ctx.reply('📚 Applied preset: **Studying** (Status: Idle)');
        case 'gaming':
          ctx.client.user.setStatus('online');
          ctx.client.user.setActivity('Competitive Match', { type: 'PLAYING' });
          return ctx.reply('🎮 Applied preset: **Gaming** (Status: Online)');
        case 'busy':
          ctx.client.user.setStatus('dnd');
          ctx.client.user.setActivity('Do Not Disturb', { type: 'CUSTOM' });
          return ctx.reply('⛔ Applied preset: **Busy** (Status: DND)');
        case 'sleeping':
          ctx.client.user.setStatus('idle');
          ctx.client.user.setActivity('Sleeping 🌙', { type: 'CUSTOM' });
          return ctx.reply('🌙 Applied preset: **Sleeping** (Status: Idle)');
        case 'afk':
          ctx.client.user.setStatus('idle');
          ctx.client.user.setActivity('Away From Keyboard', { type: 'CUSTOM' });
          return ctx.reply('💤 Applied preset: **AFK** (Status: Idle)');
        case 'stealth':
          ctx.client.user.setStatus('invisible');
          ctx.client.user.setPresence({ activities: [] });
          return ctx.reply('👻 Applied preset: **Stealth** (Status: Invisible)');
        default:
          return ctx.reply('❌ Unknown preset. Options: `studying`, `gaming`, `busy`, `sleeping`, `afk`, `stealth`.');
      }
    }
  },
  {
    name: 'fakestream',
    category: 'RPC & Voice',
    description: 'Broadcast streaming status with purple icon badge and custom twitch channel',
    usage: '.fakestream <stream_title> [twitch_channel]',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide stream title.');
      const channel = args[1] || 'discord';
      const title = args[0];
      ctx.client?.user?.setActivity(title, {
        type: 'STREAMING',
        url: `https://twitch.tv/${channel}`
      });
      return ctx.reply(`🟣 Streaming **${title}** (Twitch: \`${channel}\`)`);
    }
  },
  {
    name: 'fakeplay',
    category: 'RPC & Voice',
    description: 'Set Rich Presence Playing activity status',
    usage: '.fakeplay <game_name>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide game title.');
      const name = args.join(' ');
      ctx.client?.user?.setActivity(name, { type: 'PLAYING' });
      return ctx.reply(`🎮 Playing: **${name}**`);
    }
  },
  {
    name: 'fakelisten',
    category: 'RPC & Voice',
    description: 'Set Listening presence activity status',
    usage: '.fakelisten <song_name>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide track title.');
      const name = args.join(' ');
      ctx.client?.user?.setActivity(name, { type: 'LISTENING' });
      return ctx.reply(`🎧 Listening to: **${name}**`);
    }
  },
  {
    name: 'fakewatch',
    category: 'RPC & Voice',
    description: 'Set Watching presence activity status',
    usage: '.fakewatch <show_or_movie>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide title.');
      const name = args.join(' ');
      ctx.client?.user?.setActivity(name, { type: 'WATCHING' });
      return ctx.reply(`📺 Watching: **${name}**`);
    }
  },
  {
    name: 'fakecompete',
    category: 'RPC & Voice',
    description: 'Set Competing presence activity status',
    usage: '.fakecompete <competition_name>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide competition title.');
      const name = args.join(' ');
      ctx.client?.user?.setActivity(name, { type: 'COMPETING' });
      return ctx.reply(`🏆 Competing in: **${name}**`);
    }
  },
  {
    name: 'spotifyalbum',
    category: 'RPC & Voice',
    description: 'Broadcast Spotify Rich Presence with custom song, artist, and album name',
    usage: '.spotifyalbum <song> | <artist> | <album>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      const song = parts[0]?.trim() || 'Midnight City';
      const artist = parts[1]?.trim() || 'M83';
      const album = parts[2]?.trim() || 'Hurry Up, We\'re Dreaming';

      const { SpotifyRPC } = require('discord.js-selfbot-v13');
      const spotify = new SpotifyRPC(ctx.client)
        .setSongTitle(song)
        .setArtist(artist)
        .setAlbum(album)
        .setStartTimestamp(Date.now())
        .setEndTimestamp(Date.now() + 240000);

      ctx.client.user.setPresence({ activities: [spotify] });
      return ctx.reply(`🎵 **Spotify:** "${song}" by **${artist}** (*${album}*)`);
    }
  },
  {
    name: 'pendingrequests',
    category: 'User',
    description: 'Summary of pending friend requests (both incoming and outgoing)',
    usage: '.pendingrequests',
    run: async (ctx) => {
      const rels = ctx.client?.relationships;
      if (!rels) return ctx.reply('❌ Relationships cache unavailable.');
      const incoming = rels.incomingCache?.size || 0;
      const outgoing = rels.outgoingCache?.size || 0;
      return ctx.reply(`### 👥 PENDING FRIEND REQUESTS\n* Incoming from other users: \`${incoming}\`\n* Outgoing sent by you: \`${outgoing}\`\n* Total Pending: \`${incoming + outgoing}\``);
    }
  },
  {
    name: 'dmsummary',
    category: 'User',
    description: 'Count and overview of all open Direct Message channels in memory',
    usage: '.dmsummary',
    run: async (ctx) => {
      if (!ctx.client) return;
      const dms = ctx.client.channels.cache.filter(c => c.type === 'DM');
      const groupDms = ctx.client.channels.cache.filter(c => c.type === 'GROUP_DM');
      return ctx.reply(`### 📬 DIRECT MESSAGES OVERVIEW\n* Open 1-on-1 DMs: \`${dms.size}\`\n* Open Group DMs: \`${groupDms.size}\`\n* Total Cached: \`${dms.size + groupDms.size}\``);
    }
  },
  {
    name: 'closedm',
    category: 'User',
    description: 'Close active DM conversation channel with specific user by ID',
    usage: '.closedm <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      const targetId = args[0].replace(/[<@!>]/g, '');
      const channel = ctx.client.channels.cache.find(c => c.type === 'DM' && c.recipient?.id === targetId);
      if (!channel) return ctx.reply('❌ Open DM channel not found.');
      await channel.delete().catch(() => {});
      return ctx.reply(`📪 Closed DM channel with \`${targetId}\`.`);
    }
  },
  {
    name: 'clearallstatus',
    category: 'User',
    description: 'Completely reset presence, activities, custom status, and status text back to default Online',
    usage: '.clearallstatus',
    run: async (ctx) => {
      if (ctx.client?.user) {
        ctx.client.user.setStatus('online');
        ctx.client.user.setPresence({ activities: [] });
      }
      return ctx.reply('🧹 Cleared all custom presence activities and reset to standard Online.');
    }
  },
  {
    name: 'avatarlink',
    category: 'User',
    description: 'Direct high-res CDN avatar image link for specified user (or yourself)',
    usage: '.avatarlink [user]',
    run: async (ctx, args) => {
      let targetUser = ctx.author;
      if (args[0] && ctx.client) {
        const id = args[0].replace(/[<@!>]/g, '');
        try { targetUser = await ctx.client.users.fetch(id, { force: true }); } catch (e) {}
      }
      if (!targetUser) return ctx.reply('❌ User not found.');
      const url = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });
      return ctx.reply(`🖼️ **${targetUser.tag}:** ${url}`);
    }
  },
  {
    name: 'bannerlink',
    category: 'User',
    description: 'Direct high-res CDN banner image link for specified user (or yourself)',
    usage: '.bannerlink [user]',
    run: async (ctx, args) => {
      let targetUser = ctx.author;
      if (args[0] && ctx.client) {
        const id = args[0].replace(/[<@!>]/g, '');
        try { targetUser = await ctx.client.users.fetch(id, { force: true }); } catch (e) {}
      }
      if (!targetUser) return ctx.reply('❌ User not found.');
      const url = targetUser.bannerURL({ dynamic: true, size: 4096 });
      return url ? ctx.reply(`🎨 **${targetUser.tag}:** ${url}`) : ctx.reply(`ℹ️ ${targetUser.tag} has no banner.`);
    }
  }
];
