import { getUserBySocket } from '../../sessions/userSession.js';
import {
  getDungeonSessionByUserId,
  removeDungeonSessionByUserId,
} from '../../sessions/dungeonSession.js';
import sPlayerActionHandler from './sPlayerActionHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PacketType } from '../../constants/header.js';
import { cEnterHandler } from '../town/cEnterHandler.js';
import { sMonsterActionHandler } from './sMonsterActionHandler.js';
import { sMonsterAttackHandler } from './sMonsterAttackHandler.js';

// 던전에서 버튼을 클릭할 경우 그에 따른 동작
export const cPlayerResponseHandler = async ({ socket, payload }) => {
  const { responseCode } = payload;
  const user = await getUserBySocket(socket);
  const dungeon = getDungeonSessionByUserId(user.id);
  const alive = dungeon.monsters.filter((monster) => monster.monsterHp > 0);
  if (user.stat.hp <= 0 || alive.length === 0) {
    removeDungeonSessionByUserId(user.id);
    const response = createResponse(PacketType.S_LeaveDungeon, {});
    user.socket.write(response);
    cEnterHandler({ socket, payload: { nickname: user.nickname, class: user.job } });
  }
  if (responseCode === 0) {
    user.socket.write(createResponse(PacketType.S_ScreenDone, {}));
    return;
  } else {
    await sPlayerActionHandler(user, dungeon, responseCode);

    // for(let i = 0; i < alive.length; i++)
    // {

    // }

    for (let monster of alive) {
      setTimeout(async () => {
        await sMonsterAttackHandler(user, monster);
      }, 1000);
    }
  }
};

export default cPlayerResponseHandler;
