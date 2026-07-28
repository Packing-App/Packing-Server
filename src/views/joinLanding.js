// src/views/joinLanding.js
// 초대 링크 웹 랜딩 페이지. app.js가 라우트만 갖고 마크업은 여기서 만든다.
//
// 이 페이지는 **사용자 자유 입력(여행 제목·목적지)을 렌더한다.** 예외 없이 escapeHtml을 통과시킨다.
// 특히 OG 메타는 값이 속성(content="...") 안에 들어가서 `"` 하나만 새도 즉시 속성 탈출이 된다.
const { escapeHtml } = require('../utils/html');
const { PUBLIC_ORIGIN, APP_SCHEME, APP_STORE_URL } = require('../config/appLinks');

const DEFAULT_OG_IMAGE = `${PUBLIC_ORIGIN}/static/app-icon.png`;

// Cloud Run 컨테이너는 UTC로 뜬다. 서버 로컬 시간대에 기대면 날짜가 하루 밀린다.
const KST_DATE_FORMAT = { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' };

const formatKstDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('ko-KR', KST_DATE_FORMAT);
};

/** 여행 기간을 "8월 10일 - 8월 13일"로. 당일치기면 하나만. */
const formatPeriod = (startDate, endDate) => {
  const start = formatKstDate(startDate);
  const end = formatKstDate(endDate);
  if (!start) return end;
  if (!end || start === end) return start;
  return `${start} - ${end}`;
};

const STYLES = `
  body{font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;margin:0;padding:24px 0;background:#f7f7f8;color:#1c1c1e;display:flex;min-height:100vh;box-sizing:border-box;align-items:center;justify-content:center}
  .card{background:#fff;border-radius:20px;padding:24px;max-width:340px;width:calc(100% - 32px);text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.08)}
  .hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;margin-bottom:16px;background:#eceef1}
  h1{font-size:20px;margin:8px 0 6px;word-break:keep-all}
  p{color:#6b6b70;font-size:14px;line-height:1.5;margin:4px 0}
  .meta{color:#3c3c43;font-size:15px;font-weight:500}
  .code-label{font-size:12px;color:#9a9aa0;margin-top:20px}
  .code{font-size:22px;font-weight:700;letter-spacing:2px;margin:4px 0 16px;color:#2b7fff}
  a.btn{display:block;margin-top:12px;background:#2b7fff;color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:600}
  a.btn.sub{background:#fff;color:#2b7fff;border:1px solid #d3d9e2}
  .hint{font-size:12px;color:#9a9aa0;margin-top:14px}
`;

/**
 * 공통 셸. og 값들은 **이미 이스케이프된 문자열**을 받는다.
 */
const shell = ({ ogTitle, ogDescription, ogImage, ogUrl, body }) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>패킹 여행 초대</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="패킹">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDescription}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${ogUrl}">
<style>${STYLES}</style>
</head>
<body>
  <div class="card">
${body}
  </div>
  <script src="/static/join.v1.js" defer></script>
</body>
</html>`;

/**
 * 정상 초대 링크 페이지.
 * @param {object} params
 * @param {string} params.code 서버가 발급한 초대 코드(=journey.inviteCode). URL 파라미터 원문이 아니다
 * @param {object} params.preview invitePreviewService.toPreviewPayload 결과
 */
const renderInvite = ({ code, preview }) => {
  const pageUrl = `${PUBLIC_ORIGIN}/join/${code}`;
  const appUrl = `${APP_SCHEME}://join?code=${code}`;

  const title = escapeHtml(preview.title);
  const destination = escapeHtml(preview.destination);
  const period = escapeHtml(formatPeriod(preview.startDate, preview.endDate));
  const people = `${preview.participantCount}명이 함께 준비 중`;
  const image = preview.imageUrl ? escapeHtml(preview.imageUrl) : '';

  const meta = [destination, period].filter(Boolean).join(' · ');

  const body = `    ${image ? `<img class="hero" src="${image}" alt="">` : ''}
    <h1>${title}</h1>
    <p class="meta">${meta}</p>
    <p>${people}</p>
    <p class="code-label">초대 코드</p>
    <div class="code">${code}</div>
    <a class="btn" href="${appUrl}">앱에서 열기</a>
    <a class="btn sub" id="store" href="${APP_STORE_URL}" data-copy="${pageUrl}">App Store에서 패킹 받기</a>
    <p class="hint">앱이 열리지 않으면 아직 설치 전이에요.</p>`;

  // meta/title은 위에서 이미 이스케이프됐다. 여기서 또 걸면 &amp;amp; 로 이중 이스케이프된다.
  return shell({
    ogTitle: `🧳 ${title}`,
    ogDescription: meta ? `${meta} · ${people}` : people,
    ogImage: image || DEFAULT_OG_IMAGE,
    ogUrl: pageUrl,
    body
  });
};

/**
 * 만료·폐기·없는 코드 페이지.
 * 404가 아니라 **200으로 준다** — 인앱 브라우저가 자체 오류 화면으로 덮어버리기 때문이다.
 * OG에는 여행 정보를 담지 않는다. 폐기한 링크가 미리보기로 정보를 계속 흘리면 폐기가 무의미해진다.
 */
const renderUnavailable = () =>
  shell({
    ogTitle: '🧳 패킹 여행 초대',
    ogDescription: '사용할 수 없는 초대 링크예요.',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${PUBLIC_ORIGIN}/join`,
    body: `    <h1>🧳 만료됐거나 사용할 수 없는 초대 링크예요</h1>
    <p>초대한 사람에게 링크를 다시 받아주세요.</p>
    <a class="btn" href="${APP_STORE_URL}">App Store에서 패킹 받기</a>`
  });

module.exports = { renderInvite, renderUnavailable, formatPeriod };
