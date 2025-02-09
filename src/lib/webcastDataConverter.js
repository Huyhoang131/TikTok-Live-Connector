/**
 * Flattens nested protobuf objects and converts attributes in "Long" format to strings.
 * This makes the data easier to handle and serialize.
 */
function simplifyObject(webcastObject) {
    const transformations = [
        { key: 'questionDetails' },
        { key: 'user', transform: getUserAttributes },
        { key: 'event', transform: getEventAttributes },
        { key: 'eventDetails' },
        { key: 'topViewers', transform: getTopViewerAttributes },
    ];

    transformations.forEach(({ key, transform }) => {
        if (webcastObject[key]) {
            Object.assign(webcastObject, transform ? transform(webcastObject[key]) : webcastObject[key]);
            delete webcastObject[key];
        }
    });

    if (webcastObject.battleUsers) {
        webcastObject.battleUsers = webcastObject.battleUsers
            .map((user) => user?.battleGroup?.user)
            .filter(Boolean)
            .map(getUserAttributes);
    }

    if (webcastObject.battleItems) {
        webcastObject.battleArmies = webcastObject.battleItems.flatMap(({ battleGroups, hostUserId }) =>
            battleGroups.map(({ points, users }) => ({
                hostUserId: hostUserId.toString(),
                points: parseInt(points),
                participants: users.map(getUserAttributes),
            }))
        );
        delete webcastObject.battleItems;
    }

    if (webcastObject.giftId) {
        webcastObject.repeatEnd = !!webcastObject.repeatEnd;
        webcastObject.gift = {
            gift_id: webcastObject.giftId,
            repeat_count: webcastObject.repeatCount,
            repeat_end: webcastObject.repeatEnd ? 1 : 0,
            gift_type: webcastObject.giftDetails?.giftType,
        };

        ['giftDetails', 'giftImage', 'giftExtra'].forEach((key) => {
            if (webcastObject[key]) {
                Object.assign(webcastObject, webcastObject[key]);
                delete webcastObject[key];
            }
        });

        ['receiverUserId', 'groupId'].forEach((key) => {
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
        webcastObject.emoteId = webcastObject.emote?.emoteId;
        webcastObject.emoteImageUrl = webcastObject.emote?.image?.imageUrl;
        delete webcastObject.emote;
    }

    if (Array.isArray(webcastObject.emotes)) {
        webcastObject.emotes = webcastObject.emotes.map(({ emote, placeInComment }) => ({
            emoteId: emote?.emoteId,
            emoteImageUrl: emote?.image?.imageUrl,
            placeInComment,
        }));
    }

    if (webcastObject.treasureBoxUser) {
        Object.assign(webcastObject, getUserAttributes(webcastObject.treasureBoxUser?.user2?.user3?.[0]?.user4?.user || {}));
        delete webcastObject.treasureBoxUser;
    }

    if (webcastObject.treasureBoxData) {
        Object.assign(webcastObject, webcastObject.treasureBoxData);
        delete webcastObject.treasureBoxData;
        if (webcastObject.timestamp) webcastObject.timestamp = parseInt(webcastObject.timestamp);
    }

    return { ...webcastObject };
}

function getUserAttributes(webcastUser) {
    if (!webcastUser) return {};

    const badges = mapBadges(webcastUser.badges);
    return {
        userId: webcastUser.userId?.toString(),
        secUid: webcastUser.secUid?.toString(),
        uniqueId: webcastUser.uniqueId || undefined,
        nickname: webcastUser.nickname || undefined,
        profilePictureUrl: getPreferredPictureFormat(webcastUser.profilePicture?.urls),
        followRole: webcastUser.followInfo?.followStatus,
        userBadges: badges,
        userSceneTypes: badges.map((x) => x.badgeSceneType || 0),
        userDetails: {
            createTime: webcastUser.createTime?.toString(),
            bioDescription: webcastUser.bioDescription,
            profilePictureUrls: webcastUser.profilePicture?.urls,
        },
        followInfo: webcastUser.followInfo
            ? {
                  followingCount: webcastUser.followInfo.followingCount,
                  followerCount: webcastUser.followInfo.followerCount,
                  followStatus: webcastUser.followInfo.followStatus,
                  pushStatus: webcastUser.followInfo.pushStatus,
              }
            : undefined,
        isModerator: badges.some((x) => x.type?.toLowerCase().includes('moderator') || x.badgeSceneType === 1),
        isNewGifter: badges.some((x) => x.type?.toLowerCase().includes('live_ng_')),
        isSubscriber: badges.some((x) => x.url?.includes('/sub_') || [4, 7].includes(x.badgeSceneType)),
        topGifterRank: badges
            .find((x) => x.url?.includes('/ranklist_top_gifter_'))
            ?.url.match(/ranklist_top_gifter_(\d+)\.png/)?.[1] ?? null,
        gifterLevel: badges.find((x) => x.badgeSceneType === 8)?.level || 0,
        teamMemberLevel: badges.find((x) => x.badgeSceneType === 10)?.level || 0,
    };
}

function getEventAttributes(event) {
    if (!event) return {};
    return {
        msgId: event.msgId?.toString(),
        createTime: event.createTime?.toString(),
        ...event,
    };
}

function getTopViewerAttributes(topViewers) {
    return topViewers.map(({ user, coinCount }) => ({
        user: user ? getUserAttributes(user) : null,
        coinCount: coinCount ? parseInt(coinCount) : 0,
    }));
}

function mapBadges(badges) {
    if (!Array.isArray(badges)) return [];

    return badges.flatMap(({ badgeSceneType, badges = [], imageBadges = [], privilegeLogExtra }) => [
        ...badges.map((badge) => ({ badgeSceneType, ...badge })),
        ...imageBadges.map(({ image, displayType }) => (image?.url ? { type: 'image', badgeSceneType, displayType, url: image.url } : null)).filter(Boolean),
        ...(privilegeLogExtra?.level && privilegeLogExtra.level !== '0'
            ? [{ type: 'privilege', privilegeId: privilegeLogExtra.privilegeId, level: parseInt(privilegeLogExtra.level), badgeSceneType }]
            : []),
    ]);
}

function getPreferredPictureFormat(pictureUrls) {
    if (!Array.isArray(pictureUrls) || pictureUrls.length === 0) return null;
    return pictureUrls.find((url) => url.includes('100x100') && url.includes('.webp')) ||
           pictureUrls.find((url) => url.includes('100x100') && url.includes('.jpeg')) ||
           pictureUrls.find((url) => !url.includes('shrink')) ||
           pictureUrls[0];
}

module.exports = {
    simplifyObject,
};