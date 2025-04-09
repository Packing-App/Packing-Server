// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

// 사용자 알림 목록 조회
router.get('/', protect, notificationController.getUserNotifications);

// 알림 읽음 처리
router.put('/:id/read', protect, notificationController.markNotificationAsRead);

// 모든 알림 읽음 처리
router.put('/read-all', protect, notificationController.markAllNotificationsAsRead);

// 알림 삭제
router.delete('/:id', protect, notificationController.deleteNotification);

// 여행 일정 전 알림 생성 (수동 테스트용, 실제로는 스케줄러에서 호출)
router.post('/schedule-journey', protect, notificationController.createJourneyReminder);

// 날씨 알림 생성 (수동 테스트용, 실제로는 스케줄러에서 호출)
router.post('/weather-alert', protect, notificationController.createWeatherAlert);

module.exports = router;