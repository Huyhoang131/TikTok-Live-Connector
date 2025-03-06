"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const Config = require('./webcastConfig.js');
const websocket = require('websocket');
const {
  deserializeWebsocketMessage,
  serializeMessage
} = require('./webcastProtobuf.js');
var _WebcastWebsocket_brand = /*#__PURE__*/new WeakSet();
class WebcastWebsocket extends websocket.client {
  constructor(wsUrl, cookieJar, clientParams, wsParams, customHeaders = {}, websocketOptions) {
    super();
    _classPrivateMethodInitSpec(this, _WebcastWebsocket_brand);
    this.connection = null;
    this.pingInterval = null;
    this.wsParams = {
      ...clientParams,
      ...wsParams
    };
    this.wsUrlWithParams = `${wsUrl}?${new URLSearchParams(this.wsParams)}&version_code=${Config.WEBCAST_VERSION_CODE}`;
    this.wsHeaders = {
      Cookie: cookieJar.getCookieString(),
      ...customHeaders
    };
    _assertClassBrand(_WebcastWebsocket_brand, this, _setupWebSocket).call(this);
    this.connect(this.wsUrlWithParams, '', Config.TIKTOK_URL_WEB, this.wsHeaders, websocketOptions);
  }
}
function _setupWebSocket() {
  this.on('connect', wsConnection => _assertClassBrand(_WebcastWebsocket_brand, this, _initializeConnection).call(this, wsConnection));
  this.on('connectFailed', error => this.emit('connectionFailed', error));
}
function _initializeConnection(wsConnection) {
  this.connection = wsConnection;
  this.pingInterval = setInterval(() => _assertClassBrand(_WebcastWebsocket_brand, this, _sendPing).call(this), 10000);
  wsConnection.on('message', message => {
    if (message.type === 'binary') {
      _assertClassBrand(_WebcastWebsocket_brand, this, _handleMessage).call(this, message);
    }
  });
  wsConnection.on('close', () => {
    clearInterval(this.pingInterval);
    this.connection = null;
  });
  wsConnection.on('error', error => {
    this.emit('connectionError', error);
  });
}
async function _handleMessage(message) {
  try {
    const decodedContainer = await deserializeWebsocketMessage(message.binaryData);
    if (decodedContainer.id > 0) {
      _assertClassBrand(_WebcastWebsocket_brand, this, _sendAck).call(this, decodedContainer.id);
    }
    if (typeof decodedContainer.webcastResponse === 'object') {
      this.emit('webcastResponse', decodedContainer.webcastResponse);
    }
  } catch (err) {
    this.emit('messageDecodingFailed', err);
  }
}
function _sendPing() {
  if (this.connection) {
    this.connection.sendBytes(Buffer.from('3A026862', 'hex'));
  }
}
function _sendAck(id) {
  if (this.connection) {
    const ackMsg = serializeMessage('WebcastWebsocketAck', {
      type: 'ack',
      id
    });
    this.connection.sendBytes(ackMsg);
  }
}
module.exports = WebcastWebsocket;