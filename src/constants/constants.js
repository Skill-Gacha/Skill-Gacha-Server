export const PACKET_SIZE_LENGTH = 4;
export const PACKET_ID_LENGTH = 1;
export const PACKET_HEADER_LENGTH = 5;


export const STATE_MESSAGE_WINDOW = 0;
export const STATE_CHOOSE_ACTION = 1;
export const STATE_CHOOSE_TARGET = 2;
export const STATE_PLAYER_ATTACK = 3;
export const STATE_OPPONENT_ATTACK = 4;
export const STATE_CHOOSE_SKILL_TYPE = 5;
export const STATE_CHOOSE_TARGET_WITH_SKILL = 6;
export const STATE_OPPONENT_DEAD = 7;
export const STATE_ITEM_SELECT = 8;
export const STATE_ITEM_USING = 9;
export const STATE_GO_TO_TOWN = 11;
export const STATE_ITEM_CHOOSE = 12;
export const STATE_GAME_OVER_WIN = 100;
export const STATE_GAME_OVER_LOSE = 101;
export const STATE_CONFIRM = 1000;

export const PVE_MODE = 0;
export const PVP_MODE = 1;
