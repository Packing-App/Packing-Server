// src/utils/externalApiUtils.js
const axios = require('axios');
const logger = require('../config/logger');
const { processCityName } = require('./locationUtils');

// 예보 API가 실제로 덮는 범위를 넘어선 날짜. 예전에는 이 구간에 '현재 날씨'를 복제해 넣어
// 1년 뒤 여행도 모든 날짜가 같은 값으로 채워졌다 — 예보인 척하는 값을 만들지 않는다.
const FORECAST_OUT_OF_RANGE = 'FORECAST_OUT_OF_RANGE';
const FORECAST_UNAVAILABLE = 'FORECAST_UNAVAILABLE';
const FORECAST_PAST = 'FORECAST_PAST';

// 조회에 필요한 도시명·URL을 한 번에 만든다.
const buildWeatherRequest = (location, countryCode, apiKey) => {
  const translatedCity = processCityName(location);
  const cityName = translatedCity.name;
  const cityCountryCode = countryCode || translatedCity.countryCode;
  const query = `q=${cityName},${cityCountryCode}&appid=${apiKey}&units=metric&lang=kr`;

  return {
    cityName,
    currentUrl: `https://api.openweathermap.org/data/2.5/weather?${query}`,
    forecastUrl: `https://api.openweathermap.org/data/2.5/forecast?${query}`
  };
};

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
    const { cityName, currentUrl, forecastUrl } = buildWeatherRequest(location, countryCode, apiKey);

    logger.info(`날씨 조회: ${location}(${cityName})`);

    // 날짜가 없거나 오늘이면 현재 날씨 반환
    if (!date || isSameDay(new Date(), date)) {
      const response = await axios.get(currentUrl);
      const parsedData = parseCurrentWeather(response.data);
      parsedData.originalLocation = location; // 원본 한글 지역명 추가
      return parsedData;
    }

    // 미래 날짜는 예보에서 찾는다. 예보가 덮지 못하는 날짜면 그 사실을 그대로 알린다.
    const response = await axios.get(forecastUrl);
    const forecastData = findForecastForDate(response.data, date);

    if (!forecastData) {
      const until = lastForecastDay(response.data);
      const isBeyond = until && dayKeyOf(date) > until;
      logger.warn(`${dayKeyOf(date)} 예보 없음 (제공 범위: ~${until})`);
      return isBeyond
        ? {
            error: FORECAST_OUT_OF_RANGE,
            message: `예보는 ${until}까지만 제공됩니다`,
            forecastAvailableUntil: until
          }
        : { error: FORECAST_UNAVAILABLE, message: '해당 날짜의 예보를 찾을 수 없습니다' };
    }

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

// 날짜 키는 전부 'YYYY-MM-DD'로 다룬다. 여행 날짜는 "여행지의 달력 날짜"이므로
// 예보 슬롯도 UTC가 아니라 도시 현지 시각으로 환산해 묶는다(city.timezone은 초 단위 오프셋).
const dayKeyOf = (date) => new Date(date).toISOString().split('T')[0];
const localDayKey = (unixSeconds, offsetSeconds = 0) =>
  new Date((unixSeconds + offsetSeconds) * 1000).toISOString().split('T')[0];

// 예보 슬롯(3시간 간격)을 도시 현지 날짜별로 묶는다.
const groupSlotsByLocalDay = (data) => {
  const offset = data?.city?.timezone || 0;
  const byDay = new Map();

  for (const slot of data?.list || []) {
    const key = localDayKey(slot.dt, offset);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(slot);
  }

  return byDay;
};

// 예보가 실제로 덮는 마지막 날짜. 상수 5를 쓰지 않고 응답에서 직접 읽는다.
const lastForecastDay = (data) => {
  const days = [...groupSlotsByLocalDay(data).keys()].sort();
  return days.length ? days[days.length - 1] : null;
};

/**
 * 하루치 슬롯을 하루 요약으로 집계한다.
 * 최저/최고는 그날 전체 슬롯에서 뽑는다 — 슬롯 하나의 temp_min/temp_max를 그대로 쓰면
 * 대표 기온과 같은 값이 나와("33.05 / 33.05") 최저·최고가 의미를 잃는다.
 */
const summarizeDay = (slots, city = {}, offsetSeconds = 0) => {
  if (!slots || slots.length === 0) return null;

  // 대표 슬롯은 현지 12시에 가장 가까운 것
  const representative = slots.reduce((best, slot) => {
    const hourOf = (s) => new Date((s.dt + offsetSeconds) * 1000).getUTCHours();
    return Math.abs(hourOf(slot) - 12) < Math.abs(hourOf(best) - 12) ? slot : best;
  }, slots[0]);

  const tempMin = Math.min(...slots.map((s) => s.main.temp_min));
  const tempMax = Math.max(...slots.map((s) => s.main.temp_max));
  // 강수량은 그날 슬롯 합계가 "하루 동안 얼마나 오나"에 맞다
  const rain = slots.reduce((sum, s) => sum + (s.rain?.['3h'] || 0), 0);

  return {
    temp: representative.main.temp,
    tempMin,
    tempMax,
    humidity: representative.main.humidity,
    weatherMain: representative.weather[0].main,
    weatherDescription: representative.weather[0].description,
    weatherIcon: representative.weather[0].icon,
    cityName: city.name,
    countryCode: city.country,
    windSpeed: representative.wind.speed,
    clouds: representative.clouds.all,
    rain: Math.round(rain * 10) / 10,
    timestamp: new Date(representative.dt * 1000),
    iconUrl: `http://openweathermap.org/img/wn/${representative.weather[0].icon}@2x.png`,
    isForecast: true // 예보 데이터임을 표시
  };
};

