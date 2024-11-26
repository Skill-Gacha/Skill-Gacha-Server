// src/constants/header.js

export const PacketType = {
  // 클라이언트 → 서버 패킷
  C_Enter: 0,
  C_Move: 6,
  C_Animation: 8,
  C_Chat: 12,
  C_EnterDungeon: 14,
  C_PlayerResponse: 15,
  C_ViewRankPoint: 26,
  C_PlayerMatch: 30,
  C_PvpPlayerResponse: 39,
  C_OpenStoreRequest: 46,
  C_BuyItemRequest: 48,
  C_InventoryViewRequest: 50,
  C_EnhanceUiRequest: 52,
  C_EnhanceRequest: 54,

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
  S_ViewRankPoint: 27,
  S_PlayerStrikeFirstNotification: 28,
  S_PlayerCurrencyNotification: 29,
  S_PlayerMatch: 31,
  S_PlayerMatchNotification: 32,
  S_UserTurn: 33,
  S_EnemyActionNotification: 34,
  S_GameOverNotification: 35,
  S_EnemyHpNotification: 36,
  S_BeatenAnimationNotification: 37,
  S_HitAnimationNotification: 38,
  S_PvpBattleLog: 40,
  S_PvpPlayerAction: 41,
  S_PvpEnemyAction: 42,
  S_SetPvpPlayerHp: 43,
  S_SetPvpPlayerMp: 44,
  S_SetPvpEnemyHp: 45,
  S_OpenStoreResponse: 47,
  S_BuyItemResponse: 49,
  S_InventoryViewResponse: 51,
  S_EnhanceUiResponse: 53,
  S_EnhanceResponse: 55,
};
