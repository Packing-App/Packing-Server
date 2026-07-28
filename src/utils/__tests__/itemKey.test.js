// 준비물 이름 정규화 유틸 테스트 (카탈로그 데이터에 의존)
const { resolveItem } = require('../itemKey');

describe('resolveItem', () => {
  it('등록된 별칭은 정본 이름·카테고리로 해석된다', () => {
    const resolved = resolveItem('자외선 차단제');
    expect(resolved.name).toBe('선크림');
    expect(resolved.category).toBe('toiletries');
    expect(resolved.key).toBe(resolveItem('선크림').key);
  });

  it('띄어쓰기만 다른 표기는 같은 키가 된다', () => {
    expect(resolveItem('비치 타올').key).toBe(resolveItem('비치타올').key);
    expect(resolveItem('비치 타올').name).toBe('비치타올');
  });

  it('카탈로그에 없는 이름은 원본을 유지하고 카테고리는 null이다', () => {
    const resolved = resolveItem('할머니 약봉지');
    expect(resolved.name).toBe('할머니 약봉지'); // 정규화된 문자열을 보여주면 안 된다
    expect(resolved.category).toBeNull();
  });

  it('빈 값이 들어와도 예외를 던지지 않는다', () => {
    expect(() => resolveItem(null)).not.toThrow();
    expect(() => resolveItem(undefined)).not.toThrow();
    expect(resolveItem('').name).toBe('');
    expect(resolveItem(null).category).toBeNull();
  });

  it('정본 이름 자신도 자기 키로 해석된다', () => {
    const resolved = resolveItem('선크림');
    expect(resolved.name).toBe('선크림');
    expect(resolved.category).toBe('toiletries');
  });
});
