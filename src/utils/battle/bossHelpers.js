// src/utils/battle/bossHelpers.js

import { createResponse } from '../response/createResponse.js';
import { PacketType } from '../../constants/header.js';

export function sendBossBattleLog(target, msg, btns = [{ msg: '확인', enable: false }], typingAnimation = false) {
  const battleLog = { msg, typingAnimation, btns };
  const response = createResponse(PacketType.S_BossBattleLog, { battleLog });

  if (Array.isArray(target)) {
    target.forEach((user) => user.socket.write(response));
  } else {
    target.socket.write(response);
  }
}

export function sendBossPlayerStatus(users) {
  const playerIds = users.map(u => u.id);
  const hps = users.map(u => u.stat.hp);
  const mps = users.map(u => u.stat.mp);
  const response = createResponse(PacketType.S_BossPlayerStatusNotification, {
    playerId: playerIds,
    hp: hps,
    mp: mps,
  });
  users.forEach(u => u.socket.write(response));
}

export function sendBossPlayerStatusOfUsers(users, targetUsers) {
  const playerIds = targetUsers.map(u => u.id);
  const hps = targetUsers.map(u => u.stat.hp);
  const mps = targetUsers.map(u => u.stat.mp);
  const response = createResponse(PacketType.S_BossPlayerStatusNotification, {
    playerId: playerIds,
    hp: hps,
    mp: mps,
  });
  users.forEach(u => u.socket.write(response));
}

export function sendBossMonsterHpUpdate(users, monster) {
  const response = createResponse(PacketType.S_BossSetMonsterHp, {
    monsterIdx: monster.monsterIdx,
    hp: monster.monsterHp,
  });
  users.forEach(u => u.socket.write(response));
}

export function sendBossPlayerActionNotification(users, playerId, targetMonsterIdxs, animCode, effectCode) {
  const response = createResponse(PacketType.S_BossPlayerActionNotification, {
    playerId,
    targetMonsterIdx: targetMonsterIdxs,
    actionSet: { animCode, effectCode },
  });
  users.forEach(u => u.socket.write(response));
}

export function sendBossMonsterAction(users, monsterIdx, animCode, effectCode, playerIds = []) {
  const response = createResponse(PacketType.S_BossMonsterAction, {
    playerIds: playerIds.length > 0 ? playerIds : users.map(user => user.id),
    actionMonsterIdx: monsterIdx,
    actionSet: { animCode, effectCode },
  });
  users.forEach(u => u.socket.write(response));
}

export function sendBossBarrierCount(users, barrierCount) {
  const response = createResponse(PacketType.S_BossBarrierCount, { barrierCount });
  users.forEach(u => u.socket.write(response));
}

export function sendBossPhase(users, randomElement, phase) {
  const response = createResponse(PacketType.S_BossPhase, { randomElement, phase });
  users.forEach(u => u.socket.write(response));
}

export function sendBossScreenText(users, msg) {
  const response = createResponse(PacketType.S_ScreenText, {
    screenText: { msg, typingAnimation: false },
  });
  users.forEach(u => u.socket.write(response));
}

export function sendBossLeaveDungeon(user) {
  user.socket.write(createResponse(PacketType.S_LeaveDungeon, {}));
}
