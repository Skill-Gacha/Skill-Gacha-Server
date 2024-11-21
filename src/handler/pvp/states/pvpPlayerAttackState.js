// src/handler/pvp/states/pvpPlayerAttackState.js

import PvpState from './pvpState.js';
import { PacketType } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { delay } from '../../../utils/delay.js';
import { PVP_STATUS } from '../../../constants/battle.js';
import PvpActionState from './pvpActionState.js';
import sessionManager from '#managers/sessionManager.js';
import User from '../../../classes/models/userClass.js';

// 플레이어가 공격하는 상태
export default class PvpPlayerAttackState extends PvpState {
  async enter() {
    this.pvpRoom.pvpState = PVP_STATUS.PLAYER_ATTACK;
    const playerDamage = this.mover.stat.atk;
    this.stopper.reduceHp(playerDamage);

    // TODO: 클라이언트에서 수신하는 부분 구현 필요함
    this.mover.socket.write(
      createResponse(PacketType.S_EnemyHpNotification, { hp: this.stopper.hp }),
    );

    this.stopper.socket.write(createResponse(PacketType.S_SetPlayerHp, { hp: this.stopper.hp }));

    // TODO: mover는 공격 애니메이션 전송 만들어주기
    // 이유 : 몬스터가 없어서 클라이언트의 몬스터 공격이 오류가 발생함.
    this.mover.write(
      createResponse(PacketType.S_HitAnimationNotification, {
        playerId: this.mover.id,
        actionSet: {
          animCode: 0, // 공격 애니메이션 코드
          effectCode: 3001, // 이펙트 코드
        },
      }),
    );

    // TODO: mover는 공격 애니메이션 전송 만들어주기
    // 이유 : 몬스터가 없어서 클라이언트의 몬스터 공격이 오류가 발생함.
    this.stopper.write(
      createResponse(PacketType.S_HitAnimationNotification, {
        playerId: this.stopper.id,
        actionSet: {
          animCode: 0, // 공격 애니메이션 코드
          effectCode: 3001, // 이펙트 코드
        },
      }),
    );

    // TODO: stopper는 피격 + 죽는 당하는 애니메이션 전송 만들어주기
    // 이유 : 몬스터가 없어서 클라이언트에서 오류가 발생합니다.
    this.mover.write(
      createResponse(PacketType.S_BeatenAnimationNotification, {
        playerId: this.mover.id,
        actionSet: {
          animCode: 1,
        },
      }),
    );

    // TODO: stopper는 피격 + 죽는 당하는 애니메이션 전송 만들어주기
    // 이유 : 몬스터가 없어서 클라이언트에서 오류가 발생합니다.
    this.stopper.write(
      createResponse(PacketType.S_BeatenAnimationNotification, {
        playerId: this.stopper.id,
        actionSet: {
          animCode: 1,
        },
      }),
    );

    // 공격 결과 메시지 전송
    this.mover.socket.write(
      createResponse(PacketType.S_PvpBattleLog, {
        BattleLog: {
          msg: `${this.stopper.nickname}에게 ${playerDamage}의 피해를 입혔습니다.`,
          typingAnimation: false,
          // 공격 도중 여러 번 공격 못 하게 버튼 처리
          btns: [{ msg: this.stopper.nickname, enable: false }],
        },
      }),
    );

    // 공격 당했다 결과 전송
    this.stopper.socket.write(
      createResponse(PacketType.S_PvpBattleLog, {
        battleLog: {
          msg: `${this.mover.nickname}에게 ${playerDamage}의 피해를 입었습니다.`,
          typingAnimation: false,
        },
      }),
    );

    // 턴이 아닌 유저 사망 유무 판별
    if (this.stopper.stats.hp <= 0) {
      this.mover.socket.write(
        // TODO: stopper는 피격 + 죽는 당하는 애니메이션 전송 만들어주기
        // 이유 : 몬스터가 없어서 클라이언트에서 오류가 발생합니다.
        this.stopper.write(
          createResponse(PacketType.S_BeatenAnimationNotification, {
            playerId: this.stopper.id,
            actionSet: {
              animCode: 1,
            },
          }),
        ),
      );

      this.stopper.socket.write(
        // TODO: stopper는 피격 + 죽는 당하는 애니메이션 전송 만들어주기
        // 이유 : 몬스터가 없어서 클라이언트에서 오류가 발생합니다.
        this.stopper.write(
          createResponse(PacketType.S_BeatenAnimationNotification, {
            playerId: this.stopper.id,
            actionSet: {
              animCode: 1,
            },
          }),
        ),
      );

      //TODO: 승자 rank 포인트 증가 시켜주기  S_ViewRankPoint
      this.mover.socket.write(
        createResponse(PacketType.S_GameOverNotification, {
          isWin: true,
        }),
      );

      this.mover.socket(createResponse(PacketType.S_LeaveDungeon, {}));

      //TODO: S_GameOverNotification을 수신하는 클라이언트 부분 만들기
      //TODO: 패자 rank 포인트 감소시켜주기
      this.stopper.socket.write(
        createResponse(PacketType.S_GameOverNotification, {
          isWin: false,
        }),
      );

      this.stopper.socket(createResponse(PacketType.S_LeaveDungeon, {}));

      sessionManager.removePvpRoom(this.pvpRoom.sessionId);
    } else {
      // 죽지 않았으면 턴 교체
      this.pvpRoom.setUserTurn(!this.pvpRoom.getUserTurn());
      [this.pvpRoom.stopper, this.pvpRoom.mover] = [this.pvpRoom.mover, this.pvpRoom.stopper];
      this.changeState(PvpActionState);
    }
    await delay(1000);
  }

  async handleInput(responseCode) {
    // 이 상태에서는 플레이어의 추가 입력이 필요하지 않음
  }
}
