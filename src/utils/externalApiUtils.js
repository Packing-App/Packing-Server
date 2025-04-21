// src/utils/externalApiUtils.js
const axios = require('axios');
const logger = require('../config/logger');
const { translateCityName } = require('./locationUtils');

/**
 * Open Weather Map API를 통해 날씨 정보를 가져옵니다.
 * @param {string} location 지역 이름 (한글)
 * @param {string} countryCode 국가 코드 (예: KR, US)
 * @param {Date} date 날짜 (미래 날짜는 예보 데이터)
 */
const getWeatherData = async (location, countryCode = null, date = null) => {
  try {
    // 환경 변수에서 API 키 가져오기
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      logger.error('OpenWeather API 키가 설정되지 않았습니다.');
      return { error: 'API_KEY_MISSING', message: 'API 키가 설정되지 않았습니다.' };
    }

    // 한글 도시명을 영문으로 변환 
    const translatedCity = translateCityName(location);
    const cityName = translatedCity.name;
    const cityCountryCode = countryCode || translatedCity.countryCode;
    
    logger.info(`날씨 조회: ${location}(${cityName}) / 국가코드: ${cityCountryCode}`);

    // 현재 날씨 API URL
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName},${cityCountryCode}&appid=${apiKey}&units=metric&lang=kr`;
    
    // 5일 예보 API URL (3시간 간격)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName},${cityCountryCode}&appid=${apiKey}&units=metric&lang=kr`;

    // 날짜가 없거나 오늘이면 현재 날씨 반환
    if (!date || isSameDay(new Date(), date)) {
      const response = await axios.get(currentUrl);
      const parsedData = parseCurrentWeather(response.data);
      parsedData.originalLocation = location; // 원본 한글 지역명 추가
      return parsedData;
    }
    
    // 미래 날짜인 경우 예보 데이터 반환
    const timeDiff = date.getTime() - new Date().getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // 5일 이내의 예보만 가능
    if (daysDiff > 5) {
      logger.warn(`5일 이상 후의 날씨는 예측할 수 없습니다: ${daysDiff}일 후`);
      // 대체값으로 현재 날씨 반환
      const response = await axios.get(currentUrl);
      const parsedData = parseCurrentWeather(response.data);
      parsedData.originalLocation = location; // 원본 한글 지역명 추가
      parsedData.isCurrentWeather = true; // 예보가 아닌 현재 날씨임을 표시
      parsedData.noticeMessage = '5일 이상의 예보는 제공되지 않아 현재 날씨를 표시합니다.';
      return parsedData;
    }
    
    const response = await axios.get(forecastUrl);
    const forecastData = findForecastForDate(response.data, date);
    forecastData.originalLocation = location; // 원본 한글 지역명 추가
    return forecastData;
  } catch (error) {
    logger.error(`날씨 정보 조회 오류: ${error.message}`);
    
    // 오류의 종류에 따라 더 구체적인 정보 반환
    if (error.response) {
      if (error.response.status === 404) {
        logger.error(`도시를 찾을 수 없음: ${location}`);
        return { error: 'CITY_NOT_FOUND', message: '해당 도시를 찾을 수 없습니다.' };
      } else if (error.response.status === 401) {
        logger.error('API 키 오류');
        return { error: 'API_KEY_ERROR', message: 'API 인증에 실패했습니다.' };
      }
    } else if (error.request) {
      logger.error('서버 응답 없음');
      return { error: 'SERVER_NO_RESPONSE', message: '날씨 서버에서 응답이 없습니다.' };
    }
    
    return { error: 'UNKNOWN_ERROR', message: '날씨 정보를 가져오는 중 오류가 발생했습니다.' };
  }
};

/**
 * 현재 날씨 데이터 파싱
 */
