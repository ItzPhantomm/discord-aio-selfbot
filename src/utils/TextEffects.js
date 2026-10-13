const TextEffects = {
  // Mock sponge-bob case
  mock(str) {
    return str
      .split('')
      .map((char, i) => (i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
      .join('');
  },

  // Reverse text
  reverse(str) {
    return str.split('').reverse().join('');
  },

  // Vaporwave / Fullwidth
  vaporwave(str) {
    return str
      .split('')
      .map(c => {
        const code = c.charCodeAt(0);
        if (code >= 33 && code <= 126) {
          return String.fromCharCode(code + 65248);
        } else if (code === 32) {
          return '　';
        }
        return c;
      })
      .join('');
  },

  // 1337 Speak
  leet(str) {
    const map = {
      a: '4', A: '4',
      e: '3', E: '3',
      i: '1', I: '1',
      o: '0', O: '0',
      s: '5', S: '5',
      t: '7', T: '7'
    };
    return str.split('').map(c => map[c] || c).join('');
  },

  // Morse Code
  morse(str, encode = true) {
    const morseMap = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
      '9': '----.', '0': '-----', ' ': '/'
    };
    if (encode) {
      return str.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
    } else {
      const revMap = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]));
      return str.split(' ').map(c => revMap[c] || c).join('');
    }
  },

  // Binary converter
  binary(str, encode = true) {
    if (encode) {
      return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    } else {
      return str.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
    }
  },

  // Clap text
  clap(str) {
    return str.trim().split(/\s+/).join(' 👏 ');
  },

  // Emojify (regional indicators)
  emojify(str) {
    return str
      .toLowerCase()
      .split('')
      .map(c => {
        if (c >= 'a' && c <= 'z') return `:regional_indicator_${c}:`;
        if (c === ' ') return '   ';
        return c;
      })
      .join(' ');
  },

  // Upside down
  upsidedown(str) {
    const chars = 'abcdefghijklmnopqrstuvwxyz,.?!_()[]{}<>';
    const flip  = 'ɐqɔpǝɟɓɥᴉɾʞlɯudodbɹsʇnʌʍxʎz˙\'¿¡‾)(][}{><';
    return str
      .toLowerCase()
      .split('')
      .reverse()
      .map(c => {
        const i = chars.indexOf(c);
        return i !== -1 ? flip[i] : c;
      })
      .join('');
  },

  // OwO / Uwu text
  owo(str) {
    return str
      .replace(/(?:r|l)/g, 'w')
      .replace(/(?:R|L)/g, 'W')
      .replace(/n([aeiou])/gi, 'ny$1')
      .replace(/N([aeiou])/gi, 'Ny$1')
      .replace(/ove/g, 'uv')
      .replace(/!+/g, ' >w< ');
  },

  // Zalgo text (glitch generator)
  zalgo(str) {
    const zalgoUp = ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈', '͊', '͋', '͌', '̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒', '̓', '̔', '̽', '̉', 'ͣ', 'ͤ', 'ͥ', 'ͦ', 'ͧ', 'ͨ', 'ͩ', 'ͪ', 'ͫ', 'ͬ', 'ͭ', 'ͮ', 'ͯ', '̾', '͛', '͆', '̚'];
    const zalgoDown = ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̧', '̨', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̴', '̵', '̶', '̷', '̸', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'];
    let result = '';
    for (const char of str) {
      result += char;
      for (let i = 0; i < 2; i++) {
        result += zalgoUp[Math.floor(Math.random() * zalgoUp.length)];
        result += zalgoDown[Math.floor(Math.random() * zalgoDown.length)];
      }
    }
    return result;
  },

  // Simple Ascii Banner generator
  cowsay(text) {
    const len = text.length;
    const border = '-'.repeat(len + 2);
    return `
 ${border}
< ${text} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
    `.trim();
  }
};

module.exports = TextEffects;
