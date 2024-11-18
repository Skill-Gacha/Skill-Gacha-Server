// src/utils/korean/checkBatchim.js

function checkBatchim(word) {
  if (typeof word !== 'string') return null;
  return (word[word.length - 1].charCodeAt(0) - 44032) % 28 !== 0;
}

/*
  
  손흥민은 마지막 글자(민)에 받침이 ㄴ이 있기 때문에
  
  손흥민이, 손흥민을, 손흥민과
  
  로 출력돼야 하지만,
  
  메시는 마지막 글자(시)에 받침이 없기 때문에
  
  메시가, 메시를, 메시와
  
  로 작성돼야 합니다.
  
  현재 true는 받침이 있는 글자, false는 받침이 없는 글자로,
  사용 법은 src/routers/player.router.js에 뽑기 추가 부분을 보시면 됩니다.
  
   */

export default checkBatchim;
