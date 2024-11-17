// src/tests/sessionManagerTest.js

import sessionManager1 from './managers/SessionManager.js';
import sessionManager2 from './managers/SessionManager.js';

console.log('Are both session managers the same instance?', sessionManager1 === sessionManager2); // true이어야 함
