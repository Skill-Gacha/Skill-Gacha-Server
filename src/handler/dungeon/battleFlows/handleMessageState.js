// src/handler/dungeon/battleFlows/handleMessageState.js

import switchToActionState from '../transition/switchToActionState.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PacketType } from '../../../constants/header.js';

export default async function handleMessageState(responseCode, dungeon, user, socket) {
  console.log('handleMessageState Called');
  if (responseCode === 0) {
    const screenDoneResponse = createResponse(PacketType.S_ScreenDone, {});
    socket.write(screenDoneResponse);
    await switchToActionState(dungeon, socket);
  }
}
