const { EventEmitter } = require('node:events');
const TikTokHttpClient = require('./lib/tiktokHttpClient.js');
const WebcastWebsocket = require('./lib/webcastWebsocket.js');
const { getRoomIdFromMainPageHtml, validateAndNormalizeUniqueId, addUniqueId, removeUniqueId } = require('./lib/tiktokUtils.js');
const { simplifyObject } = require('./lib/webcastDataConverter.js');
const { deserializeMessage, deserializeWebsocketMessage } = require('./lib/webcastProtobuf.js');
const Config = require('./lib/webcastConfig.js');
const {
    AlreadyConnectingError,
    AlreadyConnectedError,
    UserOfflineError,
    NoWSUpgradeError,
    InvalidSessionIdError,
    InvalidResponseError,
    ExtractRoomIdError,
    InitialFetchError,
} = require('./lib/tiktokErrors');

const ControlEvents = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    RAWDATA: 'rawData',
    DECODEDDATA: 'decodedData',
    STREAMEND: 'streamEnd',
    WSCONNECTED: 'websocketConnected',
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
    SUBSCRIBE: 'subscribe',
};

class WebcastPushConnection extends EventEmitter {
    #options;
    #uniqueStreamerId;
    #roomId;
    #roomInfo;
    #clientParams;
    #httpClient;
    #availableGifts;
    #websocket;
    #isConnecting = false;
    #isConnected = false;
    #isPollingEnabled = false;
    #isWsUpgradeDone = false;

    constructor(uniqueId, options = {}) {
        super();
        this.#setOptions(options);
        this.#uniqueStreamerId = validateAndNormalizeUniqueId(uniqueId);
        this.#httpClient = new TikTokHttpClient(
            this.#options.requestHeaders,
            this.#options.requestOptions,
            this.#options.signProviderOptions,
            this.#options.sessionId
        );
        this.#clientParams = { ...Config.DEFAULT_CLIENT_PARAMS, ...this.#options.clientParams };
        this.#setUnconnected();
    }

    #setOptions(providedOptions) {
        this.#options = Object.assign(
            {
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
                signProviderOptions: {},
            },
            providedOptions
        );
    }

    #setUnconnected() {
        this.#roomInfo = null;
        this.#isConnecting = false;
        this.#isConnected = false;
        this.#isPollingEnabled = false;
        this.#isWsUpgradeDone = false;
        this.#clientParams.cursor = '';
        this.#clientParams.internal_ext = '';
    }

    async connect(roomId = null) {
        if (this.#isConnecting) throw new AlreadyConnectingError('Already connecting!');
        if (this.#isConnected) throw new AlreadyConnectedError('Already connected!');

        this.#isConnecting = true;
        addUniqueId(this.#uniqueStreamerId);

        try {
            if (roomId) {
                this.#roomId = roomId;
                this.#clientParams.room_id = roomId;
            } else {
                await this.#retrieveRoomId();
            }

            if (this.#options.fetchRoomInfoOnConnect) await this.#fetchRoomInfo();
            if (this.#roomInfo?.status === 4) throw new UserOfflineError('LIVE has ended');
            if (this.#options.enableExtendedGiftInfo) await this.#fetchAvailableGifts();
            await this.#fetchRoomData(true);

            if (!this.#isWsUpgradeDone) {
                if (!this.#options.enableRequestPolling) {
                    throw new NoWSUpgradeError('TikTok does not offer a WebSocket upgrade and request polling is disabled.');
                }
                if (!this.#options.sessionId) {
                    throw new NoWSUpgradeError('TikTok does not offer a WebSocket upgrade. Please provide a valid `sessionId`.');
                }
                this.#startFetchRoomPolling();
            }

            this.#isConnected = true;
            this.emit(ControlEvents.CONNECTED, this.getState());
            return this.getState();
        } catch (err) {
            this.#handleError(err, 'Error while connecting');
            removeUniqueId(this.#uniqueStreamerId);
            throw err;
        } finally {
            this.#isConnecting = false;
        }
    }

    disconnect() {
        if (this.#isConnected) {
            if (this.#isWsUpgradeDone && this.#websocket?.connection?.connected) {
                this.#websocket.connection.close();
            }
            this.#setUnconnected();
            removeUniqueId(this.#uniqueStreamerId);
            this.emit(ControlEvents.DISCONNECTED);
        }
    }

    async getRoomInfo() {
        if (!this.#isConnected) await this.#retrieveRoomId();
        await this.#fetchRoomInfo();
        return this.#roomInfo;
    }

    async sendMessage(text, sessionId) {
        if (sessionId) this.#options.sessionId = sessionId;
        if (!this.#options.sessionId) throw new InvalidSessionIdError('Missing SessionId. Please provide your current SessionId.');
        this.#httpClient.setSessionId(this.#options.sessionId);

        const requestParams = { ...this.#clientParams, content: text };
        const response = await this.#httpClient.postFormDataToWebcastApi('room/chat/', requestParams, null);

        if (response?.status_code === 0) return response.data;
        throw new InvalidResponseError(`Failed to send chat message. Status: ${response?.status_code}`, response);
    }

    #handleError(exception, info) {
        if (this.listenerCount(ControlEvents.ERROR) > 0) {
            this.emit(ControlEvents.ERROR, { info, exception });
        }
    }
}

module.exports = {
    WebcastPushConnection,
    signatureProvider: require('./lib/tiktokSignatureProvider'),
    webcastProtobuf: require('./lib/webcastProtobuf.js'),
};