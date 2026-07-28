// 카탈로그 무결성 검사.
// itemKey.js는 로드 시점에 throw하지 않으므로(서버가 죽으면 안 된다) 여기서 잡는다.
const { itemCatalog } = require('../itemCatalog');
const { normalizeItemName } = require('../../utils/itemKey');

// PackingItem.js / ThemeTemplate.js의 category enum과 같은 목록
const CATEGORIES = [
  'clothing',
  'electronics',
  'toiletries',
  'documents',
  'medicines',
  'essentials',
  'other'
];

describe('itemCatalog 무결성', () => {
  it('하나의 별칭이 두 항목에 중복 등록되지 않는다', () => {
    const seen = new Map();
    const conflicts = [];

    Object.entries(itemCatalog).forEach(([canonicalName, entry]) => {
      (entry.aliases || []).forEach((alias) => {
        const normalized = normalizeItemName(alias);
        if (seen.has(normalized)) {
          conflicts.push(`'${alias}' → ${seen.get(normalized)} / ${canonicalName}`);
        }
        seen.set(normalized, canonicalName);
      });
    });

    expect(conflicts).toEqual([]);
  });

  it('별칭이 다른 항목의 정본 이름과 겹치지 않는다', () => {
    const canonicalNames = new Set(Object.keys(itemCatalog).map(normalizeItemName));
    const conflicts = [];

    Object.entries(itemCatalog).forEach(([canonicalName, entry]) => {
      // 띄어쓰기만 다른 별칭('비치 타올' → '비치타올')은 자기 정본과 같아진다. 정상이다
      const ownNormalized = normalizeItemName(canonicalName);

      (entry.aliases || []).forEach((alias) => {
        const normalized = normalizeItemName(alias);
        if (normalized === ownNormalized) {
          return;
        }
        if (canonicalNames.has(normalized)) {
          conflicts.push(`'${alias}'(${canonicalName}의 별칭)이 다른 항목의 정본 이름과 충돌`);
        }
      });
    });

    expect(conflicts).toEqual([]);
  });

  it('모든 카테고리가 PackingItem enum 안에 있다', () => {
    const invalid = Object.entries(itemCatalog)
      .filter(([, entry]) => !CATEGORIES.includes(entry.category))
      .map(([name, entry]) => `${name}: ${entry.category}`);

    expect(invalid).toEqual([]);
  });
});
