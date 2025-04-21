// src/utils/locationUtils.js
const axios = require('axios');
const logger = require('../config/logger');
const cityTranslations = require('../data/cityTranslations');

// 도시 데이터 캐시 (API 호출 결과 저장)
let citiesCache = null;

/**
 * 한글 도시명을 영문으로 변환
 * @param {string} koreanCityName 한글 도시명
 * @returns {Object} 영문 도시명과 국가 코드
 */
const translateCityName = (koreanCityName) => {
  if (!koreanCityName) {
    return { name: '', countryCode: 'KR' };
  }
  
  const city = cityTranslations[koreanCityName];
  if (city) {
    return { name: city.en, countryCode: city.countryCode };
  }
  
  // 매핑이 없는 경우 그대로 반환 (기본 국가코드 KR)
  return { name: koreanCityName, countryCode: 'KR' };
};

/**
 * OpenWeatherMap 도시 목록 초기화 (서버 시작 시 호출)
 */
const initCityList = async () => {
  try {
    // 이미 캐시가 있는 경우 건너뜀
    if (citiesCache) {
      return { success: true, message: '도시 목록이 이미 로드되어 있습니다.' };
    }
    
    // 환경 변수에서 API 키 가져오기
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      logger.error('OpenWeather API 키가 설정되지 않았습니다.');
      return { success: false, message: 'API 키가 설정되지 않았습니다.' };
    }
    
    logger.info('OpenWeatherMap 도시 목록을 초기화 중입니다...');
    
    // 한국 도시 정보 가져오기 (예시)
    const korCities = await fetchCitiesByCountryCode('KR', apiKey);
    
    // 주요 국가 도시 정보 가져오기 (실제 구현 시 더 많은 국가 추가)
    const jpCities = await fetchCitiesByCountryCode('JP', apiKey);
    const usCities = await fetchCitiesByCountryCode('US', apiKey);
    const frCities = await fetchCitiesByCountryCode('FR', apiKey);
    
    // 도시 목록 통합
    citiesCache = [...korCities, ...jpCities, ...usCities, ...frCities];
    
    logger.info(`OpenWeatherMap 도시 목록 초기화 완료: ${citiesCache.length}개 도시`);
    return { success: true, message: `도시 목록을 성공적으로 로드했습니다. (${citiesCache.length}개 도시)` };
  } catch (error) {
    logger.error(`도시 목록 초기화 오류: ${error.message}`);
    return { success: false, message: '도시 목록 로드 실패: ' + error.message };
  }
};

/**
 * 국가 코드별 도시 정보 가져오기
 * @param {string} countryCode 국가 코드
 * @param {string} apiKey OpenWeatherMap API 키
 * @returns {Promise<Array>} 도시 목록
 */
const fetchCitiesByCountryCode = async (countryCode, apiKey) => {
  try {
    // OpenWeatherMap API는 국가별 도시 목록을 직접 제공하지 않음
    // 실제 구현 시 OpenWeatherMap의 전체 도시 목록 JSON 파일을 다운로드하여 사용하는 것이 좋음
    // 이 예제에서는 간단한 API 호출로 대체 (실제로 이런 API는 없음)
    
    // 예시 데이터 반환 (실제 구현에서 수정 필요)
    return [];
  } catch (error) {
    logger.error(`국가별 도시 조회 오류 (${countryCode}): ${error.message}`);
    return [];
  }
};

/**
 * 도시명 자동완성 검색
 * @param {string} query 검색어
 * @param {number} limit 반환할 결과 수
 * @returns {Array} 검색 결과
 */
const searchCities = (query, limit = 10) => {
  if (!query || query.length < 1) {
    return [];
  }
  
  const results = [];
  
  // 한글 검색어로 한글-영문 매핑 목록에서 검색
  Object.keys(cityTranslations).forEach(city => {
    // 대소문자 구분 없이 포함 여부 확인
    if (city.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        korName: city,
        engName: cityTranslations[city].en,
        countryCode: cityTranslations[city].countryCode
      });
    }
  });
  
  // 캐시된 OpenWeatherMap 도시 목록에서도 검색 (영문명)
  // (실제 구현 시 활용)
  
  // 결과 정렬 (정확도 순)
  results.sort((a, b) => {
    // 검색어로 시작하는 도시를 우선 정렬
    const aStartsWith = a.korName.toLowerCase().startsWith(query.toLowerCase());
    const bStartsWith = b.korName.toLowerCase().startsWith(query.toLowerCase());
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // 이름 길이가 짧은 순서로 정렬
    return a.korName.length - b.korName.length;
  });
  
  // limit 개수만큼 반환
  return results.slice(0, limit);
};

/**
 * 영문 도시명으로 도시 정보 검색
 * @param {string} engName 영문 도시명
 * @returns {Object|null} 도시 정보
 */
const findCityByEngName = (engName) => {
  if (!engName) return null;
  
  // 소문자로 변환하여 비교
  const lowerName = engName.toLowerCase();
  
  // 한글-영문 매핑에서 검색
  for (const korName in cityTranslations) {
    if (cityTranslations[korName].en.toLowerCase() === lowerName) {
      return {
        korName,
        engName: cityTranslations[korName].en,
        countryCode: cityTranslations[korName].countryCode
      };
    }
  }
  
  return null;
};

module.exports = {
  translateCityName,
  initCityList,
  searchCities,
  findCityByEngName
};