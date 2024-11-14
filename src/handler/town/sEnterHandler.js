import { PacketType } from '../../constants/header.js';
import { createUser, findUserNickname } from '../../db/user/user.db.js';
import { getJobById } from '../../init/loadAssets.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { sSpawnHandler } from './sSpawnHandler.js';

export const sEnterHandler = async ({ socket, payload }) => {
  const { nickname, job } = payload;

  const player = await findUserNickname(nickname);
  //   const { playerCharacter } = getGameAssets();
  const chosenJob = getJobById(job);
  if (!chosenJob) {
    console.error('존재하지 않는 직업군입니다.');
    return;
  } else if (player) {
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
    console.log(registUser);
    const registedUser = await findUserNickname(nickname);
    const enterData = {
      playerId: registedUser.id,
      nickname: registedUser.nickname,
      class: registedUser.job,
      transform: {
        posX: registUser.posX,
        posY: registUser.posY,
        posZ: registUser.posZ,
        rot: registUser.rot,
      },
      statInfo: {
        level: registUser.level,
        hp: registUser.maxHp,
        maxHp: registUser.maxHp,
        mp: registUser.maxMp,
        maxMp: registUser.maxMp,
        atk: registUser.atk,
        def: registUser.def,
        magic: registUser.magic,
        speed: registUser.speed,
      },
    };
    const enterResponse = createResponse(PacketType.C_Enter, enterData);

    socket.write(enterResponse);
    sSpawnHandler(socket, enterData);
  }
};
