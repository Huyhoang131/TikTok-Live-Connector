const axios = require('axios');
const TikTokCookieJar = require('./tiktokCookieJar');
const { deserializeMessage } = require('./webcastProtobuf.js');
const { signWebcastRequest } = require('./tiktokSignatureProvider');
const Config = require('./webcastConfig.js');

class TikTokHttpClient {
    constructor(customHeaders = {}, axiosOptions = {}, signProviderOptions = {}, sessionId) {
        const { Cookie } = customHeaders;

        if (Cookie) delete customHeaders['Cookie'];

        this.axiosInstance = axios.create({
            timeout: 10000,
            headers: Object.assign({}, Config.DEFAULT_REQUEST_HEADERS, customHeaders),
            ...axiosOptions,
        });

        this.cookieJar = new TikTokCookieJar(this.axiosInstance);

        if (Cookie) {
            Cookie.split('; ').forEach(this.cookieJar.processSetCookieHeader.bind(this.cookieJar));
        }

        this.signProviderOptions = signProviderOptions;
        if (sessionId) this.setSessionId(sessionId);
    }

    setSessionId(sessionId) {
        ['sessionid', 'sessionid_ss', 'sid_tt'].forEach((key) => this.cookieJar.setCookie(key, sessionId));
    }

    async #buildSignedUrl(host, path, params, shouldSign) {
        let fullUrl = `${host}${path}?${new URLSearchParams(params || {})}`;

        return shouldSign
            ? await signWebcastRequest(fullUrl, this.axiosInstance.defaults.headers, this.cookieJar, this.signProviderOptions)
            : fullUrl;
    }

    async #fetchGet(url, responseType = 'json') {
        try {
            const response = await this.axiosInstance.get(url, { responseType });
            return response.data;
        } catch (error) {
            throw new Error(`GET Request Failed: ${error.message} | URL: ${url}`);
        }
    }

    async #fetchPost(url, params, data, responseType = 'json') {
        try {
            const response = await this.axiosInstance.post(url, data, { params, responseType });
            return response.data;
        } catch (error) {
            throw new Error(`POST Request Failed: ${error.message} | URL: ${url}`);
        }
    }

    async getMainPage(path) {
        return this.#fetchGet(`${Config.TIKTOK_URL_WEB}${path}`);
    }

    async getDeserializedObjectFromWebcastApi(path, params, schemaName, shouldSign) {
        const url = await this.#buildSignedUrl(Config.TIKTOK_URL_WEBCAST, path, params, shouldSign);
        const bufferData = await this.#fetchGet(url, 'arraybuffer');
        return deserializeMessage(schemaName, bufferData);
    }

    async getJsonObjectFromWebcastApi(path, params, shouldSign) {
        const url = await this.#buildSignedUrl(Config.TIKTOK_URL_WEBCAST, path, params, shouldSign);
        return this.#fetchGet(url);
    }

    async postFormDataToWebcastApi(path, params, formData) {
        return this.#fetchPost(`${Config.TIKTOK_URL_WEBCAST}${path}`, params, formData);
    }

    async getJsonObjectFromTiktokApi(path, params, shouldSign) {
        const url = await this.#buildSignedUrl(Config.TIKTOK_URL_WEB, path, params, shouldSign);
        return this.#fetchGet(url);
    }
}

module.exports = TikTokHttpClient;