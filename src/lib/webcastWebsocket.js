const Config = require('./webcastConfig.js');
const websocket = require('websocket');
const { deserializeWebsocketMessage, serializeMessage } = require('./webcastProtobuf.js');

class WebcastWebsocket extends websocket.client {
    constructor(wsUrl, cookieJar, clientParams, wsParams, customHeaders = {}, websocketOptions) {
        super();

        this.connection = null;
        this.pingInterval = null;
        this.wsParams = { ...clientParams, ...wsParams };
        this.wsUrlWithParams = `${wsUrl}?${new URLSearchParams(this.wsParams)}&version_code=${Config.WEBCAST_VERSION_CODE}`;
        this.wsHeaders = {
            Cookie: cookieJar.getCookieString(),
            ...customHeaders,
        };

        this.#setupWebSocket();
        this.connect(this.wsUrlWithParams, '', Config.TIKTOK_URL_WEB, this.wsHeaders, websocketOptions);
    }

    #setupWebSocket() {
        this.on('connect', (wsConnection) => this.#initializeConnection(wsConnection));
        this.on('connectFailed', (error) => this.emit('connectionFailed', error));
    }

    #initializeConnection(wsConnection) {
        this.connection = wsConnection;
        this.pingInterval = setInterval(() => this.#sendPing(), 10000);

        wsConnection.on('message', (message) => {
            if (message.type === 'binary') {
                this.#handleMessage(message);
            }
        });

        wsConnection.on('close', () => {
            clearInterval(this.pingInterval);
            this.connection = null;
        });

        wsConnection.on('error', (error) => {
            this.emit('connectionError', error);
        });
    }

    async #handleMessage(message) {
        try {
            const decodedContainer = await deserializeWebsocketMessage(message.binaryData);

            if (decodedContainer.id > 0) {
                this.#sendAck(decodedContainer.id);
            }

            if (typeof decodedContainer.webcastResponse === 'object') {
                this.emit('webcastResponse', decodedContainer.webcastResponse);
            }
        } catch (err) {
            this.emit('messageDecodingFailed', err);
        }
    }

    #sendPing() {
        if (this.connection) {
            this.connection.sendBytes(Buffer.from('3A026862', 'hex'));
        }
    }

    #sendAck(id) {
        if (this.connection) {
            const ackMsg = serializeMessage('WebcastWebsocketAck', { type: 'ack', id });
            this.connection.sendBytes(ackMsg);
        }
    }
}

module.exports = WebcastWebsocket;