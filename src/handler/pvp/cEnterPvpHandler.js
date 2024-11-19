import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { v4 } from 'uuid';
import { MyStatus, OpponentStatus } from '../../utils/battle/battle.js';
import { sDespawnHandler } from '../town/sDespawnHandler.js';

export const cPlayerMatchHandler = async ({ socket }) => {
  try {
    const user = sessionManager.getUserBySocket(socket);
    if (!user) {
      throw Error('유저가 존재하지 않습니다.');
    }

    //TODO: S_PlayerMatch 클라이언트 수신 부분 만들기
    //TODO: 멀티 타워 디팬스에 사용하던 로딩화면이 적용되도록 클라이언트 제작
    user.socket.write(createResponse(PacketType.S_PlayerMatch, { check: true }));

    const isTwoPlayer = sessionManager.matchQueue.addMatchingQueue(user);

    if (!isTwoPlayer) return;

    try {
      const { playerA, playerB } = isTwoPlayer;

      const pvpRoom = sessionManager.sessions.createPvpRoom(v4());

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
      playerA.socket.write(
        createResponse(PacketType.S_PlayerMatchNotification, {
          playerData: MyStatus(playerA),
          opponentData: OpponentStatus(playerB),
        }),
      );
      playerB.socket.write(
        createResponse(PacketType.S_PlayerMatchNotification, {
          playerData: MyStatus(playerB),
          opponentData: OpponentStatus(playerA),
        }),
      );

      const isFirstAttack = Math.random() > 0.5;

      playerA.socket.write(
        createResponse(PacketType.S_PlayerStrikeFirstNotification, { check: isFirstAttack }),
      );
      // 0.5 크다인 경우 선공 얻었다 보내기, 0.5 이하인 경우 선공 아니다 보내기

      playerB.socket.write(
        createResponse(PacketType.S_PlayerStrikeFirstNotification, { check: !isFirstAttack }),
      );

      pvpRoom.setUserTurn(isFirstAttack);

      // 0.5 이하인 경우 선공 얻었다 보내기, 0.5 크다인 경우 선공 아니다 보내기
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
