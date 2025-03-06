"use strict";

/**
 * Custom cookie jar for axios
 * Because axios-cookiejar-support does not work as expected when using proxy agents
 * https://github.com/zerodytrash/TikTok-Livestream-Chat-Connector/issues/18
 */

class TikTokCookieJar {
  constructor(axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.cookies = {};

    // Intercept responses to store cookies
    this.axiosInstance.interceptors.response.use(response => {
      this.readCookies(response);
      return response;
    });

    // Intercept requests to append cookies
    this.axiosInstance.interceptors.request.use(request => {
      this.appendCookies(request);
      return request;
    });
  }
  readCookies(response) {
    var _response$headers;
    const setCookieHeaders = (_response$headers = response.headers) === null || _response$headers === void 0 ? void 0 : _response$headers['set-cookie'];
    if (Array.isArray(setCookieHeaders)) {
      setCookieHeaders.forEach(this.processSetCookieHeader.bind(this));
    } else if (typeof setCookieHeaders === 'string') {
      this.processSetCookieHeader(setCookieHeaders);
    }
  }
  appendCookies(request) {
    const existingCookies = request.headers['cookie'] || request.headers['Cookie'];
    if (existingCookies) {
      Object.assign(this.cookies, this.parseCookies(existingCookies));
    }
    request.headers['Cookie'] = this.getCookieString();
  }

  /**
   * Parses a cookie string into an object.
   * @param {string} cookieStr The cookie string.
   * @returns {Object} Parsed cookies as an object.
   */
  parseCookies(cookieStr) {
    return cookieStr.split('; ').reduce((acc, cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      if (name) acc[decodeURIComponent(name)] = valueParts.join('=');
      return acc;
    }, {});
  }
  processSetCookieHeader(setCookieHeader) {
    const [cookiePart] = setCookieHeader.split(';');
    const [name, ...valueParts] = cookiePart.split('=');
    if (name) {
      this.cookies[decodeURIComponent(name)] = valueParts.join('=');
    }
  }
  getCookieByName(name) {
    return this.cookies[name];
  }
  getCookieString() {
    return Object.entries(this.cookies).map(([name, value]) => `${encodeURIComponent(name)}=${value}`).join('; ');
  }
  setCookie(name, value) {
    this.cookies[name] = value;
  }
}
module.exports = TikTokCookieJar;