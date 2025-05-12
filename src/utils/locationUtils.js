// src/utils/locationUtils.js
const axios = require('axios');
const logger = require('../config/logger');
const {countryMapping, cityTranslations} = require('../data/cityTranslations');

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
 * 도시명 자동완성 검색 (한글, 영문, 국가명 모두 지원)
 * @param {string} query 검색어
 * @param {number} limit 반환할 결과 수
 * @returns {Array} 검색 결과
 */
const searchCities = (query, limit = 10) => {
  if (!query || query.length < 1) {
    return [];
  }
  
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  // 1. 한글 도시명으로 검색
  Object.keys(cityTranslations).forEach(korCity => {
    if (korCity.toLowerCase().includes(lowerQuery)) {
      results.push({
        korName: korCity,
        engName: cityTranslations[korCity].en,
        countryCode: cityTranslations[korCity].countryCode,
        matchType: 'kor_city'
      });
    }
  });
  
  // 2. 영문 도시명으로 검색
  Object.keys(cityTranslations).forEach(korCity => {
    const engCity = cityTranslations[korCity].en;
    if (engCity.toLowerCase().includes(lowerQuery)) {
      // 한글로 이미 찾은 도시는 제외 (중복 방지)
      const alreadyFound = results.some(r => r.korName === korCity);
      if (!alreadyFound) {
        results.push({
          korName: korCity,
          engName: engCity,
          countryCode: cityTranslations[korCity].countryCode,
          matchType: 'eng_city'
        });
      }
    }
  });
  
  // 3. 국가명으로 검색 (한글 및 영문)
  Object.keys(countryMapping).forEach(countryCode => {
    const country = countryMapping[countryCode];
    
    // 한글 국가명으로 검색
    if (country.ko.toLowerCase().includes(lowerQuery) ||
        // 영문 국가명으로 검색
        country.en.toLowerCase().includes(lowerQuery) ||
        // 국가 코드로 검색
        countryCode.toLowerCase().includes(lowerQuery)) {
      
      // 해당 국가의 모든 도시 찾기
      Object.keys(cityTranslations).forEach(korCity => {
        if (cityTranslations[korCity].countryCode === countryCode) {
          // 이미 찾은 도시는 제외
          const alreadyFound = results.some(r => r.korName === korCity);
          if (!alreadyFound) {
            results.push({
              korName: korCity,
              engName: cityTranslations[korCity].en,
              countryCode: countryCode,
              matchType: 'country',
              // 추가 정보로 국가명도 포함
              countryNameKo: country.ko,
              countryNameEn: country.en
            });
          }
        }
      });
    }
  });
  
  // 결과 정렬 (검색 정확도 순)
  results.sort((a, b) => {
    // 도시명 직접 매칭을 우선시
    if (a.matchType !== b.matchType) {
      if (a.matchType === 'kor_city' || a.matchType === 'eng_city') return -1;
      if (b.matchType === 'kor_city' || b.matchType === 'eng_city') return 1;
    }
    
    // 검색어로 시작하는 도시를 우선 정렬
    const aKorStartsWith = a.korName.toLowerCase().startsWith(lowerQuery);
    const bKorStartsWith = b.korName.toLowerCase().startsWith(lowerQuery);
    const aEngStartsWith = a.engName.toLowerCase().startsWith(lowerQuery);
    const bEngStartsWith = b.engName.toLowerCase().startsWith(lowerQuery);
    
    if ((aKorStartsWith || aEngStartsWith) && !(bKorStartsWith || bEngStartsWith)) return -1;
    if (!(aKorStartsWith || aEngStartsWith) && (bKorStartsWith || bEngStartsWith)) return 1;
    
    // 이름 길이가 짧은 순서로 정렬
    return a.korName.length - b.korName.length;
  });
  
  // matchType 필드 제거 (클라이언트에 노출하지 않음)
  const cleanResults = results.map(result => {
    const { matchType, ...cleanResult } = result;
    return cleanResult;
  });
  
  // limit 개수만큼 반환
  return cleanResults.slice(0, limit);
};

module.exports = {
  translateCityName,
  initCityList,
  searchCities
};