import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/user.db.js';
import { getJobById } from '../../init/loadAssets.js';
import { addUser } from '../../sessions/userSession.js';
import { createResponse } from '../../utils/response/createResponse.js';
import User from '../../classes/models/userClass.js';
import { sSpawnHandler } from './sSpawnHandler.js';
import { addUserAtTown } from '../../sessions/townSession.js';

export const sEnterHandler = async ({ socket, payload }) => {
  const { nickname } = payload;
  const job = payload.class;

  const player = await findUserNickname(nickname);
  //   const { playerCharacter } = getGameAssets();
  const chosenJob = getJobById(job);
  if (!chosenJob) {
    console.error('존재하지 않는 직업군입니다.');
    return;
  } else if (player) {
    // 여기서 존재하는 아이디면 확인하고 가져와줘야 함
    // 로그인처럼 만들어야 하지만, 일단 다 하고 생각
    console.error('이미 존재하는 닉네임입니다.');
    return;
  } else {
    const registUser = await createUser(
      nickname,
      job,
      1,
      chosenJob.maxHp,
      chosenJob.maxMp,
      chosenJob.atk,
      chosenJob.def,
      chosenJob.magic,
      chosenJob.speed,
    );
    
    const registedUser = await findUserNickname(nickname);
    const enterData = {
      player: {  // 중첩 객체로 변경
        playerId: registedUser.id,
        nickname: registedUser.nickname,
        class: registedUser.job,
        transform: {
          posX: registedUser.posX,
          posY: registedUser.posY,
          posZ: registedUser.posZ,
          rot: registedUser.rot,
        },
        statInfo: {
          level: registedUser.level,
          hp: registedUser.maxHp,
          maxHp: registedUser.maxHp,
          mp: registedUser.maxMp,
          maxMp: registedUser.maxMp,
          atk: registedUser.atk,
          def: registedUser.def,
          magic: registedUser.magic,
          speed: registedUser.speed,
        },
      },
    };

    
    const enterResponse = createResponse(PacketType.S_Enter, enterData);
    const user = new User(socket, registedUser.id, nickname);
    await addUser(user);
    await addUserAtTown(user);

    socket.write(enterResponse);
  }
};
