// src/controllers/locationController.js
const { searchCities, translateCityName } = require('../utils/locationUtils');
const { getWeatherData } = require('../utils/externalApiUtils');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

/**
 * 도시 검색 (자동완성)
 * @route GET /api/locations/search
 * @access Public
 */
const searchLocations = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 1) {
      return sendError(res, 400, '검색어를 입력해주세요');
    }
    
    const results = searchCities(query, parseInt(limit));
    
    return sendSuccess(res, 200, '도시 검색 결과', results);
  } catch (error) {
    logger.error(`도시 검색 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 도시 날씨 정보 조회
 * @route GET /api/locations/:city/weather
 * @access Public
 */
const getCityWeather = async (req, res) => {
  try {
    const { city } = req.params;
    const { date } = req.query;
    
    if (!city) {
      return sendError(res, 400, '도시 이름이 필요합니다');
    }
    
    // 날짜 파라미터 처리
    let targetDate = null;
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return sendError(res, 400, '유효한 날짜 형식이 아닙니다 (YYYY-MM-DD)');
      }
    }
    
    // 날씨 정보 조회
    const weatherData = await getWeatherData(city, null, targetDate);
    
    if (!weatherData) {
      return sendError(res, 404, '날씨 정보를 찾을 수 없습니다');
    }
    
    if (weatherData.error) {
      return sendError(res, 400, weatherData.message || '날씨 정보를 가져오는 중 오류가 발생했습니다');
    }
    
    return sendSuccess(res, 200, '날씨 정보 조회 성공', weatherData);
  } catch (error) {
    logger.error(`도시 날씨 정보 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행지 기간 내 날씨 정보 조회
 * @route GET /api/locations/:city/forecast
 * @access Public
 */
const getJourneyForecast = async (req, res) => {
  try {
    const { city } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!city) {
      return sendError(res, 400, '도시 이름이 필요합니다');
    }
    
    if (!startDate || !endDate) {
      return sendError(res, 400, '여행 시작일과 종료일이 필요합니다');
    }
    
    // 날짜 파라미터 처리
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendError(res, 400, '유효한 날짜 형식이 아닙니다 (YYYY-MM-DD)');
    }
    
    if (start > end) {
      return sendError(res, 400, '시작일은 종료일보다 이전이어야 합니다');
    }
    
    // 여행 기간 내 각 날짜의 날씨 정보 조회
    const forecasts = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      const weatherData = await getWeatherData(city, null, new Date(currentDate));
      
      if (weatherData && !weatherData.error) {
        forecasts.push({
          date: dateString,
          weather: weatherData
        });
      } else {
        // 날씨 정보를 가져올 수 없는 경우 null 처리
        forecasts.push({
          date: dateString,
          weather: null,
          error: weatherData?.error || 'WEATHER_UNAVAILABLE',
          message: weatherData?.message || '날씨 정보를 가져올 수 없습니다'
        });
      }
      
      // 다음 날짜로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return sendSuccess(res, 200, '여행 기간 날씨 정보 조회 성공', {
      city,
      startDate,
      endDate,
      forecasts
    });
  } catch (error) {
    logger.error(`여행 기간 날씨 정보 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 도시 영문명 변환
 * @route GET /api/locations/translate
 * @access Public
 */
const translateCity = async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return sendError(res, 400, '도시 이름이 필요합니다');
    }
    
    const translatedCity = translateCityName(city);
    
    return sendSuccess(res, 200, '도시명 변환 성공', {
      korName: city,
      engName: translatedCity.name,
      countryCode: translatedCity.countryCode
    });
  } catch (error) {
    logger.error(`도시명 변환 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  searchLocations,
  getCityWeather,
  getJourneyForecast,
  translateCity
};