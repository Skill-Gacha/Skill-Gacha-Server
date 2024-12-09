// src/handler/dungeon/states/stateFactory.js

class StateFactory {
  constructor() {
    this.stateMap = {
      // PvE
      message: async () => {
        const module = await import('../dungeon/states/message/messageState.js');
        return module.default;
      },
      
      // PvP
      pvpAction: async () => {
        const module = await import('../pvp/states/pvpActionState.js');
        return module.default;
      },
      pvpFlee: async () => {
        const module = await import('../pvp/states/pvpFleeMessageState.js');
        return module.default;
      },
      pvpGameOver: async () => {
        const module = await import('../pvp/states/pvpGameOverState.js');
        return module.default;
      },
    };
  }

  async createState(stateKey, room, user, socket) {
    const StateClassLoader = this.stateMap[stateKey];
    if (!StateClassLoader) {
      throw new Error(`Unknown state key: ${stateKey}`);
    }
    const StateClass = await StateClassLoader();
    return new StateClass(room, user, socket);
  }
}

const stateFactory = new StateFactory();
export default stateFactory;
