import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

const sPlayerAttackHandler = (user, dungeon, responseCode) => {
  const monster = dungeon.monsters.find((monster) => monster.monsterIdx === responseCode - 1);

  monster.monsterHp -= user.stat.atk;
  if (monster.monsterHp <= 0) dungeon.monsters.splice(responseCode - 1, 1);

  user.socket.write(
    createResponse(PacketType.S_PlayerAction, {
      targetMonsterIdx: monster.monsterIdx,
      actionSet: {
        animCode: 0,
        // TODO: 현재 effectCode가 하드 코딩으로 고정된 상태 향후 스킬마다 이팩트 바꿔주기
        effectCode: 3001,
      },
    }),
  );

  user.socket.write(PacketType.S_SetMonsterHp, {
    monsterIdx: monster.monsterIdx,
    hp: monster.monsterHp,
  });

  // TODO: 몬스터가 다 죽었는지 유무에 따라 던전 나갈 것인지, 혹은 더 깊게 들어갈 것인지 관련 코드 필요
};

export default sPlayerAttackHandler;
