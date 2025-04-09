// src/controllers/notificationController.js
const Notification = require('../models/Notification');
const Journey = require('../models/Journey');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

/**
 * 사용자 알림 목록 조회
 * @route GET /api/notifications
 * @access Private
 */
const getUserNotifications = async (req, res) => {
  try {
    // 사용자의 알림만 조회하여 최신순으로 정렬
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('journeyId', 'title');

    return sendSuccess(res, 200, '알림 목록을 성공적으로 조회했습니다', notifications);
  } catch (error) {
    logger.error(`알림 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 알림 읽음 처리
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return sendError(res, 404, '알림을 찾을 수 없습니다');
    }

    // 권한 확인 (본인 알림만 처리 가능)
    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '이 알림을 처리할 권한이 없습니다');
    }

    // 이미 읽은 경우
    if (notification.isRead) {
      return sendSuccess(res, 200, '이미 읽은 알림입니다', notification);
    }

    // 읽음 처리
    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 200, '알림을 읽음 처리했습니다', notification);
  } catch (error) {
    logger.error(`알림 읽음 처리 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 모든 알림 읽음 처리
 * @route PUT /api/notifications/read-all
 * @access Private
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    // 사용자의 모든 읽지 않은 알림 업데이트
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res, 200, `${result.nModified}개의 알림을 읽음 처리했습니다`);
  } catch (error) {
    logger.error(`모든 알림 읽음 처리 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 알림 삭제
 * @route DELETE /api/notifications/:id
 * @access Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return sendError(res, 404, '알림을 찾을 수 없습니다');
    }

    // 권한 확인 (본인 알림만 삭제 가능)
    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '이 알림을 삭제할 권한이 없습니다');
    }

    // 알림 삭제
    await notification.deleteOne();

    return sendSuccess(res, 200, '알림이 성공적으로 삭제되었습니다');
  } catch (error) {
    logger.error(`알림 삭제 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 일정 전 알림 생성 (수동 테스트용, 실제로는 스케줄러에서 호출)
 * @route POST /api/notifications/schedule-journey
 * @access Private
 */
const createJourneyReminder = async (req, res) => {
  try {
    const { journeyId } = req.body;

    if (!journeyId) {
      return sendError(res, 400, '여행 ID를 입력해주세요');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 알림 생성 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 알림을 생성할 권한이 없습니다');
    }

    // 알림 생성
    const notification = await Notification.create({
      userId: req.user._id,
      journeyId: journey._id,
      type: 'reminder',
      content: `'${journey.title}' 여행 하루 전입니다. 준비물을 확인해보세요!`,
      isRead: false,
      scheduledAt: new Date() // 테스트용으로 현재 시간 설정
    });

    return sendSuccess(res, 201, '여행 일정 알림이 생성되었습니다', notification);
  } catch (error) {
    logger.error(`여행 일정 알림 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 날씨 알림 생성 (수동 테스트용, 실제로는 스케줄러에서 호출)
 * @route POST /api/notifications/weather-alert
 * @access Private
 */
const createWeatherAlert = async (req, res) => {
  try {
    const { journeyId, weatherCondition } = req.body;

    if (!journeyId || !weatherCondition) {
      return sendError(res, 400, '여행 ID와 날씨 상태를 입력해주세요');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 알림 생성 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 알림을 생성할 권한이 없습니다');
    }

    // 알림 내용 설정
    let content = '';
    switch (weatherCondition) {
      case 'rain':
        content = `'${journey.title}' 여행지의 내일 날씨에 비가 예보되어 있습니다. 우산을 준비하세요!`;
        break;
      case 'snow':
        content = `'${journey.title}' 여행지의 내일 날씨에 눈이 예보되어 있습니다. 방한 준비를 해주세요!`;
        break;
      case 'hot':
        content = `'${journey.title}' 여행지의 내일 날씨가 매우 덥습니다. 자외선 차단제와 물을 챙기세요!`;
        break;
      case 'cold':
        content = `'${journey.title}' 여행지의 내일 날씨가 매우 춥습니다. 따뜻한 옷을 준비하세요!`;
        break;
      default:
        content = `'${journey.title}' 여행지의 내일 날씨 정보가 업데이트되었습니다.`;
    }

    // 알림 생성
    const notification = await Notification.create({
      userId: req.user._id,
      journeyId: journey._id,
      type: 'weather',
      content,
      isRead: false,
      scheduledAt: new Date() // 테스트용으로 현재 시간 설정
    });

    return sendSuccess(res, 201, '날씨 알림이 생성되었습니다', notification);
  } catch (error) {
    logger.error(`날씨 알림 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createJourneyReminder,
  createWeatherAlert
};