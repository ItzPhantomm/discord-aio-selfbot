// OP Sub-module: voice.js
const Logger = require("../../utils/Logger");

module.exports = [
// E. OP Voice & Audio Dominance (81-90)
  {
    name: 'opvckill',
    category: 'OP',
    description: 'Instantly disconnects your account from active voice room',
    usage: '.opvckill',
    run: async (ctx) => {
      await ctx.member?.voice?.disconnect().catch(() => {});
      return ctx.reply('🔇 Disconnected from voice session.');
    }
  },
  {
    name: 'opvcjump',
    category: 'OP',
    description: 'Jumps between voice rooms without audio disconnect gap',
    usage: '.opvcjump <vc_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide destination voice channel ID.');
      await ctx.member?.voice?.setChannel(args[0]).catch(() => {});
      return ctx.reply('🔊 Voice channel switched.');
    }
  },
  {
    name: 'opvcmuteall',
    category: 'OP',
    description: 'Server-mutes all members in your voice room (requires Mute Members)',
    usage: '.opvcmuteall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setMute(true).catch(() => {});
        count++;
      }
      return ctx.reply(`🔇 Server-muted \`${count}\` voice members.`);
    }
  },
  {
    name: 'opvcunmuteall',
    category: 'OP',
    description: 'Server-unmutes all members in your voice room',
    usage: '.opvcunmuteall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setMute(false).catch(() => {});
        count++;
      }
      return ctx.reply(`🔊 Server-unmuted \`${count}\` voice members.`);
    }
  },
  {
    name: 'opvcdeafall',
    category: 'OP',
    description: 'Server-deafens all members in your voice room',
    usage: '.opvcdeafall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setDeaf(true).catch(() => {});
        count++;
      }
      return ctx.reply(`🎧 Server-deafened \`${count}\` voice members.`);
    }
  },
  {
    name: 'opvcundeafall',
    category: 'OP',
    description: 'Server-undeafens all members in your voice room',
    usage: '.opvcundeafall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setDeaf(false).catch(() => {});
        count++;
      }
      return ctx.reply(`🎧 Server-undeafened \`${count}\` voice members.`);
    }
  },
  {
    name: 'opvcmoveall',
    category: 'OP',
    description: 'Moves every member in your voice room to destination room',
    usage: '.opvcmoveall <dest_vc_id>',
    run: async (ctx, args) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc || !args[0]) return ctx.reply('❌ Connect to a voice channel and specify destination.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setChannel(args[0]).catch(() => {});
        count++;
      }
      return ctx.reply(`🎧 Moved \`${count}\` voice members.`);
    }
  },
  {
    name: 'opvckickall',
    category: 'OP',
    description: 'Disconnects all members from your voice room (requires Move Members)',
    usage: '.opvckickall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.disconnect().catch(() => {});
        count++;
      }
      return ctx.reply(`🔌 Disconnected \`${count}\` voice members.`);
    }
  },
  {
    name: 'opvclock',
    category: 'OP',
    description: 'Sets voice channel user limit to current member count (preventing new joins)',
    usage: '.opvclock',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      await vc.setUserLimit(vc.members.size);
      return ctx.reply(`🔒 Voice channel locked at \`${vc.members.size}\` user capacity.`);
    }
  },
  {
    name: 'opvcunlock',
    category: 'OP',
    description: 'Removes user capacity limit on voice channel',
    usage: '.opvcunlock',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Connect to a voice channel first.');
      await vc.setUserLimit(0);
      return ctx.reply('🔓 Voice channel capacity unlocked.');
    }
  }
];
