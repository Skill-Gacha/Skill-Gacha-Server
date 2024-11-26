// src/schedulers/syncScheduler.js

import cron from 'node-cron';
import { syncSkillsToDB } from '../sync/syncSkills.js';
import { syncRatingsToDB } from '../sync/syncRatings.js';
import { syncItemsToDB } from '../sync/syncItems.js';

const SYNC_INTERVAL_IN_MIN = 5;

// 동기화 작업을 스케줄러로 실행하는 함수
export const startSyncScheduler = () => {
  // 1. */${SYNC_INTERVAL_IN_MIN} : SYNC_INTERVAL_IN_MIN마다 동작
  // 2. 모든 시간 (0 ~ 23)
  // 3. 모든 일  (1 ~ 31)
  // 4. 모든 월  (1 ~ 12)
  // 5. 모든 요일 (월 ~ 일)
  // 
  // */${SYNC_INTERVAL_IN_MIN} * * * *
  // -> 5분마다 모든 시간/일/월/요일에 동기화 작업 실행
  //
  // 0 12 * * * -> 매일 정오(12:00)에 실행 
  cron.schedule(`*/${SYNC_INTERVAL_IN_MIN} * * * *`, async () => {
    console.log('동기화 작업 시작...');
    await syncSkillsToDB();
    await syncRatingsToDB();
    await syncItemsToDB();
    console.log('동기화 작업 완료');
  });

  console.log(`동기화 스케줄러가 시작되었습니다. (매 ${SYNC_INTERVAL_IN_MIN}분마다 실행)`);
};
