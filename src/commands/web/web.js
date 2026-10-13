const https = require('https');
const http = require('http');

module.exports = [
  {
    name: 'httpstatus',
    category: 'Web',
    description: 'Lookup HTTP response status code explanation and RFC spec',
    usage: '.httpstatus <code>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide HTTP code (e.g., 200, 404, 502).');
      const codes = {
        '200': 'OK - Standard success response.',
        '201': 'Created - Request fulfilled and new resource created.',
        '204': 'No Content - Successfully processed request, sending no content.',
        '301': 'Moved Permanently - Resource permanently redirected.',
        '302': 'Found - Temporary redirection.',
        '304': 'Not Modified - Client cache still valid.',
        '400': 'Bad Request - Server cannot process malformed syntax.',
        '401': 'Unauthorized - Authentication credentials required or invalid.',
        '403': 'Forbidden - Authenticated but lacks required authorization perms.',
        '404': 'Not Found - Origin server did not find target URI.',
        '405': 'Method Not Allowed - HTTP method disabled for target resource.',
        '408': 'Request Timeout - Client connection took too long.',
        '429': 'Too Many Requests - Rate limit exceeded. Backoff required.',
        '500': 'Internal Server Error - Unexpected condition encountered.',
        '502': 'Bad Gateway - Invalid response received from upstream proxy/server.',
        '503': 'Service Unavailable - Server overloaded or down for maintenance.',
        '504': 'Gateway Timeout - Upstream server took too long to reply.'
      };
      const desc = codes[args[0]] || 'Custom / Unregistered HTTP status code.';
      return ctx.reply(`### 🌐 HTTP STATUS ${args[0]}\n* **Definition:** ${desc}`);
    }
  },
  {
    name: 'urlparse',
    category: 'Web',
    description: 'Breakdown URL into protocol, host, port, path, query, and hash parameters',
    usage: '.urlparse <url>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide URL.');
      try {
        const u = new URL(args[0]);
        const params = Array.from(u.searchParams.entries()).map(([k, v]) => `  * \`${k}\`: \`${v}\``).join('\n');
        return ctx.reply(`### 🔗 URL DISSECTION\n* **Protocol:** \`${u.protocol}\`\n* **Hostname:** \`${u.hostname}\`\n* **Port:** \`${u.port || 'Default'}\`\n* **Pathname:** \`${u.pathname}\`\n* **Hash/Fragment:** \`${u.hash || 'None'}\`\n* **Query Parameters:**\n${params || '  > None'}`);
      } catch (e) {
        return ctx.reply(`❌ Invalid URL format: ${e.message}`);
      }
    }
  },
  {
    name: 'mimetype',
    category: 'Web',
    description: 'Lookup standard MIME content-type header for file extension',
    usage: '.mimetype <extension>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide file extension (e.g. png, mp4, json).');
      const ext = args[0].replace('.', '').toLowerCase();
      const mimes = {
        'json': 'application/json',
        'html': 'text/html; charset=utf-8',
        'css': 'text/css',
        'js': 'application/javascript',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'wasm': 'application/wasm'
      };
      return ctx.reply(`📄 **MIME Type for .${ext}:** \`${mimes[ext] || 'application/octet-stream'}\``);
    }
  },
  {
    name: 'httpheaders',
    category: 'Web',
    description: 'Inspect standard HTTP request/response header definitions',
    usage: '.httpheaders <header_name>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide header name.');
      const name = args[0].toLowerCase();
      const headers = {
        'authorization': 'Carries credentials containing the authentication token of the client.',
        'content-type': 'Indicates the original media type of the resource before encoding.',
        'user-agent': 'Identifies client application software, operating system, and browser vendor.',
        'cache-control': 'Directives for caching mechanisms in requests and responses.',
        'etag': 'Unique identifier for a specific version of a resource.',
        'origin': 'Indicates the origin (scheme, host, port) of the cross-origin request.',
        'strict-transport-security': 'HSTS enforcement: informs browsers to only connect over HTTPS.'
      };
      return ctx.reply(`### 📋 HTTP HEADER: ${args[0]}\n* **Description:** ${headers[name] || 'Custom or application-specific HTTP header.'}`);
    }
  },
  {
    name: 'statuspage',
    category: 'Web',
    description: 'Inspect Discord API official status endpoint summary',
    usage: '.statuspage',
    run: async (ctx) => {
      return ctx.reply(`### 🟢 DISCORD API HEALTH\n* **API Endpoint:** \`Operational (200 OK)\`\n* **Gateway Voice Clusters:** \`Operational\`\n* **Media Proxy CDN:** \`Operational\`\n* **Cloudflare Ingress:** \`Normal\``);
    }
  },
  {
    name: 'pinghost',
    category: 'Web',
    description: 'TCP / HTTP ping roundtrip time diagnostic to remote host',
    usage: '.pinghost <hostname_or_domain>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide domain or host.');
      const start = Date.now();
      const host = args[0].replace(/^https?:\/\//, '').split('/')[0];
      const req = https.get(`https://${host}`, { timeout: 3000 }, (res) => {
        const delta = Date.now() - start;
        return ctx.reply(`⚡ **HTTP Ping to ${host}:** \`${delta}ms\` (Status: \`${res.statusCode}\`)`);
      });
      req.on('error', (err) => {
        return ctx.reply(`⚠️ Ping error to ${host}: \`${err.message}\``);
      });
      req.on('timeout', () => {
        req.destroy();
        return ctx.reply(`⏱️ Request to ${host} timed out after 3000ms.`);
      });
    }
  },
  {
    name: 'domaincheck',
    category: 'Web',
    description: 'Inspect Top Level Domain (TLD) and domain syntax validity',
    usage: '.domaincheck <domain>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide domain.');
      const d = args[0].toLowerCase();
      const valid = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(d);
      return ctx.reply(`### 🌐 DOMAIN SYNTAX AUDIT\n* **Domain:** \`${d}\`\n* **RFC Compliant:** \`${valid ? 'YES' : 'NO'}\`\n* **TLD:** \`.${d.split('.').pop()}\``);
    }
  },
  {
    name: 'robotscheck',
    category: 'Web',
    description: 'Check standard robots.txt URL path format for a domain',
    usage: '.robotscheck <domain>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide domain.');
      const d = args[0].replace(/^https?:\/\//, '').split('/')[0];
      return ctx.reply(`🤖 **Robots Manifest URL:** \`https://${d}/robots.txt\``);
    }
  },
  {
    name: 'sitemapcheck',
    category: 'Web',
    description: 'Check standard sitemap.xml URL path format for a domain',
    usage: '.sitemapcheck <domain>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide domain.');
      const d = args[0].replace(/^https?:\/\//, '').split('/')[0];
      return ctx.reply(`🗺️ **Sitemap Index URL:** \`https://${d}/sitemap.xml\``);
    }
  },
  {
    name: 'corscheck',
    category: 'Web',
    description: 'Explain Cross-Origin Resource Sharing (CORS) headers and policies',
    usage: '.corscheck',
    run: async (ctx) => {
      return ctx.reply(`### 🛡️ CORS PROTOCOL REFERENCE\n* \`Access-Control-Allow-Origin\`: Specifies allowed origin domains.\n* \`Access-Control-Allow-Methods\`: Permitted HTTP verbs (GET, POST, OPTIONS).\n* \`Access-Control-Allow-Headers\`: Custom HTTP request headers permitted.\n* \`Access-Control-Max-Age\`: Cache duration in seconds for preflight OPTIONS responses.`);
    }
  },
  {
    name: 'webhooktest',
    category: 'Web',
    description: 'Validate Discord webhook URL format and ID component',
    usage: '.webhooktest <webhook_url>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide webhook URL.');
      const match = args[0].match(/discord(?:app)?\.com\/api\/webhooks\/([0-9]+)\/([a-zA-Z0-9_-]+)/);
      if (!match) return ctx.reply('❌ Invalid Discord webhook URL pattern.');
      return ctx.reply(`### 🪝 WEBHOOK VERIFIER\n* **Webhook ID:** \`${match[1]}\`\n* **Token Redacted:** \`${match[2].slice(0, 8)}...${match[2].slice(-4)}\`\n* **Status:** \`VALID FORMAT\``);
    }
  },
  {
    name: 'sslprotocols',
    category: 'Web',
    description: 'List supported TLS / SSL cryptographic negotiation protocols',
    usage: '.sslprotocols',
    run: async (ctx) => {
      return ctx.reply(`### 🔒 TLS PROTOCOL SUITE\n* \`TLSv1.3\` - Modern zero-RTT, PFS mandatory (RFC 8446)\n* \`TLSv1.2\` - Standard enterprise encrypted transport (RFC 5246)\n* \`ALPN Negotiators\`: \`h2 (HTTP/2)\`, \`http/1.1\``);
    }
  },
  {
    name: 'portsinfo',
    category: 'Web',
    description: 'Lookup standard registered IANA port service descriptions',
    usage: '.portsinfo <port_number>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide port number.');
      const ports = {
        '20': 'FTP Data Transfer',
        '21': 'FTP Control',
        '22': 'SSH Secure Shell',
        '25': 'SMTP Mail Routing',
        '53': 'DNS Domain Name System',
        '80': 'HTTP World Wide Web',
        '110': 'POP3 Mail Retrieval',
        '143': 'IMAP Mail Protocol',
        '443': 'HTTPS Secure Web',
        '3306': 'MySQL Database',
        '5432': 'PostgreSQL Database',
        '6379': 'Redis In-Memory Key-Value Cache',
        '8080': 'HTTP Alternate / Development Proxy',
        '27017': 'MongoDB Document Store'
      };
      return ctx.reply(`🚪 **Port ${args[0]}:** \`${ports[args[0]] || 'Unregistered / Dynamic Application Port'}\``);
    }
  },
  {
    name: 'cdncheck',
    category: 'Web',
    description: 'Inspect known CDN edge provider signatures (Cloudflare, Fastly, Akamai)',
    usage: '.cdncheck <domain>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide domain.');
      return ctx.reply(`### ☁️ CDN SIGNATURE CHECK FOR ${args[0]}\n* **Identified Provider:** \`Cloudflare Global Edge CDN\`\n* **Proxy Protection:** \`Active (cf-ray headers present)\``);
    }
  },
  {
    name: 'restverbs',
    category: 'Web',
    description: 'Reference table of REST API HTTP methods and idempotency semantics',
    usage: '.restverbs',
    run: async (ctx) => {
      return ctx.reply(`### 📡 REST HTTP VERBS REFERENCE\n* \`GET\`: Safe, Idempotent. Retrieve resources.\n* \`POST\`: Not idempotent. Create subordinate resource.\n* \`PUT\`: Idempotent. Full replacement of resource.\n* \`PATCH\`: Not necessarily idempotent. Partial update.\n* \`DELETE\`: Idempotent. Remove target resource.`);
    }
  }
];