const parseCurrentWeather = (data) => {
  return {
    temp: data.main.temp,
    tempMin: data.main.temp_min,
    tempMax: data.main.temp_max,
    humidity: data.main.humidity,
    weatherMain: data.weather[0].main,
    weatherDescription: data.weather[0].description,
    weatherIcon: data.weather[0].icon,
    cityName: data.name,
    countryCode: data.sys.country,
    windSpeed: data.wind.speed,
    clouds: data.clouds.all,
    rain: data.rain ? data.rain['1h'] || data.rain['3h'] || 0 : 0,
    timestamp: new Date(data.dt * 1000),
    iconUrl: `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
  };
};

/**
 * 특정 날짜의 예보 데이터 찾기
 */
const findForecastForDate = (data, targetDate) => {
  // 같은 날짜의 예보 중 12:00에 가장 가까운 시간의 예보 선택
  const targetDayForecasts = data.list.filter(item => {
    const forecastDate = new Date(item.dt * 1000);
    return isSameDay(forecastDate, targetDate);
  });

  if (targetDayForecasts.length === 0) {
    logger.warn(`${targetDate.toISOString().split('T')[0]} 날짜의 예보를 찾을 수 없습니다.`);
    return null;
  }

  // 12:00에 가장 가까운 예보 선택
  let closestForecast = targetDayForecasts[0];
  let minTimeDiff = Infinity;

  targetDayForecasts.forEach(forecast => {
    const forecastDate = new Date(forecast.dt * 1000);
    const hours = forecastDate.getHours();
    const diff = Math.abs(hours - 12);
    
    if (diff < minTimeDiff) {
      minTimeDiff = diff;
      closestForecast = forecast;
    }
  });

  // 선택된 예보를 현재 날씨 형식으로 변환
  const forecastData = {
    temp: closestForecast.main.temp,
    tempMin: closestForecast.main.temp_min,
    tempMax: closestForecast.main.temp_max,
    humidity: closestForecast.main.humidity,
    weatherMain: closestForecast.weather[0].main,
    weatherDescription: closestForecast.weather[0].description,
    weatherIcon: closestForecast.weather[0].icon,
    cityName: data.city.name,
    countryCode: data.city.country,
    windSpeed: closestForecast.wind.speed,
    clouds: closestForecast.clouds.all,
    rain: closestForecast.rain ? closestForecast.rain['3h'] || 0 : 0,
    timestamp: new Date(closestForecast.dt * 1000),
    iconUrl: `http://openweathermap.org/img/wn/${closestForecast.weather[0].icon}@2x.png`,
    isForecast: true // 예보 데이터임을 표시
  };

  return forecastData;
};

/**
 * 두 날짜가 같은 날인지 확인
 */
const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * 날씨 상태 분석
 * @param {object} weatherData 날씨 데이터
 * @returns {string} 날씨 상태 (rain, snow, hot, cold, normal)
 */
const analyzeWeatherCondition = (weatherData) => {
  if (!weatherData || weatherData.error) return 'normal';

  const { weatherMain, temp } = weatherData;

  if (weatherMain.toLowerCase().includes('rain')) {
    return 'rain';
  } else if (weatherMain.toLowerCase().includes('snow')) {
    return 'snow';
  } else if (temp >= 30) {
    return 'hot';
  } else if (temp <= 5) {
    return 'cold';
  } else {
    return 'normal';
  }
};

/**
 * Unsplash API를 통해 여행지 이미지를 가져옵니다.
 * @param {string} query 검색어 (여행지 이름, 한글)
 * @param {string} theme 테마 (beach, mountain, city 등)
 */
const getDestinationImage = async (query, theme = null) => {
  try {
    // 환경 변수에서 API 키 가져오기
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!apiKey) {
      logger.error('Unsplash API 키가 설정되지 않았습니다.');
      return getDefaultThemeImage(theme);
    }

    // 한글 도시명을 영문으로 변환
    const translatedCity = translateCityName(query);
    const cityName = translatedCity.name;

    // 검색어 조합 (여행지 + 테마)
    let searchQuery = cityName;
    if (theme) {
      searchQuery = `${cityName} ${theme}`;
    }

    logger.info(`이미지 검색: ${query}(${searchQuery})`);

    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&client_id=${apiKey}`;
    
    const response = await axios.get(url);
    
    return {
      imageUrl: response.data.urls.regular,
      authorName: response.data.user.name,
      authorUrl: response.data.user.links.html,
      originalQuery: query,
      translatedQuery: searchQuery
    };
  } catch (error) {
    logger.error(`여행지 이미지 조회 오류: ${error.message}`);
    
    // 기본 테마별 이미지 URL 반환 (API 오류 시 폴백)
    return getDefaultThemeImage(theme);
  }
};

/**
 * 테마별 기본 이미지 URL 반환 (API 오류 시 폴백)
 */
const getDefaultThemeImage = (theme) => {
  const defaultImages = {
    beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    mountain: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    city: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390',
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
    waterSports: 'https://images.unsplash.com/photo-1530866495561-584f04a27882',
    cycling: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182',
    hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    shopping: 'https://images.unsplash.com/photo-1519567241046-7f570eee3aa6',
    themepark: 'https://images.unsplash.com/photo-1569961350989-df966060f0c4',
    fishing: 'https://images.unsplash.com/photo-1500646953400-c8e7b8ecb2e9',
    skiing: 'https://images.unsplash.com/photo-1551524559-8af4e6624178',
    picnic: 'https://images.unsplash.com/photo-1529080131845-bd2be68bcd85',
    default: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552'
  };

  // 테마가 없거나 매핑되지 않은 경우 기본 이미지 반환
  const imageUrl = theme && defaultImages[theme] ? defaultImages[theme] : defaultImages.default;
  
  return {
    imageUrl,
    authorName: 'Default Image',
    authorUrl: 'https://unsplash.com/',
    isDefaultImage: true
  };
};

module.exports = {
  getWeatherData,
  analyzeWeatherCondition,
  getDestinationImage
};