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

describe('mergeDuplicateItems — canonical key', () => {
  it('표기만 다른 이름은 하나로 병합되고 정본 이름으로 통일된다', () => {
    const merged = mergeDuplicateItems([
      { name: '래쉬가드', category: 'clothing', isEssential: false },
      { name: '래시가드', category: 'clothing', isEssential: true }
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('래시가드');
    expect(merged[0].isEssential).toBe(true);
  });

  it('카테고리는 입력 순서와 무관하게 카탈로그 정본을 따른다', () => {
    // 선크림은 소스마다 essentials / toiletries로 갈려 있어 병합 순서에 따라 분류가 달라졌다
    const pair = [
      { name: '선크림', category: 'essentials', isEssential: true },
      { name: '선크림', category: 'toiletries', isEssential: true }
    ];
    expect(mergeDuplicateItems(pair)[0].category).toBe('toiletries');
    expect(mergeDuplicateItems([...pair].reverse())[0].category).toBe('toiletries');
  });

  it('isEssential 승격 시 이미 쌓인 count가 유실되지 않는다', () => {
    // count 있는 비필수 → count 없는 필수 순서여야 재현된다. 뒤집으면 옛 코드도 통과했다
    const merged = mergeDuplicateItems([
      { name: '양말', category: 'clothing', isEssential: false, count: 3 },
      { name: '양말', category: 'clothing', isEssential: true }
    ]);
    expect(merged[0].count).toBe(3);
    expect(merged[0].isEssential).toBe(true);

    // 반대 순서도 같은 결과여야 한다
    const reversed = mergeDuplicateItems([
      { name: '양말', category: 'clothing', isEssential: true },
      { name: '양말', category: 'clothing', isEssential: false, count: 3 }
    ]);
    expect(reversed[0].count).toBe(3);
    expect(reversed[0].isEssential).toBe(true);
  });

  it('비행기 준비물에서 여권/신분증 표기가 정리된다', () => {
    const merged = mergeDuplicateItems(getTransportBasedItems('plane'));
    const names = merged.map((i) => i.name);

    expect(names).not.toContain('여권/신분증'); // 신분증으로 통일
    expect(names).toContain('신분증');
    expect(names).toContain('여권'); // 비행기 전용이라 신분증과 별개로 남는다
    expect(names.filter((n) => n === '신분증')).toHaveLength(1);
    expect(names).toContain('충전기'); // '휴대폰 충전기'가 정본으로 통일된 것
  });

  it('테마 소스가 흘리는 _id를 응답에서 제거한다', () => {
    const merged = mergeDuplicateItems([
      { _id: '507f1f77bcf86cd799439011', name: '우산', category: 'essentials', isEssential: true }
    ]);
    expect(merged[0]._id).toBeUndefined();
    expect(Object.keys(merged[0]).sort()).toEqual(['category', 'isEssential', 'name']);
  });

  it('카탈로그에 없는 이름은 원본 이름·카테고리를 유지한다', () => {
    const merged = mergeDuplicateItems([
      { name: '할머니 약봉지', category: 'medicines', isEssential: false },
      { name: '우산', category: 'essentials', isEssential: true }
    ]);
    expect(merged).toHaveLength(2);

    const custom = merged.find((i) => i.name === '할머니 약봉지');
    expect(custom).toBeDefined();
    expect(custom.category).toBe('medicines');
  });
});