/**
 * 특정 날짜의 예보 데이터 찾기. 해당 날짜의 슬롯이 없으면 null.
 */
const findForecastForDate = (data, targetDate) => {
  const byDay = groupSlotsByLocalDay(data);
  const slots = byDay.get(dayKeyOf(targetDate));

  return summarizeDay(slots, data?.city || {}, data?.city?.timezone || 0);
};

/**
 * 시작일~종료일 사이의 날짜 키 목록.
 */
const enumerateDates = (startDate, endDate) => {
  const dates = [];
  const cursor = new Date(dayKeyOf(startDate));
  const last = dayKeyOf(endDate);

  while (dayKeyOf(cursor) <= last) {
    dates.push(dayKeyOf(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

/**
 * 예보 응답 + (있으면) 현재 날씨를 날짜별 배열로 만든다. 네트워크를 타지 않는 순수 함수.
 * 예보가 못 미치는 날짜는 값을 지어내지 않고 weather: null + 사유를 남긴다.
 */
const buildForecastRange = ({ forecastData, currentWeather = null, dates }) => {
  const offset = forecastData?.city?.timezone || 0;
  const byDay = groupSlotsByLocalDay(forecastData);
  const availableDays = [...byDay.keys()].sort();
  const forecastAvailableUntil = availableDays.length ? availableDays[availableDays.length - 1] : null;
  const todayKey = localDayKey(Math.floor(Date.now() / 1000), offset);

  const forecasts = dates.map((date) => {
    // 오늘은 예보 슬롯보다 실측(현재 날씨)이 정확하다
    if (date === todayKey && currentWeather) {
      return { date, weather: currentWeather };
    }

    const summary = summarizeDay(byDay.get(date), forecastData?.city || {}, offset);
    if (summary) return { date, weather: summary };

    if (forecastAvailableUntil && date > forecastAvailableUntil) {
      return {
        date,
        weather: null,
        error: FORECAST_OUT_OF_RANGE,
        message: `예보는 ${forecastAvailableUntil}까지만 제공됩니다`
      };
    }

    // 진행 중인 여행이면 지난 날짜가 섞인다. "정보 없음"보다 이유를 밝히는 편이 낫다.
    if (date < todayKey) {
      return { date, weather: null, error: FORECAST_PAST, message: '지난 날짜입니다' };
    }

    return {
      date,
      weather: null,
      error: FORECAST_UNAVAILABLE,
      message: '해당 날짜의 예보를 찾을 수 없습니다'
    };
  });

  return { forecasts, forecastAvailableUntil };
};

/**
 * 여행 기간 전체의 날씨를 한 번에 조회한다.
 * 날짜마다 외부 API를 부르던 것을 예보 1회(+오늘이 포함되면 현재 날씨 1회)로 줄인다.
 */
const getForecastRange = async (location, countryCode = null, startDate, endDate) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    logger.error('OpenWeather API 키가 설정되지 않았습니다.');
    return { error: 'API_KEY_MISSING', message: 'API 키가 설정되지 않았습니다.' };
  }

  const dates = enumerateDates(startDate, endDate);
  const { cityName, currentUrl, forecastUrl } = buildWeatherRequest(location, countryCode, apiKey);

  logger.info(`기간 날씨 조회: ${location}(${cityName}) ${dates[0]}~${dates[dates.length - 1]}`);

  try {
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;

    // 여행 기간에 오늘이 들어 있을 때만 현재 날씨를 추가로 부른다
    const offset = forecastData?.city?.timezone || 0;
    const todayKey = localDayKey(Math.floor(Date.now() / 1000), offset);
    let currentWeather = null;

    if (dates.includes(todayKey)) {
      const currentResponse = await axios.get(currentUrl);
      currentWeather = parseCurrentWeather(currentResponse.data);
      currentWeather.originalLocation = location;
    }

    const { forecasts, forecastAvailableUntil } = buildForecastRange({
      forecastData,
      currentWeather,
      dates
    });

    return { forecasts, forecastAvailableUntil };
  } catch (error) {
    logger.error(`기간 날씨 조회 오류: ${error.message}`);
    return { error: 'FORECAST_REQUEST_FAILED', message: '날씨 정보를 가져오는 중 오류가 발생했습니다.' };
  }
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
    const translatedCity = processCityName(query);
    const cityName = translatedCity.name;

    // 검색어로 cityName만 사용 (theme은 사용하지 않음)
    const searchQuery = cityName;

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
  getForecastRange,
  analyzeWeatherCondition,
  getDestinationImage,
  // 테스트용 순수 함수
  enumerateDates,
  summarizeDay,
  buildForecastRange
};