// src/init/index.js

import { loadProtos } from './loadProto.js';
import { PacketType } from '../constants/header.js';
import { getHandlerByPacketType } from '../handler/index.js';
import { createResponse } from '../utils/response/createResponse.js';
import { packetParser } from '../utils/parser/packetParser.js';

const initServer = async () => {
  try {
    await loadProtos();

    // 여기서부터 테스트 코드
    const responsePacketId = PacketType.S_Animation;
    const responseData = {
      playerId: 1,
      animCode: 2,
    };

    // 직렬화된 프로토버퍼 생성
    const responseBuffer = createResponse(responsePacketId, responseData);
    console.log('Serialized Buffer (Big Endian):', responseBuffer);

    // 패킷 길이 추출
    const packetHeader = responseBuffer.slice(0, 4);
    console.log('Packet Header:', packetHeader);

    // 패킷 ID 추출
    const packetId = responseBuffer.readUInt8(4);
    console.log('Packet Header:', packetId);

    // 메시지 추출
    const protobufData = responseBuffer.slice(5);
    console.log('Protobuf Data:', protobufData);


    // 패킷 파싱
    const parsed = packetParser(packetId, protobufData);

    const handler = getHandlerByPacketType(packetId);
    handler({ undefined, payload: parsed });

    // 여기까지 테스트 코드
    //await testConnection();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export default initServer;
