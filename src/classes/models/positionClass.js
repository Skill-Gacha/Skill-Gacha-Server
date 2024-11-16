// src/classes/models/PositionClass.js

class Position {
  constructor(posX = 0, posY = 0, posZ = 0, rotation = 0) {
    this.posX = posX;
    this.posY = posY;
    this.posZ = posZ;
    this.rotation = rotation;
  }
}

export default Position;
