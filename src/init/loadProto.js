// src/init/loadProto.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoDir = path.join(__dirname, '../protobuf');

const getAllProtoFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      getAllProtoFiles(filePath, fileList);
    } else if (path.extname(file) === '.proto') {
      fileList.push(filePath);
    }
  });

  return fileList;
};

const protoFiles = getAllProtoFiles(protoDir);

const protoMessages = {};

export const loadProtos = async () => {
  try {
    const root = new protobuf.Root();

    // 모든 .proto 파일을 비동기적으로 로드
    await Promise.all(protoFiles.map((file) => root.load(file)));

    root.resolveAll();

    const processNamespace = (namespace) => {
      for (const [typeName, type] of Object.entries(namespace.nested)) {
        if (type instanceof protobuf.Type || type instanceof protobuf.Enum) {
          protoMessages[typeName] = type;
        } else if (type instanceof protobuf.Namespace) {
          processNamespace(type);
        }
      }
    };

    processNamespace(root);

    console.log('Protobuf 파일이 모두 로드되었습니다.');
  } catch (e) {
    console.error('Protobuf 파일 로드 중 오류가 발생하였습니다.', e);
  }
};

export const getProtoMessages = () => {
  return { ...protoMessages };
};


// 패킷 타입과 메시지 이름을 매핑하는 함수
export const getMessageNameByPacketType = (packetType) => {
  const protoMessages = getProtoMessages();
  const MsgIdEnum = protoMessages.MsgId;

  for (const [key, value] of Object.entries(MsgIdEnum)) {
    if (value === packetType) {
      return key;
    }
  }

  return null;
};