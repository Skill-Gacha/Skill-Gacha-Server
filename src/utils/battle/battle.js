const AliveMonster = (monster, dungeon) => {
  let btns = [];
  for (let monster of dungeon.monsters) {
    const isAlive = monster.monsterHp > 0;
    btns.push({ msg: monster.monsterName, enable: isAlive });
  }
  return btns;
};
