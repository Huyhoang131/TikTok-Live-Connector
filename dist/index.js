"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const {
  EventEmitter
} = require('node:events');
const TikTokHttpClient = require('./lib/tiktokHttpClient.js');
const WebcastWebsocket = require('./lib/webcastWebsocket.js');
const {
  getRoomIdFromMainPageHtml,
  validateAndNormalizeUniqueId,
  addUniqueId,
  removeUniqueId
} = require('./lib/tiktokUtils.js');
const {
  simplifyObject
} = require('./lib/webcastDataConverter.js');
const {
  deserializeMessage,
  deserializeWebsocketMessage
} = require('./lib/webcastProtobuf.js');
const Config = require('./lib/webcastConfig.js');
const {
  AlreadyConnectingError,
  AlreadyConnectedError,
  UserOfflineError,
  NoWSUpgradeError,
  InvalidSessionIdError,
  InvalidResponseError,
  ExtractRoomIdError,
  InitialFetchError
} = require('./lib/tiktokErrors');
const ControlEvents = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RAWDATA: 'rawData',
  DECODEDDATA: 'decodedData',
  STREAMEND: 'streamEnd',
  WSCONNECTED: 'websocketConnected'
};
const MessageEvents = {
  CHAT: 'chat',
  MEMBER: 'member',
  GIFT: 'gift',
  ROOMUSER: 'roomUser',
  SOCIAL: 'social',
  LIKE: 'like',
  QUESTIONNEW: 'questionNew',
  LINKMICBATTLE: 'linkMicBattle',
  LINKMICARMIES: 'linkMicArmies',
  LIVEINTRO: 'liveIntro',
  EMOTE: 'emote',
  ENVELOPE: 'envelope',
  SUBSCRIBE: 'subscribe'
};
var _options = /*#__PURE__*/new WeakMap();
var _uniqueStreamerId = /*#__PURE__*/new WeakMap();
var _roomId = /*#__PURE__*/new WeakMap();
var _roomInfo = /*#__PURE__*/new WeakMap();
var _clientParams = /*#__PURE__*/new WeakMap();
var _httpClient = /*#__PURE__*/new WeakMap();
var _availableGifts = /*#__PURE__*/new WeakMap();
var _websocket = /*#__PURE__*/new WeakMap();
var _isConnecting = /*#__PURE__*/new WeakMap();
var _isConnected = /*#__PURE__*/new WeakMap();
var _isPollingEnabled = /*#__PURE__*/new WeakMap();
var _isWsUpgradeDone = /*#__PURE__*/new WeakMap();
var _WebcastPushConnection_brand = /*#__PURE__*/new WeakSet();
class WebcastPushConnection extends EventEmitter {
  constructor(uniqueId, options = {}) {
    super();
    _classPrivateMethodInitSpec(this, _WebcastPushConnection_brand);
    _classPrivateFieldInitSpec(this, _options, void 0);
    _classPrivateFieldInitSpec(this, _uniqueStreamerId, void 0);
    _classPrivateFieldInitSpec(this, _roomId, void 0);
    _classPrivateFieldInitSpec(this, _roomInfo, void 0);
    _classPrivateFieldInitSpec(this, _clientParams, void 0);
    _classPrivateFieldInitSpec(this, _httpClient, void 0);
    _classPrivateFieldInitSpec(this, _availableGifts, void 0);
    _classPrivateFieldInitSpec(this, _websocket, void 0);
    _classPrivateFieldInitSpec(this, _isConnecting, false);
    _classPrivateFieldInitSpec(this, _isConnected, false);
    _classPrivateFieldInitSpec(this, _isPollingEnabled, false);
    _classPrivateFieldInitSpec(this, _isWsUpgradeDone, false);
    _assertClassBrand(_WebcastPushConnection_brand, this, _setOptions).call(this, options);
    _classPrivateFieldSet(_uniqueStreamerId, this, validateAndNormalizeUniqueId(uniqueId));
    _classPrivateFieldSet(_httpClient, this, new TikTokHttpClient(_classPrivateFieldGet(_options, this).requestHeaders, _classPrivateFieldGet(_options, this).requestOptions, _classPrivateFieldGet(_options, this).signProviderOptions, _classPrivateFieldGet(_options, this).sessionId));
    _classPrivateFieldSet(_clientParams, this, {
      ...Config.DEFAULT_CLIENT_PARAMS,
      ..._classPrivateFieldGet(_options, this).clientParams
    });
    _assertClassBrand(_WebcastPushConnection_brand, this, _setUnconnected).call(this);
  }
  async connect(roomId = null) {
    if (_classPrivateFieldGet(_isConnecting, this)) throw new AlreadyConnectingError('Already connecting!');
    if (_classPrivateFieldGet(_isConnected, this)) throw new AlreadyConnectedError('Already connected!');
    _classPrivateFieldSet(_isConnecting, this, true);
    addUniqueId(_classPrivateFieldGet(_uniqueStreamerId, this));
    try {
      var _classPrivateFieldGet2;
      if (roomId) {
        _classPrivateFieldSet(_roomId, this, roomId);
        _classPrivateFieldGet(_clientParams, this).room_id = roomId;
      } else {
        await this.retrieveRoomId();
      }
      if (_classPrivateFieldGet(_options, this).fetchRoomInfoOnConnect) await this.fetchRoomInfo();
      if (((_classPrivateFieldGet2 = _classPrivateFieldGet(_roomInfo, this)) === null || _classPrivateFieldGet2 === void 0 ? void 0 : _classPrivateFieldGet2.status) === 4) throw new UserOfflineError('LIVE has ended');
      if (_classPrivateFieldGet(_options, this).enableExtendedGiftInfo) await this.fetchAvailableGifts();
      await this.fetchRoomData(true);
      if (!_classPrivateFieldGet(_isWsUpgradeDone, this)) {
        if (!_classPrivateFieldGet(_options, this).enableRequestPolling) {
          throw new NoWSUpgradeError('TikTok does not offer a WebSocket upgrade and request polling is disabled.');
        }
        if (!_classPrivateFieldGet(_options, this).sessionId) {
          throw new NoWSUpgradeError('TikTok does not offer a WebSocket upgrade. Please provide a valid `sessionId`.');
        }
        this.startFetchRoomPolling();
      }
      _classPrivateFieldSet(_isConnected, this, true);
      this.emit(ControlEvents.CONNECTED, this.getState());
      return this.getState();
    } catch (err) {
      _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Error while connecting');
      removeUniqueId(_classPrivateFieldGet(_uniqueStreamerId, this));
      throw err;
    } finally {
      _classPrivateFieldSet(_isConnecting, this, false);
    }
  }
  disconnect() {
    if (_classPrivateFieldGet(_isConnected, this)) {
      var _classPrivateFieldGet3;
      if (_classPrivateFieldGet(_isWsUpgradeDone, this) && (_classPrivateFieldGet3 = _classPrivateFieldGet(_websocket, this)) !== null && _classPrivateFieldGet3 !== void 0 && (_classPrivateFieldGet3 = _classPrivateFieldGet3.connection) !== null && _classPrivateFieldGet3 !== void 0 && _classPrivateFieldGet3.connected) {
        _classPrivateFieldGet(_websocket, this).connection.close();
      }
      _assertClassBrand(_WebcastPushConnection_brand, this, _setUnconnected).call(this);
      removeUniqueId(_classPrivateFieldGet(_uniqueStreamerId, this));
      this.emit(ControlEvents.DISCONNECTED);
    }
  }
  async getRoomInfo() {
    if (!_classPrivateFieldGet(_isConnected, this)) await this.retrieveRoomId();
    await this.fetchRoomInfo();
    return _classPrivateFieldGet(_roomInfo, this);
  }
  async sendMessage(text, sessionId) {
    if (sessionId) _classPrivateFieldGet(_options, this).sessionId = sessionId;
    if (!_classPrivateFieldGet(_options, this).sessionId) throw new InvalidSessionIdError('Missing SessionId. Please provide your current SessionId.');
    _classPrivateFieldGet(_httpClient, this).setSessionId(_classPrivateFieldGet(_options, this).sessionId);
    const requestParams = {
      ..._classPrivateFieldGet(_clientParams, this),
      content: text
    };
    const response = await _classPrivateFieldGet(_httpClient, this).postFormDataToWebcastApi('room/chat/', requestParams, null);
    if ((response === null || response === void 0 ? void 0 : response.status_code) === 0) return response.data;
    throw new InvalidResponseError(`Failed to send chat message. Status: ${response === null || response === void 0 ? void 0 : response.status_code}`, response);
  }
}
function _setOptions(providedOptions) {
  _classPrivateFieldSet(_options, this, Object.assign({
    processInitialData: true,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: false,
    enableWebsocketUpgrade: true,
    enableRequestPolling: true,
    requestPollingIntervalMs: 1000,
    sessionId: null,
    clientParams: {},
    requestHeaders: {},
    websocketHeaders: Config.DEFAULT_REQUEST_HEADERS,
    requestOptions: {},
    websocketOptions: {},
    signProviderOptions: {}
  }, providedOptions));
}
function _setUnconnected() {
  _classPrivateFieldSet(_roomInfo, this, null);
  _classPrivateFieldSet(_isConnecting, this, false);
  _classPrivateFieldSet(_isConnected, this, false);
  _classPrivateFieldSet(_isPollingEnabled, this, false);
  _classPrivateFieldSet(_isWsUpgradeDone, this, false);
  _classPrivateFieldGet(_clientParams, this).cursor = '';
  _classPrivateFieldGet(_clientParams, this).internal_ext = '';
}
function _handleError(exception, info) {
  if (this.listenerCount(ControlEvents.ERROR) > 0) {
    this.emit(ControlEvents.ERROR, {
      info,
      exception
    });
  }
}
module.exports = {
  WebcastPushConnection,
  signatureProvider: require('./lib/tiktokSignatureProvider'),
  webcastProtobuf: require('./lib/webcastProtobuf.js')
};