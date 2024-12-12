// src/utils/battle/bossHelpers.js

import { createResponse } from '../response/createResponse.js';
import { PacketType } from '../../constants/header.js';

// 보스 전투에서의 배틀 로그 전송
export function sendBossBattleLog(target, msg, btns = [{ msg: '확인', enable: false }], typingAnimation = false) {
  const battleLog = { msg, typingAnimation, btns };
  const response = createResponse(PacketType.S_BossBattleLog, { battleLog });

  if (Array.isArray(target)) {
    target.forEach((user) => user.socket.write(response));
  } else {
    target.socket.write(response);
  }
}

// 모든 유저의 HP/MP 상태 전송
export function sendBossPlayerStatus(users) {
  const playerIds = users.map(u => u.id);
  const hps = users.map(u => u.stat.hp);
  const mps = users.map(u => u.stat.mp);
  const response = createResponse(PacketType.S_BossPlayerStatusNotification, { playerId: playerIds, hp: hps, mp: mps });
  users.forEach(u => u.socket.write(response));
}

// 특정 대상 유저들만 상태 전송 (다른 유저들에게 알림)
export function sendBossPlayerStatusOfUsers(users, targetUsers) {
  const playerIds = targetUsers.map(u => u.id);
  const hps = targetUsers.map(u => u.stat.hp);
  const mps = targetUsers.map(u => u.stat.mp);
  const response = createResponse(PacketType.S_BossPlayerStatusNotification, { playerId: playerIds, hp: hps, mp: mps });
  users.forEach(u => u.socket.write(response));
}

// 몬스터 HP 업데이트 패킷 전송
export function sendBossMonsterHpUpdate(users, monster) {
  const response = createResponse(PacketType.S_BossSetMonsterHp, { monsterIdx: monster.monsterIdx, hp: monster.monsterHp });
  users.forEach(u => u.socket.write(response));
}

// 플레이어 행동 알림 전송
export function sendBossPlayerActionNotification(users, playerId, targetMonsterIdxs, animCode, effectCode) {
  const response = createResponse(PacketType.S_BossPlayerActionNotification, {
    playerId,
    targetMonsterIdx: targetMonsterIdxs,
    actionSet: { animCode, effectCode },
  });
  users.forEach(u => u.socket.write(response));
}

// 몬스터 액션 전송
export function sendBossMonsterAction(users, monsterIdx, animCode, effectCode, playerIds = []) {
  const response = createResponse(PacketType.S_BossMonsterAction, {
    playerIds: playerIds.length > 0 ? playerIds : users.map(user => user.id),
    actionMonsterIdx: monsterIdx,
    actionSet: { animCode, effectCode },
  });
  users.forEach(u => u.socket.write(response));
}

// 쉴드 카운트 전송
export function sendBossBarrierCount(users, barrierCount) {
  const response = createResponse(PacketType.S_BossBarrierCount, { barrierCount });
  users.forEach(u => u.socket.write(response));
}

// 보스 페이즈 정보 전송
export function sendBossPhase(users, randomElement, phase) {
  const response = createResponse(PacketType.S_BossPhase, { randomElement, phase });
  users.forEach(u => u.socket.write(response));
}

// 스크린 텍스트 전송
export function sendBossScreenText(users, msg) {
  const response = createResponse(PacketType.S_ScreenText, { screenText: { msg, typingAnimation: false } });
  users.forEach(u => u.socket.write(response));
}

// 던전 탈출 패킷 전송
export function sendBossLeaveDungeon(user) {
  user.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
}
