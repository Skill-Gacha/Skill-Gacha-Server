// src/constants/header.js

export const PacketType = {
  // 클라이언트 → 서버 패킷
  C_Enter: 0,
  C_Move: 6,
  C_Animation: 8,
  C_Chat: 12,
  C_EnterDungeon: 14,
  C_PlayerResponse: 15,

  // 서버 → 클라이언트 패킷
  S_Enter: 1,
  S_Spawn: 2,
  S_Despawn: 5,
  S_Move: 7,
  S_Animation: 9,
  S_Chat: 13,
  S_EnterDungeon: 16,
  S_LeaveDungeon: 17,
  S_ScreenText: 18,
  S_ScreenDone: 19,
  S_BattleLog: 20,
  S_SetPlayerHp: 21,
  S_SetPlayerMp: 22,
  S_SetMonsterHp: 23,
  S_PlayerAction: 24,
  S_MonsterAction: 25,
};
