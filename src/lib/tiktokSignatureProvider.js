const { EventEmitter } = require('node:events');
const { getUuc } = require('./tiktokUtils');
const pkg = require('../../package.json');
const { SignatureError } = require('./tiktokErrors');
const axios = require('axios').create({
    timeout: 5000,
    headers: {
        'User-Agent': `${pkg.name}/${pkg.version} ${process.platform}`,
    },
});

const config = {
    enabled: true,
    signProviderHost: 'https://tiktok.eulerstream.com/',
    signProviderFallbackHosts: ['https://tiktok-sign.zerody.one/'],
    extraParams: {},
};

const signEvents = new EventEmitter();

async function signWebcastRequest(url, headers, cookieJar, signProviderOptions) {
    return signRequest('webcast/sign_url', url, headers, cookieJar, signProviderOptions);
}

async function signRequest(providerPath, url, headers, cookieJar, signProviderOptions) {
    if (!config.enabled) return url;

    const params = {
        url,
        client: 'ttlive-node',
        ...config.extraParams,
        ...signProviderOptions?.params,
        uuc: getUuc(),
    };

    let hostsToTry = [config.signProviderHost, ...config.signProviderFallbackHosts];
    
    // Prioritize custom host if provided, avoiding duplicates
    if (signProviderOptions?.host) {
        hostsToTry = [signProviderOptions.host, ...hostsToTry.filter((host) => host !== signProviderOptions.host)];
    }

    let signResponse;
    let lastError;

    for (const signHost of hostsToTry) {
        try {
            signResponse = await axios.get(`${signHost}${providerPath}`, {
                params,
                headers: signProviderOptions?.headers,
                responseType: 'json',
            });

            if (signResponse.status === 200 && typeof signResponse.data === 'object') {
                break;
            }
        } catch (err) {
            lastError = err;
        }
    }

    if (!signResponse) {
        throw new SignatureError(`Failed to sign request: ${lastError?.message || 'Unknown Error'}; URL: ${url}`, lastError);
    }

    const { signedUrl, 'User-Agent': newUserAgent, msToken } = signResponse.data ?? {};

    if (!signedUrl) throw new SignatureError('Missing signedUrl property');

    if (headers && newUserAgent) headers['User-Agent'] = newUserAgent;
    if (cookieJar && msToken) cookieJar.setCookie('msToken', msToken);

    signEvents.emit('signSuccess', { originalUrl: url, signedUrl, headers, cookieJar });

    return signedUrl;
}

module.exports = {
    config,
    signEvents,
    signWebcastRequest,
};