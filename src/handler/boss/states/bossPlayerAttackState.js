// src/handler/boss/states/bossPlayerAttackState.js

import { BOSS_STATUS } from '../../../constants/battle.js';
import BossRoomState from './bossRoomState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { AREASKILL, BUFF_SKILL, DEBUFF } from '../../../constants/battle.js';
import {
  checkEnemyResist,
  skillEnhancement,
  updateDamage,
} from '../../../utils/battle/calculate.js';
import { buffSkill, useBuffSkill } from '../../../utils/battle/battle.js';
import MonsterDeadState from './bossMonsterDeadState.js';
import BossEnemyAttackState from './bossEnemyAttackState.js';

// 보스 플레이어 공격 상태
export default class BossPlayerAttackState extends BossRoomState {
  async enter() {
    this.bossRoom.bossStatus = BOSS_STATUS.PLAYER_ATTACK;

    const selectedSkill = this.bossRoom.selectedSkill; // 선택된 스킬
    const userSkillInfo = this.user.userSkills[selectedSkill]; // 유저 스킬 정보

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = this.bossRoom.monsters.map((monster) => ({
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
      buffSkill(this.user, userSkillInfo.id);
      useBuffSkill(this.user, this.socket, this.bossRoom);
      this.user.reduceMp(userSkillInfo.mana);

      // 유저 MP 업데이트
      this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));

      // 행동 액션 보내기
      sendPlayerAction([], userSkillInfo.effectCode);

      await delay(1000);
      this.changeState(BossEnemyAttackState);
      return;
    }

    // 광역기 스킬 처리
    if (userSkillInfo.id >= AREASKILL) {
      const targetMonster = this.bossRoom.selectedMonster;

      // 행동 액션 보내기
      sendPlayerAction([targetMonster.monsterIdx], userSkillInfo.effectCode);

      // 속성과 데미지 배율 계산
      const skillDamageRate = skillEnhancement(this.user.element, userSkillInfo.element);
      let userDamage = userSkillInfo.damage * skillDamageRate;

      // 버프 및 아이템 효과를 적용한 최종 데미지 계산
      userDamage = updateDamage(this.user, userDamage);

      // 몬스터 저항 계산
      const monsterResist = checkEnemyResist(userSkillInfo.element, targetMonster);
      const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

      // 몬스터 HP 감소
      targetMonster.reduceHp(totalDamage);
      sendMonsterHpUpdate(targetMonster);

      // 피해 로그 전송
      sendBattleLog('광역 스킬을 사용하여 보스에게 피해를 입혔습니다.', disableButtons);

      // 플레이어 MP 감소
      this.user.reduceMp(userSkillInfo.mana);
      this.socket.write(createResponse(PacketType.S_SetPlayerMp, { mp: this.user.stat.mp }));
      await delay(1000);

      // 보스의 사망 여부 확인
      if (targetMonster.monsterHp <= 0) {
        this.changeState(MonsterDeadState);
      } else {
        this.changeState(BossEnemyAttackState);
      }
      return;
    }

    // 단일 스킬 처리
    const targetMonster = this.bossRoom.selectedMonster;

    // 플레이어의 속성과 스킬의 속성이 일치하는지 검증 후, 배율 적용
    const playerElement = this.user.element;
    const skillElement = userSkillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    let userDamage = userSkillInfo.damage * skillDamageRate;

    // 포션 및 버프 효과에 따른 최종 대미지 계산
    userDamage = updateDamage(this.user, userDamage);

    // 몬스터 저항값 계산
    const monsterResist = checkEnemyResist(skillElement, targetMonster);
    const totalDamage = Math.floor(userDamage * ((100 - monsterResist) / 100));

    // 몬스터 HP 감소
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
      this.changeState(BossEnemyAttackState);
    }
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
