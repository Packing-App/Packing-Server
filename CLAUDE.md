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

## 아키텍처 — 계층 흐름

요청은 항상 이 순서로 흐른다. 새 기능도 이 계층을 따른다.

```
routes/ → middlewares/ → controllers/ → services/ → models/
```

- **routes/** (`src/routes/`): 엔드포인트 정의. 인증 필요 라우트는 `middlewares/auth.js`의 `protect`를 건다. `app.js`가 `/api/*`와 `/*`(접두사 없음) 양쪽에 마운트한다(iOS 호환).
- **controllers/** (`src/controllers/`): 요청 파싱·검증·응답. 비즈니스 로직이 무거워지면 service로 뺀다.
- **services/** (`src/services/`): 도메인 로직(추천·이메일·푸시). 순수 로직은 순수하게 유지해 테스트 가능하게 둔다.
- **models/** (`src/models/`): Mongoose 스키마. 검증·pre 훅을 스키마 레벨에 둔다.

## 규약 (반드시 따를 것)

- **응답은 responseHelper로 통일**: `src/utils/responseHelper.js`의 `sendSuccess(res, status, message, data)` / `sendError(res, status, message)`를 쓴다. `res.json`을 직접 부르지 않는다.
- **로깅은 winston**: `require('./config/logger')`의 `logger.info/warn/error`. `console.log` 금지.
- **에러는 던지고 중앙에서**: 최종 에러 핸들러가 `app.js`에 있다. 컨트롤러에서는 try/catch 후 `sendError` 또는 next(err).
- **응답 메시지·주석은 한국어**가 관례.
- **환경변수는 필수화**: 시크릿에 하드코딩 폴백을 두지 않는다. 필요한 env가 없으면 부팅을 실패시킨다.

## 외부 연동

날씨(OpenWeather), 이미지(Unsplash), 저장소(AWS S3), 이메일(SendGrid), 푸시(APNs), 소셜로그인(Google/Kakao/Naver/Apple, Passport). 키는 `.env`(gitignore됨).

## 테스트 정책

- 대상 우선순위: **순수함수 먼저**(예: `services/itemRecommendationService.js`의 기간·교통·병합 로직). DB/외부 API 의존 함수는 목킹 비용이 크므로 필요할 때만.
- 테스트 위치: `src/**/__tests__/*.test.js`.
