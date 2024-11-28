// src/constants/battle.js
export const DUNGEON_CODE = 5000;

export const DUNGEON_STATUS = {
  MESSAGE: 0,
  ACTION: 1,
  TARGET: 2,
  SKILL_CHOICE: 3,
  PLAYER_ATTACK: 4,
  ENEMY_ATTACK: 5,
  MONSTER_DEAD: 6,
  GAME_OVER_WIN: 7,
  GAME_OVER_LOSE: 8,
  CONFIRM: 9,
  USE_ITEM: 10,
  FLEE_MESSAGE: 11,
  REWARD: 12,
  SKILL_CHANGE: 13,
  FAIL_FLEE: 14,
  PALYER_DEAD: 15,
  ITEM_CHOCE: 16,
  INCREASE_MANA: 17,
};

export const PVP_STATUS = {
  MESSAGE: 0,
  ACTION: 1,
  SKILL_CHOICE: 3,
  PLAYER_ATTACK: 4,
  ENEMY_DEAD: 6,
  GAME_OVER: 7,
  CONFIRM: 8,
  USE_ITEM: 9,
  FLEE_MESSAGE: 10,
  TURN_CHANGE: 11,
  ITEM_CHOICE: 12,
  INCREASE_MANA: 13,
};

export const CONFIRM_TYPE = {
  DEFAULT: 0,
  FLEE: 1,
  STONE: 2,
  SKILLCHANGE: 3,
  GIVEUP: 4,
};

export const SKILL_RANK = {
  NORMAL: 100,
  RARE: 101,
  EPIC: 102,
  UNIQUE: 103,
  LEGENDARY: 104,
};

export const SKILL_ELEMENTAL = {
  ELECTRIC: 1000,
  STONE: 1001,
  PLANT: 1002,
  FIRE: 1003,
  WATER: 1004,
};

export const DUNGEON_RESOURCES = {
  1: { gold: 200, stone: 0 },
  2: { gold: 400, stone: 1 },
  3: { gold: 800, stone: 2 },
  4: { gold: 1600, stone: 4 },
};

export const DUNGEON_DEAD_RESOURCES = {
  1: { gold: 300, stone: 0 },
  2: { gold: 500, stone: 2 },
  3: { gold: 1000, stone: 4 },
  4: { gold: 2000, stone: 8 },
};

export const STONE = {
  100: 1,
  101: 5,
  102: 10,
  103: 15,
  104: 20,
};

export const buffs = {
  26: 4,
  27: 1,
  28: 2,
  29: 3,
};

export const MAX_SKILL_REWARD = 3;
export const MAX_BUTTON_COUNT = 6;
export const MAX_SKILL_COUNT = 4;
export const MAX_REWARD_BUTTON = 4;
export const AREASKILL = 21;
export const BUFF_SKILL = 27;
export const DEBUFF = 26;

export const PVP_TURN_TIMEOUT_LIMIT = 5000;
export const PVP_TURN_OVER_CONFIRM_TIMEOUT_LIMIT = 2500;

export const PHASE_ONE_TURN_TIMEOUT_LIMIT = 30000;
export const PHASE_TWO_TURN_TIMEOUT_LIMIT = 20000;
export const PHASE_THREE_TURN_TIMEOUT_LIMIT = 10000;