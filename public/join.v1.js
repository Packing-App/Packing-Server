// public/join.v1.js
// App Store로 나가기 전에 초대 링크를 클립보드에 남긴다.
// 설치 후 첫 실행에서 앱이 detectPatterns(.probableWebURL)로 "URL이 있다"는 것만 확인하고
// (붙여넣기 경고 배너 없이) UIPasteControl로 실제 값을 받아간다.
//
// ⚠️ 파일명이 캐시 키다. /static은 maxAge 7일이라 내용을 고치면 join.v2.js로 이름을 바꾸고
//    src/views/joinLanding.js의 참조도 함께 바꿔야 수정이 퍼진다.
document.getElementById('store')?.addEventListener('click', async (e) => {
  const link = e.currentTarget.dataset.copy;
  const storeUrl = e.currentTarget.href;

  e.preventDefault();

  try {
    await navigator.clipboard.writeText(link);
  } catch (_) {
    // 카카오톡 인앱 브라우저 등에서 거부될 수 있다. 복사 실패가 스토어 이동을 막으면 안 된다
    // (앱에는 코드 직접 입력 fallback이 있다).
  }

  location.href = storeUrl;
});
