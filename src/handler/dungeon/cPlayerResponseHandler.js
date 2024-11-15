import { getUserBySocket } from '../../sessions/userSession.js';
import { getDungeonSessionByUser } from '../../sessions/dungeonSession.js';
import sPlayerActionHandler from './sPlayerActionHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';
import { sMonsterActionHandler } from './sMonsterActionHandler.js';
import { cEnterHandler } from '../town/cEnterHandler.js';

// 던전에서 버튼을 클릭할 경우 그에 따른 동작
export const cPlayerResponseHandler = async ({ socket, payload }) => {
  let responseCode = payload.responseCode ? payload.responseCode : 0;
  const user = await getUserBySocket(socket);
  responseCode = user.stat.hp <= 0 ? 0 : responseCode;
  const dungeon = getDungeonSessionByUser(user.id);
  console.log('던전 내 몬스터 확인 : ', dungeon.monsters);
  //TODO : 대화창 구분 닫기
  if (responseCode === 0) {
    const alive = dungeon.monsters.filter((monster) => monster.monsterHp > 0);
    if (user.stat.hp <= 0) {
      const response = createResponse(PacketType.S_LeaveDungeon, {});
      console.log('던전 떠나기 동작 유무 : ', response);
      user.socket.write(response);
      cEnterHandler({ socket, payload: { nickname: user.nickname, class: user.job } });
      return;
    } else if (alive.length === 0) {
      //TODO : 보상 지급 혹은 더 깊게 던전 진행(일단은 if, else if 로 구분)
      const response = createResponse(PacketType.S_LeaveDungeon, {});
      console.log('던전 떠나기 동작 유무 : ', response);
      user.socket.write(response);
      cEnterHandler({ socket, payload: { nickname: user.nickname, class: user.job } });
      return;
    }
    user.socket.write(createResponse(PacketType.S_ScreenDone, {}));
    return;
  } else {
    await sPlayerActionHandler(user, dungeon, responseCode);

    setTimeout(async () => {
      await sMonsterActionHandler(user, dungeon);
    }, 1000);
  }
};

export default cPlayerResponseHandler;
