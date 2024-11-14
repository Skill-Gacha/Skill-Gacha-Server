// src/classes/models/positionClass.js

class Position {

  constructor() {
    this.posX = 0;
    this.posY = 0;
    this.posZ = 0;
    this.rot = 0;
  }

  updatePosition(posX, posY, posZ, rot) {
    this.posX = posX;
    this.posY = posY;
    this.posZ = posZ;
    this.rot = rot;
  }
}

export default Position;
