// src/init/loadProto.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';
import { PacketType } from '../constants/header.js'; // Assuming this file exports PacketType

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
const protoMessagesById = {};

export const loadProtos = async () => {
  try {
    const root = new protobuf.Root();

    // Load all .proto files asynchronously
    await Promise.all(protoFiles.map((file) => root.load(file)));

    root.resolveAll();

    const processNamespace = (namespace) => {
      if (namespace.nested) {
        for (const [typeName, type] of Object.entries(namespace.nested)) {
          if (type instanceof protobuf.Type || type instanceof protobuf.Enum) {
            protoMessages[typeName] = type;
          } else if (type instanceof protobuf.Namespace) {
            processNamespace(type);
          }
        }
      }
    };

    processNamespace(root);

    // 패킷 ID를 프로토 메시지로 매핑
    for (const [packetName, packetId] of Object.entries(PacketType)) {
      if (protoMessages[packetName]) {
        protoMessagesById[packetId] = protoMessages[packetName];
      } else {
        console.warn(`패킷 타입에 해당하는 프로토 메시지를 찾을 수 없습니다: ${packetName}`);
      }
    }

    console.log('All Protobuf files have been loaded.');
  } catch (e) {
    console.error('An error occurred while loading Protobuf files.', e);
  }
};

export const getProtoMessages = () => {
  return { ...protoMessages };
};

export const getProtoMessagesById = (packetId) => {
  return protoMessagesById[packetId];
};
