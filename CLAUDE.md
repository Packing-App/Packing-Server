# Packing-Server — 개발 가이드

여행 준비물 앱 백엔드. Node.js + Express + MongoDB(Mongoose) + Socket.io.
공통 원칙은 [루트 CLAUDE.md](../CLAUDE.md) 참조. 이 문서는 서버 고유 사항만 다룬다.

## 실행 / 검증 명령

```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 (nodemon)
npm start          # 프로덕션 실행
npm test           # Jest 유닛테스트  ← 커밋 전 필수
npm run test:syntax  # 문법 체크 (node --check)
npm run lint       # ESLint (flat config)
npm run format     # Prettier
```

Node 버전: `>=18 <23` (package.json engines).

## 라우팅 — 관례와 다른 점 2개

디렉터리 구조(`routes/` → `controllers/` → `services/` → `models/`)는 Express 관례 그대로다.
관례로 짐작할 수 없는 건 이 둘뿐이다.

- **`app.js`가 모든 라우터를 `/api/*`와 `/*`(접두사 없음) 양쪽에 마운트한다**(`src/app.js`).
  iOS 클라이언트 호환 때문이다. **라우터를 추가하면 두 블록 다 등록해야 한다.**
- 인증이 필요한 라우트에는 `src/middlewares/auth.js`의 `protect`를 건다.
  비인증으로도 열리되 로그인 상태면 응답을 더 채우는 라우트에는 같은 파일의 `optionalAuth`를 쓴다
  (토큰이 없거나 깨져도 통과시키고 `req.user`만 비운다). 현재 사용처는 초대 미리보기 하나다.

## 재사용 자산 — 새로 짜기 전에 여기부터

### 여행 접근 권한 — `src/middlewares/journeyAccess.js`

**여행 관련 라우트를 추가할 때 참가자·생성자 검증을 손으로 다시 짜지 말고 이걸 쓴다.**

- `loadJourneyRequireParticipant` (`:17`) — journeyId를 `params.id` → `params.journeyId` →
  `body.journeyId` 순으로 찾아 여행을 로드한다. 없으면 404, 참가자가 아니면 403.
  로드된 문서를 **`req.journey`에 주입**하므로 컨트롤러에서 다시 조회할 필요가 없다.
- `requireJourneyCreator(message?)` (`:41`) — 위 미들웨어 **뒤에** 걸어 생성자만 통과시킨다.
- `isParticipant` / `isCreator` — populate 여부와 무관하게 안전 비교하는 헬퍼.
  컨트롤러 안에서 직접 판정할 때 쓴다(raw ObjectId 배열의 `.includes`는 어긋날 수 있다).

사용례: `src/routes/journeys.js`, `src/routes/packingItems.js`.

### 알림 — `notifyUser` (`src/services/notificationService.js:22`)

알림 생성의 **단일 진입점**. 알림을 추가할 땐 반드시 여기를 통과시킨다(Notification 문서 생성과
푸시 발송이 여기서 함께 처리된다).

```js
notifyUser(recipient, { type, content, journeyId, metadata }, pushOptions)
```

사용 중: `src/utils/scheduler.js:85,181,246`, `src/controllers/notificationController.js:6`.

### 실시간 — `src/socket/socketSetup.js`

`io.emit`을 직접 짜지 말고 헬퍼를 쓴다.

- `sendNotification(io, userId, notification)` (`:96`)
- `sendParticipantUpdate(io, journeyId, data)` (`:109`)
- `sendPackingItemUpdate(io, journeyId, item)` (`:122`)

⚠️ iOS 앱은 현재 소켓에 접속하지 않는다(순수 REST). 소켓이 실제로 쓰일 때의 인프라 제약은
[DEPLOYMENT.md](DEPLOYMENT.md)의 "인프라 제약" 참조.

### 초대 링크 — `src/services/invitePreviewService.js`

초대 코드로 "무슨 여행인지"를 조회하는 **단일 진입점**. 웹 랜딩(`src/views/joinLanding.js`)과
미리보기 API(`GET /journeys/preview/:code`)가 같은 판정·같은 노출 범위를 쓰도록 여기 모았다.

- `getInvitePreview(code)` — 형식 검증 → 조회 → `isPrivate` → 만료 순으로 거른다.
  **`isPrivate`는 notfound와 똑같이 취급**한다(여행의 존재조차 알리지 않는다).
