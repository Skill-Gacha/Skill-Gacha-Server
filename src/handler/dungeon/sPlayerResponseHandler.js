import { getUserBySocket } from '../../sessions/userSession.js';
import { getDungeonSessionByUser } from '../../sessions/dungeonSession.js';
import sPlayerAttackHandler from './sPlayerAttackHandler.js';

// 던전에서 버튼을 클릭할 경우 그에 따른 동작
export const sPlayerResponseHandler = async ({ socket, payload }) => {
  const responseCode = payload.responseCode ? payload.responseCode : 0;
  const user = getUserBySocket(socket);
  const dungeon = getDungeonSessionByUser(user);
  switch (responseCode) {
    // TODO:: 향후 config의 값으로 변경하기
    // 현재 1(중앙 몬스터) 2(왼쪽 몬스터) 3(오른쪽 몬스터) 때리는 로직의 1, 2, 3을 하드 코딩한 상태
    case 1:
    case 2:
    case 3:
      sPlayerAttackHandler(user, dungeon, responseCode);
      break;
    case 0:
      break;
  }
  sMonsterAction(user, dungeon);
};

export default sPlayerResponseHandler;
