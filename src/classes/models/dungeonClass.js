import BaseSession from './BaseSessionClass.js';

class Dungeon extends BaseSession {
  constructor(dungeonId, dungeonCode) {
    super(dungeonId);
    this.battleLog = [];
    this.monsters = [];
    this.dungeonCode = dungeonCode;
  }

  addUserAtDungeon(user) {
    this.users.push(user);
  }

  addMonster(monster, index) {
    const fixMonster = { monsterIdx: index, ...monster };
    this.monsters.push(monster);
  }
}

export default Dungeon;
