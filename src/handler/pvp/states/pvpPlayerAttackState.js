// src/handler/pvp/states/pvpPlayerAttackState.js

import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpActionState from './pvpActionState.js';
import { skillEnhancement, checkStopperResist } from '../../../utils/battle/calculate.js';

// 플레이어가 공격하는 상태
export default class PvpPlayerAttackState extends PvpState {
  async enter() {
    this.pvpRoom.pvpState = PVP_STATUS.PLAYER_ATTACK;

    const selectedSkill = this.pvpRoom.selectedSkill;
    const userSkillInfo = this.mover.userSkills[selectedSkill];

    // 플레이어의 속성과 스킬의 속성이 일치하는지 검증 후, 배율 적용(1차 검증)
    const playerElement = this.mover.element;
    const skillElement = userSkillInfo.element;
    const skillDamageRate = skillEnhancement(playerElement, skillElement);
    // const userDamage = userSkillInfo.damage * skillDamageRate;

    // 2차 검증 첫번째 : 상대가 저항값을 가지고 있냐?
    // const stopperResist = checkStopperResist(skillElement, this.stopper);

    // 저항값이 적용된 최종 대미지
    // const totalDamage = Math.floor(userDamage * ((100 - stopperResist) / 100));
    const totalDamage = userSkillInfo.damage;

    this.stopper.reduceHp(totalDamage);
    this.mover.reduceMp(userSkillInfo.mana);

    // 유저 MP 업데이트
    const setPlayerMpResponse = createResponse(PacketType.S_SetPlayerMp, {
      mp: this.mover.stat.mp,
    });
    this.mover.socket.write(setPlayerMpResponse);

    // 공격 시 의도되지 않은 조작 방지 위한 버튼 비활성화
    const disableButtons = [{ msg: this.stopper.nickname, enable: false }];

    // 상대방 HP 업데이트
    const setStopperHpResponse = createResponse(PacketType.S_EnemyHpNotification, {
      hp: this.stopper.stat.hp,
    });
    this.mover.socket.write(setStopperHpResponse);
    this.stopper.socket.write(setStopperHpResponse);

    // 플레이어 공격 애니메이션
    const playerActionResponse = createResponse(PacketType.S_HitAnimationNotification, {
      playerId: this.mover.id,
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: userSkillInfo.effectCode, // 이펙트 코드
      },
    });
    this.mover.socket.write(playerActionResponse);

    // 상대방이 때리는 애니메이션
    const enemyActionResponse = createResponse(PacketType.S_HitAnimationNotification, {
      playerId: this.mover.id,
      actionSet: {
        animCode: 0, // 공격 애니메이션 코드
        effectCode: userSkillInfo.effectCode, // 이펙트 코드
      },
    });
    this.stopper.socket.write(enemyActionResponse);

    // 공격 결과 메시지 전송(때리는 놈)
    if (skillDamageRate > 1) {
      const moverBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
        battleLog: {
          msg: `효과는 굉장했다! \n${this.stopper.nickname}에게 ${totalDamage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: disableButtons,
        },
      });
      this.mover.socket.write(moverBattleLogResponse);
    } else {
      const moverBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
        battleLog: {
          msg: `${this.stopper.nickname}에게 ${totalDamage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          btns: disableButtons,
        },
      });
      this.mover.socket.write(moverBattleLogResponse);
    }

    // 공격 결과 메시지 전송(맞는 놈)
    let stopperBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `${this.mover.nickname}에게 ${totalDamage}의 피해를 입었습니다.`,
        typingAnimation: false,
        btns: disableButtons,
      },
    });
    this.stopper.socket.write(stopperBattleLogResponse);

    // 턴이 아닌 유저 사망 유무 판별
    // if (this.stopper.stats.hp <= 0) {
    //   this.mover.socket.write(
    //     // TODO: stopper는 피격 + 죽는 당하는 애니메이션 전송 만들어주기
    //     // 이유 : 몬스터가 없어서 클라이언트에서 오류가 발생합니다.
    //     this.stopper.write(
    //       createResponse(PacketType.S_BeatenAnimationNotification, {
    //         playerId: this.stopper.id,
    //         actionSet: {
    //           animCode: 1,
    //         },
    //       }),
    //     ),
    //   );

    //   this.stopper.socket.write(
    //     // TODO: stopper는 피격 + 죽는 당하는 애니메이션 전송 만들어주기
    //     // 이유 : 몬스터가 없어서 클라이언트에서 오류가 발생합니다.
    //     this.stopper.write(
    //       createResponse(PacketType.S_BeatenAnimationNotification, {
    //         playerId: this.stopper.id,
    //         actionSet: {
    //           animCode: 1,
    //         },
    //       }),
    //     ),
    //   );

    //   //TODO: 승자 rank 포인트 증가 시켜주기  S_ViewRankPoint
    //   this.mover.socket.write(
    //     createResponse(PacketType.S_GameOverNotification, {
    //       isWin: true,
    //     }),
    //   );

    //   this.mover.socket(createResponse(PacketType.S_LeaveDungeon, {}));

    //   //TODO: S_GameOverNotification을 수신하는 클라이언트 부분 만들기
    //   //TODO: 패자 rank 포인트 감소시켜주기
    //   this.stopper.socket.write(
    //     createResponse(PacketType.S_GameOverNotification, {
    //       isWin: false,
    //     }),
    //   );

    //   this.stopper.socket(createResponse(PacketType.S_LeaveDungeon, {}));

    //   sessionManager.removePvpRoom(this.pvpRoom.sessionId);
    // }
    // 죽지 않았으면 턴 교체
    this.pvpRoom.setUserTurn(!this.pvpRoom.getUserTurn());
    stopperBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `이제 님이 때릴 차례에요`,
        typingAnimation: true,
        btns: [
          { msg: '스킬 사용', enable: true }, // 향후 구현 예정
          { msg: '아이템 사용', enable: true }, // 향후 구현 예정
          { msg: '기권', enable: true },
        ],
      },
    });

    const moverBattleLogResponse = createResponse(PacketType.S_PvpBattleLog, {
      battleLog: {
        msg: `이제 님이 맞을 차례에요`,
        typingAnimation: true,
        btns: [
          { msg: '스킬 사용', enable: false }, // 향후 구현 예정
          { msg: '아이템 사용', enable: false }, // 향후 구현 예정
          { msg: '기권', enable: false },
        ],
      },
    });

    this.stopper.socket.write(stopperBattleLogResponse);
    this.mover.socket.write(moverBattleLogResponse);
    [this.pvpRoom.stopper, this.pvpRoom.mover] = [this.pvpRoom.mover, this.pvpRoom.stopper];
    this.changeState(PvpActionState);
    this.pvpRoom.setUserTurn(!this.pvpRoom.getUserTurn());
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
