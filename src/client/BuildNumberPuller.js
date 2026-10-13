const fs = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

/**
 * Dynamic Discord Build Number Puller
 * Scrapes the live, production Discord build number directly from discord.com/app assets
 * on startup to ensure fingerprint byte-for-byte fidelity against Discord anti-bot checks.
 */
class BuildNumberPuller {
  constructor() {
    this.cacheFile = path.join(__dirname, '../../data/discord_build.json');
    this.fallbackBuild = 634304; // Verified production build fallback
    this.firefoxUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0';
    this.cachedBuild = null;
    this.lastFetched = 0;
  }

  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const raw = fs.readFileSync(this.cacheFile, 'utf-8');
        const data = JSON.parse(raw);
        if (data.build && Date.now() - (data.timestamp || 0) < 2 * 60 * 60 * 1000) { // 2 hours
          this.cachedBuild = data.build;
          this.lastFetched = data.timestamp;
          return this.cachedBuild;
        }
      }
    } catch {}
    return null;
  }

  saveCache(build) {
    try {
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cacheFile, JSON.stringify({ build, timestamp: Date.now() }, null, 2), 'utf-8');
    } catch {}
  }

  async fetchLatestBuild() {
    // 1. Check in-memory cache
    if (this.cachedBuild && Date.now() - this.lastFetched < 2 * 60 * 60 * 1000) {
      return this.cachedBuild;
    }

    // 2. Check disk cache
    const diskCached = this.loadCache();
    if (diskCached) {
      return diskCached;
    }

    // 3. Live scrape from discord.com/app
    try {
      Logger.info('Pulling live Discord production client build number...');
      const res = await fetch('https://discord.com/app', {
        headers: {
          'User-Agent': this.firefoxUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      const scriptMatches = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map(m => m[1]);

      if (scriptMatches.length > 0) {
        // Scrape the last 5 script chunks (where client build number metadata resides)
        for (const scriptPath of scriptMatches.slice(-5).reverse()) {
          try {
            const scriptRes = await fetch('https://discord.com' + scriptPath, {
              headers: { 'User-Agent': this.firefoxUserAgent }
            });
            if (!scriptRes.ok) continue;
            const js = await scriptRes.text();

            const match = js.match(/buildNumber:"(\d+)"/i) ||
                          js.match(/BuildNumber:"(\d+)"/i) ||
                          js.match(/build_number:"(\d+)"/i) ||
                          js.match(/"client_build_number",(\d+)/i);

            if (match && match[1]) {
              const buildNumber = parseInt(match[1], 10);
              this.cachedBuild = buildNumber;
              this.lastFetched = Date.now();
              this.saveCache(buildNumber);
              Logger.success(`Live Discord build number acquired: ${buildNumber}`);
              return buildNumber;
            }
          } catch {}
        }
      }
    } catch (err) {
      Logger.warn(`Failed to pull live Discord build number (${err.message}). Using verified fallback.`);
    }

    this.cachedBuild = this.fallbackBuild;
    return this.fallbackBuild;
  }
}

module.exports = new BuildNumberPuller();
module.exports.BuildNumberPuller = BuildNumberPuller;
