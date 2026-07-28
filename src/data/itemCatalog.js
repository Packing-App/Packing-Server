// src/data/itemCatalog.js
/**
 * 준비물 정본 카탈로그
 *
 * 키    = 정본 이름. 사용자에게 이 이름이 보인다.
 * aliases = 이 항목으로 병합될 다른 표기들. 없으면 필드를 생략한다(대다수 항목).
 * category = 정본 카테고리. 소스마다 카테고리가 갈리던 항목을 여기서 고정한다.
 *
 * 소비처는 src/utils/itemKey.js 하나뿐이다. 여기엔 데이터만 둔다.
 * 등록되지 않은 이름은 자기 자신으로 폴백하므로, 카탈로그가 미완성이어도
 * 추천 동작은 항상 정확하다(= 등록 전과 같다).
 *
 * ── 이름 추출 (항목을 추가하기 전에 돌려볼 것) ──
 *   grep -ohE "\{ name: '[^']+', category: '[a-z]+'" \
 *     src/config/seedData.js src/services/itemRecommendationService.js \
 *     | sed "s/{ name: '//;s/', category: '/\t/;s/'$//" | sort -u
 *
 *   정합성 가드(2026-07-28 기준): seedData 리터럴 384개 / 서비스 고유 47개 /
 *   합집합 고유 이름 304개. 숫자가 다르면 누가 다른 표기(큰따옴표 등)를 도입한 것이니
 *   정규식부터 고칠 것.
 *
 * ── 병합 정책 ──
 *   ✅ 표기 흔들림만 병합한다 (오타·띄어쓰기·동의어)
 *   ❌ 의미가 다르면 병합하지 않는다
 *      등산화 ≠ 구두 ≠ 샌들 ≠ 슬리퍼 ≠ 방수 신발 / 아이 선크림 ≠ 선크림
 *      아이 약품 ≠ 상비약 / 자전거 물통 ≠ 물병 / 목베개 ≠ 여행용 베개
 *      차량용 충전기 ≠ 충전기 / 우비 ≠ 우산 / 타올 ≠ 비치타올
 *   ⚖️ 애매하면 병합하지 않는다. 비용이 비대칭이다 — 잘못 병합하면 사용자가
 *      필요한 물건을 잃고, 놓치면 중복이 남을 뿐이다.
 *   정본 선택: 표준 표기 우선, 동률이면 등장 횟수가 많은 쪽.
 *
 * ── 진행 상황 ──
 *   304개 고유 이름 전수 등록 완료(2026-07-28). 별칭으로 묶인 것은 32건뿐이고
 *   나머지는 이름이 비슷해도 용도가 갈려 독립으로 뒀다.
 *   새 이름을 추가하면 itemCatalog.test.js의 커버리지 테스트가 잡아준다.
 *   계획 문서: ~/.claude/plans/validated-beaming-penguin.md
 */
