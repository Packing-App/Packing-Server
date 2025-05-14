// src/services/itemRecommendationService.js
const ThemeTemplate = require('../models/ThemeTemplate');
const { getWeatherData, analyzeWeatherCondition } = require('../utils/externalApiUtils');
const logger = require('../config/logger');

/**
 * 여행 정보를 기반으로 준비물 추천
 * @param {Object} journey 여행 정보
 * @returns {Promise<Array>} 추천 준비물 목록
 */

const getRecommendedItems = async (journey) => {
  try {
    logger.info(`추천 아이템 생성 시작: 여행 ${journey.title}, 테마: ${journey.themes}`);
    
    // 1. 테마 기반 기본 준비물 가져오기 (다중 테마 지원)
    const themeItems = await getThemeBasedItems(journey.themes);
    logger.info(`테마 아이템: ${themeItems.length}개`);
    themeItems.forEach((item, index) => {
      if (!item.name) {
        logger.error(`테마 아이템 ${index}: name 없음 - ${JSON.stringify(item)}`);
      }
    });
    
    // 2. 날씨 기반 준비물 가져오기
    const weatherItems = await getWeatherBasedItems(journey.destination, journey.startDate);
    logger.info(`날씨 아이템: ${weatherItems.length}개`);
    weatherItems.forEach((item, index) => {
      if (!item.name) {
        logger.error(`날씨 아이템 ${index}: name 없음 - ${JSON.stringify(item)}`);
      }
    });
    
    // 3. 여행 기간 기반 준비물 계산
    const durationItems = getDurationBasedItems(journey.startDate, journey.endDate);
    logger.info(`기간 아이템: ${durationItems.length}개`);
    durationItems.forEach((item, index) => {
      if (!item.name) {
        logger.error(`기간 아이템 ${index}: name 없음 - ${JSON.stringify(item)}`);
      }
    });
    
    // 4. 교통 수단 기반 준비물
    const transportItems = getTransportBasedItems(journey.transportType);
    logger.info(`교통 아이템: ${transportItems.length}개`);
    transportItems.forEach((item, index) => {
      if (!item.name) {
        logger.error(`교통 아이템 ${index}: name 없음 - ${JSON.stringify(item)}`);
      }
    });
    
    // 5. 모든 준비물 통합
    const allItems = [...themeItems, ...weatherItems, ...durationItems, ...transportItems];
    logger.info(`전체 아이템 (병합 전): ${allItems.length}개`);
    
    // 6. 중복 제거 및 우선순위 병합
    const uniqueItems = mergeDuplicateItems(allItems);
    logger.info(`유니크 아이템 (병합 후): ${uniqueItems.length}개`);
    
    return uniqueItems;
  } catch (error) {
    logger.error(`준비물 추천 오류: ${error.message}`);
    logger.error(error.stack);
    return getDefaultItems(); // 오류 발생 시 기본 준비물 반환
  }
};

/**
 * 중복 아이템 병합 및 우선순위 처리
 * @param {Array} items 전체 아이템 목록
 * @returns {Array} 중복 제거된 아이템 목록
 */

const mergeDuplicateItems = (items) => {
  const itemMap = new Map();
  
  // 디버깅: 입력 아이템 검증
  logger.info(`mergeDuplicateItems: 입력 아이템 수 ${items.length}`);
  
  items.forEach((item, index) => {
    // 아이템 유효성 검사
    if (!item || typeof item !== 'object') {
      logger.error(`mergeDuplicateItems: 잘못된 아이템 (인덱스 ${index}): ${JSON.stringify(item)}`);
      return;
    }
    
    if (!item.name) {
      logger.error(`mergeDuplicateItems: name 없는 아이템 (인덱스 ${index}): ${JSON.stringify(item)}`);
      return;
    }
    
    if (!item.category) {
      logger.error(`mergeDuplicateItems: category 없는 아이템 (인덱스 ${index}): ${JSON.stringify(item)}`);
      return;
    }
    
    const key = item.name;
    
    if (itemMap.has(key)) {
      const existingItem = itemMap.get(key);
      // isEssential이 true인 것을 우선
      if (item.isEssential && !existingItem.isEssential) {
        itemMap.set(key, { ...item });
      }
      // count가 있는 경우 큰 값으로 업데이트
      if (item.count && existingItem.count) {
        existingItem.count = Math.max(existingItem.count, item.count);
      } else if (item.count) {
        existingItem.count = item.count;
      }
    } else {
      // 새 아이템 추가 시 검증
      const newItem = { ...item };
      if (!newItem.name || !newItem.category) {
        logger.error(`mergeDuplicateItems: 복사 후 필수 속성 누락: ${JSON.stringify(newItem)}`);
        return;
      }
      itemMap.set(key, newItem);
    }
  });
  
  const result = Array.from(itemMap.values());
  
  // 디버깅: 결과 검증
  logger.info(`mergeDuplicateItems: 출력 아이템 수 ${result.length}`);
  result.forEach((item, index) => {
    if (!item.name || !item.category) {
      logger.error(`mergeDuplicateItems 결과: 잘못된 아이템 (인덱스 ${index}): ${JSON.stringify(item)}`);
    }
  });
  
  return result;
};

