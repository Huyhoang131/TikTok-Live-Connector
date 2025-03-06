"use strict";

class ConnectError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
class InvalidUniqueIdError extends Error {}
class InvalidSessionIdError extends Error {}
class ExtractRoomIdError extends Error {}
class InvalidResponseError extends Error {
  constructor(message, requestErr = undefined) {
    super(message);
    this.name = 'InvalidResponseError';
    this.requestErr = requestErr;
  }
}
class SignatureError extends InvalidResponseError {}
class InitialFetchError extends ConnectError {
  constructor(message, retryAfter) {
    super(message);
    this.retryAfter = retryAfter;
  }
}
class AlreadyConnectingError extends ConnectError {}
class AlreadyConnectedError extends ConnectError {}
class UserOfflineError extends ConnectError {}
class NoWSUpgradeError extends ConnectError {}

// Export errors in a cleaner way
module.exports = {
  ConnectError,
  InvalidUniqueIdError,
  InvalidSessionIdError,
  ExtractRoomIdError,
  InvalidResponseError,
  SignatureError,
  InitialFetchError,
  AlreadyConnectingError,
  AlreadyConnectedError,
  UserOfflineError,
  NoWSUpgradeError
};