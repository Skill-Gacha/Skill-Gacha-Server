// src/utils/packet/playerPacket.js

export const playerData = (user) => {
  const playerInfo = {
    playerId: user.id,
    nickname: user.nickname,
    class: user.element,
    transform: {
      posX: user.position.posX,
      posY: user.position.posY,
      posZ: user.position.posZ,
      rot: user.position.rotation,
    },
    statInfo: {
      level: 0,
      hp: user.stat.hp,
      maxHp: user.stat.maxHp,
      mp: user.stat.mp,
      maxMp: user.stat.maxMp,
      atk: 0,
      def: 0,
      magic: 0,
      speed: 0,
    },
  };

  return playerInfo;
};

export const elementResist = (chosenElement) => {
  const resistInfo = {
    electricResist: chosenElement.electricResist,
    earthResist: chosenElement.earthResist,
    grassResist: chosenElement.grassResist,
    fireResist: chosenElement.fireResist,
    waterResist: chosenElement.waterResist,
  };

  return resistInfo;
};
