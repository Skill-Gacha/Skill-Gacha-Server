// src/handler/town/cViewRankPointHandler.js

import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import sessionManager from '#managers/sessionManager.js';
import { getTopRatingsWithPlayer } from '../../db/redis/ratingService.js';

const RANK_RANGE = 10;

export const cViewRankPointHandler = async ({ socket }) => {
  try {
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      console.error('cViewRankPointHandler: 유저를 찾을 수 없습니다.');
      return;
    }

    // 상위 10명과 특정 유저의 레이팅 정보 가져오기
    const topRatings = await getTopRatingsWithPlayer(user.nickname, RANK_RANGE);

    // 대상 유저의 랭킹 정보 찾기
    const myRankInfo = topRatings.find((rank) => rank.value === user.nickname);

    if (!myRankInfo) {
      console.error('cViewRankPointHandler: 대상 유저의 랭킹 정보를 찾을 수 없습니다.');
      return;
    }

    // 상위 10명 랭크 정보
    const otherRanks = topRatings.map((rank) => ({
      playerName: rank.value,
      playerRank: rank.rank,
      playerScore: rank.score,
    }));

    // 클라이언트에 응답 전송
    user.socket.write(
      createResponse(PacketType.S_ViewRankPoint, {
        myRank: {
          playerName: myRankInfo.value,
          playerRank: myRankInfo.rank,
          playerScore: myRankInfo.score,
        },
        otherRanks,
      }),
    );
  } catch (error) {
    console.error(`cViewRankPointHandler: S_ViewRankPoint 패킷 전송중 오류 발생: ${error.message}`);
  }
};
