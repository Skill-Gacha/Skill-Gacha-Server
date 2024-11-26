// src/utils/korean/checkBatchim.js

// 주어진 단어의 마지막 글자가 받침이 있는지 확인
function checkBatchim(word) {
  if (typeof word !== 'string') return null;
  
  // 마지막 글자 가져옴
  const lastChar = word[word.length - 1];
  const code = lastChar.charCodeAt(0);
  
  // 한글인지 검사
  if (code < 44032 || code > 55203) return null; // 한글 범위 외의 문자
  
  // 결과 리턴
  return (code - 44032) % 28 !== 0;
}

export default checkBatchim;