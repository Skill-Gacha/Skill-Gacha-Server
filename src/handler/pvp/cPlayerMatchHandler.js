// src/handler/pvp/cPlayerMathHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 } from 'uuid';
import { MyStatus, OpponentStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';
import checkBatchim from '../../utils/korean/checkBatchim.js';

export const cPlayerMatchHandler = async ({ socket }) => {
  try {
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      throw Error('유저가 존재하지 않습니다.');
    }

    user.socket.write(createResponse(PacketType.S_PlayerMatch, { check: true }));

    const isTwoPlayer = sessionManager.addMatchingQueue(user);
    if (!isTwoPlayer) return;

    try {
      const [playerA, playerB] = isTwoPlayer;

      const pvpRoom = sessionManager.createPvpRoom(v4());

      pvpRoom.addUser(playerA);
      pvpRoom.addUser(playerB);
      try {
        sDespawnHandler(playerA);
        sDespawnHandler(playerB);
      } catch (error) {
        console.error(error);
      }

      let dungeonCode = Math.floor(Math.random() * 3 + 1) + 5000;

      pvpRoom.setUserTurn();
      const isFirstAttack = pvpRoom.getUserTurn();

      let btns = [];

      let lastKorean = checkBatchim(playerB.nickname) ? '과' : '와';
      let response = createResponse(PacketType.S_PlayerMatchNotification, {
        dungeonCode,
        playerData: MyStatus(playerA),
        opponentData: OpponentStatus(playerB),
        battleLog: {
          msg: `${playerB.nickname}${lastKorean} 싸워 이기세요!\n${isFirstAttack ? '선공입니다.' : '후공입니다'}`,
          typingAnimation: false,
          btns: [
            { msg: '스킬 사용', enable: isFirstAttack }, // 향후 구현 예정
            { msg: '아이템 사용', enable: isFirstAttack }, // 향후 구현 예정
            { msg: '도망치기', enable: isFirstAttack },
          ],
        },
      });

      playerA.socket.write(response);

      lastKorean = checkBatchim(playerB.nickname) ? '과' : '와';
      response = createResponse(PacketType.S_PlayerMatchNotification, {
        dungeonCode,
        playerData: MyStatus(playerB),
        opponentData: OpponentStatus(playerA),
        battleLog: {
          msg: `${playerA.nickname}${lastKorean} 싸워 이기세요!\n${isFirstAttack ? '후공입니다' : '선공입니다.'}`,
          typingAnimation: false,
          btns: [
            { msg: '스킬 사용', enable: !isFirstAttack }, // 향후 구현 예정
            { msg: '아이템 사용', enable: !isFirstAttack }, // 향후 구현 예정
            { msg: '도망치기', enable: !isFirstAttack },
          ],
        },
      });

      playerB.socket.write(response);
    } catch (error) {
      // TODO: 남은 유저는 매칭 Queue에 다시 넣어주던가, 아니면 다시 매칭 버튼을 누리게 만들어줘야 함
      //playerA.socket.write(createResponse(PacketType.오류와 관련된 패킷 처리 핸들러 이름, { msg = "서버에서 오류가 발생했습니다."}))
      //playerB.socket.write(createResponse(PacketType.오류와 관련된 패킷 처리 핸들러 이름, { msg = "서버에서 오류가 발생했습니다."}))
    }
  } catch (error) {
    // TODO : 서버가 에러가 나지 않게 두 명에게 오류 보내기
    //socket.write(createResponse(PacketType.오류와 관련된 패킷 처리 핸들러 이름, { msg = "서버에서 오류가 발생했습니다."}))
    console.error('매칭 오류 : ', error);
  }
};
