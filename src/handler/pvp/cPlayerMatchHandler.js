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

    //TODO: S_PlayerMatch 클라이언트 수신 부분 만들기
    //TODO: 멀티 타워 디팬스에 사용하던 로딩화면이 적용되도록 클라이언트 제작
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
        //TODO: 에러 발생시 HandlerError로 서버가 죽지 않게 만들기
        console.error(error);
      }

      //TODO: 두 유저가 PVP SCENE으로 넘어갈 수 있도록 클라이언트에서 제작

      let dungeonCode = Math.floor(Math.random() * 3 + 1) + 5000;

      const isFirstAttack = Math.random() > 0.5;

      let btns = [
        { msg: '공격', enable: true }, // 평타는 나중에 제거
        { msg: '스킬 사용', enable: false }, // 향후 구현 예정
        { msg: '아이템 사용', enable: false }, // 향후 구현 예정
        { msg: '기권', enable: true },
      ];

      let lastKorean = checkBatchim(playerB.nickname) ? '과' : '와';
      let response = createResponse(PacketType.S_PlayerMatchNotification, {
        dungeonCode,
        playerData: MyStatus(playerA),
        opponentData: OpponentStatus(playerB),
        battleLog: {
          msg: `${playerB.nickname}${lastKorean} 싸워 이기세요!\n${isFirstAttack ? '선공입니다.' : '후공입니다'}`,
          typingAnimation: true,
          btns: [
            { msg: '공격', enable: isFirstAttack }, // 평타는 나중에 제거
            { msg: '스킬 사용', enable: isFirstAttack }, // 향후 구현 예정
            { msg: '아이템 사용', enable: isFirstAttack }, // 향후 구현 예정
            { msg: '기권', enable: isFirstAttack },
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
          typingAnimation: true,
          btns: [
            { msg: '공격', enable: !isFirstAttack }, // 평타는 나중에 제거
            { msg: '스킬 사용', enable: !isFirstAttack }, // 향후 구현 예정
            { msg: '아이템 사용', enable: !isFirstAttack }, // 향후 구현 예정
            { msg: '기권', enable: !isFirstAttack },
          ],
        },
      });

      playerB.socket.write(response);

      pvpRoom.setUserTurn(isFirstAttack);
      //0.5 이하인 경우 선공 얻었다 보내기, 0.5 크다인 경우 선공 아니다 보내기
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
