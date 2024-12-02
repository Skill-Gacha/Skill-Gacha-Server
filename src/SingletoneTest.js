import SessionManager1 from '#managers/sessionManager.js';
import SessionManager2 from '#managers/SessionManager.js';

if (SessionManager1 === SessionManager2) {
  console.log('같은 인스턴스를 공유 중!');
} else {
  console.log('다른데?');
}