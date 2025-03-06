"use strict";

/**
 * Flattens nested protobuf objects and converts attributes in "Long" format to strings.
 * This makes the data easier to handle and serialize.
 */
function simplifyObject(webcastObject) {
  const transformations = [{
    key: 'questionDetails'
  }, {
    key: 'user',
    transform: getUserAttributes
  }, {
    key: 'event',
    transform: getEventAttributes
  }, {
    key: 'eventDetails'
  }, {
    key: 'topViewers',
    transform: getTopViewerAttributes
  }];
  transformations.forEach(({
    key,
    transform
  }) => {
    if (webcastObject[key]) {
      Object.assign(webcastObject, transform ? transform(webcastObject[key]) : webcastObject[key]);
      delete webcastObject[key];
    }
  });
  if (webcastObject.battleUsers) {
    webcastObject.battleUsers = webcastObject.battleUsers.map(user => {
      var _user$battleGroup;
      return user === null || user === void 0 || (_user$battleGroup = user.battleGroup) === null || _user$battleGroup === void 0 ? void 0 : _user$battleGroup.user;
    }).filter(Boolean).map(getUserAttributes);
  }
  if (webcastObject.battleItems) {
    webcastObject.battleArmies = webcastObject.battleItems.flatMap(({
      battleGroups,
      hostUserId
    }) => battleGroups.map(({
      points,
      users
    }) => ({
      hostUserId: hostUserId.toString(),
      points: parseInt(points),
      participants: users.map(getUserAttributes)
    })));
    delete webcastObject.battleItems;
  }
  if (webcastObject.giftId) {
    var _webcastObject$giftDe;
    webcastObject.repeatEnd = !!webcastObject.repeatEnd;
    webcastObject.gift = {
      gift_id: webcastObject.giftId,
      repeat_count: webcastObject.repeatCount,
      repeat_end: webcastObject.repeatEnd ? 1 : 0,
      gift_type: (_webcastObject$giftDe = webcastObject.giftDetails) === null || _webcastObject$giftDe === void 0 ? void 0 : _webcastObject$giftDe.giftType
    };
    ['giftDetails', 'giftImage', 'giftExtra'].forEach(key => {
      if (webcastObject[key]) {
        Object.assign(webcastObject, webcastObject[key]);
        delete webcastObject[key];
      }
    });
    ['receiverUserId', 'groupId'].forEach(key => {
      if (webcastObject[key]) webcastObject[key] = webcastObject[key].toString();
    });
    if (webcastObject.timestamp) webcastObject.timestamp = parseInt(webcastObject.timestamp);
    if (typeof webcastObject.monitorExtra === 'string' && webcastObject.monitorExtra.startsWith('{')) {
      try {
        webcastObject.monitorExtra = JSON.parse(webcastObject.monitorExtra);
      } catch (_) {}
    }
  }
  if (webcastObject.emote) {
    var _webcastObject$emote, _webcastObject$emote2;
    webcastObject.emoteId = (_webcastObject$emote = webcastObject.emote) === null || _webcastObject$emote === void 0 ? void 0 : _webcastObject$emote.emoteId;
    webcastObject.emoteImageUrl = (_webcastObject$emote2 = webcastObject.emote) === null || _webcastObject$emote2 === void 0 || (_webcastObject$emote2 = _webcastObject$emote2.image) === null || _webcastObject$emote2 === void 0 ? void 0 : _webcastObject$emote2.imageUrl;
    delete webcastObject.emote;
  }
  if (Array.isArray(webcastObject.emotes)) {
    webcastObject.emotes = webcastObject.emotes.map(({
      emote,
      placeInComment
    }) => {
      var _emote$image;
      return {
        emoteId: emote === null || emote === void 0 ? void 0 : emote.emoteId,
        emoteImageUrl: emote === null || emote === void 0 || (_emote$image = emote.image) === null || _emote$image === void 0 ? void 0 : _emote$image.imageUrl,
        placeInComment
      };
    });
  }
  if (webcastObject.treasureBoxUser) {
    var _webcastObject$treasu;
    Object.assign(webcastObject, getUserAttributes(((_webcastObject$treasu = webcastObject.treasureBoxUser) === null || _webcastObject$treasu === void 0 || (_webcastObject$treasu = _webcastObject$treasu.user2) === null || _webcastObject$treasu === void 0 || (_webcastObject$treasu = _webcastObject$treasu.user3) === null || _webcastObject$treasu === void 0 || (_webcastObject$treasu = _webcastObject$treasu[0]) === null || _webcastObject$treasu === void 0 || (_webcastObject$treasu = _webcastObject$treasu.user4) === null || _webcastObject$treasu === void 0 ? void 0 : _webcastObject$treasu.user) || {}));
    delete webcastObject.treasureBoxUser;
  }
  if (webcastObject.treasureBoxData) {
    Object.assign(webcastObject, webcastObject.treasureBoxData);
    delete webcastObject.treasureBoxData;
    if (webcastObject.timestamp) webcastObject.timestamp = parseInt(webcastObject.timestamp);
  }
  return {
    ...webcastObject
  };
}
function getUserAttributes(webcastUser) {
  var _webcastUser$userId, _webcastUser$secUid, _webcastUser$profileP, _webcastUser$followIn, _webcastUser$createTi, _webcastUser$profileP2, _badges$find$url$matc, _badges$find, _badges$find2, _badges$find3;
  if (!webcastUser) return {};
  const badges = mapBadges(webcastUser.badges);
  return {
    userId: (_webcastUser$userId = webcastUser.userId) === null || _webcastUser$userId === void 0 ? void 0 : _webcastUser$userId.toString(),
    secUid: (_webcastUser$secUid = webcastUser.secUid) === null || _webcastUser$secUid === void 0 ? void 0 : _webcastUser$secUid.toString(),
    uniqueId: webcastUser.uniqueId || undefined,
    nickname: webcastUser.nickname || undefined,
    profilePictureUrl: getPreferredPictureFormat((_webcastUser$profileP = webcastUser.profilePicture) === null || _webcastUser$profileP === void 0 ? void 0 : _webcastUser$profileP.urls),
    followRole: (_webcastUser$followIn = webcastUser.followInfo) === null || _webcastUser$followIn === void 0 ? void 0 : _webcastUser$followIn.followStatus,
    userBadges: badges,
    userSceneTypes: badges.map(x => x.badgeSceneType || 0),
    userDetails: {
      createTime: (_webcastUser$createTi = webcastUser.createTime) === null || _webcastUser$createTi === void 0 ? void 0 : _webcastUser$createTi.toString(),
      bioDescription: webcastUser.bioDescription,
      profilePictureUrls: (_webcastUser$profileP2 = webcastUser.profilePicture) === null || _webcastUser$profileP2 === void 0 ? void 0 : _webcastUser$profileP2.urls
    },
    followInfo: webcastUser.followInfo ? {
      followingCount: webcastUser.followInfo.followingCount,
      followerCount: webcastUser.followInfo.followerCount,
      followStatus: webcastUser.followInfo.followStatus,
      pushStatus: webcastUser.followInfo.pushStatus
    } : undefined,
    isModerator: badges.some(x => {
      var _x$type;
      return ((_x$type = x.type) === null || _x$type === void 0 ? void 0 : _x$type.toLowerCase().includes('moderator')) || x.badgeSceneType === 1;
    }),
    isNewGifter: badges.some(x => {
      var _x$type2;
      return (_x$type2 = x.type) === null || _x$type2 === void 0 ? void 0 : _x$type2.toLowerCase().includes('live_ng_');
    }),
    isSubscriber: badges.some(x => {
      var _x$url;
      return ((_x$url = x.url) === null || _x$url === void 0 ? void 0 : _x$url.includes('/sub_')) || [4, 7].includes(x.badgeSceneType);
    }),
    topGifterRank: (_badges$find$url$matc = (_badges$find = badges.find(x => {
      var _x$url2;
      return (_x$url2 = x.url) === null || _x$url2 === void 0 ? void 0 : _x$url2.includes('/ranklist_top_gifter_');
    })) === null || _badges$find === void 0 || (_badges$find = _badges$find.url.match(/ranklist_top_gifter_(\d+)\.png/)) === null || _badges$find === void 0 ? void 0 : _badges$find[1]) !== null && _badges$find$url$matc !== void 0 ? _badges$find$url$matc : null,
    gifterLevel: ((_badges$find2 = badges.find(x => x.badgeSceneType === 8)) === null || _badges$find2 === void 0 ? void 0 : _badges$find2.level) || 0,
    teamMemberLevel: ((_badges$find3 = badges.find(x => x.badgeSceneType === 10)) === null || _badges$find3 === void 0 ? void 0 : _badges$find3.level) || 0
  };
}
function getEventAttributes(event) {
  var _event$msgId, _event$createTime;
  if (!event) return {};
  return {
    msgId: (_event$msgId = event.msgId) === null || _event$msgId === void 0 ? void 0 : _event$msgId.toString(),
    createTime: (_event$createTime = event.createTime) === null || _event$createTime === void 0 ? void 0 : _event$createTime.toString(),
    ...event
  };
}
function getTopViewerAttributes(topViewers) {
  return topViewers.map(({
    user,
    coinCount
  }) => ({
    user: user ? getUserAttributes(user) : null,
    coinCount: coinCount ? parseInt(coinCount) : 0
  }));
}
function mapBadges(badges) {
  if (!Array.isArray(badges)) return [];
  return badges.flatMap(({
    badgeSceneType,
    badges = [],
    imageBadges = [],
    privilegeLogExtra
  }) => [...badges.map(badge => ({
    badgeSceneType,
    ...badge
  })), ...imageBadges.map(({
    image,
    displayType
  }) => image !== null && image !== void 0 && image.url ? {
    type: 'image',
    badgeSceneType,
    displayType,
    url: image.url
  } : null).filter(Boolean), ...(privilegeLogExtra !== null && privilegeLogExtra !== void 0 && privilegeLogExtra.level && privilegeLogExtra.level !== '0' ? [{
    type: 'privilege',
    privilegeId: privilegeLogExtra.privilegeId,
    level: parseInt(privilegeLogExtra.level),
    badgeSceneType
  }] : [])]);
}
function getPreferredPictureFormat(pictureUrls) {
  if (!Array.isArray(pictureUrls) || pictureUrls.length === 0) return null;
  return pictureUrls.find(url => url.includes('100x100') && url.includes('.webp')) || pictureUrls.find(url => url.includes('100x100') && url.includes('.jpeg')) || pictureUrls.find(url => !url.includes('shrink')) || pictureUrls[0];
}
module.exports = {
  simplifyObject
};