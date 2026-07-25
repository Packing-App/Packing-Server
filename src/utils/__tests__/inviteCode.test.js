const { generateInviteCode } = require('../inviteCode');

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
