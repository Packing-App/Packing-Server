const { resolveClientIp, clientIpKey } = require('../rateLimit');

const reqWith = (headers, ip) => ({ headers, ip });

describe('resolveClientIp', () => {
  test('CF-Connecting-IP가 있으면 그것을 쓴다', () => {
    const req = reqWith(
      { 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
      '10.0.0.9'
    );
    expect(resolveClientIp(req)).toBe('203.0.113.7');
  });

  test('CF 헤더가 없으면 X-Forwarded-For의 첫 항목을 쓴다', () => {
    const req = reqWith({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' }, '10.0.0.9');
    expect(resolveClientIp(req)).toBe('198.51.100.1');
  });

  test('둘 다 없으면 req.ip로 떨어진다', () => {
    expect(resolveClientIp(reqWith({}, '10.0.0.9'))).toBe('10.0.0.9');
  });

  test('아무 정보도 없으면 unknown', () => {
    expect(resolveClientIp(reqWith({}, undefined))).toBe('unknown');
    expect(resolveClientIp({})).toBe('unknown');
  });

  test('빈 문자열 헤더는 없는 것으로 본다', () => {
    const req = reqWith({ 'cf-connecting-ip': '  ', 'x-forwarded-for': '' }, '10.0.0.9');
    expect(resolveClientIp(req)).toBe('10.0.0.9');
  });
});

describe('clientIpKey', () => {
  test('IPv4는 그대로 키가 된다', () => {
    expect(clientIpKey(reqWith({ 'cf-connecting-ip': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  test('IPv6는 /56 서브넷으로 묶어 주소 갈아끼우기를 막는다', () => {
    const a = clientIpKey(reqWith({ 'cf-connecting-ip': '2001:db8:85a3:8d3:1319:8a2e:370:7348' }));
    const b = clientIpKey(reqWith({ 'cf-connecting-ip': '2001:db8:85a3:8d3:ffff:ffff:ffff:1' }));
    expect(a).toBe(b);
    expect(a).toContain('/56');
  });
});
