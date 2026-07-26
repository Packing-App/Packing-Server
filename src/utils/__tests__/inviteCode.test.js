const { generateInviteCode, normalizeCode, isValidCode } = require('../inviteCode');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

describe('generateInviteCode', () => {
  it('기본 길이는 8자다', () => {
    expect(generateInviteCode()).toHaveLength(8);
  });

  it('지정한 길이로 생성한다', () => {
    expect(generateInviteCode(12)).toHaveLength(12);
  });

  it('혼동 문자(0,O,1,I,L)를 포함하지 않는다', () => {
    const code = generateInviteCode(500);
    expect(code).not.toMatch(/[0O1IL]/);
  });

  it('허용된 알파벳 문자만 사용한다', () => {
    const code = generateInviteCode(500);
    for (const ch of code) {
      expect(ALPHABET).toContain(ch);
    }
  });
});

describe('normalizeCode', () => {
  it('소문자를 대문자로 바꾼다', () => {
    expect(normalizeCode('abcdefgh')).toBe('ABCDEFGH');
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(normalizeCode('  ABCDEFGH \n')).toBe('ABCDEFGH');
  });

  it('null과 undefined를 빈 문자열로 다룬다', () => {
    expect(normalizeCode(null)).toBe('');
    expect(normalizeCode(undefined)).toBe('');
  });
});

describe('isValidCode', () => {
  it('생성된 코드는 항상 통과한다', () => {
    for (let i = 0; i < 100; i++) {
      expect(isValidCode(generateInviteCode())).toBe(true);
    }
  });

  it('소문자로 입력해도 통과한다', () => {
    expect(isValidCode(generateInviteCode().toLowerCase())).toBe(true);
  });

  it('길이가 8자가 아니면 거부한다', () => {
    expect(isValidCode('ABCDEFG')).toBe(false);
    expect(isValidCode('ABCDEFGHJ')).toBe(false);
    expect(isValidCode('')).toBe(false);
  });

  it('혼동 문자(0,O,1,I,L)를 거부한다', () => {
    expect(isValidCode('ABCDEFG0')).toBe(false);
    expect(isValidCode('ABCDEFGO')).toBe(false);
    expect(isValidCode('ABCDEFG1')).toBe(false);
    expect(isValidCode('ABCDEFGI')).toBe(false);
    expect(isValidCode('ABCDEFGL')).toBe(false);
  });

  // 이메일 부분검색 시절 회원 명부를 통째로 열거하던 입력들
  it('정규식 메타문자와 열거 시도를 거부한다', () => {
    for (const input of ['.', '.*', '^', '$', '[a-z]', '.{8}', 'apple', 'a', '@', '.......  ']) {
      expect(isValidCode(input)).toBe(false);
    }
  });

  it('문자열이 아닌 입력을 거부한다', () => {
    expect(isValidCode(null)).toBe(false);
    expect(isValidCode(undefined)).toBe(false);
    expect(isValidCode({})).toBe(false);
    expect(isValidCode(12345678)).toBe(false);
  });
});
