// 외부에 노출되는 앱의 고정 주소들.
//
// PUBLIC_ORIGIN은 iOS 앱 entitlement(`applinks:packing-api.iyungui.dev`)에 박힌 값과
// 반드시 같아야 유니버설 링크가 걸린다. 요청 헤더(`req.get('host')`)에서 뽑으면 안 된다 —
// Cloudflare Worker가 Cloud Run으로 프록시하면서 Host를 `*.run.app`으로 바꿔 보내기 때문에
// 앱이 열지 못하는 링크가 나간다. 도메인을 바꾸면 iOS entitlement·이 값·Worker 라우트를
// 함께 고쳐야 한다.
const PUBLIC_ORIGIN = 'https://packing-api.iyungui.dev';

// 커스텀 스킴. 카카오톡 등 인앱 브라우저는 유니버설 링크를 발동시키지 않으므로
// 랜딩 페이지의 "앱에서 열기" 버튼이 이 스킴을 쓴다(SceneDelegate가 처리).
const APP_SCHEME = 'packingapp';

const APP_STORE_URL = 'https://apps.apple.com/app/id6745450311';

module.exports = { PUBLIC_ORIGIN, APP_SCHEME, APP_STORE_URL };
