export = WebcastWebsocket;
declare class WebcastWebsocket {
    constructor(wsUrl: any, cookieJar: any, clientParams: any, wsParams: any, customHeaders: {}, websocketOptions: any);
    connection: any;
    pingInterval: NodeJS.Timeout;
    wsParams: any;
    wsUrlWithParams: string;
    wsHeaders: {
        Cookie: any;
    };
    #private;
}
//# sourceMappingURL=webcastWebsocket.d.ts.map