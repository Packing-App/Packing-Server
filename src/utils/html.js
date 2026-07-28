// src/utils/html.js
// 서버가 렌더하는 HTML(초대 링크 랜딩)에 사용자 자유 입력을 넣기 위한 이스케이프.
//
// 여행 제목·목적지는 사용자가 100자까지 자유 입력한다. 랜딩은 본문뿐 아니라
// OG 메타의 **속성값**(content="...")에도 이 값을 넣으므로 `"`를 빠뜨리면 즉시 속성 탈출이 된다.
// 그래서 5종을 모두 치환한다.
const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * HTML 본문·속성값에 안전하게 넣을 수 있게 이스케이프한다.
 * @param {*} value null/undefined는 빈 문자열
 * @returns {string}
 */
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

module.exports = { escapeHtml };
