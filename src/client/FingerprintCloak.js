const crypto = require('crypto');
const BuildNumberPuller = require('./BuildNumberPuller');

/**
 * FingerprintCloak
 * Byte-for-byte identical Mozilla Firefox client emulation.
 * Provides exact X-Super-Properties, WebSocket handshake properties,
 * and HTTP headers matching an authentic Firefox on Windows session.
 */
class FingerprintCloak {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0';
    this.browserVersion = '136.0';
    this.os = 'Windows';
    this.osVersion = '10.0.19045';
  }

  async getSuperProperties() {
    const buildNumber = await BuildNumberPuller.fetchLatestBuild();

    return {
      os: this.os,
      browser: 'Firefox',
      device: '',
      system_locale: 'en-US',
      browser_user_agent: this.userAgent,
      browser_version: this.browserVersion,
      os_version: this.osVersion,
      referrer: '',
      referring_domain: '',
      referrer_current: '',
      referring_domain_current: '',
      release_channel: 'stable',
      client_build_number: buildNumber,
      client_event_source: null,
      has_client_mods: false
    };
  }

  async getGatewayProperties() {
    const buildNumber = await BuildNumberPuller.fetchLatestBuild();

    return {
      os: this.os,
      browser: 'Firefox',
      release_channel: 'stable',
      client_version: this.browserVersion,
      os_version: this.osVersion,
      os_arch: 'x64',
      app_arch: 'x64',
      system_locale: 'en-US',
      has_client_mods: false,
      client_launch_id: crypto.randomUUID(),
      browser_user_agent: this.userAgent,
      browser_version: this.browserVersion,
      os_sdk_version: '19045',
      client_build_number: buildNumber,
      native_build_number: null,
      client_event_source: null,
      launch_signature: crypto.randomUUID(),
      client_heartbeat_session_id: crypto.randomUUID(),
      client_app_state: 'focused'
    };
  }

  getHttpHeaders() {
    return {
      'User-Agent': this.userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    };
  }
}

module.exports = new FingerprintCloak();
module.exports.FingerprintCloak = FingerprintCloak;
