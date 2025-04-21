// src/routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const { updateDeviceToken, updatePushSettings, sendTestNotification, removeDeviceToken } = require('../controllers/deviceController');
const { protect } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(protect);

router.put('/token', updateDeviceToken);
router.put('/push-settings', updatePushSettings);
router.post('/test-notification', sendTestNotification);
router.delete('/token', removeDeviceToken);

module.exports = router;