// src/utils/error/errorHandler.js

export const handleError = (error) => {
  let responseCode;
  let message;
  console.error(error);

  if (error.code) {
    console.error(`에러코드: ${error.code}, 메세지: ${error.message}`);
  } else {
    console.error(`일반에러: ${error.message}`);
  }
};