- `toPreviewPayload(journey)` — 초대받은 사람에게 보여도 되는 필드만. **출발지(`origin`)·참가자
  목록·여행 ID는 의도적으로 뺐다.** 여기에 필드를 더하기 전에 "링크를 주운 사람이 봐도 되나"를 먼저 본다.

랜딩은 **사용자 자유 입력(제목·목적지)을 렌더**하므로 `escapeHtml`을 반드시 통과시킨다.
스크립트는 `public/join.v<n>.js`로 외부화돼 있다 — `/static`이 7일 캐시라 **내용을 고치면 파일명 버전을 올린다**.

### Rate limit — `src/middlewares/rateLimit.js`

공개 경로(랜딩·미리보기·참여)에만 걸려 있다. ⚠️ **`trust proxy`를 켜지 않는다** — 켜면
X-Forwarded-For 위조로 제한을 우회할 수 있다. 대신 Cloudflare가 넣는 `CF-Connecting-IP`를
키로 쓴다(`resolveClientIp`). 새 공개 라우트를 열면 여기에 리미터를 추가한다.

### `src/utils/`

| 파일 | 쓰임 |
|---|---|
| `responseHelper.js` | `sendSuccess` / `sendError` — 아래 규약 |
| `jwt.js` | `generateAccessToken` / `generateRefreshToken` / `verifyToken` |
| `appleAuth.js` | `createAppleClientSecret` — Apple 네이티브 로그인 검증용 |
| `locationUtils.js` | `processCityName` / `translateCityName` / `initCityList` / `searchCities`. `src/data/cityTranslations.js`(한↔영 도시·국가 매핑) 기반 |
| `externalApiUtils.js` | `getWeatherData` / `analyzeWeatherCondition` / `getDestinationImage` |
| `inviteCode.js` | `generateInviteCode` / `normalizeCode` / `isValidCode` — 혼동되는 글자(I/L/O/0/1) 제외 알파벳. 여행 초대 코드와 친구 코드가 공유한다. 테스트 있음 |
| `inviteExpiry.js` | `isInviteExpired(journey, now)` — 초대 링크 만료(= `endDate + 1일`). 만료 전용 필드는 없다. 테스트 있음 |
| `html.js` | `escapeHtml` — 서버 렌더 HTML에 사용자 입력을 넣을 때. 테스트 있음 |
| `scheduler.js` | `initSchedulers` — node-cron 정기 알림(매일 09시·08시, 매주 월 10시) |

특히 `scheduler.js`와 `inviteCode.js`는 모르고 다시 만들기 쉬우니 먼저 확인한다.

### 8자 코드 — 여행 초대 코드 / 친구 코드

둘 다 `inviteCode.js`의 같은 알파벳(`ABCDEFGHJKMNPQRSTUVWXYZ23456789`)을 쓴다.

- **사용자 입력 코드는 반드시 `normalizeCode` → `isValidCode`를 거친다.** 정규식 메타문자와 길이 이상 입력이
  여기서 걸린다. 친구 검색이 `$regex`로 회원 명부를 열거당한 원인이 이 검증의 부재였다.
- 형식 정규식은 **`ALPHABET`에서 파생**시킨다. 손으로 쓴 범위(`A-HJ-N` 등)는 `L`을 다시 끌어들여
  알파벳과 어긋난다 — 실제로 그런 적이 있다.
- **발급은 지연 발급이다.** 여행은 `getInviteLink` 호출 시(`journeyController.js`), 친구 코드는
  `getMyProfile` 호출 시(`userController.js`) 발급된다. 마이그레이션 스크립트는 없다.

⚠️ **코드 필드의 유니크 인덱스에 `sparse`를 쓰지 않는다.** sparse는 *필드 누락*만 건너뛰고
`null`은 색인하므로, `default: null`과 함께 쓰면 코드가 없는 문서 **두 개째에서 E11000**이 난다.
`partialFilterExpression: { <필드>: { $type: 'string' } }`를 쓴다. `Journey.inviteCode`가
실제로 이 함정에 빠졌었다(2026-07-26 수정, 운영 인덱스 재생성 필요했음).

