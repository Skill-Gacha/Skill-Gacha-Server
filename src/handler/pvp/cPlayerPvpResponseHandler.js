// src/handler/pvp/cPlayerPvpHandler.js

import sessionManager from '#managers/sessionManager.js';
import { PacketType } from '../../constants/header.js';
import { handleError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';

export const cPlayerPvpResponseHandler = async ({ socket, payload }) => {
  const responseCode = payload.responseCode || 0;
  const user = sessionManager.getUserBySocket(socket);
  const pvpRoom = sessionManager.getPvpByUser(user);
  const [playerA, playerB] = Array.from(pvpRoom.users.values());

  // 공격 유저 맞는 유저
  let mover = null;
  let stopper = null;

  if (pvpRoom.getUserTurn() === 0) {
    mover = playerB;
    stopper = playerA;
  } else {
    mover = playerA;
    stopper = playerB;
  }

  // 본인 턴인 사람만 행동 가능하게 설정
  if (stopper.socket === socket) return;

  // 턴 정보 클라이언트에게도 전송
  mover.socket.write(
    createResponse(PacketType.S_UserTurn, {
      userTurn: true,
    }),
  );

  stopper.socket.write(
    createResponse(PacketType.S_UserTurn, {
      userTurn: false,
    }),
  );

  if (!mover || !stopper || !pvpRoom) {
    console.error('cPlayerPvpResponseHandler: 유저 또는 PVP 세션을 찾을 수 없습니다.');
    return;
  }

  if (!pvpRoom.currentState) {
    // 초기 상태 설정
    // 던전 입장 시 스크린 텍스트부터 표시되므로
    // 메세지 상태 핸들링이 필요하다
    // 따라서 상태 지정이 없을 때 messageState.js부터 로드
    // 다르게 로드할 수 있는지는 찾아봐야 할 듯

    // messageState.js을 동적으로 임포트하고
    // 모듈의 기본 내보내기(Default Export)를 가져옴
    // 동적 임포트는 모듈의 전체 네임스페이스를 반환하므로
    // default를 통해 필요한 것만 가져오게 함
    const PvpActionState = (await import('./states/pvpActionState.js')).default;
    pvpRoom.currentState = new PvpActionState(pvpRoom, mover, stopper);
    await pvpRoom.currentState.enter();
  }

  // 초기 상황이 아니면 클라이언트 응답 처리로 넘어감
  // 이 파일에선 응답 코드에 대한 어떤 처리도 하지 않기 때문에
  // 스테이트에서 확실히 넘겨주는 작업이 필요
  try {
    await pvpRoom.currentState.handleInput(responseCode);
  } catch (error) {
    console.error('cPlayerPvpResponseHandler 처리 중 오류 발생:', error);
    handleError(error);
  }
};
