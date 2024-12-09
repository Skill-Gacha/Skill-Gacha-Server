// src/utils/error/errorCodes.js

export const ErrorCodes = {
  SOCKET_ERROR: 10000,
  CLIENT_VERSION_MISMATCH: 10001,
  UNKNOWN_HANDLER_ID: 10002,
  PACKET_DECODE_ERROR: 10003,
  PACKET_STRUCTURE_MISMATCH: 10004,
  MISSING_FIELDS: 10005,
  USER_NOT_FOUND: 10006,
  INVALID_PACKET: 10007,
  INVALID_SEQUENCE: 10008,
  GAME_NOT_FOUND: 10009,
  ALREADY_INIT_USER: 10010,
  GAME_FULL_USERS: 10011,
  INVALID_ROLE: 10012,
  MAX_TOWERS: 10013,
  FAIL_TO_SEND_NOTY: 10014,
  DB_UPDATE_FAILED: 10015,
  PACKET_ENCODE_ERROR: 10016,
  DUNGEON_CODE_NOT_FOUND: 10017,
  INITIALIZE_FAILED: 10018,
  PROTO_LOAD_FAILED: 10019,
  DB_TEST_QUERY_FAILED: 10020,
  REDIS_INIT_FAILED: 10021,

  // DB
  FETCH_ITEM_DATA_FROM_DB_FAILED: 20000,
  SAVE_ITEM_DATA_TO_DB_FAILED: 20001,

  FETCH_ITEM_DATA_FROM_REDIS_FAILED: 20002,
  SAVE_ITEM_DATA_TO_REDIS_FAILED: 20003,
  FETCH_RATING_DATA_FROM_REDIS_FAILED: 20004,

  FETCH_SKILL_DATA_FROM_DB_FAILED: 20005,
  SAVE_SKILL_DATA_TO_DB_FAILED: 20006,

  FETCH_SKILL_DATA_FROM_REDIS_FAILED: 20007,
  SAVE_SKILL_DATA_TO_REDIS_FAILED: 20008,

  NO_VALID_SKILLSET_FOR_USER: 21000,
  NO_VALID_REPLACE_TARGET_INDEX: 21001,

  // 이벤트
  NO_MATCHED_HANLDER: 30000,
  FAILED_TO_PROCESS_END: 30001,
  FAILED_TO_PROCESS_ERROR: 30002,

  INTERNAL_SERVER_ERROR: 50000, // 추가
  MIGRATION_FAILED: 70000,

  ABSTRACT_CLASS: 90000,
  INVALID_SERVICE_LOCATOR: 90001,

  OUT_OF_RANGE: 500000,
  // 추가적인 에러 코드들
};


export const ErrorNames = Object.fromEntries(
  Object.entries(ErrorCodes).map(([key, value]) => [value, key]),
);