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
  },
  // 신규 테마
  {
    themeName: 'business',
    items: [
      { name: '정장/비즈니스 캐주얼', category: 'clothing', isEssential: true },
      { name: '드레스 셔츠/블라우스', category: 'clothing', isEssential: true },
      { name: '넥타이/스카프', category: 'clothing', isEssential: false },
      { name: '구두', category: 'clothing', isEssential: true },
      { name: '노트북', category: 'electronics', isEssential: true },
      { name: '명함', category: 'documents', isEssential: true },
      { name: '서류 가방', category: 'essentials', isEssential: true },
      { name: '충전기/어댑터', category: 'electronics', isEssential: true },
      { name: '프레젠테이션 자료', category: 'documents', isEssential: true },
      { name: '명함 지갑', category: 'essentials', isEssential: false },
      { name: '노트/펜', category: 'essentials', isEssential: true },
      { name: '휴대용 다리미', category: 'electronics', isEssential: false }
    ]
  },
  {
    themeName: 'beach',
    items: [
      { name: '수영복', category: 'clothing', isEssential: true },
      { name: '비치웨어', category: 'clothing', isEssential: true },
      { name: '샌들/슬리퍼', category: 'clothing', isEssential: true },
      { name: '비치 타올', category: 'essentials', isEssential: true },
      { name: '비치백', category: 'essentials', isEssential: true },
      { name: '파라솔', category: 'essentials', isEssential: false },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '선글라스', category: 'essentials', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '보습 스프레이', category: 'toiletries', isEssential: false },
      { name: '방수 파우치', category: 'essentials', isEssential: false },
      { name: '쿨러백', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'cultural',
    items: [
      { name: '편안한 운동화', category: 'clothing', isEssential: true },
      { name: '카메라', category: 'electronics', isEssential: true },
      { name: '가이드북', category: 'documents', isEssential: true },
      { name: '메모장/펜', category: 'essentials', isEssential: true },
      { name: '박물관 패스', category: 'documents', isEssential: false },
      { name: '경량 배낭', category: 'essentials', isEssential: true },
      { name: '충전기', category: 'electronics', isEssential: true },
      { name: '긴팔 옷', category: 'clothing', isEssential: true },
      { name: '스카프', category: 'clothing', isEssential: false },
      { name: '물병', category: 'essentials', isEssential: true },
      { name: '간식', category: 'essentials', isEssential: false },
      { name: '지도', category: 'documents', isEssential: false }
    ]
  },
  {
    themeName: 'photography',
    items: [
      { name: 'DSLR/미러리스 카메라', category: 'electronics', isEssential: true },
      { name: '여분 렌즈', category: 'electronics', isEssential: true },
      { name: '삼각대', category: 'electronics', isEssential: true },
      { name: '여분 배터리', category: 'electronics', isEssential: true },
      { name: '메모리카드', category: 'electronics', isEssential: true },
      { name: '렌즈 청소 도구', category: 'electronics', isEssential: true },
      { name: '카메라 가방', category: 'essentials', isEssential: true },
      { name: '필터', category: 'electronics', isEssential: false },
      { name: '반사판', category: 'electronics', isEssential: false },
      { name: '노트북/태블릿', category: 'electronics', isEssential: false },
      { name: '외장하드', category: 'electronics', isEssential: false },
      { name: '충전기', category: 'electronics', isEssential: true }
    ]
  },
  {
    themeName: 'family',
    items: [
      { name: '아이 옷 여벌', category: 'clothing', isEssential: true },
      { name: '기저귀', category: 'essentials', isEssential: true },
      { name: '물티슈', category: 'toiletries', isEssential: true },
      { name: '젖병/이유식', category: 'essentials', isEssential: true },
      { name: '아이 간식', category: 'essentials', isEssential: true },
      { name: '장난감', category: 'essentials', isEssential: true },
      { name: '유모차', category: 'essentials', isEssential: false },
      { name: '카시트', category: 'essentials', isEssential: false },
      { name: '아이 약품', category: 'medicines', isEssential: true },
      { name: '아이 선크림', category: 'toiletries', isEssential: true },
      { name: '아이 수영복', category: 'clothing', isEssential: false },
      { name: '보온병', category: 'essentials', isEssential: true }
    ]
  },
  {
    themeName: 'backpacking',
    items: [
      { name: '배낭', category: 'essentials', isEssential: true },
      { name: '여행용 수건', category: 'essentials', isEssential: true },
      { name: '세탁 세제', category: 'toiletries', isEssential: true },
      { name: '자물쇠', category: 'essentials', isEssential: true },
      { name: '슬리퍼', category: 'clothing', isEssential: true },
      { name: '압축 팩', category: 'essentials', isEssential: true },
      { name: '여권 파우치', category: 'essentials', isEssential: true },
      { name: '멀티탭', category: 'electronics', isEssential: true },
      { name: '유스호스텔 카드', category: 'documents', isEssential: false },
      { name: '침낭 라이너', category: 'essentials', isEssential: false },
      { name: '여행용 베개', category: 'essentials', isEssential: false },
      { name: '귀마개', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'wellness',
    items: [
      { name: '요가 매트', category: 'essentials', isEssential: true },
      { name: '운동복', category: 'clothing', isEssential: true },
      { name: '슬리퍼', category: 'clothing', isEssential: true },
      { name: '목욕 가운', category: 'clothing', isEssential: false },
      { name: '마사지 오일', category: 'toiletries', isEssential: false },
      { name: '아로마 오일', category: 'toiletries', isEssential: false },
      { name: '명상 앱', category: 'electronics', isEssential: false },
      { name: '이어폰', category: 'electronics', isEssential: true },
      { name: '물병', category: 'essentials', isEssential: true },
      { name: '건강 간식', category: 'essentials', isEssential: false },
      { name: '선글라스', category: 'essentials', isEssential: false },
      { name: '편한 옷', category: 'clothing', isEssential: true }
    ]
  },
  {
    themeName: 'safari',
    items: [
      { name: '쌍안경', category: 'essentials', isEssential: true },
      { name: '카키색 옷', category: 'clothing', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '방충제', category: 'toiletries', isEssential: true },
      { name: '자외선 차단제', category: 'toiletries', isEssential: true },
      { name: '카메라', category: 'electronics', isEssential: true },
      { name: '망원렌즈', category: 'electronics', isEssential: false },
      { name: '먼지 방지 커버', category: 'essentials', isEssential: false },
      { name: '부츠', category: 'clothing', isEssential: true },
      { name: '긴팔/긴바지', category: 'clothing', isEssential: true },
      { name: '손전등', category: 'essentials', isEssential: true },
      { name: '물병', category: 'essentials', isEssential: true }
    ]
  },
  {
    themeName: 'cruise',
    items: [
      { name: '정장/칵테일 드레스', category: 'clothing', isEssential: true },
      { name: '캐주얼 의류', category: 'clothing', isEssential: true },
      { name: '수영복', category: 'clothing', isEssential: true },
      { name: '운동화', category: 'clothing', isEssential: true },
      { name: '구두', category: 'clothing', isEssential: true },
      { name: '멀미약', category: 'medicines', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '선글라스', category: 'essentials', isEssential: true },
      { name: '가벼운 재킷', category: 'clothing', isEssential: true },
      { name: '비치타올', category: 'essentials', isEssential: false },
      { name: '방수 가방', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'desert',
    items: [
      { name: '스카프/터번', category: 'clothing', isEssential: true },
      { name: '긴팔 셔츠', category: 'clothing', isEssential: true },
      { name: '긴바지', category: 'clothing', isEssential: true },
      { name: '선글라스', category: 'essentials', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '튼튼한 신발', category: 'clothing', isEssential: true },
      { name: '물병(대용량)', category: 'essentials', isEssential: true },
      { name: '전해질 보충제', category: 'medicines', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '립밤', category: 'toiletries', isEssential: true },
      { name: '모래 방지 커버', category: 'essentials', isEssential: false },
      { name: '야간용 재킷', category: 'clothing', isEssential: true }
    ]
  },
  {
    themeName: 'sports',
    items: [
      { name: '팀 유니폼', category: 'clothing', isEssential: true },
      { name: '운동화', category: 'clothing', isEssential: true },
      { name: '응원 도구', category: 'essentials', isEssential: false },
      { name: '방석', category: 'essentials', isEssential: false },
      { name: '우비', category: 'clothing', isEssential: false },
      { name: '쌍안경', category: 'essentials', isEssential: false },
      { name: '캡모자', category: 'clothing', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '물병', category: 'essentials', isEssential: true },
      { name: '간식', category: 'essentials', isEssential: false },
      { name: '카메라', category: 'electronics', isEssential: false },
      { name: '현금', category: 'essentials', isEssential: true }
    ]
  },
  {
    themeName: 'roadtrip',
    items: [
      { name: '차량용 충전기', category: 'electronics', isEssential: true },
      { name: '네비게이션', category: 'electronics', isEssential: true },
      { name: '음악 플레이리스트', category: 'essentials', isEssential: false },
      { name: '쿨러/아이스박스', category: 'essentials', isEssential: true },
      { name: '담요', category: 'essentials', isEssential: false },
      { name: '베개', category: 'essentials', isEssential: false },
      { name: '간식', category: 'essentials', isEssential: true },
      { name: '물티슈', category: 'toiletries', isEssential: true },
      { name: '휴지', category: 'toiletries', isEssential: true },
      { name: '구급상자', category: 'medicines', isEssential: true },
      { name: '차량 정비 도구', category: 'essentials', isEssential: false },
      { name: '주차 동전', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'study',
    items: [
      { name: '노트북', category: 'electronics', isEssential: true },
      { name: '교재', category: 'essentials', isEssential: true },
      { name: '사전', category: 'essentials', isEssential: true },
      { name: '필기구', category: 'essentials', isEssential: true },
      { name: '노트', category: 'essentials', isEssential: true },
      { name: '유학생 비자', category: 'documents', isEssential: true },
      { name: '증명사진', category: 'documents', isEssential: true },
      { name: '변압기', category: 'electronics', isEssential: true },
      { name: '장기체류 의류', category: 'clothing', isEssential: true },
      { name: '세탁용품', category: 'toiletries', isEssential: true },
      { name: '조리도구', category: 'essentials', isEssential: false },
      { name: '침구', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'glamping',
    items: [
      { name: '가벼운 침구', category: 'essentials', isEssential: false },
      { name: '와인/와인잔', category: 'essentials', isEssential: false },
      { name: '블루투스 스피커', category: 'electronics', isEssential: false },
      { name: '분위기 조명', category: 'electronics', isEssential: false },
      { name: '보드게임', category: 'essentials', isEssential: false },
      { name: '바비큐 도구', category: 'essentials', isEssential: false },
      { name: '쿨러', category: 'essentials', isEssential: true },
      { name: '편한 옷', category: 'clothing', isEssential: true },
      { name: '슬리퍼', category: 'clothing', isEssential: true },
      { name: '카메라', category: 'electronics', isEssential: false },
      { name: '간식', category: 'essentials', isEssential: true },
      { name: '음료', category: 'essentials', isEssential: true }
    ]
  },
  {
    themeName: 'medical',
    items: [
      { name: '의료 기록', category: 'documents', isEssential: true },
      { name: '처방전', category: 'documents', isEssential: true },
      { name: '보험 서류', category: 'documents', isEssential: true },
      { name: '편한 옷', category: 'clothing', isEssential: true },
      { name: '슬리퍼', category: 'clothing', isEssential: true },
      { name: '회복용 베개', category: 'essentials', isEssential: false },
      { name: '약품', category: 'medicines', isEssential: true },
      { name: '붕대/거즈', category: 'medicines', isEssential: false },
      { name: '체온계', category: 'medicines', isEssential: false },
      { name: '혈압계', category: 'medicines', isEssential: false },
      { name: '동반자 연락처', category: 'documents', isEssential: true },
      { name: '통역 앱', category: 'electronics', isEssential: false }
    ]
  },
  {
    themeName: 'adventure',
    items: [
      { name: '액션캠', category: 'electronics', isEssential: true },
      { name: '헬멧', category: 'essentials', isEssential: true },
      { name: '보호대', category: 'essentials', isEssential: true },
      { name: '스포츠 의류', category: 'clothing', isEssential: true },
      { name: '튼튼한 신발', category: 'clothing', isEssential: true },
      { name: '응급 키트', category: 'medicines', isEssential: true },
      { name: '방수 가방', category: 'essentials', isEssential: true },
      { name: '에너지바', category: 'essentials', isEssential: true },
      { name: '전해질 음료', category: 'essentials', isEssential: true },
      { name: '로프', category: 'essentials', isEssential: false },
      { name: '손전등', category: 'essentials', isEssential: true },
      { name: '호루라기', category: 'essentials', isEssential: true }
    ]
  },
  {
    themeName: 'diving',
    items: [
      { name: '다이빙 자격증', category: 'documents', isEssential: true },
      { name: '다이빙 로그북', category: 'documents', isEssential: true },
      { name: '수영복', category: 'clothing', isEssential: true },
      { name: '래시가드', category: 'clothing', isEssential: true },
      { name: '다이빙 마스크', category: 'essentials', isEssential: true },
      { name: '스노클', category: 'essentials', isEssential: false },
      { name: '핀', category: 'essentials', isEssential: true },
      { name: '수중 카메라', category: 'electronics', isEssential: false },
      { name: '방수 가방', category: 'essentials', isEssential: true },
      { name: '타올', category: 'essentials', isEssential: true },
      { name: '이퀄라이징 약', category: 'medicines', isEssential: false },
      { name: '선크림', category: 'toiletries', isEssential: true }
    ]
  },
  {
    themeName: 'music',
    items: [
      { name: '티켓', category: 'documents', isEssential: true },
      { name: '귀마개', category: 'essentials', isEssential: true },
      { name: '일회용 우비', category: 'clothing', isEssential: false },
      { name: '휴대용 의자', category: 'essentials', isEssential: false },
      { name: '배터리 팩', category: 'electronics', isEssential: true },
      { name: '현금', category: 'essentials', isEssential: true },
      { name: '작은 가방', category: 'essentials', isEssential: true },
      { name: '편한 신발', category: 'clothing', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: false },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '물병', category: 'essentials', isEssential: true },
      { name: '간식', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'wine',
    items: [
      { name: '와인 오프너', category: 'essentials', isEssential: true },
      { name: '와인 스토퍼', category: 'essentials', isEssential: false },
      { name: '시음 노트', category: 'essentials', isEssential: false },
      { name: '편한 신발', category: 'clothing', isEssential: true },
      { name: '간단한 크래커', category: 'essentials', isEssential: false },
      { name: '물병', category: 'essentials', isEssential: true },
      { name: '카메라', category: 'electronics', isEssential: false },
      { name: '가벼운 재킷', category: 'clothing', isEssential: false },
      { name: '선글라스', category: 'essentials', isEssential: false },
      { name: '모자', category: 'clothing', isEssential: false },
      { name: '작은 쿨러백', category: 'essentials', isEssential: false },
      { name: '와인 가방', category: 'essentials', isEssential: false }
    ]
  },
  {
    themeName: 'urban',
    items: [
      { name: '시티투어 패스', category: 'documents', isEssential: false },
      { name: '편한 운동화', category: 'clothing', isEssential: true },
      { name: '도시 지도', category: 'documents', isEssential: false },
      { name: '대중교통 카드', category: 'essentials', isEssential: true },
      { name: '경량 배낭', category: 'essentials', isEssential: true },
      { name: '카메라', category: 'electronics', isEssential: false },
      { name: '충전기', category: 'electronics', isEssential: true },
      { name: '우산', category: 'essentials', isEssential: false },
      { name: '가벼운 재킷', category: 'clothing', isEssential: false },
      { name: '물병', category: 'essentials', isEssential: true },
      { name: '간식', category: 'essentials', isEssential: false },
      { name: '가이드북', category: 'documents', isEssential: false }
    ]
  },
  {
    themeName: 'island',
    items: [
      { name: '선박 티켓', category: 'documents', isEssential: true },
      { name: '멀미약', category: 'medicines', isEssential: true },
      { name: '수영복', category: 'clothing', isEssential: true },
      { name: '비치타올', category: 'essentials', isEssential: true },
      { name: '샌들', category: 'clothing', isEssential: true },
      { name: '방수 가방', category: 'essentials', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true },
      { name: '모기약', category: 'medicines', isEssential: true },
      { name: '모자', category: 'clothing', isEssential: true },
      { name: '선글라스', category: 'essentials', isEssential: true },
      { name: '간단한 약품', category: 'medicines', isEssential: true },
      { name: '현금', category: 'essentials', isEssential: true }
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