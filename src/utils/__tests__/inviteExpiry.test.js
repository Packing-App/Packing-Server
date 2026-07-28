const { isInviteExpired } = require('../inviteExpiry');

// endDate = 2026-08-13T00:00:00Z (KST 8월 13일 09시). grace +24h → 2026-08-14T00:00:00Z 까지 유효.
const END = '2026-08-13T00:00:00.000Z';
const at = (iso) => new Date(iso);

describe('isInviteExpired', () => {
  test('여행 시작 전에는 만료가 아니다', () => {
    expect(isInviteExpired({ endDate: END }, at('2026-08-01T00:00:00.000Z'))).toBe(false);
  });

  test('종료일 당일 KST 밤(=UTC +14h)에도 만료가 아니다', () => {
    // grace가 없으면 여기서 이미 만료로 잡혀 마지막 날 참여가 막힌다
    expect(isInviteExpired({ endDate: END }, at('2026-08-13T14:00:00.000Z'))).toBe(false);
  });

  test('종료일 +23시간은 만료가 아니다', () => {
    expect(isInviteExpired({ endDate: END }, at('2026-08-13T23:00:00.000Z'))).toBe(false);
  });

  test('정확히 +24시간은 아직 만료가 아니다 (초과일 때만 만료)', () => {
    expect(isInviteExpired({ endDate: END }, at('2026-08-14T00:00:00.000Z'))).toBe(false);
  });

  test('종료일 +25시간은 만료다', () => {
    expect(isInviteExpired({ endDate: END }, at('2026-08-14T01:00:00.000Z'))).toBe(true);
  });

  test('Date 객체로 들어와도 동일하게 판정한다', () => {
    expect(isInviteExpired({ endDate: new Date(END) }, at('2026-08-14T01:00:00.000Z'))).toBe(true);
  });

  test('endDate가 없거나 파싱 불가면 만료로 취급하지 않는다', () => {
    expect(isInviteExpired({}, at('2030-01-01T00:00:00.000Z'))).toBe(false);
    expect(isInviteExpired({ endDate: '언젠가' }, at('2030-01-01T00:00:00.000Z'))).toBe(false);
    expect(isInviteExpired(null, at('2030-01-01T00:00:00.000Z'))).toBe(false);
  });
});
