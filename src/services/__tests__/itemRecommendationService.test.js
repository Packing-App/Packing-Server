// 추천 서비스의 순수함수 유닛테스트 (DB/외부 API 의존 없음)
const {
  getDurationBasedItems,
  getTransportBasedItems,
  mergeDuplicateItems
} = require('../itemRecommendationService');

const findItem = (items, name) => items.find((i) => i.name === name);

describe('getDurationBasedItems', () => {
  it('3박4일이면 속옷/양말 수량이 여행 일수(4)와 같다', () => {
    const items = getDurationBasedItems('2026-08-01', '2026-08-04');
    expect(findItem(items, '속옷').count).toBe(4);
    expect(findItem(items, '양말').count).toBe(4);
  });

  it('여분 옷 수량은 최대 7로 제한된다', () => {
    const items = getDurationBasedItems('2026-08-01', '2026-08-04');
    expect(findItem(items, '여분 옷').count).toBe(4);

    const longItems = getDurationBasedItems('2026-08-01', '2026-08-11'); // 11일
    expect(findItem(longItems, '여분 옷').count).toBe(7);
  });

  it('단기 여행(7일 이하)에는 세탁 용품이 없다', () => {
    const items = getDurationBasedItems('2026-08-01', '2026-08-04');
    expect(findItem(items, '세탁 세제')).toBeUndefined();
    expect(findItem(items, '여행용 다리미')).toBeUndefined();
  });

  it('장기 여행(7일 초과)에는 세탁 용품이 추가된다', () => {
    const items = getDurationBasedItems('2026-08-01', '2026-08-11'); // 11일
    expect(findItem(items, '세탁 세제')).toBeDefined();
    expect(findItem(items, '여행용 다리미')).toBeDefined();
  });
});

describe('getTransportBasedItems', () => {
  it('모든 교통수단에 공통 준비물(지갑·충전기)이 포함된다', () => {
    const items = getTransportBasedItems('plane');
    expect(findItem(items, '지갑')).toBeDefined();
    expect(findItem(items, '휴대폰 충전기')).toBeDefined();
  });

  it('비행기는 탑승권 등 항공 전용 준비물을 포함한다', () => {
    const items = getTransportBasedItems('plane');
    expect(findItem(items, '비행기 탑승권')).toBeDefined();
    expect(findItem(items, '목베개')).toBeDefined();
  });

  it('알 수 없는 교통수단은 기본 티켓만 추가한다', () => {
    const items = getTransportBasedItems('teleport');
    expect(findItem(items, '교통편 티켓')).toBeDefined();
    expect(findItem(items, '비행기 탑승권')).toBeUndefined();
  });
});

describe('mergeDuplicateItems', () => {
  it('같은 이름은 하나로 병합하고 isEssential=true를 우선한다', () => {
    const merged = mergeDuplicateItems([
      { name: '우산', category: 'essentials', isEssential: false },
      { name: '우산', category: 'essentials', isEssential: true }
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].isEssential).toBe(true);
  });

  it('수량이 있으면 더 큰 값으로 병합한다', () => {
    const merged = mergeDuplicateItems([
      { name: '양말', category: 'clothing', isEssential: true, count: 2 },
      { name: '양말', category: 'clothing', isEssential: true, count: 5 }
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].count).toBe(5);
  });

  it('서로 다른 이름은 각각 유지된다', () => {
    const merged = mergeDuplicateItems([
      { name: '우산', category: 'essentials', isEssential: true },
      { name: '양말', category: 'clothing', isEssential: true }
    ]);
    expect(merged).toHaveLength(2);
  });
});
