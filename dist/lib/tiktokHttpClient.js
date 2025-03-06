"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const axios = require('axios');
const TikTokCookieJar = require('./tiktokCookieJar');
const {
  deserializeMessage
} = require('./webcastProtobuf.js');
const {
  signWebcastRequest
} = require('./tiktokSignatureProvider');
const Config = require('./webcastConfig.js');
var _TikTokHttpClient_brand = /*#__PURE__*/new WeakSet();
class TikTokHttpClient {
  constructor(customHeaders = {}, axiosOptions = {}, signProviderOptions = {}, sessionId) {
    _classPrivateMethodInitSpec(this, _TikTokHttpClient_brand);
    const {
      Cookie
    } = customHeaders;
    if (Cookie) delete customHeaders['Cookie'];
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: Object.assign({}, Config.DEFAULT_REQUEST_HEADERS, customHeaders),
      ...axiosOptions
    });
    this.cookieJar = new TikTokCookieJar(this.axiosInstance);
    if (Cookie) {
      Cookie.split('; ').forEach(this.cookieJar.processSetCookieHeader.bind(this.cookieJar));
    }
    this.signProviderOptions = signProviderOptions;
    if (sessionId) this.setSessionId(sessionId);
  }
  setSessionId(sessionId) {
    ['sessionid', 'sessionid_ss', 'sid_tt'].forEach(key => this.cookieJar.setCookie(key, sessionId));
  }
  async getMainPage(path) {
    return _assertClassBrand(_TikTokHttpClient_brand, this, _fetchGet).call(this, `${Config.TIKTOK_URL_WEB}${path}`);
  }
  async getDeserializedObjectFromWebcastApi(path, params, schemaName, shouldSign) {
    const url = await _assertClassBrand(_TikTokHttpClient_brand, this, _buildSignedUrl).call(this, Config.TIKTOK_URL_WEBCAST, path, params, shouldSign);
    const bufferData = await _assertClassBrand(_TikTokHttpClient_brand, this, _fetchGet).call(this, url, 'arraybuffer');
    return deserializeMessage(schemaName, bufferData);
  }
  async getJsonObjectFromWebcastApi(path, params, shouldSign) {
    const url = await _assertClassBrand(_TikTokHttpClient_brand, this, _buildSignedUrl).call(this, Config.TIKTOK_URL_WEBCAST, path, params, shouldSign);
    return _assertClassBrand(_TikTokHttpClient_brand, this, _fetchGet).call(this, url);
  }
  async postFormDataToWebcastApi(path, params, formData) {
    return _assertClassBrand(_TikTokHttpClient_brand, this, _fetchPost).call(this, `${Config.TIKTOK_URL_WEBCAST}${path}`, params, formData);
  }
  async getJsonObjectFromTiktokApi(path, params, shouldSign) {
    const url = await _assertClassBrand(_TikTokHttpClient_brand, this, _buildSignedUrl).call(this, Config.TIKTOK_URL_WEB, path, params, shouldSign);
    return _assertClassBrand(_TikTokHttpClient_brand, this, _fetchGet).call(this, url);
  }
}
async function _buildSignedUrl(host, path, params, shouldSign) {
  let fullUrl = `${host}${path}?${new URLSearchParams(params || {})}`;
  return shouldSign ? await signWebcastRequest(fullUrl, this.axiosInstance.defaults.headers, this.cookieJar, this.signProviderOptions) : fullUrl;
}
async function _fetchGet(url, responseType = 'json') {
  try {
    const response = await this.axiosInstance.get(url, {
      responseType
    });
    return response.data;
  } catch (error) {
    throw new Error(`GET Request Failed: ${error.message} | URL: ${url}`);
  }
}
async function _fetchPost(url, params, data, responseType = 'json') {
  try {
    const response = await this.axiosInstance.post(url, data, {
      params,
      responseType
    });
    return response.data;
  } catch (error) {
    throw new Error(`POST Request Failed: ${error.message} | URL: ${url}`);
  }
}
module.exports = TikTokHttpClient;