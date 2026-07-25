// src/services/notificationService.js
// "Notification.create + 소켓 실시간 전송 + iOS 푸시" 3종 세트 중복을 통합한 헬퍼.
// 기존에 컨트롤러/스케줄러 9곳에 복붙돼 있던 로직을 한 곳으로 모은다.
const Notification = require('../models/Notification');
const { sendNotification } = require('../socket/socketSetup');
const { sendPushToIOS } = require('./pushNotificationService');
const logger = require('../config/logger');

/**
 * 한 사용자에게 알림을 생성(DB)하고, 소켓으로 실시간 전송하고, 조건이 맞으면 iOS 푸시를 보낸다.
 * @param {Object} recipient 수신자 User 문서 (_id, deviceToken, pushNotificationEnabled 포함)
 * @param {Object} data 알림 데이터
 * @param {string} data.type 알림 타입 (Notification 스키마 enum)
 * @param {string} data.content 알림 내용
 * @param {string|Object} [data.journeyId] 연관 여행 ID
 * @param {Object} [data.metadata] 추가 메타데이터 (예: { friendshipId })
 * @param {Object} [pushOptions] 푸시 옵션
 * @param {string} [pushOptions.title] 푸시 제목 (없으면 content 사용)
 * @param {Object} [pushOptions.pushData] 푸시 payload 추가 필드
 * @returns {Promise<Object>} 생성된 Notification 문서
 */
const notifyUser = async (recipient, { type, content, journeyId = null, metadata = null }, pushOptions = {}) => {
  const { title, pushData = {} } = pushOptions;

  const notification = await Notification.create({
    userId: recipient._id,
    type,
    content,
    ...(journeyId ? { journeyId } : {}),
    ...(metadata ? { metadata } : {})
  });

  // 소켓 실시간 전송
  if (global.io) {
    sendNotification(global.io, recipient._id.toString(), notification);
  }

  // iOS 푸시 (기기 토큰 + 알림 허용 시에만). 푸시 실패가 알림 생성을 되돌리지 않도록 격리.
  if (recipient.deviceToken && recipient.pushNotificationEnabled) {
    try {
      await sendPushToIOS(recipient.deviceToken, title || content, content, {
        notificationId: notification._id.toString(),
        type,
        ...pushData
      });
    } catch (pushError) {
      logger.error(`푸시 알림 전송 오류: ${pushError.message}`);
    }
  }

  return notification;
};

module.exports = { notifyUser };