/**
 * 테마 기반 준비물 가져오기 (다중 테마 지원)
 */
const getThemeBasedItems = async (themes) => {
  try {
    // 단일 테마인 경우 (기존 코드 호환성)
    if (typeof themes === 'string') {
      themes = [themes];
    }
    
    if (!themes || themes.length === 0) {
      logger.warn('테마가 지정되지 않았습니다.');
      return [];
    }
    
    const allThemeItems = [];
    
    // 각 테마별로 준비물 가져오기
    for (const theme of themes) {
      const themeTemplate = await ThemeTemplate.findOne({ themeName: theme });
      
      if (!themeTemplate) {
        logger.warn(`${theme} 테마의 템플릿을 찾을 수 없습니다.`);
        continue;
      }
      
      allThemeItems.push(...themeTemplate.items);
    }
    
    return allThemeItems;
  } catch (error) {
    logger.error(`테마 기반 준비물 조회 오류: ${error.message}`);
    return [];
  }
};

/**
 * 날씨 기반 준비물 가져오기
 */
const getWeatherBasedItems = async (destination, startDate) => {
  try {
    // 날씨 정보 가져오기
    const weatherData = await getWeatherData(destination, null, new Date(startDate));
    
    if (!weatherData) {
      logger.warn(`${destination} 날씨 정보를 가져올 수 없습니다.`);
      return [];
    }
    
    // 날씨 상태 분석
    const condition = analyzeWeatherCondition(weatherData);
    
    // 날씨별 추가 준비물
    const weatherItems = [];
    
    switch (condition) {
      case 'rain':
        weatherItems.push(
          { name: '우산', category: 'essentials', isEssential: true },
          { name: '비옷', category: 'clothing', isEssential: false },
          { name: '방수 가방 커버', category: 'essentials', isEssential: false }
        );
        break;
      case 'snow':
        weatherItems.push(
          { name: '겨울 코트', category: 'clothing', isEssential: true },
          { name: '장갑', category: 'clothing', isEssential: true },
          { name: '목도리', category: 'clothing', isEssential: true },
          { name: '방한 모자', category: 'clothing', isEssential: true },
          { name: '방수 신발', category: 'clothing', isEssential: true }
        );
        break;
      case 'hot':
        weatherItems.push(
          { name: '선크림', category: 'toiletries', isEssential: true },
          { name: '모자', category: 'clothing', isEssential: true },
          { name: '선글라스', category: 'clothing', isEssential: false },
          { name: '시원한 옷', category: 'clothing', isEssential: true },
          { name: '물병', category: 'essentials', isEssential: true }
        );
        break;
      case 'cold':
        weatherItems.push(
          { name: '겨울 코트', category: 'clothing', isEssential: true },
          { name: '장갑', category: 'clothing', isEssential: false },
          { name: '목도리', category: 'clothing', isEssential: false },
          { name: '방한 내의', category: 'clothing', isEssential: true }
        );
        break;
      default:
        weatherItems.push(
          { name: '가벼운 재킷', category: 'clothing', isEssential: false }
        );
    }
    
    // 날씨 온도 기반 추가 준비물
    if (weatherData.temp < 10) {
      weatherItems.push({ name: '두꺼운 양말', category: 'clothing', isEssential: true });
    } else if (weatherData.temp > 25) {
      weatherItems.push({ name: '땀 수건', category: 'toiletries', isEssential: true });
    }
    
    // 습도 기반 추가 준비물
    if (weatherData.humidity > 70) {
      weatherItems.push({ name: '제습제', category: 'essentials', isEssential: false });
    }
    
    return weatherItems;
  } catch (error) {
    logger.error(`날씨 기반 준비물 조회 오류: ${error.message}`);
    return [];
  }
};

