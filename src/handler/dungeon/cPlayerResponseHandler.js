import { getUserBySocket } from '../../sessions/userSession.js';
import { getDungeonSession, getDungeonSessionByUser } from '../../sessions/dungeonSession.js';
import sPlayerAttackHandler from './sPlayerAttackHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';

// 던전에서 버튼을 클릭할 경우 그에 따른 동작
export const cPlayerResponseHandler = async ({ socket, payload }) => {
  console.log('동작 유무 확인');
  const responseCode = payload.responseCode ? payload.responseCode : 0;
  const user = await getUserBySocket(socket);
  const dungeon = getDungeonSessionByUser(user.id);

  console.log(`던전 유무 확인 ${dungeon}`);
  switch (responseCode) {
    // TODO:: 향후 config의 값으로 변경하기
    // 현재 1(중앙 몬스터) 2(왼쪽 몬스터) 3(오른쪽 몬스터) 때리는 로직의 1, 2, 3을 하드 코딩한 상태
    case 1:
    case 2:
    case 3:
      sPlayerAttackHandler(user, dungeon, responseCode);
      break;
    case 0:
      user.socket.write(createResponse(PacketType.S_ScreenDone, {}));
      break;
  }
  //sMonsterAction(user, dungeon);
};

export default cPlayerResponseHandler;
