// src/services/pushNotificationService.js
const apn = require('apn');
const logger = require('../config/logger');

let apnProvider = null;

/**
 * APN 서비스 초기화
 */
const initAPNProvider = () => {
  try {
    // 문자열 내의 \n을 실제 줄바꿈으로 변환
    const privateKey = process.env.APPLE_PRIVATE_KEY_STRING.replace(/\\n/g, '\n');
    
    console.log("변환된 개인 키 형식 확인:", privateKey.slice(0, 50) + "...");
    
    const options = {
      token: {
        key: privateKey, // 변환된 키 사용
        keyId: process.env.APPLE_KEY_ID,
        teamId: process.env.APPLE_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production'
    };
    
    apnProvider = new apn.Provider(options);
    logger.info('APN 서비스가 초기화되었습니다.');
    
    return true;
  } catch (error) {
    logger.error(`APN 서비스 초기화 오류: ${error.message}`);
    return false;
  }
};

/**
 * iOS 기기에 푸시 알림 전송
 * @param {string} deviceToken iOS 기기 토큰
 * @param {string} title 알림 제목
 * @param {string} body 알림 내용
 * @param {Object} data 추가 데이터
 * @returns {Promise<Object>} 알림 전송 결과
 */
const sendPushToIOS = async (deviceToken, title, body, data = {}) => {
  if (!apnProvider) {
    const initialized = initAPNProvider();
    if (!initialized) {
      logger.error('APN 서비스 초기화에 실패했습니다.');
      return { success: false, message: 'APN 서비스 초기화 실패' };
    }
  }
  
  try {
    const notification = new apn.Notification();
    
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료
    notification.sound = 'default';
    notification.alert = {
      title: title,
      body: body
    };
    notification.topic = process.env.APPLE_CLIENT_ID; // 앱 번들 ID
    notification.payload = { ...data };
    
    const result = await apnProvider.send(notification, deviceToken);
    
    if (result.failed.length > 0) {
      logger.error(`푸시 알림 전송 실패: ${JSON.stringify(result.failed)}`);
      return { success: false, message: '푸시 알림 전송 실패', errors: result.failed };
    }
    
    logger.info(`푸시 알림 성공적으로 전송: ${deviceToken}`);
    return { success: true, message: '푸시 알림 전송 성공' };
  } catch (error) {
    logger.error(`푸시 알림 전송 오류: ${error.message}`);
    return { success: false, message: `푸시 알림 전송 오류: ${error.message}` };
  }
};

/**
 * 여러 사용자에게 일괄 푸시 알림 전송
 * @param {Array<Object>} users 사용자 목록 (deviceToken 필드 포함)
 * @param {string} title 알림 제목
 * @param {string} body 알림 내용
 * @param {Object} data 추가 데이터
 * @returns {Promise<Object>} 알림 전송 결과
 */
const sendBulkPushToIOS = async (users, title, body, data = {}) => {
  if (!users || users.length === 0) {
    return { success: false, message: '전송할 사용자가 없습니다.' };
  }
  
  const results = {
    success: [],
    failure: []
  };
  
  for (const user of users) {
    if (!user.deviceToken) {
      results.failure.push({
        userId: user._id,
        error: 'DEVICE_TOKEN_MISSING'
      });
      continue;
    }
    
    try {
      const result = await sendPushToIOS(user.deviceToken, title, body, {
        userId: user._id.toString(),
        ...data
      });
      
      if (result.success) {
        results.success.push({
          userId: user._id,
          deviceToken: user.deviceToken
        });
      } else {
        results.failure.push({
          userId: user._id,
          deviceToken: user.deviceToken,
          error: result.message
        });
      }
    } catch (error) {
      results.failure.push({
        userId: user._id,
        deviceToken: user.deviceToken,
        error: error.message
      });
    }
  }
  
  return {
    success: results.success.length > 0,
    totalSent: results.success.length,
    totalFailed: results.failure.length,
    results
  };
};

/**
 * API 제공자 종료 (서버 종료 시 호출)
 */
const shutdownAPNProvider = () => {
  if (apnProvider) {
    apnProvider.shutdown();
    apnProvider = null;
    logger.info('APN 서비스가 종료되었습니다.');
  }
};

module.exports = {
  initAPNProvider,
  sendPushToIOS,
  sendBulkPushToIOS,
  shutdownAPNProvider
};