// src/handler/dungeon/states/playerAttackState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import MonsterDeadState from './monsterDeadState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { DUNGEON_STATUS } from '../../../constants/battle.js';
import { potionEffectDamage, checkEnemyResist, skillEnhancement } from '../../../utils/battle/calculate.js';

// 플레이어가 공격하는 상태
export default class PlayerAttackState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_ATTACK;
    const targetMonster = this.dungeon.selectedMonster;

    const selectedSkill = this.dungeon.selectedSkill;
    const userSkillInfo = this.user.userSkills[selectedSkill];

    // 플레이어의 속성과 스킬의 속성이 일치하는지 검증 후, 배율 적용(1차 검증)
    const playerElement = this.user.element;
    const skillElement = userSkillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    const userDamage = userSkillInfo.damage * skillDamageRate;

    // 포션 효과에 따른 최종 대미지 계산
    const finalDamage = potionEffectDamage(userDamage, this.user.stat.berserk, this.user.stat.dangerPotion); 


    // 효과 사용 후 상태 초기화
    if (this.user.stat.berserk || this.user.stat.dangerPotion ) {
      if (this.user.stat.berserk) {
        this.user.stat.berserk = false; // 스팀팩 효과를 사용한 후 초기화
      }
      if (this.user.stat.dangerPotion) {
        this.user.stat.dangerPotion = false; // 위험한 포션 효과를 사용 후 초기화
      }  
    }

    // 2차 검증 첫번째 : 몬스터가 저항값을 가지고 있냐?
    const monsterResist = checkEnemyResist(skillElement, targetMonster);

    // 저항값이 적용된 최종 대미지
    const totalDamage = Math.floor(finalDamage * ((100 - monsterResist) / 100));

    targetMonster.reduceHp(totalDamage);
    this.user.reduceMp(userSkillInfo.mana);

    // 유저 MP 업데이트
    const setPlayerMpResponse = createResponse(PacketType.S_SetPlayerMp, {
      mp: this.user.stat.mp,
    });
    this.socket.write(setPlayerMpResponse);

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = this.dungeon.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: false,
    }));

    // 몬스터 HP 업데이트
    const setMonsterHpResponse = createResponse(PacketType.S_SetMonsterHp, {
      monsterIdx: targetMonster.monsterIdx,
      hp: targetMonster.monsterHp,
    });
    this.socket.write(setMonsterHpResponse);

    // 플레이어 공격 애니메이션 전송
    const playerActionResponse = createResponse(PacketType.S_PlayerAction, {
      targetMonsterIdx: targetMonster.monsterIdx,
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: userSkillInfo.effectCode, // 이펙트 코드
      },
    });
    this.socket.write(playerActionResponse);

    const battleLog = {
      msg: `효과는 굉장했다! \n${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`,
      typingAnimation: false,
      btns: disableButtons,
    };

    // 공격 결과 메시지 전송
    if (skillDamageRate > 1) {
      const battleLogResponse = createResponse(PacketType.S_BattleLog, {
        battleLog,
      });
      console.log('battleLog :', battleLog);
      this.socket.write(battleLogResponse);
    } else {
      const battleLogResponse = createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: `${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: disableButtons,
        },
      });
      this.socket.write(battleLogResponse);
    }

    await delay(1000);

    // 몬스터 사망 여부 확인
    if (targetMonster.monsterHp <= 0) {
      this.changeState(MonsterDeadState);
    } else {
      this.changeState(EnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
