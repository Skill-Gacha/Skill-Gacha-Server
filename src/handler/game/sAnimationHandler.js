// src/handler/game/monsterAttackBaseRequest.handler.js

export const sAnimationHandler = async ({ socket, payload }) => {
  // 테스트 코드
  const { playerId, animCode } = payload;
  console.log('핸들러에서 출력: ', payload);
  console.log('Player ID: ', playerId);
  console.log('Anim Code: ', animCode);
  // 테스트 코드
};

export default sAnimationHandler;
