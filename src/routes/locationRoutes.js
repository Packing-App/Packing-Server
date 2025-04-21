// src/routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { searchLocations, getCityWeather, getJourneyForecast, translateCity } = require('../controllers/locationController');
const { protect } = require('../middlewares/auth');

// 공개 API 라우트
router.get('/search', searchLocations);
router.get('/translate', translateCity);

// 인증 필요 API 라우트
router.get('/:city/weather', protect, getCityWeather);
router.get('/:city/forecast', protect, getJourneyForecast);

module.exports = router;