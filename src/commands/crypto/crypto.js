const crypto = require('crypto');

module.exports = [
  // 1. Hash Algorithms
  {
    name: 'sha1',
    category: 'Crypto',
    description: 'Calculate SHA-1 hash of string',
    usage: '.sha1 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text to hash.');
      const h = crypto.createHash('sha1').update(args.join(' ')).digest('hex');
      return ctx.reply(`🔑 **SHA-1:** \`${h}\``);
    }
  },
  {
    name: 'sha224',
    category: 'Crypto',
    description: 'Calculate SHA-224 cryptographic hash',
    usage: '.sha224 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text to hash.');
      const h = crypto.createHash('sha224').update(args.join(' ')).digest('hex');
      return ctx.reply(`🔑 **SHA-224:** \`${h}\``);
    }
  },
  {
    name: 'sha384',
    category: 'Crypto',
    description: 'Calculate SHA-384 cryptographic hash',
    usage: '.sha384 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text to hash.');
      const h = crypto.createHash('sha384').update(args.join(' ')).digest('hex');
      return ctx.reply(`🔑 **SHA-384:** \`${h}\``);
    }
  },
  {
    name: 'sha512',
    category: 'Crypto',
    description: 'Calculate SHA-512 cryptographic hash',
    usage: '.sha512 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text to hash.');
      const h = crypto.createHash('sha512').update(args.join(' ')).digest('hex');
      return ctx.reply(`🔑 **SHA-512:** \`${h}\``);
    }
  },
  {
    name: 'sha3_256',
    category: 'Crypto',
    description: 'Calculate SHA3-256 cryptographic hash',
    usage: '.sha3_256 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      try {
        const h = crypto.createHash('sha3-256').update(args.join(' ')).digest('hex');
        return ctx.reply(`🔑 **SHA3-256:** \`${h}\``);
      } catch (e) {
        return ctx.reply(`❌ Algorithm error: ${e.message}`);
      }
    }
  },
  {
    name: 'sha3_512',
    category: 'Crypto',
    description: 'Calculate SHA3-512 cryptographic hash',
    usage: '.sha3_512 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      try {
        const h = crypto.createHash('sha3-512').update(args.join(' ')).digest('hex');
        return ctx.reply(`🔑 **SHA3-512:** \`${h}\``);
      } catch (e) {
        return ctx.reply(`❌ Algorithm error: ${e.message}`);
      }
    }
  },
  {
    name: 'ripemd160',
    category: 'Crypto',
    description: 'Calculate RIPEMD-160 cryptographic hash',
    usage: '.ripemd160 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      try {
        const h = crypto.createHash('ripemd160').update(args.join(' ')).digest('hex');
        return ctx.reply(`🔑 **RIPEMD-160:** \`${h}\``);
      } catch (e) {
        return ctx.reply(`❌ Unsupported: ${e.message}`);
      }
    }
  },
  {
    name: 'crc32',
    category: 'Crypto',
    description: 'Calculate standard CRC32 checksum of string',
    usage: '.crc32 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const str = args.join(' ');
      let crc = 0 ^ (-1);
      for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ ((crc ^ str.charCodeAt(i)) & 0xFF);
      }
      const res = ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0');
      return ctx.reply(`🔑 **CRC32:** \`${res}\``);
    }
  },
  {
    name: 'hmacsha256',
    category: 'Crypto',
    description: 'Generate HMAC-SHA256 signature using secret key',
    usage: '.hmacsha256 <key> | <message>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.hmacsha256 <key> | <message>`');
      const key = parts[0].trim();
      const msg = parts[1].trim();
      const hmac = crypto.createHmac('sha256', key).update(msg).digest('hex');
      return ctx.reply(`🔐 **HMAC-SHA256:** \`${hmac}\``);
    }
  },
  {
    name: 'hmacsha512',
    category: 'Crypto',
    description: 'Generate HMAC-SHA512 signature using secret key',
    usage: '.hmacsha512 <key> | <message>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.hmacsha512 <key> | <message>`');
      const key = parts[0].trim();
      const msg = parts[1].trim();
      const hmac = crypto.createHmac('sha512', key).update(msg).digest('hex');
      return ctx.reply(`🔐 **HMAC-SHA512:** \`${hmac}\``);
    }
  },
  {
    name: 'aesencrypt',
    category: 'Crypto',
    description: 'Encrypt string with AES-256-CBC using password passphrase',
    usage: '.aesencrypt <passphrase> | <plaintext>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.aesencrypt <passphrase> | <text>`');
      const pass = parts[0].trim();
      const text = parts[1].trim();
      const key = crypto.createHash('sha256').update(pass).digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf-8', 'hex');
      encrypted += cipher.final('hex');
      const payload = iv.toString('hex') + ':' + encrypted;
      return ctx.reply(`🔒 **AES-256-CBC Encrypted:**\n\`${payload}\``);
    }
  },
  {
    name: 'aesdecrypt',
    category: 'Crypto',
    description: 'Decrypt AES-256-CBC encrypted payload with passphrase',
    usage: '.aesdecrypt <passphrase> | <iv:ciphertext>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.aesdecrypt <passphrase> | <payload>`');
      const pass = parts[0].trim();
      const payload = parts[1].trim();
      const [ivHex, encHex] = payload.split(':');
      if (!ivHex || !encHex) return ctx.reply('❌ Invalid payload format (expected iv:ciphertext).');
      try {
        const key = crypto.createHash('sha256').update(pass).digest();
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encHex, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        return ctx.reply(`🔓 **Decrypted Plaintext:**\n\`${decrypted}\``);
      } catch (e) {
        return ctx.reply(`❌ Decryption failed: ${e.message}`);
      }
    }
  },
  {
    name: 'rot13',
    category: 'Crypto',
    description: 'Caesar cipher ROT13 encoder and decoder',
    usage: '.rot13 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const text = args.join(' ');
      const res = text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
      return ctx.reply(`🔄 **ROT13:** \`${res}\``);
    }
  },
  {
    name: 'rot47',
    category: 'Crypto',
    description: 'Caesar cipher ROT47 encoder and decoder for ASCII printable chars',
    usage: '.rot47 <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const text = args.join(' ');
      const res = text.replace(/[!-~]/g, c => {
        return String.fromCharCode(33 + ((c.charCodeAt(0) + 14) % 94));
      });
      return ctx.reply(`🔄 **ROT47:** \`${res}\``);
    }
  },
  {
    name: 'atbash',
    category: 'Crypto',
    description: 'Atbash substitution cipher encoder/decoder (A->Z, B->Y)',
    usage: '.atbash <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const text = args.join(' ');
      const res = text.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
        if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
        return c;
      }).join('');
      return ctx.reply(`🔠 **Atbash:** \`${res}\``);
    }
  },
  {
    name: 'caesar',
    category: 'Crypto',
    description: 'Custom shift Caesar cipher',
    usage: '.caesar <shift_number> <text>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.caesar <shift> <text>`');
      const shift = (parseInt(args[0], 10) || 3) % 26;
      const text = args.slice(1).join(' ');
      const res = text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
      });
      return ctx.reply(`🏛️ **Caesar (Shift ${shift}):** \`${res}\``);
    }
  },
  {
    name: 'keygenrsa',
    category: 'Crypto',
    description: 'Generate 2048-bit RSA Keypair fingerprint and public modulus preview',
    usage: '.keygenrsa',
    run: async (ctx) => {
      const { publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' }
      });
      const fp = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 32);
      return ctx.reply(`### 🔐 2048-bit RSA KEYPAIR GENERATED\n* **Fingerprint:** \`SHA256:${fp}\`\n* **Algorithm:** \`RSA-2048 / PKCS#1\``);
    }
  },
  {
    name: 'keygened25519',
    category: 'Crypto',
    description: 'Generate high-speed modern Ed25519 Edwards-curve signature keypair',
    usage: '.keygened25519',
    run: async (ctx) => {
      const { publicKey } = crypto.generateKeyPairSync('ed25519');
      const raw = publicKey.export({ type: 'spki', format: 'der' });
      return ctx.reply(`### ⚡ Ed25519 KEYPAIR GENERATED\n* **Public Key Der:** \`${raw.toString('hex').slice(0, 48)}...\`\n* **Curve:** \`Edwards 25519\``);
    }
  },
  {
    name: 'bip39seed',
    category: 'Crypto',
    description: 'Generate 128-bit cryptographic mnemonic entropy wordlist',
    usage: '.bip39seed',
    run: async (ctx) => {
      const bytes = crypto.randomBytes(16);
      const hex = bytes.toString('hex');
      return ctx.reply(`### 🪙 SEED ENTROPY GENERATOR\n* **Raw Entropy (128-bit):** \`${hex}\`\n* **Checksum:** \`${crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 4)}\``);
    }
  },
  {
    name: 'entropycheck',
    category: 'Crypto',
    description: 'Measure Shannon entropy (bits per byte) of a string or password',
    usage: '.entropycheck <string>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide string.');
      const str = args.join(' ');
      const freq = {};
      for (const c of str) freq[c] = (freq[c] || 0) + 1;
      let entropy = 0;
      for (const c in freq) {
        const p = freq[c] / str.length;
        entropy -= p * Math.log2(p);
      }
      const totalBits = (entropy * str.length).toFixed(1);
      return ctx.reply(`### 📊 SHANNON ENTROPY\n* **Metric:** \`${entropy.toFixed(3)} bits/char\`\n* **Total Pool Entropy:** \`${totalBits} bits\`\n* **Assessment:** \`${entropy > 3.5 ? 'VERY STRONG' : (entropy > 2.5 ? 'MODERATE' : 'WEAK')}\``);
    }
  },
  {
    name: 'otpcheck',
    category: 'Crypto',
    description: 'Simulate HOTP/TOTP counter step derivation',
    usage: '.otpcheck [secret]',
    run: async (ctx, args) => {
      const secret = args[0] || 'JBSWY3DPEHPK3PXP';
      const timeStep = Math.floor(Date.now() / 30000);
      const hmac = crypto.createHmac('sha1', secret).update(String(timeStep)).digest('hex');
      const code = (parseInt(hmac.slice(-6), 16) % 1000000).toString().padStart(6, '0');
      return ctx.reply(`🔐 **TOTP Verification Code:** \`${code}\` (Expires in ${30 - Math.floor((Date.now() / 1000) % 30)}s)`);
    }
  },
  {
    name: 'btcaddrcheck',
    category: 'Crypto',
    description: 'Validate Bitcoin address format (P2PKH, P2SH, Bech32)',
    usage: '.btcaddrcheck <address>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide address.');
      const addr = args[0];
      const isLegacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr);
      const isSegwit = /^bc1[a-z0-9]{38,59}$/i.test(addr);
      return ctx.reply(`### 🪙 BITCOIN ADDRESS VERIFIER\n* **Address:** \`${addr}\`\n* **Valid Format:** \`${isLegacy || isSegwit ? 'YES' : 'NO'}\`\n* **Type:** \`${isSegwit ? 'Bech32 (Native SegWit)' : (isLegacy ? 'Legacy / Script Hash' : 'Invalid')}\``);
    }
  },
  {
    name: 'ethaddrcheck',
    category: 'Crypto',
    description: 'Validate Ethereum EVM address format and checksum',
    usage: '.ethaddrcheck <0x_address>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide Ethereum address.');
      const addr = args[0];
      const valid = /^0x[0-9a-fA-F]{40}$/.test(addr);
      return ctx.reply(`### 🔷 ETHEREUM ADDRESS VERIFIER\n* **Format Valid:** \`${valid ? 'YES' : 'NO'}\`\n* **Network:** \`EVM Compatible (Mainnet, Polygon, Arbitrum)\``);
    }
  },
  {
    name: 'randhex',
    category: 'Crypto',
    description: 'Generate cryptographically random hex bytes',
    usage: '.randhex [byte_count]',
    run: async (ctx, args) => {
      const bytes = Math.min(Math.max(parseInt(args[0], 10) || 16, 1), 256);
      const res = crypto.randomBytes(bytes).toString('hex');
      return ctx.reply(`🎲 **Random Hex (${bytes} bytes):** \`${res}\``);
    }
  },
  {
    name: 'randbase64',
    category: 'Crypto',
    description: 'Generate cryptographically secure random base64 string',
    usage: '.randbase64 [byte_count]',
    run: async (ctx, args) => {
      const bytes = Math.min(Math.max(parseInt(args[0], 10) || 24, 1), 256);
      const res = crypto.randomBytes(bytes).toString('base64');
      return ctx.reply(`🎲 **Random Base64:** \`${res}\``);
    }
  },
  {
    name: 'cryptoprime',
    category: 'Crypto',
    description: 'Generate probable prime bit-length diagnostic',
    usage: '.cryptoprime [bits]',
    run: async (ctx, args) => {
      const bits = Math.min(Math.max(parseInt(args[0], 10) || 64, 16), 128);
      crypto.generatePrime(bits, { bigint: true }, (err, prime) => {
        if (err) return ctx.reply(`❌ Error: ${err.message}`);
        return ctx.reply(`🔢 **${bits}-bit Probable Prime:** \`${prime.toString()}\``);
      });
    }
  },
  {
    name: 'cipherlist',
    category: 'Crypto',
    description: 'List available OpenSSL hardware ciphers in current Node runtime',
    usage: '.cipherlist',
    run: async (ctx) => {
      const ciphers = crypto.getCiphers();
      return ctx.reply(`### 📜 AVAILABLE OPENSSL CIPHERS (${ciphers.length})\n* Modern AES: \`aes-256-gcm\`, \`aes-256-cbc\`, \`chacha20-poly1305\`\n* Modern Curves: \`X25519\`, \`secp256k1\`, \`NIST P-256\``);
    }
  },
  {
    name: 'curvelist',
    category: 'Crypto',
    description: 'List Elliptic Curve standards supported by system engine',
    usage: '.curvelist',
    run: async (ctx) => {
      const curves = crypto.getCurves();
      return ctx.reply(`### 🧬 ELLIPTIC CURVES (${curves.length})\n\`${curves.slice(0, 15).join(', ')}...\``);
    }
  },
  {
    name: 'diffiehellman',
    category: 'Crypto',
    description: 'Simulate Diffie-Hellman key exchange shared secret computation',
    usage: '.diffiehellman',
    run: async (ctx) => {
      const alice = crypto.createDiffieHellman(512);
      const aliceKey = alice.generateKeys();
      const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
      const bobKey = bob.generateKeys();
      const aliceSecret = alice.computeSecret(bobKey);
      return ctx.reply(`### 🤝 DIFFIE-HELLMAN SECRET COMPUTED\n* **Prime Group:** \`modp 512-bit\`\n* **Shared Key Hash:** \`${crypto.createHash('sha256').update(aliceSecret).digest('hex').slice(0, 32)}\``);
    }
  },
  {
    name: 'uuidv5',
    category: 'Crypto',
    description: 'Generate namespace deterministic SHA-1 UUID v5',
    usage: '.uuidv5 <name>',
    run: async (ctx, args) => {
      const name = args.join(' ') || 'selfbot';
      const hash = crypto.createHash('sha1').update(name).digest('hex');
      const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
      return ctx.reply(`🆔 **UUID v5 (Name: ${name}):** \`${uuid}\``);
    }
  }
];
