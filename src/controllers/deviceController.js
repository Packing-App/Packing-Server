// src/controllers/deviceController.js
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');
const { initAPNProvider, sendPushToIOS } = require('../services/pushNotificationService');

/**
 * 기기 토큰 등록/업데이트
 * @route PUT /api/devices/token
 * @access Private
 */
const updateDeviceToken = async (req, res) => {
  try {
    const { deviceToken, deviceType = 'ios' } = req.body;
    
    if (!deviceToken) {
      return sendError(res, 400, '기기 토큰이 필요합니다');
    }
    
    // 허용된 디바이스 타입 확인
    const allowedDeviceTypes = ['ios', 'android', 'web'];
    if (!allowedDeviceTypes.includes(deviceType)) {
      return sendError(res, 400, `유효하지 않은 기기 타입입니다. 지원되는 타입: ${allowedDeviceTypes.join(', ')}`);
    }
    
    // 사용자 정보 업데이트
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        deviceToken: deviceToken,
        deviceType: deviceType,
        pushNotificationEnabled: true // 토큰 등록 시 알림 활성화
      },
      { new: true }
    );
    
    if (!user) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }
    
    logger.info(`사용자 ${user._id}의 기기 토큰 업데이트: ${deviceType} - ${deviceToken.substring(0, 10)}...`);
    
    return sendSuccess(res, 200, '기기 토큰이 업데이트되었습니다', { 
      deviceToken: user.deviceToken,
      deviceType: user.deviceType,
      pushNotificationEnabled: user.pushNotificationEnabled
    });
  } catch (error) {
    logger.error(`기기 토큰 업데이트 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 푸시 알림 설정 변경
 * @route PUT /api/devices/push-settings
 * @access Private
 */
const updatePushSettings = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return sendError(res, 400, '유효한 설정값이 필요합니다 (enabled: boolean)');
    }
    
    // 사용자 정보 업데이트
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pushNotificationEnabled: enabled },
      { new: true }
    );
    
    if (!user) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }
    
    logger.info(`사용자 ${user._id}의 푸시 알림 설정 변경: ${enabled ? '활성화' : '비활성화'}`);
    
    return sendSuccess(res, 200, `푸시 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다`, { 
      pushNotificationEnabled: user.pushNotificationEnabled 
    });
  } catch (error) {
    logger.error(`푸시 알림 설정 변경 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 테스트 푸시 알림 전송
 * @route POST /api/devices/test-notification
 * @access Private
 */
const sendTestNotification = async (req, res) => {
  try {
    // 사용자 정보 조회
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }
    
    if (!user.deviceToken) {
      return sendError(res, 400, '등록된 기기 토큰이 없습니다');
    }
    
    if (!user.pushNotificationEnabled) {
      return sendError(res, 400, '푸시 알림이 비활성화되어 있습니다');
    }
    
    if (user.deviceType !== 'ios') {
      return sendError(res, 400, '현재 iOS 기기만 테스트 알림을 지원합니다');
    }
    
    // 테스트 알림 전송
    const title = '테스트 알림';
    const body = '푸시 알림이 정상적으로 작동합니다!';
    
    const result = await sendPushToIOS(
      user.deviceToken,
      title,
      body,
      {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    );
    
    if (!result.success) {
      return sendError(res, 500, `테스트 알림 전송 실패: ${result.message}`);
    }
    
    logger.info(`사용자 ${user._id}에게 테스트 알림 전송 완료`);
    
    return sendSuccess(res, 200, '테스트 알림이 전송되었습니다', { 
      deviceToken: user.deviceToken,
      deviceType: user.deviceType
    });
  } catch (error) {
    logger.error(`테스트 알림 전송 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 알림 해제 및 기기 토큰 삭제
 * @route DELETE /api/devices/token
 * @access Private
 */
const removeDeviceToken = async (req, res) => {
  try {
    // 사용자 정보 업데이트
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        deviceToken: null,
        pushNotificationEnabled: false
      },
      { new: true }
    );
    
    if (!user) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }
    
    logger.info(`사용자 ${user._id}의 기기 토큰 삭제 완료`);
    
    return sendSuccess(res, 200, '기기 토큰이 삭제되었습니다');
  } catch (error) {
    logger.error(`기기 토큰 삭제 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  updateDeviceToken,
  updatePushSettings,
  sendTestNotification,
  removeDeviceToken
};