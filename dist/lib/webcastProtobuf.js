"use strict";

const protobufjs = require('protobufjs');
const util = require('node:util');
const zlib = require('node:zlib');
const unzip = util.promisify(zlib.unzip);
const tiktokSchemaPath = require.resolve('../proto/tiktokSchema.proto');
let tiktokSchema = null;
const config = {
  skipMessageTypes: new Set()
};

// Load & cache schema only once
function loadTikTokSchema() {
  if (!tiktokSchema) {
    tiktokSchema = protobufjs.loadSync(tiktokSchemaPath);
  }
}

// Serialize an object to protobuf binary format
function serializeMessage(protoName, obj) {
  loadTikTokSchema();
  return tiktokSchema.lookupType(`TikTok.${protoName}`).encode(obj).finish();
}

// Deserialize a binary protobuf message
function deserializeMessage(protoName, binaryMessage) {
  loadTikTokSchema();
  const webcastData = tiktokSchema.lookupType(`TikTok.${protoName}`).decode(binaryMessage);
  if (protoName === 'WebcastResponse' && Array.isArray(webcastData.messages)) {
    webcastData.messages.forEach(message => {
      if (config.skipMessageTypes.has(message.type)) return;
      const schemaType = tiktokSchema.lookupType(`TikTok.${message.type}`);
      if (schemaType) {
        try {
          message.decodedData = schemaType.decode(message.binary);
        } catch (error) {
          console.warn(`Failed to decode message type: ${message.type}`, error);
        }
      }
    });
  }
  return webcastData;
}

// Detect and decompress gzip compressed messages
async function decompressIfGzipped(binary) {
  return (binary === null || binary === void 0 ? void 0 : binary.length) > 2 && binary[0] === 0x1f && binary[1] === 0x8b ? await unzip(binary) : binary;
}

// Deserialize a websocket message, handling gzip compression if needed
async function deserializeWebsocketMessage(binaryMessage) {
  const decodedWebsocketMessage = deserializeMessage('WebcastWebsocketMessage', binaryMessage);
  if (decodedWebsocketMessage.type === 'msg') {
    decodedWebsocketMessage.binary = await decompressIfGzipped(decodedWebsocketMessage.binary);
    decodedWebsocketMessage.webcastResponse = deserializeMessage('WebcastResponse', decodedWebsocketMessage.binary);
  }
  return decodedWebsocketMessage;
}
module.exports = {
  serializeMessage,
  deserializeMessage,
  deserializeWebsocketMessage,
  config
};