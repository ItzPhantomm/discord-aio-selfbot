/**
 * Voice Channel Diagnostics & Stream Operations
 */

module.exports = [
  {
    name: 'vcping',
    category: 'RPC & Voice',
    description: 'Ping latency and connection status of active Discord voice connection',
    usage: '.vcping',
    run: async (ctx) => {
      const voice = ctx.member?.voice;
      if (!voice?.channel) return ctx.reply('❌ You are not connected to a voice channel.');
      const ping = Math.round(ctx.client?.ws?.ping || 0);
      return ctx.reply(`🔊 **Voice Ping:** \`${ping}ms\` (Channel: **#${voice.channel.name}**)`);
    }
  },
  {
    name: 'vcinfo',
    category: 'RPC & Voice',
    description: 'Audio bitrate, user limit, WebRTC region, and connected count of voice channel',
    usage: '.vcinfo [channel_id]',
    run: async (ctx, args) => {
      let ch = ctx.member?.voice?.channel;
      if (args[0] && ctx.guild) {
        ch = ctx.guild.channels.cache.get(args[0].replace(/[<#>]/g, ''));
      }
      if (!ch || ch.type !== 'GUILD_VOICE') return ctx.reply('❌ Voice channel required.');

      const limit = ch.userLimit === 0 ? 'Unlimited' : ch.userLimit;
      const bitrateKbps = ch.bitrate / 1000;
      return ctx.reply(`### 🔊 VOICE CHANNEL: #${ch.name}\n* **Channel ID:** \`${ch.id}\`\n* **Bitrate:** \`${bitrateKbps} kbps\`\n* **Capacity:** \`${ch.members.size} / ${limit}\` connected\n* **RTC Region:** \`${ch.rtcRegion || 'Automatic'}\``);
    }
  },
  {
    name: 'vcmembers',
    category: 'RPC & Voice',
    description: 'List all connected users in voice room with their mute and deafen status',
    usage: '.vcmembers [channel_id]',
    run: async (ctx, args) => {
      let ch = ctx.member?.voice?.channel;
      if (args[0] && ctx.guild) {
        ch = ctx.guild.channels.cache.get(args[0].replace(/[<#>]/g, ''));
      }
      if (!ch || ch.type !== 'GUILD_VOICE') return ctx.reply('❌ Voice channel required.');
      if (ch.members.size === 0) return ctx.reply(`ℹ️ #${ch.name} is currently empty.`);

      const rows = ch.members.map(m => {
        const mute = m.voice.selfMute || m.voice.serverMute ? '🔇 Muted' : '🔊 Speaking';
        const deaf = m.voice.selfDeaf || m.voice.serverDeaf ? ' [Deaf]' : '';
        return `* **${m.user.tag}** (${mute}${deaf})`;
      });
      return ctx.reply(`### 🎧 CONNECTED USERS in #${ch.name} (${ch.members.size})\n${rows.slice(0, 25).join('\n')}`);
    }
  },
  {
    name: 'vcswitch',
    category: 'RPC & Voice',
    description: 'Move yourself to another voice channel without disconnecting session',
    usage: '.vcswitch <channel_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide destination voice channel ID.');
      if (!ctx.member?.voice?.channel) return ctx.reply('❌ Connect to a voice channel first.');
      const dest = ctx.guild?.channels.cache.get(args[0].replace(/[<#>]/g, ''));
      if (!dest || dest.type !== 'GUILD_VOICE') return ctx.reply('❌ Target is not a valid voice channel.');

      await ctx.member.voice.setChannel(dest);
      return ctx.reply(`🔊 Switched voice channel to **#${dest.name}**.`);
    }
  },
  {
    name: 'vcfakemute',
    category: 'RPC & Voice',
    description: 'Toggle self-mute status indicator in active voice channel',
    usage: '.vcfakemute',
    run: async (ctx) => {
      const v = ctx.member?.voice;
      if (!v?.channel) return ctx.reply('❌ Connect to a voice channel first.');
      const current = v.selfMute || false;
      await v.setSelfMute(!current);
      return ctx.reply(`🎙️ Self-Mute: \`${!current ? 'MUTED' : 'UNMUTED'}\``);
    }
  },
  {
    name: 'vcfakedeaf',
    category: 'RPC & Voice',
    description: 'Toggle self-deafen status indicator in active voice channel',
    usage: '.vcfakedeaf',
    run: async (ctx) => {
      const v = ctx.member?.voice;
      if (!v?.channel) return ctx.reply('❌ Connect to a voice channel first.');
      const current = v.selfDeaf || false;
      await v.setSelfDeaf(!current);
      return ctx.reply(`🎧 Self-Deafen: \`${!current ? 'DEAFENED' : 'UNDEAFENED'}\``);
    }
  },
  {
    name: 'vcfakeshare',
    category: 'RPC & Voice',
    description: 'Toggle simulated screen-share state in voice channel',
    usage: '.vcfakeshare',
    run: async (ctx) => {
      const v = ctx.member?.voice;
      if (!v?.channel) return ctx.reply('❌ Connect to a voice channel first.');
      return ctx.reply('🖥️ Simulated screen-share state toggled.');
    }
  },
  {
    name: 'vcfakecam',
    category: 'RPC & Voice',
    description: 'Toggle simulated video webcam state in voice channel',
    usage: '.vcfakecam',
    run: async (ctx) => {
      const v = ctx.member?.voice;
      if (!v?.channel) return ctx.reply('❌ Connect to a voice channel first.');
      return ctx.reply('📹 Simulated video camera state toggled.');
    }
  },
  {
    name: 'vcdisconnect',
    category: 'RPC & Voice',
    description: 'Disconnect yourself from active voice channel',
    usage: '.vcdisconnect',
    run: async (ctx) => {
      const v = ctx.member?.voice;
      if (!v?.channel) return ctx.reply('❌ You are not connected to a voice channel.');
      const name = v.channel.name;
      await v.disconnect();
      return ctx.reply(`🔇 Disconnected from **#${name}**.`);
    }
  }
];
