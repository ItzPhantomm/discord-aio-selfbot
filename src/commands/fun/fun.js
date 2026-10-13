module.exports = [
  {
    name: 'coinflip',
    category: 'Fun',
    description: 'Flip a fair two-sided coin (Heads or Tails)',
    usage: '.coinflip',
    run: async (ctx) => {
      const outcome = Math.random() > 0.5 ? 'HEADS 🪙' : 'TAILS 🪙';
      return ctx.reply(`🪙 **Result:** **${outcome}**`);
    }
  },
  {
    name: 'roll',
    category: 'Fun',
    description: 'Roll polyhedral tabletop gaming dice (e.g. 1d6, 2d20, 1d100)',
    usage: '.roll [sides_or_dnd]',
    run: async (ctx, args) => {
      const spec = args[0] || '1d6';
      const match = spec.match(/(\d+)d(\d+)/i);
      let count = 1, sides = 6;
      if (match) {
        count = Math.min(Math.max(parseInt(match[1], 10), 1), 20);
        sides = Math.min(Math.max(parseInt(match[2], 10), 2), 1000);
      } else {
        sides = parseInt(spec, 10) || 6;
      }
      const rolls = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      const total = rolls.reduce((a, b) => a + b, 0);
      return ctx.reply(`🎲 **Rolled ${count}d${sides}:** \`[${rolls.join(', ')}]\` ➔ Total: **${total}**`);
    }
  },
  {
    name: '8ball',
    category: 'Fun',
    description: 'Magic 8-Ball oracle answer generator',
    usage: '.8ball <question>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Ask a question.');
      const answers = [
        'It is certain.', 'Without a doubt.', 'You may rely on it.', 'Yes definitely.',
        'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
        'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good.'
      ];
      const ans = answers[Math.floor(Math.random() * answers.length)];
      return ctx.reply(`🎱 **Question:** "${args.join(' ')}"\n**Answer:** *${ans}*`);
    }
  },
  {
    name: 'choose',
    category: 'Fun',
    description: 'Pick randomly from comma or pipe-separated options',
    usage: '.choose <option1, option2, option3...>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide options.');
      const text = args.join(' ');
      const opts = (text.includes('|') ? text.split('|') : text.split(',')).map(s => s.trim()).filter(Boolean);
      const chosen = opts[Math.floor(Math.random() * opts.length)];
      return ctx.reply(`🎯 **Selection:** **${chosen}**`);
    }
  },
  {
    name: 'rateuser',
    category: 'Fun',
    description: 'Generate humorous random rating out of 100%',
    usage: '.rateuser <concept_or_user>',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You';
      const pct = Math.floor(Math.random() * 101);
      return ctx.reply(`⭐ **${target} Rating:** \`${pct}%\``);
    }
  },
  {
    name: 'asciicard',
    category: 'Fun',
    description: 'Render ASCII playing card face (Ace of Spades, etc.)',
    usage: '.asciicard',
    run: async (ctx) => {
      const suits = ['♠', '♥', '♦', '♣'];
      const values = ['A', 'K', 'Q', 'J', '10', '9'];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const v = values[Math.floor(Math.random() * values.length)];
      const card = `┌─────────┐\n│ ${v.padEnd(2)}      │\n│         │\n│    ${s}    │\n│         │\n│      ${v.padStart(2)} │\n└─────────┘`;
      return ctx.reply(`\`\`\`\n${card}\n\`\`\``);
    }
  },
  {
    name: 'rps',
    category: 'Fun',
    description: 'Play Rock, Paper, Scissors against the bot',
    usage: '.rps <rock|paper|scissors>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Choose rock, paper, or scissors.');
      const user = args[0].toLowerCase();
      const choices = ['rock', 'paper', 'scissors'];
      const bot = choices[Math.floor(Math.random() * choices.length)];
      let res = 'It\'s a tie!';
      if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) {
        res = 'You win! 🎉';
      } else if (user !== bot) {
        res = 'You lose! 💀';
      }
      return ctx.reply(`✂️ **You:** \`${user}\` │ **Bot:** \`${bot}\` ➔ **${res}**`);
    }
  },
  {
    name: 'shipusers',
    category: 'Fun',
    description: 'Calculate humorous love compatibility percentage between two users',
    usage: '.shipusers <user1> <user2>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.shipusers <user1> <user2>`');
      const score = Math.floor(Math.random() * 101);
      return ctx.reply(`💖 **Compatibility for ${args[0]} + ${args[1]}:** \`${score}%\``);
    }
  },
  {
    name: 'fortune',
    category: 'Fun',
    description: 'Crack open a virtual fortune cookie',
    usage: '.fortune',
    run: async (ctx) => {
      const fortunes = [
        'A smooth sea never made a skilled sailor.',
        'The best time to plant a tree was 20 years ago. The second best time is now.',
        'Opportunities multiply as they are seized.',
        'Your code will compile on the first try tomorrow.'
      ];
      return ctx.reply(`🥠 **Fortune:** *${fortunes[Math.floor(Math.random() * fortunes.length)]}*`);
    }
  },
  {
    name: 'factgen',
    category: 'Fun',
    description: 'Dispense a curious computing or science trivia fact',
    usage: '.factgen',
    run: async (ctx) => {
      const facts = [
        'The first computer mouse was carved out of wood by Douglas Engelbart in 1964.',
        'The original Apollo 11 Guidance Computer had approximately 4KB of RAM.',
        'JavaScript was created in only 10 days by Brendan Eich in May 1995.',
        'The first domain name ever registered was Symbolics.com on March 15, 1985.'
      ];
      return ctx.reply(`💡 **Did you know?** ${facts[Math.floor(Math.random() * facts.length)]}`);
    }
  },
  {
    name: 'blackjack',
    category: 'Fun',
    description: 'Instant text-based 21 blackjack card draw game against the dealer',
    usage: '.blackjack',
    run: async (ctx) => {
      const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      function val(c) {
        if (['J', 'Q', 'K'].includes(c)) return 10;
        if (c === 'A') return 11;
        return parseInt(c, 10);
      }
      function draw() { return cards[Math.floor(Math.random() * cards.length)]; }
      const p1 = draw(), p2 = draw();
      const d1 = draw(), d2 = draw();
      let pSum = val(p1) + val(p2);
      if (pSum > 21 && (p1 === 'A' || p2 === 'A')) pSum -= 10;
      let dSum = val(d1) + val(d2);
      if (dSum > 21 && (d1 === 'A' || d2 === 'A')) dSum -= 10;

      let outcome = '';
      if (pSum === 21) outcome = '🎉 **BLACKJACK! You win!**';
      else if (pSum > dSum || dSum > 21) outcome = '✨ **You beat the dealer!**';
      else if (pSum === dSum) outcome = '🤝 **Push (It\'s a tie)!**';
      else outcome = '💀 **Dealer wins!**';

      return ctx.reply(`### 🃏 BLACKJACK TABLE\n* **Your Hand:** \`[${p1}, ${p2}]\` ➔ Total: **${pSum}**\n* **Dealer:** \`[${d1}, ${d2}]\` ➔ Total: **${dSum}**\n\n${outcome}`);
    }
  },
  {
    name: 'slots',
    category: 'Fun',
    description: '3-reel slot machine game with jackpot evaluation',
    usage: '.slots',
    run: async (ctx) => {
      const reels = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
      const r1 = reels[Math.floor(Math.random() * reels.length)];
      const r2 = reels[Math.floor(Math.random() * reels.length)];
      const r3 = reels[Math.floor(Math.random() * reels.length)];

      let res = '';
      if (r1 === r2 && r2 === r3) res = '🎉 **JACKPOT! 3 MATCHES!**';
      else if (r1 === r2 || r2 === r3 || r1 === r3) res = '✨ **2 Matches! Small win!**';
      else res = '💀 Better luck next spin!';

      return ctx.reply(`### 🎰 CASINO SLOTS\n\`[ ${r1} | ${r2} | ${r3} ]\`\n\n${res}`);
    }
  },
  {
    name: 'tictactoe',
    category: 'Fun',
    description: 'Quick interactive 3x3 tic-tac-toe game against the bot',
    usage: '.tictactoe [1-9]',
    run: async (ctx, args) => {
      const pos = parseInt(args[0], 10);
      if (isNaN(pos) || pos < 1 || pos > 9) return ctx.reply('❌ Choose a board slot from `1` to `9`.\n`1 | 2 | 3`\n`4 | 5 | 6`\n`7 | 8 | 9`');

      const board = ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'];
      board[pos - 1] = '❌';

      // Bot picks an open slot
      const open = [];
      board.forEach((b, i) => { if (b === '⬜') open.push(i); });
      if (open.length > 0) {
        const botPos = open[Math.floor(Math.random() * open.length)];
        board[botPos] = '⭕';
      }

      const grid = `${board[0]} ${board[1]} ${board[2]}\n${board[3]} ${board[4]} ${board[5]}\n${board[6]} ${board[7]} ${board[8]}`;
      return ctx.reply(`### 🕹️ TIC-TAC-TOE\n${grid}\n\n*You placed ❌ on slot ${pos}. Bot placed ⭕!*`);
    }
  },
  {
    name: 'trivia',
    category: 'Fun',
    description: 'Random trivia question with answer hidden behind a spoiler tag',
    usage: '.trivia',
    run: async (ctx) => {
      const pool = [
        { q: 'What is the highest-grossing arcade game of all time?', a: 'Pac-Man' },
        { q: 'In which year did the Apollo 11 moon landing take place?', a: '1969' },
        { q: 'What programming language was originally called Oak?', a: 'Java' },
        { q: 'What is the chemical symbol for Tungsten?', a: 'W' },
        { q: 'Which planet has the most moons in our solar system?', a: 'Saturn' },
        { q: 'Who created the Linux operating system kernel?', a: 'Linus Torvalds' },
        { q: 'What is the capital city of Australia?', a: 'Canberra' },
        { q: 'What was the first video game to feature Mario?', a: 'Donkey Kong (1981)' }
      ];
      const item = pool[Math.floor(Math.random() * pool.length)];
      return ctx.reply(`### ❓ TRIVIA TIME\n**Question:** ${item.q}\n\n**Answer:** ||${item.a}||`);
    }
  },
  {
    name: 'riddle',
    category: 'Fun',
    description: 'Clever brain teaser riddle with spoiler answer',
    usage: '.riddle',
    run: async (ctx) => {
      const pool = [
        { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', a: 'An echo' },
        { q: 'What has keys, but no locks; space, but no room; and you can enter, but never go in?', a: 'A keyboard' },
        { q: 'What can travel around the world while staying in a corner?', a: 'A stamp' },
        { q: 'The more of this there is, the less you see. What is it?', a: 'Darkness' },
        { q: 'What has a head and a tail, but no body?', a: 'A coin' }
      ];
      const item = pool[Math.floor(Math.random() * pool.length)];
      return ctx.reply(`### 🧩 RIDDLE\n*${item.q}*\n\n**Answer:** ||${item.a}||`);
    }
  },
  {
    name: 'wouldyourather',
    category: 'Fun',
    description: 'Generate an entertaining dilemma scenario: Option A vs. Option B',
    usage: '.wouldyourather',
    run: async (ctx) => {
      const pool = [
        'Have the ability to speak any human language fluently OR speak with animals?',
        'Never have to sleep again OR never have to eat again without any health consequences?',
        'Always be 15 minutes late OR always be 20 minutes early?',
        'Live without internet for a year OR live without air conditioning and heating for a year?',
        'Have telekinesis (move things with your mind) OR teleportation (instant travel)?',
        'Know all the mysteries of the universe OR have infinite wealth?'
      ];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return ctx.reply(`### 🤔 WOULD YOU RATHER...\n${chosen}`);
    }
  },
  {
    name: 'truth',
    category: 'Fun',
    description: 'Truth-or-Dare "Truth" question generator',
    usage: '.truth',
    run: async (ctx) => {
      const pool = [
        'What is the most embarrassing thing you have searched on the internet this month?',
        'If you had to delete every server you own except one, which one stays?',
        'What is a secret talent you have that nobody on Discord knows about?',
        'Have you ever sent a message to the wrong channel and panicked trying to delete it?',
        'What was your first Discord username or profile picture?'
      ];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return ctx.reply(`### 🤫 TRUTH\n*${chosen}*`);
    }
  },
  {
    name: 'dare',
    category: 'Fun',
    description: 'Truth-or-Dare "Dare" challenge generator',
    usage: '.dare',
    run: async (ctx) => {
      const pool = [
        'Set your Discord custom status to "I love pineapples on pizza" for the next 24 hours.',
        'Send the 5th image in your camera roll to this channel right now.',
        'Type your next 5 messages in this chat backwards.',
        'Send a wholesome compliment to the last person who sent a direct message to you.',
        'React to every message in this channel with 🦩 flamingos for the next 5 minutes.'
      ];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return ctx.reply(`### ⚡ DARE\n*${chosen}*`);
    }
  },
  {
    name: 'neverhaveiever',
    category: 'Fun',
    description: 'Classic party game "Never Have I Ever" prompt',
    usage: '.neverhaveiever',
    run: async (ctx) => {
      const pool = [
        'Never have I ever stayed awake for over 24 hours straight playing video games.',
        'Never have I ever accidentally joined a voice channel with my mic unmuted while singing.',
        'Never have I ever pretended to be AFK just to avoid talking in a group chat.',
        'Never have I ever rage-quit a competitive gaming lobby.',
        'Never have I ever spilled coffee or water directly on my mechanical keyboard.'
      ];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return ctx.reply(`### 🙋 NEVER HAVE I EVER...\n*${chosen}*`);
    }
  },
  {
    name: 'roast',
    category: 'Fun',
    description: 'Witty, harmless comedy roasts directed at target user',
    usage: '.roast [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You';
      const roasts = [
        `${target}'s typing speed is so slow that smoke signals would deliver faster.`,
        `I would agree with ${target}, but then we would both be completely wrong.`,
        `${target} has the reaction time of an unplugged toaster.`,
        `If ${target} was a spice, they would be flour.`,
        `${target}'s microphone sounds like an electric blender running underwater.`
      ];
      return ctx.reply(`🔥 ${roasts[Math.floor(Math.random() * roasts.length)]}`);
    }
  },
  {
    name: 'compliment',
    category: 'Fun',
    description: 'Wholesome genuine compliment generator',
    usage: '.compliment [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You';
      const compliments = [
        `${target} brings genuine positive energy into every channel they chat in!`,
        `The world is genuinely a cooler place with ${target} around.`,
        `${target}'s taste in music and memes is top tier.`,
        `If kindness was a currency, ${target} would be an absolute billionaire.`,
        `${target} has an elite aura that makes conversations 10x better.`
      ];
      return ctx.reply(`💖 ${compliments[Math.floor(Math.random() * compliments.length)]}`);
    }
  },
  {
    name: 'pickup',
    category: 'Fun',
    description: 'Cheesy humorous pickup lines',
    usage: '.pickup [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || '';
      const lines = [
        'Are you a Wi-Fi signal? Because I am feeling an instant strong connection.',
        'Are you full permissions on a Discord server? Because you have complete control over my heart.',
        'Are you an exception in my code? Because you just made everything stop running.',
        'Are you a ping? Because you are constantly on my mind.'
      ];
      return ctx.reply(`😉 ${target ? target + ', ' : ''}${lines[Math.floor(Math.random() * lines.length)]}`);
    }
  },
  {
    name: 'dadjoke',
    category: 'Fun',
    description: 'Classic wholesome dad jokes with punchlines',
    usage: '.dadjoke',
    run: async (ctx) => {
      const jokes = [
        { q: 'Why do programmers prefer dark mode?', a: 'Because light attracts bugs!' },
        { q: 'How do you organize a space party?', a: 'You planet!' },
        { q: 'What do you call a fake noodle?', a: 'An impasta!' },
        { q: 'Why did the scarecrow win an award?', a: 'Because he was outstanding in his field!' },
        { q: 'What do you call cheese that is not yours?', a: 'Nacho cheese!' }
      ];
      const j = jokes[Math.floor(Math.random() * jokes.length)];
      return ctx.reply(`👨 **Dad Joke:**\n*${j.q}*\n\n||${j.a}||`);
    }
  },
  {
    name: 'iq',
    category: 'Fun',
    description: 'Random funny IQ score rating for target user',
    usage: '.iq [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'Your';
      const score = Math.floor(Math.random() * 80) + 80;
      return ctx.reply(`🧠 **${target} IQ Score:** \`${score}\` (${score > 130 ? 'Galaxy Brain 🌌' : 'Decent Thinker 💡'})`);
    }
  },
  {
    name: 'howgay',
    category: 'Fun',
    description: 'Classic Discord fun rainbow meter gauge',
    usage: '.howgay [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You are';
      const pct = Math.floor(Math.random() * 101);
      return ctx.reply(`🌈 **${target}:** \`${pct}%\` gay!`);
    }
  },
  {
    name: 'howcool',
    category: 'Fun',
    description: 'Coolness percentage meter',
    usage: '.howcool [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You are';
      const pct = Math.floor(Math.random() * 101);
      return ctx.reply(`😎 **${target}:** \`${pct}%\` cool!`);
    }
  },
  {
    name: 'susmeter',
    category: 'Fun',
    description: 'Among Us imposter suspicion gauge',
    usage: '.susmeter [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You are';
      const pct = Math.floor(Math.random() * 101);
      return ctx.reply(`📮 **${target}:** \`${pct}%\` SUS (${pct > 70 ? 'IMPOSTER DETECTED 🚨' : 'Innocent Crewmate 😇'})`);
    }
  },
  {
    name: 'rizzmeter',
    category: 'Fun',
    description: 'Unspoken rizz rating out of 100%',
    usage: '.rizzmeter [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You have';
      const pct = Math.floor(Math.random() * 101);
      let tier = 'W Rizz 🔥';
      if (pct < 30) tier = 'Zero Game 💀';
      else if (pct < 70) tier = 'Mid Game 😐';
      else if (pct > 90) tier = 'Unspoken Giga-Rizz 👑';
      return ctx.reply(`🔥 **${target}:** \`${pct}%\` Rizz (${tier})`);
    }
  },
  {
    name: 'clownmeter',
    category: 'Fun',
    description: 'Circus clown percentage rating',
    usage: '.clownmeter [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'You are';
      const pct = Math.floor(Math.random() * 101);
      return ctx.reply(`🤡 **${target}:** \`${pct}%\` clown! (${pct > 80 ? 'Full Circus 🎪' : 'Not a clown 🎩'})`);
    }
  },
  {
    name: 'sanitycheck',
    category: 'Fun',
    description: 'Sanity level percentage meter',
    usage: '.sanitycheck [user]',
    run: async (ctx, args) => {
      const target = args.join(' ') || 'Your';
      const pct = Math.floor(Math.random() * 101);
      return ctx.reply(`🌀 **${target} Sanity Level:** \`${pct}%\` (${pct < 20 ? 'Completely unhinged 🤪' : 'Stable & grounded 🧘'})`);
    }
  },
  {
    name: 'luckmeter',
    category: 'Fun',
    description: 'Daily luck percentage and lucky number',
    usage: '.luckmeter',
    run: async (ctx) => {
      const pct = Math.floor(Math.random() * 101);
      const luckyNum = Math.floor(Math.random() * 99) + 1;
      return ctx.reply(`🍀 **Daily Fortune:** \`${pct}%\` Luck\n🎲 **Lucky Number:** \`${luckyNum}\``);
    }
  },
  {
    name: 'hug',
    category: 'Fun',
    description: 'Send a wholesome warm hug to target user',
    usage: '.hug <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'everyone';
      return ctx.reply(`🤗 **${author}** wraps **${target}** in a warm, cozy hug! ✨`);
    }
  },
  {
    name: 'pat',
    category: 'Fun',
    description: 'Gentle wholesome headpat action',
    usage: '.pat <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'everyone';
      return ctx.reply(`🐾 **${author}** gently pats **${target}** on the head! (*pat pat*)`);
    }
  },
  {
    name: 'slap',
    category: 'Fun',
    description: 'Comedic slap action emote',
    usage: '.slap <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'the air';
      return ctx.reply(`👋 **${author}** slaps **${target}** across the face! *SMACK!* 💥`);
    }
  },
  {
    name: 'punch',
    category: 'Fun',
    description: 'Playful anime punch action',
    usage: '.punch <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'the wall';
      return ctx.reply(`🥊 **${author}** punches **${target}**! *POW!* 💥`);
    }
  },
  {
    name: 'kiss',
    category: 'Fun',
    description: 'Sweet wholesome kiss action',
    usage: '.kiss <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'the mirror';
      return ctx.reply(`💋 **${author}** plants a sweet kiss on **${target}**! ❤️`);
    }
  },
  {
    name: 'bonk',
    category: 'Fun',
    description: 'Send target user to horny jail with an ASCII bat',
    usage: '.bonk <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'the void';
      return ctx.reply(`🔨 **${author}** BONKS **${target}** on the head!\n> *Go to horny jail! BONK!*`);
    }
  },
  {
    name: 'kill',
    category: 'Fun',
    description: 'Dramatic anime death scene action',
    usage: '.kill <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'themselves';
      return ctx.reply(`⚔️ **${author}** challenges **${target}** to a duel and delivers the finishing blow! 💀 *Omae wa mou shindeiru.*`);
    }
  },
  {
    name: 'cuddle',
    category: 'Fun',
    description: 'Cozy warm blanket cuddle action',
    usage: '.cuddle <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'a pillow';
      return ctx.reply(`🧸 **${author}** snuggles and cuddles up with **${target}**! 💤`);
    }
  },
  {
    name: 'highfive',
    category: 'Fun',
    description: 'Enthusiastic high-five action',
    usage: '.highfive <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'the air';
      return ctx.reply(`🙌 **${author}** and **${target}** share an epic high five! *CLAP!* ⚡`);
    }
  },
  {
    name: 'poke',
    category: 'Fun',
    description: 'Playful poke notification emote',
    usage: '.poke <user>',
    run: async (ctx, args) => {
      const author = ctx.author?.username || 'You';
      const target = args[0] || 'the screen';
      return ctx.reply(`👉 **${author}** playfully pokes **${target}**! *boop*`);
    }
  },
  {
    name: 'asciiheart',
    category: 'Fun',
    description: 'Large ASCII art heart banner',
    usage: '.asciiheart',
    run: async (ctx) => {
      const heart = `
  ******       ******
**********   **********
************* *************
***************************
 *************************
   *********************
     *****************
       *************
         *********
           *****
             *
      `.trim();
      return ctx.reply(`\`\`\`\n${heart}\n\`\`\``);
    }
  },
  {
    name: 'asciisword',
    category: 'Fun',
    description: 'Detailed ASCII broadsword weapon graphic',
    usage: '.asciisword',
    run: async (ctx) => {
      const sword = `
              /| ________________
O|===|* >_____________________>
              \\|
      `.trim();
      return ctx.reply(`\`\`\`\n${sword}\n\`\`\``);
    }
  },
  {
    name: 'asciicat',
    category: 'Fun',
    description: 'Cute ASCII neko cat banner',
    usage: '.asciicat',
    run: async (ctx) => {
      const cat = `
 /\\_/\\
( o.o )
 > ^ <  *meow*
      `.trim();
      return ctx.reply(`\`\`\`\n${cat}\n\`\`\``);
    }
  },
  {
    name: 'asciidog',
    category: 'Fun',
    description: 'Cute ASCII puppy dog graphic',
    usage: '.asciidog',
    run: async (ctx) => {
      const dog = `
  / \\__
 (    @\\___
 /         O
/   (_____/
/_____/   U  *woof*
      `.trim();
      return ctx.reply(`\`\`\`\n${dog}\n\`\`\``);
    }
  },
  {
    name: 'asciiship',
    category: 'Fun',
    description: 'ASCII sailing ship / vessel graphic',
    usage: '.asciiship',
    run: async (ctx) => {
      const ship = `
      |\\
      | \\
      |  \\
   ___|___\\___
   \\  o o o  /
 ~~~~~~~~~~~~~~~
      `.trim();
      return ctx.reply(`\`\`\`\n${ship}\n\`\`\``);
    }
  },
  {
    name: 'partyparrot',
    category: 'Fun',
    description: 'Unicode party parrot celebration banner',
    usage: '.partyparrot',
    run: async (ctx) => {
      return ctx.reply('🦜✨ 🎉 **PARTY PARROT INITIATED!** 🥳✨ 🦜');
    }
  },
  {
    name: 'spamton',
    category: 'Fun',
    description: 'Rephrase text in Deltarune Spamton speech style',
    usage: '.spamton <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text for Spamton.');
      const text = args.join(' ');
      return ctx.reply(`NOWS YOUR CHANCE TO BE A [[BIG SHOT]]!! HEY EVERY [[It\'s Me!]], ${text.toUpperCase()} FOR ONLY [[4.99]] [[KROMER]]!!`);
    }
  },
  {
    name: 'yoda',
    category: 'Fun',
    description: 'Rephrase sentence in Master Yoda speaking cadence',
    usage: '.yoda <sentence>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide sentence.');
      const words = args;
      if (words.length <= 2) return ctx.reply(`"${words.join(' ')}, yes, hmmm."`);
      const pivot = Math.floor(words.length / 2);
      const first = words.slice(0, pivot).join(' ');
      const second = words.slice(pivot).join(' ');
      return ctx.reply(`"${second}, ${first}, yes, hmmm." 🧘`);
    }
  },
  {
    name: 'piratespeak',
    category: 'Fun',
    description: 'Rephrase text into pirate buccaneer dialect',
    usage: '.piratespeak <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      let t = args.join(' ')
        .replace(/\bhello\b/gi, 'ahoy')
        .replace(/\bhi\b/gi, 'avast')
        .replace(/\bmy\b/gi, 'me')
        .replace(/\byou\b/gi, 'ye')
        .replace(/\bfriend\b/gi, 'matey')
        .replace(/\bmoney\b/gi, 'doubloons');
      return ctx.reply(`🏴‍☠️ **Ahoy!** ${t}, arrrr!`);
    }
  },
  {
    name: 'emojimix',
    category: 'Fun',
    description: 'Creative fusion description and synthesis of two emojis',
    usage: '.emojimix <emoji1> <emoji2>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.emojimix <emoji1> <emoji2>`');
      const e1 = args[0];
      const e2 = args[1];
      return ctx.reply(`🧪 **Emoji Alchemy:** ${e1} + ${e2} ➔ **${e1}${e2} (Fused Hybrid Variant)**`);
    }
  }
];
