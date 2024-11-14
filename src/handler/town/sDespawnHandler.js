import { PacketType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { getUserBySocket } from '../../sessions/userSession.js';
import { townSession } from '../../sessions/sessions.js';
import { getAllUserExceptMyself, removeUser } from '../../sessions/townSession.js';
import { handleError } from '../../utils/error/errorHandler.js';

export const sDespawnHandler = async (socket) => {
  
  const user = await getUserBySocket(socket);
  
  const despawnedUser = [];
  despawnedUser.push(user.id);
  
  try {
    const allTownSessions = await getAllUserExceptMyself(user.id);
    const despawnNoty = createResponse(PacketType.S_Despawn, {
      playerIds: despawnedUser,
    });
    
    for (const session of allTownSessions) {      
      session.socket.write(despawnNoty);
    }
    
    await removeUser(user.id);
  }
  catch (error) {
    handleError(socket, error);
  }
};