const itemCatalog = {
  // ── 카테고리 충돌 해소 ──
  // 같은 이름이 소스마다 다른 카테고리로 등록돼 있어, 테마 조합 순서에 따라
  // 분류가 달라지던 3건. 다수결로 정본을 고정한다.
  '선크림': { category: 'toiletries', aliases: ['자외선 차단제'] }, // toiletries 14 : essentials 1
  '선글라스': { category: 'essentials' }, // essentials 7 : clothing 2
  '지도': { category: 'documents' }, // 1:1 동률이나 지도 계열(가이드북·도시 지도)이 전부 documents

  // ── 표기 흔들림 ──
  '래시가드': { category: 'clothing', aliases: ['래쉬가드'] }, // 동률, 표준 표기 우선
  '비치타올': { category: 'essentials', aliases: ['비치 타올'] },
  '편안한 신발': { category: 'clothing', aliases: ['편한 신발'] },
  '운동화': { category: 'clothing', aliases: ['편안한 운동화', '편한 운동화'] },
  '여분 옷': { category: 'clothing', aliases: ['여벌 옷'] },
  '여행용 베개': { category: 'essentials', aliases: ['여행 베개'] },
  '경량 배낭': { category: 'essentials', aliases: ['가벼운 배낭'] },
  '우비': { category: 'clothing', aliases: ['비옷'] }, // 일회용 우비는 별개(재질·용도 차이)
  '물병': { category: 'essentials', aliases: ['물통', '물병(대용량)'] },
  '충전기': { category: 'electronics', aliases: ['휴대폰 충전기', '휴대폰/충전기', '충전기/어댑터'] },
  '상비약': { category: 'medicines', aliases: ['비상약', '약품', '간단한 약품'] },
  '구급상자': { category: 'medicines', aliases: ['응급 키트', '기본 응급 키트'] }, // 상비약(낱개)과 별개

  // ── 여권 계열 ──
  // '여권/신분증'은 전 교통수단 공통, '여권'은 비행기 전용이다.
  // 둘을 합치면 국내 버스 여행에도 여권이 뜨므로 '여권'은 일부러 분리해 둔다.
  // 실제 중복은 '여권/신분증'(교통 공통) ↔ '신분증'(other 테마·기본 준비물) 사이에 있었다.
  '신분증': { category: 'documents', aliases: ['여권/신분증'] },
  '여권': { category: 'documents' },

  // ── 정본 고정 (다른 항목의 별칭으로 빨려들어가면 안 되는 이름) ──
  // 추천 서비스 유닛테스트가 이 두 이름에 걸려 있다.
  '우산': { category: 'essentials' },
  '양말': { category: 'clothing' },

  // ── clothing (배치 1) ──
  // 표기 흔들림만 병합했다. 실제로 묶인 건 2건뿐이고 나머지는 용도가 갈린다 —
  // 등산화 ≠ 구두 ≠ 부츠 ≠ 스키 부츠, 방수 장갑 ≠ 등산 장갑 ≠ 자전거 장갑,
  // 모자 ≠ 방한 모자 ≠ 수영 모자 ≠ 캡모자, 목도리 ≠ 넥워머(형태가 다르다),
  // 튼튼한 신발 ≠ 편안한 신발(내구성과 편안함은 다른 요구다).
  // 슬래시 복합어('긴팔/긴바지', '샌들/슬리퍼' 등)는 등록만 하고 별칭 판단은 배치 4로 미뤘다.
  '가벼운 재킷': { category: 'clothing', aliases: ['얇은 재킷'] },
  '겨울 코트': { category: 'clothing' },
  '구두': { category: 'clothing' },
  '긴바지': { category: 'clothing' },
  '긴팔 셔츠': { category: 'clothing' },
  '긴팔 옷': { category: 'clothing' },
  '긴팔/긴바지': { category: 'clothing' },
  '낚시 조끼': { category: 'clothing' },
  '넥워머': { category: 'clothing' },
  '넥타이/스카프': { category: 'clothing' },
  '두꺼운 양말': { category: 'clothing' },
  '드레스 셔츠/블라우스': { category: 'clothing' },
  '등산 양말': { category: 'clothing' },
  '등산 장갑': { category: 'clothing' },
  '등산복': { category: 'clothing' },
  '등산화': { category: 'clothing' },
  '모자': { category: 'clothing' },
  '목도리': { category: 'clothing' },
  '목욕 가운': { category: 'clothing' },
  '바람막이 자켓': { category: 'clothing' },
  '반사 조끼/의류': { category: 'clothing' },
  '방수 바지/장화': { category: 'clothing' },
  '방수 신발': { category: 'clothing' },
  '방수 자켓': { category: 'clothing' },
  '방수 장갑': { category: 'clothing' },
  '방한 내의': { category: 'clothing' },
  '방한 모자': { category: 'clothing' },
  '부츠': { category: 'clothing' },
  '비치웨어': { category: 'clothing' },
  '샌들': { category: 'clothing' },
  '샌들/슬리퍼': { category: 'clothing' },
  '속옷': { category: 'clothing' },
  '수영 모자': { category: 'clothing' },
  '수영복': { category: 'clothing' },
  '스카프': { category: 'clothing' },
  '스카프/터번': { category: 'clothing' },
  '스키 부츠': { category: 'clothing' },
  '스키 의류': { category: 'clothing' },
  '스포츠 선글라스': { category: 'clothing' },
  '슬리퍼': { category: 'clothing' },
  '시원한 옷': { category: 'clothing' },
  '아이 수영복': { category: 'clothing' },
  '아이 옷 여벌': { category: 'clothing' },
  '야간용 재킷': { category: 'clothing' },
  '운동복': { category: 'clothing', aliases: ['스포츠 의류'] },
  '운동용 마스크': { category: 'clothing' },
  '일회용 우비': { category: 'clothing' },
  '자전거 장갑': { category: 'clothing' },
  '장갑': { category: 'clothing' },
  '장기체류 의류': { category: 'clothing' },
  '정장/비즈니스 캐주얼': { category: 'clothing' },
  '정장/칵테일 드레스': { category: 'clothing' },
  '카키색 옷': { category: 'clothing' },
  '캐주얼 의류': { category: 'clothing' },
  '캡모자': { category: 'clothing' },
  '튼튼한 신발': { category: 'clothing' },
  '팀 유니폼': { category: 'clothing' },
  '패드 팬츠': { category: 'clothing' },
  '편한 옷': { category: 'clothing' },

  // ── essentials (배치 2) ──
  // 병합은 4건뿐이다. 쿨러 계열(쿨러/쿨러백/작은 쿨러백)·베개 계열(베개/목베개/회복용 베개)·
  // 가방 계열(방수 가방/방수 파우치/작은 가방)은 형태나 크기가 갈려 병합하지 않았다.
  // '현금'은 '현금/카드'의 부분집합이지만 단독으로도 쓰여 독립 유지.
  '간단한 게임도구': { category: 'essentials' },
  '간단한 크래커': { category: 'essentials' },
  '간식': { category: 'essentials' },
  '건강 간식': { category: 'essentials' },
  '고글': { category: 'essentials' },
  '교재': { category: 'essentials' },
  '귀마개': { category: 'essentials' },
  '기저귀': { category: 'essentials' },
  '낚시 도구': { category: 'essentials' },
  '낚싯대': { category: 'essentials' },
  '냅킨/물티슈': { category: 'essentials' },
  '노트': { category: 'essentials' },
  '노트/펜': { category: 'essentials' },
  '다용도 칼': { category: 'essentials' },
  '다이빙 마스크': { category: 'essentials' },
  '담요': { category: 'essentials' },
  '대중교통 카드': { category: 'essentials' },
  '도시락/음식': { category: 'essentials' },
  '돗자리/매트': { category: 'essentials' },
  '등산 배낭': { category: 'essentials' },
  '랜턴/손전등': { category: 'essentials' },
  '로프': { category: 'essentials' },
  '매트/패드': { category: 'essentials' },
  '먼지 방지 커버': { category: 'essentials' },
  '메모장/펜': { category: 'essentials' },
  '명함 지갑': { category: 'essentials' },
  '모래 방지 커버': { category: 'essentials' },
  '목베개': { category: 'essentials' },
  '물/음료': { category: 'essentials' },
  '물안경': { category: 'essentials' },
  '미끼': { category: 'essentials' },
  '바비큐 도구': { category: 'essentials' },
  '방석': { category: 'essentials' },
  '방수 가방': { category: 'essentials' },
  '방수 가방 커버': { category: 'essentials' },
  '방수 성냥/라이터': { category: 'essentials' },
  '방수 파우치': { category: 'essentials' },
  '배낭': { category: 'essentials' },
  '버너': { category: 'essentials' },
  '베개': { category: 'essentials' },
  '보드게임': { category: 'essentials' },
  '보온병': { category: 'essentials' },
  '보호대': { category: 'essentials' },
  '비치백': { category: 'essentials' },
  '사이즈 측정 테이프': { category: 'essentials' },
  '사전': { category: 'essentials' },
  '서류 가방': { category: 'essentials' },
  '손전등': { category: 'essentials' },
  '쇼핑백/에코백': { category: 'essentials' },
  '수면 안대': { category: 'essentials' },
  '스노클': { category: 'essentials' },
  '스키 패스 홀더': { category: 'essentials' },
  '스키/스노보드': { category: 'essentials' },
  '시음 노트': { category: 'essentials' },
  '쌍안경': { category: 'essentials' },
  '쓰레기 봉투': { category: 'essentials' },
  '아이 간식': { category: 'essentials' },
  '압축 팩': { category: 'essentials' },
  '얼음팩/쿨러': { category: 'essentials' },
  '에너지바': { category: 'essentials' },
  '에너지바/초콜릿': { category: 'essentials' },
  '여권 파우치': { category: 'essentials' },
  '여행용 수건': { category: 'essentials' },
  '와인 가방': { category: 'essentials' },
  '와인 스토퍼': { category: 'essentials' },
  '와인 오프너': { category: 'essentials' },
  '와인/와인잔': { category: 'essentials' },
  '요가 매트': { category: 'essentials' },
  '우산/우비': { category: 'essentials' },
  '유모차': { category: 'essentials' },
  '음료': { category: 'essentials' },
  '음악 플레이리스트': { category: 'essentials' },
  '응원 도구': { category: 'essentials' },
  '일회용 접시/컵': { category: 'essentials' },
  '자물쇠': { category: 'essentials' },
  '자전거': { category: 'essentials' },
  '자전거 물통': { category: 'essentials' },
  '자전거 수리 키트': { category: 'essentials' },
  '자전거 잠금장치': { category: 'essentials' },
  '작은 가방': { category: 'essentials' },
  '작은 가방/파우치': { category: 'essentials' },
  '작은 쿨러백': { category: 'essentials' },
  '장난감': { category: 'essentials' },
  '전해질 음료': { category: 'essentials' },
  '접이식 의자': { category: 'essentials', aliases: ['캠핑 의자', '휴대용 의자'] },
  '젖병/이유식': { category: 'essentials' },
  '제습제': { category: 'essentials' },
  '조리도구': { category: 'essentials' },
  '주차 동전': { category: 'essentials' },
  '지갑': { category: 'essentials' },
  '지도/나침반': { category: 'essentials' },
  '차량 정비 도구': { category: 'essentials' },
  '침구': { category: 'essentials', aliases: ['가벼운 침구'] },
  '침낭': { category: 'essentials' },
  '침낭 라이너': { category: 'essentials' },
  '카메라 가방': { category: 'essentials' },
  '카시트': { category: 'essentials' },
  '코펠/취사도구': { category: 'essentials' },
  '쿨러': { category: 'essentials' },
  '쿨러/아이스박스': { category: 'essentials' },
  '쿨러백': { category: 'essentials' },
  '타올': { category: 'essentials' },
  '텐트': { category: 'essentials' },
  '튜브/구명조끼': { category: 'essentials' },
  '트레킹 스틱': { category: 'essentials' },
  '파라솔': { category: 'essentials' },
  '핀': { category: 'essentials' },
  '필기구': { category: 'essentials' },
  '헤드랜턴': { category: 'essentials' },
  '헬멧': { category: 'essentials' },
  '현금': { category: 'essentials' },
  '현금/카드': { category: 'essentials', aliases: ['신용카드/현금'] },
  '호루라기': { category: 'essentials', aliases: ['비상용 호루라기'] },
  '회복용 베개': { category: 'essentials' },

  // ── toiletries (배치 3) ──
  // 신규 병합 없음. '세탁 세제'≠'세탁용품'(구체 vs 포괄), '보습 스프레이'≠'수분 크림'(형태),
  // '마사지 오일'≠'아로마 오일'(용도), '아이 선크림'≠'선크림'.
  '땀 수건': { category: 'toiletries' },
  '립밤': { category: 'toiletries' },
  '마사지 오일': { category: 'toiletries' },
  '물티슈': { category: 'toiletries' },
  '방충제': { category: 'toiletries' },
  '보습 스프레이': { category: 'toiletries' },
  '세면도구': { category: 'toiletries' },
  '세탁 세제': { category: 'toiletries' },
  '세탁용품': { category: 'toiletries' },
  '수분 크림': { category: 'toiletries' },
  '아로마 오일': { category: 'toiletries' },
  '아이 선크림': { category: 'toiletries' },
  '여행용 티슈/물티슈': { category: 'toiletries' },
  '휴지': { category: 'toiletries' },

  // ── medicines (배치 3) ──
  // 신규 병합 없음. '방충제'(toiletries)와 '모기약'(medicines)은 카테고리가 갈리고
  // 기피제와 치료약은 다른 물건일 공산이 커서 묶지 않았다.
  '멀미약': { category: 'medicines' },
  '모기약': { category: 'medicines' },
  '붕대/거즈': { category: 'medicines' },
  '아이 약품': { category: 'medicines' },
  '이퀄라이징 약': { category: 'medicines' },
  '전해질 보충제': { category: 'medicines' },
  '체온계': { category: 'medicines' },
  '혈압계': { category: 'medicines' },

  // ── electronics (배치 4) ──
  // '이어폰/헤드폰'은 슬래시 이름이지만 정본으로 뒀다 — '이어폰'만 남기면 헤드폰이 사라진다.
  // 카메라 계열(방수/수중/액션캠/DSLR)과 배터리 계열(배터리 팩/여분 배터리)은 용도가 갈려 독립.
  '계산기/환율 앱': { category: 'electronics' },
  '네비게이션': { category: 'electronics' },
  '노트북': { category: 'electronics', aliases: ['노트북/태블릿'] },
  '렌즈 청소 도구': { category: 'electronics' },
  '망원렌즈': { category: 'electronics' },
  '멀티탭': { category: 'electronics' },
  '메모리카드': { category: 'electronics' },
  '명상 앱': { category: 'electronics' },
  '반사판': { category: 'electronics' },
  '방수 시계': { category: 'electronics' },
  '방수 카메라': { category: 'electronics' },
  '방수팩': { category: 'electronics' },
  '배터리 팩': { category: 'electronics' },
  '변압기': { category: 'electronics' },
  '분위기 조명': { category: 'electronics' },
  '블루투스 스피커': { category: 'electronics' },
  '삼각대': { category: 'electronics' },
  '수중 카메라': { category: 'electronics' },
  '액션캠': { category: 'electronics' },
  '여분 렌즈': { category: 'electronics' },
  '여분 배터리': { category: 'electronics' },
  '여행용 다리미': { category: 'electronics', aliases: ['휴대용 다리미'] },
  '외장하드': { category: 'electronics' },
  '이어폰/헤드폰': { category: 'electronics', aliases: ['이어폰'] },
  '차량용 충전기': { category: 'electronics' },
  '카메라': { category: 'electronics' },
  '통역 앱': { category: 'electronics' },
  '플레이어/스피커': { category: 'electronics' },
  '필터': { category: 'electronics' },
  '휴대용 선풍기': { category: 'electronics' },
  'DSLR/미러리스 카메라': { category: 'electronics' },

  // ── documents (배치 4) ──
  // 티켓은 교통수단별로 독립이다('기차 티켓'≠'버스 티켓'≠'비행기 탑승권').
  // '배 티켓'과 '선박 티켓'만 같은 것이라 묶었다. 용도별 지도(도시/쇼핑몰/테마파크)도 독립.
  '가이드북': { category: 'documents' },
  '교통편 티켓': { category: 'documents' },
  '기차 티켓': { category: 'documents' },
  '다이빙 로그북': { category: 'documents' },
  '다이빙 자격증': { category: 'documents' },
  '도시 지도': { category: 'documents' },
  '동반자 연락처': { category: 'documents' },
  '명함': { category: 'documents' },
  '박물관 패스': { category: 'documents' },
  '버스 티켓': { category: 'documents' },
  '보험 서류': { category: 'documents' },
  '비행기 탑승권': { category: 'documents' },
  '선박 티켓': { category: 'documents', aliases: ['배 티켓'] },
  '쇼핑 리스트': { category: 'documents' },
  '쇼핑몰 지도': { category: 'documents' },
  '시티투어 패스': { category: 'documents' },
  '여행 서류': { category: 'documents' },
  '유스호스텔 카드': { category: 'documents' },
  '유학생 비자': { category: 'documents' },
  '의료 기록': { category: 'documents' },
  '입장권/예약 확인서': { category: 'documents' },
  '증명사진': { category: 'documents' },
  '지도/가이드북': { category: 'documents' },
  '처방전': { category: 'documents' },
  '테마파크 지도': { category: 'documents' },
  '티켓': { category: 'documents' },
  '프레젠테이션 자료': { category: 'documents' },
};

module.exports = { itemCatalog };
