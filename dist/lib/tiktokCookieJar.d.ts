export = TikTokCookieJar;
/**
 * Custom cookie jar for axios
 * Because axios-cookiejar-support does not work as expected when using proxy agents
 * https://github.com/zerodytrash/TikTok-Livestream-Chat-Connector/issues/18
 */
declare class TikTokCookieJar {
    constructor(axiosInstance: any);
    axiosInstance: any;
    cookies: {};
    readCookies(response: any): void;
    appendCookies(request: any): void;
    /**
     * Parses a cookie string into an object.
     * @param {string} cookieStr The cookie string.
     * @returns {Object} Parsed cookies as an object.
     */
    parseCookies(cookieStr: string): any;
    processSetCookieHeader(setCookieHeader: any): void;
    getCookieByName(name: any): any;
    getCookieString(): string;
    setCookie(name: any, value: any): void;
}
//# sourceMappingURL=tiktokCookieJar.d.ts.map