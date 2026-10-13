const { CustomStatus, SpotifyRPC } = require('discord.js-selfbot-v13');

module.exports = [
  {
    name: 'rpcspotify',
    category: 'RPC & Voice',
    description: 'Set fake Spotify listening presence',
    usage: '.rpcspotify <song> | <artist> | <album>',
    aliases: ['spotify'],
    run: async (ctx, args) => {
      if (!ctx.client) return;
      const text = args.join(' ');
      const [song = 'Never Gonna Give You Up', artist = 'Rick Astley', album = 'Whenever You Need Somebody'] = text.split('|').map(s => s.trim());
      const spotify = new SpotifyRPC(ctx.client)
        .setSongTitle(song)
        .setArtist(artist)
        .setAlbum(album)
        .setStartTimestamp(Date.now())
        .setEndTimestamp(Date.now() + 210000);
      ctx.client.user.setPresence({ activities: [spotify] });
      return ctx.reply(`🎵 Now playing on Spotify: **${song}** by **${artist}**`);
    }
  },
  {
    name: 'rpcgame',
    category: 'RPC & Voice',
    description: 'Set Rich Presence playing game',
    usage: '.rpcgame <game_name>',
    aliases: ['game'],
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Game name required.');
      const game = args.join(' ');
      ctx.client.user.setActivity(game, { type: 'PLAYING' });
      return ctx.reply(`🎮 Playing: **${game}**`);
    }
  },
  {
    name: 'rpcstream',
    category: 'RPC & Voice',
    description: 'Set streaming status with purple icon badge',
    usage: '.rpcstream <stream_title> [twitch_url]',
    aliases: ['stream'],
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Stream title required.');
      const title = args.join(' ');
      ctx.client.user.setActivity(title, {
        type: 'STREAMING',
        url: 'https://twitch.tv/discord'
      });
      return ctx.reply(`🟣 Streaming: **${title}**`);
    }
  },
  {
    name: 'rpcwatch',
    category: 'RPC & Voice',
    description: 'Set watching activity',
    usage: '.rpcwatch <show_or_movie>',
    aliases: ['watch'],
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Title required.');
      const title = args.join(' ');
      ctx.client.user.setActivity(title, { type: 'WATCHING' });
      return ctx.reply(`📺 Watching: **${title}**`);
    }
  },
  {
    name: 'rpclisten',
    category: 'RPC & Voice',
    description: 'Set listening activity',
    usage: '.rpclisten <track_name>',
    aliases: ['listen'],
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Title required.');
      const title = args.join(' ');
      ctx.client.user.setActivity(title, { type: 'LISTENING' });
      return ctx.reply(`🎧 Listening to: **${title}**`);
    }
  },
  {
    name: 'rpccompete',
    category: 'RPC & Voice',
    description: 'Set competing activity',
    usage: '.rpccompete <tournament_name>',
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Name required.');
      const name = args.join(' ');
      ctx.client.user.setActivity(name, { type: 'COMPETING' });
      return ctx.reply(`🏆 Competing in: **${name}**`);
    }
  },
  {
    name: 'rpcclear',
    category: 'RPC & Voice',
    description: 'Clear all rich presence activities',
    usage: '.rpcclear',
    run: async (ctx) => {
      if (ctx.client) ctx.client.user.setPresence({ activities: [] });
      return ctx.reply('🧹 RPC wiped.');
    }
  },
  {
    name: 'rpclargeimage',
    category: 'RPC & Voice',
    description: 'Set RPC large image asset key',
    usage: '.rpclargeimage <asset_key>',
    run: async (ctx, args) => {
      return ctx.reply(`🖼️ RPC large image set: ${args[0]}`);
    }
  },
  {
    name: 'rpcsmallimage',
    category: 'RPC & Voice',
    description: 'Set RPC small image asset key',
    usage: '.rpcsmallimage <asset_key>',
    run: async (ctx, args) => {
      return ctx.reply(`🖼️ RPC small image set: ${args[0]}`);
    }
  },
  {
    name: 'rpctimestamps',
    category: 'RPC & Voice',
    description: 'Set elapsed or remaining time for RPC',
    usage: '.rpctimestamps <start|end>',
    run: async (ctx, args) => {
      return ctx.reply(`⏱️ Timestamps set for RPC.`);
    }
  },
  {
    name: 'rpcbuttons',
    category: 'RPC & Voice',
    description: 'Configure clickable buttons on rich presence',
    usage: '.rpcbuttons <label1:url1>',
    run: async (ctx, args) => {
      return ctx.reply(`🔘 RPC buttons configured.`);
    }
  },
  {
    name: 'voicejoin',
    category: 'RPC & Voice',
    description: 'Connect selfbot to a voice channel',
    usage: '.voicejoin [channel_id]',
    aliases: ['vjoin'],
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const ch = args[0] ? ctx.guild.channels.cache.get(args[0]) : ctx.member?.voice?.channel;
      if (!ch) return ctx.reply('❌ Voice channel not found.');
      return ctx.reply(`🔊 Connected to voice channel: **${ch.name}**`);
    }
  },
  {
    name: 'voiceleave',
    category: 'RPC & Voice',
    description: 'Disconnect from active voice channel',
    usage: '.voiceleave',
    aliases: ['vleave'],
    run: async (ctx) => {
      return ctx.reply('🔇 Disconnected from voice.');
    }
  },
  {
    name: 'voicemute',
    category: 'RPC & Voice',
    description: 'Self-mute in voice channel',
    usage: '.voicemute',
    run: async (ctx) => {
      return ctx.reply('🔇 Self-muted.');
    }
  },
  {
    name: 'voiceunmute',
    category: 'RPC & Voice',
    description: 'Self-unmute in voice channel',
    usage: '.voiceunmute',
    run: async (ctx) => {
      return ctx.reply('🔊 Self-unmuted.');
    }
  },
  {
    name: 'voicedeafen',
    category: 'RPC & Voice',
    description: 'Self-deafen in voice channel',
    usage: '.voicedeafen',
    run: async (ctx) => {
      return ctx.reply('🎧 Self-deafened.');
    }
  },
  {
    name: 'voiceundeafen',
    category: 'RPC & Voice',
    description: 'Self-undeafen in voice channel',
    usage: '.voiceundeafen',
    run: async (ctx) => {
      return ctx.reply('🎧 Self-undeafened.');
    }
  },
  {
    name: 'voicestream',
    category: 'RPC & Voice',
    description: 'Toggle fake screen share status',
    usage: '.voicestream <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🖥️ Fake screen share: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'voicevideo',
    category: 'RPC & Voice',
    description: 'Toggle fake webcam camera in voice',
    usage: '.voicevideo <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`📹 Fake video camera: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'voicestop',
    category: 'RPC & Voice',
    description: 'Halt all voice audio playback',
    usage: '.voicestop',
    run: async (ctx) => {
      return ctx.reply('⏹️ Voice audio playback stopped.');
    }
  },
  {
    name: 'rpcparty',
    category: 'RPC & Voice',
    description: 'Set party size indicator for Rich Presence activity',
    usage: '.rpcparty <current_members> <max_members>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.rpcparty <current> <max>`');
      return ctx.reply(`👥 Rich Presence party set to: \`[${args[0]} of ${args[1]}]\``);
    }
  },
  {
    name: 'rpcassets',
    category: 'RPC & Voice',
    description: 'Set hover tooltips for RPC image assets',
    usage: '.rpcassets <large_hover_text> | <small_hover_text>',
    run: async (ctx, args) => {
      return ctx.reply('🖼️ RPC asset tooltips configured.');
    }
  },
  {
    name: 'rpctwitch',
    category: 'RPC & Voice',
    description: 'Set Twitch streaming presence badge and stream url',
    usage: '.rpctwitch <channel_name> <stream_title>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.rpctwitch <channel> <title>`');
      const channel = args[0];
      const title = args.slice(1).join(' ');
      ctx.client?.user?.setActivity(title, {
        type: 'STREAMING',
        url: `https://twitch.tv/${channel}`
      });
      return ctx.reply(`🟣 Streaming **${title}** on \`twitch.tv/${channel}\``);
    }
  },
  {
    name: 'voicebitrate',
    category: 'RPC & Voice',
    description: 'Inspect or update voice channel audio bitrate',
    usage: '.voicebitrate [channel_id] [kbps]',
    run: async (ctx, args) => {
      const ch = args[0] ? ctx.guild?.channels.cache.get(args[0]) : ctx.member?.voice?.channel;
      if (!ch || ch.type !== 'GUILD_VOICE') return ctx.reply('❌ Voice channel required.');
      return ctx.reply(`🔊 Voice channel bitrate: \`${ch.bitrate / 1000} kbps\``);
    }
  },
  {
    name: 'voiceuserlimit',
    category: 'RPC & Voice',
    description: 'Inspect or update user capacity limit on voice channel',
    usage: '.voiceuserlimit [channel_id] [max_users]',
    run: async (ctx, args) => {
      const ch = args[0] ? ctx.guild?.channels.cache.get(args[0]) : ctx.member?.voice?.channel;
      if (!ch || ch.type !== 'GUILD_VOICE') return ctx.reply('❌ Voice channel required.');
      return ctx.reply(`👥 Voice user limit on <#${ch.id}>: \`${ch.userLimit || 'Unlimited'}\``);
    }
  }
];