⚠️ **mongoose는 이름이 같은 기존 인덱스를 고쳐주지 않는다.** 인덱스 옵션을 바꾸면 배포 전에
운영 DB에서 기존 인덱스를 드롭해야 하고, 안 하면 `autoIndex`가 조용히 실패한다.

## 규약 (반드시 따를 것)

- **응답은 responseHelper로 통일**: `src/utils/responseHelper.js`의
  `sendSuccess(res, statusCode, message, data = null)` /
  `sendError(res, statusCode, message, errors = null)`를 쓴다.
  라우트 핸들러에서 `res.json`을 직접 부르지 않는다.
  **정당한 예외는 `src/app.js`의 인프라 응답뿐** — 루트, `/health`, `/health/ready`, AASA,
  초대 링크 웹 랜딩(HTML), 최종 에러 핸들러. 이들은 API 응답 규격
  (`{ success, message, data }`)을 따르지 않는 게 맞다.
- **로깅은 winston**: `require('./config/logger')`의 `logger.info/warn/error`. `console.log` 금지.
- **에러는 던지고 중앙에서**: 최종 에러 핸들러가 `app.js`에 있다. 컨트롤러에서는 try/catch 후
  `sendError` 또는 `next(err)`.
- **언어는 기본 한국어**(응답 메시지·주석). 다만 일부 응답은 `src/localization/messages.js`(ko/en)로
  분기한다 — 현재 사용처는 `src/controllers/packingItemController.js:539,557`.
  `req.lang`(ko|en)은 `src/middlewares/localization.js`가 `Accept-Language`에서 채운다.
  `app.js`에 전역 마운트돼 있고, iOS는 기기 로케일을 이 헤더로 실어 보낸다.
  ⚠️ **다국어 응답은 위 한 엔드포인트뿐이고 나머지 메시지는 전부 한국어 하드코딩이다.**
  영어 기기는 지금 혼재된 응답을 받는다 — 새 메시지를 다국어로 낼지는 그때 판단한다.

## 배포

절차·운영 명령·콘솔 수동 단계·비용 가드는 전부 [DEPLOYMENT.md](DEPLOYMENT.md)에 있다.
코드를 쓸 때 알아야 하는 것만 여기 남긴다.

**`.env`에 새 env를 추가하면 `scripts/gcp-config.sh`의 `SECRET_KEYS`(→Secret Manager) 또는
`PLAIN_KEYS`(→평문 환경변수) 배열에도 넣어야 배포본에 반영된다.** 안 넣으면 로컬에서만 동작하고
Cloud Run에서는 `undefined`가 된다.

### 공개 주소 — 함정 2개

앱이 보는 주소는 `https://packing-api.iyungui.dev`이고, 그 뒤에 Cloudflare Worker(`cloudflare/src/index.js`)가 Cloud Run으로 프록시한다.

- ⚠️ **`req.get('host')`로 공개 URL을 만들지 않는다.** Worker가 프록시하면서 Host를 `*.run.app`으로 재작성하기 때문에, 그렇게 만든 링크는 외부에서 열리지 않는다(유니버설 링크는 아예 앱이 안 열린다). 공개 URL은 **`src/config/appLinks.js`의 `PUBLIC_ORIGIN` 상수**를 쓴다. 원래 호스트가 정말 필요하면 Worker가 넣어주는 `X-Forwarded-Host`를 본다.
- ⚠️ **`CLIENT_URL` env는 이름과 달리 API 베이스**(`https://packing-api.iyungui.dev/api`)다. 공개 링크 생성에 쓰면 `/api/join/<code>` 같은 잘못된 주소가 나간다. 현재 정당한 사용처는 `src/socket/socketSetup.js`의 CORS origin뿐.

## 외부 연동

날씨·이미지·저장소·이메일·푸시·소셜로그인(Google/Kakao/Naver/Apple)을 쓴다.
구체적인 SDK·서비스는 `package.json` 의존성을 보면 된다. 키는 전부 `.env`(gitignore됨).

## 테스트 정책

- 대상 우선순위: **순수함수 먼저**(예: `services/itemRecommendationService.js`의 기간·교통·병합 로직).
  DB/외부 API 의존 함수는 목킹 비용이 크므로 필요할 때만.
- 테스트 위치: `src/**/__tests__/*.test.js`.
