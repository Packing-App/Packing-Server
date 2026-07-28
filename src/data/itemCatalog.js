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
 *   배치 0(현재): 카테고리 충돌 3건 + 빈도 상위 별칭 그룹. 나머지는 카테고리별로 채운다.
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
  '편한 옷': { category: 'clothing' }
};

module.exports = { itemCatalog };
