// src/classes/models/statClass.js

class Stat {
  constructor(hp, maxHp, mp, maxMp, resists) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.buff = null;
    this.berserk = false;
    this.dangerPotion = false;
    this.protect = false;
    this.debuff = false; // 저항력 0으로 만들어주기?

    this.resistances = {
      electricResist: resists.electricResist,
      earthResist: resists.earthResist,
      grassResist: resists.grassResist,
      fireResist: resists.fireResist,
      waterResist: resists.waterResist,
    };

    this.originalResistances = { ...this.resistances };
  }

  applyDebuff(debuff) {
    if (debuff.type === 'resistanceReduction') {
      this.debuff = true; // 디버프 활성화
      // 모든 저항력을 0으로 설정
      for (const key in this.resistances) {
        this.resistances[key] = 0;
      }
    } else if (debuff.type === 'swapHpMp') {
      // HP와 MP 교체 로직
      const tempHp = this.hp;
      this.hp = this.mp;
      this.mp = tempHp;
    }
  }

  // 필요에 따라 디버프 해제 메서드 추가 가능
  removeDebuff() {
    this.debuff = false;
    this.resistances = { ...this.originalResistances }; // 원래 저항력으로 복구
  }
}

export default Stat;
