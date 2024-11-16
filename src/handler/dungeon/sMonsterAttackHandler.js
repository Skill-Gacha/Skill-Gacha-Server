import { PacketType } from '../../constants/header';
import { createResponse } from '../../utils/response/createResponse';

export const sMonsterAttackHandler = (user, monster) => {
  user.stat.hp -= monster.atk;

  user.socket.write(
    createResponse(PacketType.S_SetPlayerHp, {
      hp: user.stat.hp,
    }),
  );

  user.socket.write(createResponse(PacketType.S_BattleLog, {}));

  user.socket.write(
    createResponse(PacketType.S_MonsterAction, {
      actionMonsterIdx: monster.monsterIdx,
      actionSet: {
        // animCode : ,
        // effectCode :
      },
    }),
  );
};
