export class ConnectError extends Error {
    constructor(message: any);
}
export class InvalidUniqueIdError extends Error {
}
export class InvalidSessionIdError extends Error {
}
export class ExtractRoomIdError extends Error {
}
export class InvalidResponseError extends Error {
    constructor(message: any, requestErr?: any);
    requestErr: any;
}
export class SignatureError extends InvalidResponseError {
}
export class InitialFetchError extends ConnectError {
    constructor(message: any, retryAfter: any);
    retryAfter: any;
}
export class AlreadyConnectingError extends ConnectError {
}
export class AlreadyConnectedError extends ConnectError {
}
export class UserOfflineError extends ConnectError {
}
export class NoWSUpgradeError extends ConnectError {
}
//# sourceMappingURL=tiktokErrors.d.ts.map