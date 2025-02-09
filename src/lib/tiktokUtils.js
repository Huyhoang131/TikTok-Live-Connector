const { UserOfflineError, InvalidUniqueIdError } = require('./tiktokErrors');

let uu = [];
const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

function getRoomIdFromMainPageHtml(mainPageHtml) {
    let idx = 0;
    do {
        idx = mainPageHtml.indexOf('roomId', idx + 3);
        if (idx === -1) break;

        const excerpt = mainPageHtml.slice(idx, idx + 50);
        const matchExcerpt = excerpt.match(/roomId":"(\d+)"/);
        if (matchExcerpt) return matchExcerpt[1];
    } while (true);

    const matchMeta = mainPageHtml.match(/room_id=(\d+)/) || mainPageHtml.match(/"roomId":"(\d+)"/);
    if (matchMeta) return matchMeta[1];

    const validResponse = mainPageHtml.includes('"og:url"');
    throw new UserOfflineError(validResponse ? 'User might be offline.' : 'Your IP or country might be blocked by TikTok.');
}

function validateAndNormalizeUniqueId(uniqueId) {
    if (typeof uniqueId !== 'string' || !uniqueId.trim()) {
        throw new InvalidUniqueIdError("Missing or invalid value for 'uniqueId'. Please provide the username from TikTok URL.");
    }

    return uniqueId
        .replace(/^https:\/\/www\.tiktok\.com\//, '')
        .replace(/\/live$/, '')
        .replace(/^@/, '')
        .trim();
}

function addUniqueId(uniqueId) {
    const existingEntry = uu.find((x) => x.uniqueId === uniqueId);
    const timestamp = Date.now();

    if (existingEntry) {
        existingEntry.ts = timestamp;
    } else {
        uu.push({ uniqueId, ts: timestamp });
    }
}

function removeUniqueId(uniqueId) {
    uu = uu.filter((x) => x.uniqueId !== uniqueId);
}

function getUuc() {
    const now = Date.now();
    return uu.filter((x) => x.ts > now - EXPIRATION_TIME).length;
}

module.exports = {
    getRoomIdFromMainPageHtml,
    validateAndNormalizeUniqueId,
    getUuc,
    addUniqueId,
    removeUniqueId,
};
