// src/handler/town/cChatHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { getPlayerRank, getPlayerRatingFromRedis, getTopRatings } from '../../db/redis/ratingService.js';

export const cViewRankPointHandler = async ({ socket, payload }) => {
  const user = sessionManager.getUserBySocket(socket);
  if (!user) {
    console.error('cViewRankPointHandler: 유저를 찾을 수 없습니다.');
    return;
  }

  // 유저의 랭킹과 스코어 가져오기
  const playerRank = await getPlayerRank(user.nickname);
  const playerScore = await getPlayerRatingFromRedis(user.nickname);

  // 상위 10명의 유저 랭크 정보 가져오기
  const topRatings = await getTopRatings(10);

  const otherRanks = topRatings.map((rank, index) => ({
    playerName: rank.value,
    playerRank: index + 1,
    playerScore: rank.score,
  }));

  try {
    user.socket.write(
      createResponse(PacketType.S_ViewRankPoint, {
        myRank: {
          playerName: user.nickname,
          playerRank,
          playerScore,
        },
        otherRanks,
      }),
    );
  } catch (error) {
    console.error('cViewRankPointHandler: S_ViewRankPoint 패킷 전송중 오류 발생', error);
  }
};
