// src/utils/packet/playerPacket.js

export const playerData = (user) => {
  const playerInfo = {
    playerId: user.id,
    nickname: user.nickname,
    class: user.element,
    transform: {
      posX: 0,
      posY: 0,
      posZ: 0,
      rot: 0,
    },
    statInfo: {
      hp: user.stat.hp,
      maxHp: user.stat.maxHp,
      mp: user.stat.mp,
      maxMp: user.stat.maxMp,
      resistances: user.stat.resistances,
    },
  };

  return playerInfo;
};

export const elementResist = (chosenElement) => {
  const resistInfo = {
    electricResist: chosenElement.electricResist,
    eartgResist: chosenElement.eartgResist,
    grassResist: chosenElement.grassResist,
    fireResist: chosenElement.fireResist,
    waterResist: chosenElement.waterResist,
  };

  return resistInfo;
};