/**
 * 여행 기간 기반 준비물 계산
 */
const getDurationBasedItems = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 여행 일수 계산
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const items = [
    { name: '여분 옷', category: 'clothing', isEssential: true, count: Math.min(daysDiff, 7) },
    { name: '속옷', category: 'clothing', isEssential: true, count: daysDiff },
    { name: '양말', category: 'clothing', isEssential: true, count: daysDiff }
  ];
  
  // 장기 여행인 경우 추가 준비물
  if (daysDiff > 7) {
    items.push(
      { name: '세탁 세제', category: 'toiletries', isEssential: false },
      { name: '여행용 다리미', category: 'electronics', isEssential: false }
    );
  }
  
  return items;
};

/**
 * 교통 수단 기반 준비물
 */
const getTransportBasedItems = (transportType) => {
  const commonItems = [
    { name: '여권/신분증', category: 'documents', isEssential: true },
    { name: '지갑', category: 'essentials', isEssential: true },
    { name: '휴대폰 충전기', category: 'electronics', isEssential: true }
  ];
  
  let transportItems = [];
  
  switch (transportType) {
    case 'plane':
      transportItems = [
        { name: '여권', category: 'documents', isEssential: true },
        { name: '비행기 탑승권', category: 'documents', isEssential: true },
        { name: '목베개', category: 'essentials', isEssential: false },
        { name: '귀마개', category: 'essentials', isEssential: false },
        { name: '수면 안대', category: 'essentials', isEssential: false },
        { name: '이어폰/헤드폰', category: 'electronics', isEssential: false }
      ];
      break;
    case 'train':
      transportItems = [
        { name: '기차 티켓', category: 'documents', isEssential: true },
        { name: '이어폰/헤드폰', category: 'electronics', isEssential: false },
        { name: '간식', category: 'essentials', isEssential: false }
      ];
      break;
    case 'ship':
      transportItems = [
        { name: '배 티켓', category: 'documents', isEssential: true },
        { name: '멀미약', category: 'medicines', isEssential: false },
        { name: '방수 가방', category: 'essentials', isEssential: false }
      ];
      break;
    case 'bus':
      transportItems = [
        { name: '버스 티켓', category: 'documents', isEssential: true },
        { name: '이어폰/헤드폰', category: 'electronics', isEssential: false },
        { name: '목베개', category: 'essentials', isEssential: false }
      ];
      break;
    case 'walk':
      transportItems = [
        { name: '편안한 신발', category: 'clothing', isEssential: true },
        { name: '물병', category: 'essentials', isEssential: true },
        { name: '지도', category: 'essentials', isEssential: false }
      ];
      break;
    default:
      transportItems = [
        { name: '교통편 티켓', category: 'documents', isEssential: true }
      ];
  }
  
  return [...commonItems, ...transportItems];
};

/**
 * 기본 준비물 목록 (오류 발생 시 사용)
 */
const getDefaultItems = () => {
  return [
    { name: '신분증', category: 'documents', isEssential: true },
    { name: '충전기', category: 'electronics', isEssential: true },
    { name: '여행 서류', category: 'documents', isEssential: true },
    { name: '현금/카드', category: 'essentials', isEssential: true },
    { name: '속옷', category: 'clothing', isEssential: true },
    { name: '양말', category: 'clothing', isEssential: true },
    { name: '여분 옷', category: 'clothing', isEssential: true },
    { name: '세면도구', category: 'toiletries', isEssential: true },
    { name: '상비약', category: 'medicines', isEssential: true }
  ];
};

module.exports = {
  getRecommendedItems
};