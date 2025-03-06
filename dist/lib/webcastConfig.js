"use strict";

const REFERER_URL = 'https://www.tiktok.com/';
module.exports = Object.freeze({
  // Base URLs
  TIKTOK_URL_WEB: REFERER_URL,
  TIKTOK_URL_WEBCAST: 'https://webcast.tiktok.com/webcast/',
  TIKTOK_HTTP_ORIGIN: REFERER_URL,
  // Default Client Parameters
  DEFAULT_CLIENT_PARAMS: {
    aid: 1988,
    app_language: 'en-US',
    app_name: 'tiktok_web',
    browser_language: 'en',
    browser_name: 'Mozilla',
    browser_online: true,
    browser_platform: 'Win32',
    browser_version: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    cookie_enabled: true,
    cursor: '',
    internal_ext: '',
    device_platform: 'web',
    focus_state: true,
    from_page: 'user',
    history_len: 0,
    is_fullscreen: false,
    is_page_visible: true,
    did_rule: 3,
    fetch_rule: 1,
    last_rtt: 0,
    live_id: 12,
    resp_content_type: 'protobuf',
    screen_height: 1152,
    screen_width: 2048,
    tz_name: 'Europe/Berlin',
    referer: REFERER_URL,
    root_referer: REFERER_URL,
    host: 'https://webcast.tiktok.com',
    webcast_sdk_version: '1.3.0',
    update_version_code: '1.3.0'
  },
  // Default Request Headers
  DEFAULT_REQUEST_HEADERS: {
    Connection: 'keep-alive',
    'Cache-Control': 'max-age=0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/json,application/protobuf',
    Referer: REFERER_URL,
    Origin: REFERER_URL,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate'
  },
  // Webcast Version Code
  WEBCAST_VERSION_CODE: '180800'
});