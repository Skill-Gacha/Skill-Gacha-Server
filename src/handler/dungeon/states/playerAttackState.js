// src/handler/dungeon/states/playerAttackState.js

import DungeonState from './dungeonState.js';
import EnemyAttackState from './enemyAttackState.js';
import MonsterDeadState from './monsterDeadState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { AREASKILL, BUFF_SKILL, DEBUFF, DUNGEON_STATUS } from '../../../constants/battle.js';
import {
  checkEnemyResist,
  skillEnhancement,
  updateDamage,
} from '../../../utils/battle/calculate.js';
import { buffSkill, useBuffSkill } from '../../../utils/battle/battle.js';

// 플레이어가 공격하는 상태
export default class PlayerAttackState extends DungeonState {
  async enter() {
    this.dungeon.dungeonStatus = DUNGEON_STATUS.PLAYER_ATTACK;

    const selectedSkill = this.dungeon.selectedSkill;
    const userSkillInfo = this.user.userSkills[selectedSkill];

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = this.dungeon.monsters.map((monster) => ({
      msg: monster.monsterName,
      enable: false,
    }));

    // 플레이어 액션 패킷 보내기
    const sendPlayerAction = (targetMonsterIdx, effectCode) => {
      const playerActionResponse = createResponse(PacketType.S_PlayerAction, {
        targetMonsterIdx,
        actionSet: {
          animCode: 0, // 공격 애니메이션 코드
          effectCode: effectCode, // 스킬의 이펙트 코드
        },
      });
      this.socket.write(playerActionResponse);
    };

    // 배틀로그 패킷 보내기
    const sendBattleLog = (msg, disableButtons) => {
      const battleLogResponse = createResponse(PacketType.S_BattleLog, {
        battleLog: {
          msg: msg,
          typingAnimation: false,
          btns: disableButtons,
        },
      });
      this.socket.write(battleLogResponse);
    };

    // 몬스터 HP 업데이트
    const sendMonsterHpUpdate = (monster) => {
      const setMonsterHpResponse = createResponse(PacketType.S_SetMonsterHp, {
        monsterIdx: monster.monsterIdx,
        hp: monster.monsterHp,
      });
      this.socket.write(setMonsterHpResponse);
    };

    // 버프 스킬 처리
    if (userSkillInfo.id >= BUFF_SKILL) {
      // user.stat.buff 값 설정해주기
      buffSkill(this.user, userSkillInfo.id);

      // 버프 값에 따라 행동 결정
      useBuffSkill(this.user, this.socket, this.dungeon);

      this.user.reduceMp(userSkillInfo.mana);

      // 유저 MP 업데이트
      this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

      // 행동 액션 보내기
      sendPlayerAction([], userSkillInfo.effectCode);

      await delay(1000);
      this.changeState(EnemyAttackState);
      return;
    }

    // 광역기 스킬 처리
    if (userSkillInfo.id >= AREASKILL) {
      const aliveMonsters = this.dungeon.monsters.filter((monster) => monster.monsterHp > 0);
      const targetMonsterIdx = aliveMonsters.map((monster) => monster.monsterIdx);

      // 영혼 분쇄일 경우 버프처리
      if (userSkillInfo.id === DEBUFF) {
        buffSkill(this.user, userSkillInfo.id);
        useBuffSkill(this.user, this.socket, this.dungeon);
      }

      // 행동 액션 보내기
      sendPlayerAction(targetMonsterIdx, userSkillInfo.effectCode);

      // 모든 몬스터를 대상으로 처리
      for (const monster of aliveMonsters) {
        // 속성과 데미지 배율 계산
        const skillDamageRate = skillEnhancement(this.user.element, userSkillInfo.element);
        let userDamage = userSkillInfo.damage * skillDamageRate;

        // 버프 및 아이템 효과를 적용한 최종 데미지 계산
        userDamage = updateDamage(this.user, userDamage);

        // 몬스터 저항 계산
        const monsterResist = checkEnemyResist(userSkillInfo.element, monster);
        const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

        // 몬스터 HP 감소
        monster.reduceHp(totalDamage);

        // 몬스터 HP 업데이트 패킷 전송
        sendMonsterHpUpdate(monster);
      }

      // 피해 로그 전송
      sendBattleLog('광역 스킬을 사용하여 모든 몬스터에게 피해를 입혔습니다.', disableButtons);

      // 플레이어 MP 감소
      this.user.reduceMp(userSkillInfo.mana);
      this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));
      await delay(1000);

      // 모든 몬스터의 사망 여부 확인
      const allMonstersDead = this.dungeon.monsters.every((monster) => monster.monsterHp <= 0);
      if (allMonstersDead) {
        this.changeState(MonsterDeadState);
      } else {
        this.changeState(EnemyAttackState);
      }
      return;
    }

    // 단일 스킬 처리
    const targetMonster = this.dungeon.selectedMonster;

    // 플레이어의 속성과 스킬의 속성이 일치하는지 검증 후, 배율 적용(1차 검증)
    const playerElement = this.user.element;
    const skillElement = userSkillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    let userDamage = userSkillInfo.damage * skillDamageRate;

    // 포션 및 버프 효과에 따른 최종 대미지 계산
    userDamage = updateDamage(this.user, userDamage);

    // 2차 검증 첫번째 : 몬스터가 저항값을 가지고 있냐?
    const monsterResist = checkEnemyResist(skillElement, targetMonster);

    // 저항값이 적용된 최종 대미지
    const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

    targetMonster.reduceHp(totalDamage);
    this.user.reduceMp(userSkillInfo.mana);
    this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

    // 몬스터 HP 업데이트
    sendMonsterHpUpdate(targetMonster);

    // 플레이어 공격 애니메이션 전송
    sendPlayerAction([targetMonster.monsterIdx], userSkillInfo.effectCode);

    // 공격 결과 메시지 전송
    if (skillDamageRate > 1) {
      sendBattleLog(
        `효과는 굉장했다! \n${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`,
        disableButtons,
      );
    } else {
      sendBattleLog(
        `${targetMonster.monsterName}에게 ${totalDamage}의 피해를 입혔습니다.`,
        disableButtons,
      );
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
