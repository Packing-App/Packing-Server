const { escapeHtml } = require('../html');

describe('escapeHtml', () => {
  test('5종 문자를 모두 치환한다', () => {
    expect(escapeHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  test('OG 속성값 탈출 시도를 막는다', () => {
    // <meta content="${title}"> 안에 들어가는 경로. " 가 남으면 즉시 속성 탈출이다.
    expect(escapeHtml('"><script>alert(1)</script>')).toBe(
      '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  test('&를 먼저 치환해 이중 이스케이프 꼬임이 없다', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  test('평범한 제목은 그대로 둔다', () => {
    expect(escapeHtml('제주도 3박 4일 🧳')).toBe('제주도 3박 4일 🧳');
  });

  test('null/undefined는 빈 문자열', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('문자열이 아닌 값도 문자열로 변환해 처리한다', () => {
    expect(escapeHtml(3)).toBe('3');
  });
});
