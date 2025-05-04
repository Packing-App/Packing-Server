// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  createJourneyReminder,
  createWeatherAlert,
  getUnreadNotificationsCount
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(protect);

router.get('/', getUserNotifications);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/:id', deleteNotification);
router.get('/unread-count', getUnreadNotificationsCount);

// 테스트용 라우트
router.post('/journey-reminder', createJourneyReminder);
router.post('/weather-alert', createWeatherAlert);

module.exports = router;