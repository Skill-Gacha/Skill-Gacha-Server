// src/utils/delay.js

export const delay = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};