// src/config/seedData.js
const ThemeTemplate = require('../models/ThemeTemplate');
const logger = require('./logger');

const themeTemplateData = [
  {
    themeName: 'waterSports',
    items: [
      { name: '수영복', category: 'clothing', isEssential: true },
      { name: '선크림', category: 'essentials', isEssential: true },
      { name: '선글라스', category: 'essentials', isEssential: true },
      { name: '비치타올', category: 'essentials', isEssential: true },
      { name: '방수팩', category: 'electronics', isEssential: false },
      { name: '샌들', category: 'clothing', isEssential: true },
      { name: '래쉬가드', category: 'clothing', isEssential: false },
      { name: '물안경', category: 'essentials', isEssential: false },
      { name: '수영 모자', category: 'clothing', isEssential: false },
      { name: '방수 카메라', category: 'electronics', isEssential: false },
      { name: '튜브/구명조끼', category: 'essentials', isEssential: false },
      { name: '방수 시계', category: 'electronics', isEssential: false }
    ]
  },
  {
    themeName: 'cycling',
    items: [
      { name: '자전거', category: 'essentials', isEssential: true },
      { name: '헬멧', category: 'essentials', isEssential: true },
      { name: '자전거 장갑', category: 'clothing', isEssential: false },
      { name: '패드 팬츠', category: 'clothing', isEssential: false },
      { name: '자전거 물통', category: 'essentials', isEssential: true },
      { name: '반사 조끼/의류', category: 'clothing', isEssential: true },
      { name: '자전거 수리 키트', category: 'essentials', isEssential: false },
      { name: '자전거 잠금장치', category: 'essentials', isEssential: false },
      { name: '바람막이 자켓', category: 'clothing', isEssential: false },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '운동용 마스크', category: 'clothing', isEssential: false },
      { name: '스포츠 선글라스', category: 'clothing', isEssential: false }
    ]
  },
  {
    themeName: 'camping',
    items: [
      { name: '텐트', category: 'essentials', isEssential: true },
      { name: '침낭', category: 'essentials', isEssential: true },
      { name: '매트/패드', category: 'essentials', isEssential: true },
      { name: '랜턴/손전등', category: 'essentials', isEssential: true },
      { name: '다용도 칼', category: 'essentials', isEssential: true },
      { name: '물통', category: 'essentials', isEssential: true },
      { name: '코펠/취사도구', category: 'essentials', isEssential: false },
      { name: '캠핑 의자', category: 'essentials', isEssential: false },
      { name: '버너', category: 'essentials', isEssential: false },
      { name: '방충제', category: 'toiletries', isEssential: true },
      { name: '두꺼운 양말', category: 'clothing', isEssential: true },
      { name: '기본 응급 키트', category: 'medicines', isEssential: true },
      { name: '방수 성냥/라이터', category: 'essentials', isEssential: true },
      { name: '방한 모자', category: 'clothing', isEssential: false }
    ]
  },
  {
    themeName: 'picnic',
    items: [
      { name: '돗자리/매트', category: 'essentials', isEssential: true },
      { name: '도시락/음식', category: 'essentials', isEssential: true },
      { name: '물/음료', category: 'essentials', isEssential: true },
      { name: '일회용 접시/컵', category: 'essentials', isEssential: false },
      { name: '냅킨/물티슈', category: 'essentials', isEssential: true },
      { name: '쓰레기 봉투', category: 'essentials', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: false },
      { name: '플레이어/스피커', category: 'electronics', isEssential: false },
      { name: '간단한 게임도구', category: 'essentials', isEssential: false },
      { name: '방충제', category: 'toiletries', isEssential: false },
      { name: '카메라', category: 'electronics', isEssential: false }
    ]
  },
  {
    themeName: 'mountain',
    items: [
      { name: '등산화', category: 'clothing', isEssential: true },
      { name: '등산복', category: 'clothing', isEssential: true },
      { name: '등산 배낭', category: 'essentials', isEssential: true },
      { name: '물통', category: 'essentials', isEssential: true },
      { name: '등산 양말', category: 'clothing', isEssential: true },
      { name: '구급상자', category: 'medicines', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '에너지바/초콜릿', category: 'essentials', isEssential: false },
      { name: '비상용 호루라기', category: 'essentials', isEssential: false },
      { name: '등산 장갑', category: 'clothing', isEssential: false },
      { name: '지도/나침반', category: 'essentials', isEssential: false },
      { name: '트레킹 스틱', category: 'essentials', isEssential: false },
      { name: '헤드랜턴', category: 'essentials', isEssential: false },
      { name: '방수 자켓', category: 'clothing', isEssential: false }
    ]
  },
  {
    themeName: 'skiing',
    items: [
      { name: '스키/스노보드', category: 'essentials', isEssential: true },
      { name: '스키 부츠', category: 'clothing', isEssential: true },
      { name: '스키 의류', category: 'clothing', isEssential: true },
      { name: '방수 장갑', category: 'clothing', isEssential: true },
      { name: '고글', category: 'essentials', isEssential: true },
      { name: '방한 모자', category: 'clothing', isEssential: true },
      { name: '넥워머', category: 'clothing', isEssential: false },
      { name: '방한 내의', category: 'clothing', isEssential: true },
      { name: '두꺼운 양말', category: 'clothing', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '립밤', category: 'toiletries', isEssential: false },
      { name: '스키 패스 홀더', category: 'essentials', isEssential: false },
      { name: '수분 크림', category: 'toiletries', isEssential: false },
      { name: '보온병', category: 'essentials', isEssential: false },
      { name: '헬멧', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'fishing',
    items: [
      { name: '낚싯대', category: 'essentials', isEssential: true },
      { name: '낚시 도구', category: 'essentials', isEssential: true },
      { name: '미끼', category: 'essentials', isEssential: true },
      { name: '얼음팩/쿨러', category: 'essentials', isEssential: false },
      { name: '방수 바지/장화', category: 'clothing', isEssential: false },
      { name: '낚시 조끼', category: 'clothing', isEssential: false },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '방충제', category: 'toiletries', isEssential: true },
      { name: '접이식 의자', category: 'essentials', isEssential: false },
      { name: '장갑', category: 'clothing', isEssential: false },
      { name: '선글라스', category: 'clothing', isEssential: false },
      { name: '손전등', category: 'essentials', isEssential: false },
      { name: '구급상자', category: 'medicines', isEssential: false }
    ]
  },
  {
    themeName: 'shopping',
    items: [
      { name: '쇼핑백/에코백', category: 'essentials', isEssential: true },
      { name: '신용카드/현금', category: 'essentials', isEssential: true },
      { name: '편안한 신발', category: 'clothing', isEssential: true },
      { name: '휴대폰/충전기', category: 'electronics', isEssential: true },
      { name: '쇼핑 리스트', category: 'documents', isEssential: false },
      { name: '물통', category: 'essentials', isEssential: false },
      { name: '간식', category: 'essentials', isEssential: false },
      { name: '쇼핑몰 지도', category: 'documents', isEssential: false },
      { name: '작은 가방/파우치', category: 'essentials', isEssential: false },
      { name: '계산기/환율 앱', category: 'electronics', isEssential: false },
      { name: '얇은 재킷', category: 'clothing', isEssential: false },
      { name: '사이즈 측정 테이프', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'themepark',
    items: [
      { name: '입장권/예약 확인서', category: 'documents', isEssential: true },
      { name: '편안한 신발', category: 'clothing', isEssential: true },
      { name: '가벼운 배낭', category: 'essentials', isEssential: true },
      { name: '물통', category: 'essentials', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '간식', category: 'essentials', isEssential: false },
      { name: '비상약', category: 'medicines', isEssential: false },
      { name: '우비/판초', category: 'clothing', isEssential: false },
      { name: '물티슈', category: 'toiletries', isEssential: true },
      { name: '휴대용 선풍기', category: 'electronics', isEssential: false },
      { name: '카메라', category: 'electronics', isEssential: false },
      { name: '테마파크 지도', category: 'documents', isEssential: false },
      { name: '여벌 옷', category: 'clothing', isEssential: false }
    ]
  },
  {
    themeName: 'other',
    items: [
      { name: '신분증', category: 'documents', isEssential: true },
      { name: '충전기', category: 'electronics', isEssential: true },
      { name: '여행 서류', category: 'documents', isEssential: true },
      { name: '현금/카드', category: 'essentials', isEssential: true },
      { name: '여분 옷', category: 'clothing', isEssential: true },
      { name: '세면도구', category: 'toiletries', isEssential: true },
      { name: '상비약', category: 'medicines', isEssential: true },
      { name: '우산/우비', category: 'essentials', isEssential: false },
      { name: '여행용 티슈/물티슈', category: 'toiletries', isEssential: true },
      { name: '편안한 신발', category: 'clothing', isEssential: true },
      { name: '카메라', category: 'electronics', isEssential: false },
      { name: '여행 베개', category: 'essentials', isEssential: false },
      { name: '지도/가이드북', category: 'documents', isEssential: false },
      { name: '이어폰/헤드폰', category: 'electronics', isEssential: false }
    ]
  }
];

const seedThemeTemplates = async () => {
  try {
    // 기존 데이터 수 확인
    const count = await ThemeTemplate.countDocuments();
    
    // 데이터가 없을 때만 초기 데이터 추가
    if (count === 0) {
      await ThemeTemplate.insertMany(themeTemplateData);
      logger.info('Theme templates seeded successfully');
    } else {
      logger.info('Theme templates already exist, skipping seed');
    }
  } catch (error) {
    logger.error(`Error seeding theme templates: ${error.message}`);
  }
};

module.exports = { seedThemeTemplates };