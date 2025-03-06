export class WebcastPushConnection extends EventEmitter<[never]> {
    constructor(uniqueId: any, options?: {});
    connect(roomId?: any): Promise<any>;
    disconnect(): void;
    getRoomInfo(): Promise<any>;
    sendMessage(text: any, sessionId: any): Promise<any>;
    #private;
}
import { EventEmitter } from "events";
export declare const signatureProvider: typeof import("./lib/tiktokSignatureProvider");
export declare const webcastProtobuf: typeof import("./lib/webcastProtobuf.js");
//# sourceMappingURL=index.d.ts.map