# Packing 배포·인프라 핸드오프

> 최종 업데이트: 2026-07-25
> 이 문서는 백엔드 호스팅 이전(Render → Cloud Run)과 커스텀 도메인화, iOS 배포 파이프라인
> 구축 작업의 요약·인수인계다. 다음 작업자(또는 다음 세션)가 이것만 읽어도 배포와 잔재 정리를
> 이어갈 수 있게 정리했다. QuoteHub에서 검증한 패턴을 Packing에 이식한 것이다.
>
> **브라우저/콘솔에서 사람이 해야 하는 단계는 `HANDOFF-MANUAL-PROMPTS.md`에 복붙 가능한
> 프롬프트로 따로 있다.** 이 문서는 무엇을·왜, 저 문서는 어떻게(수동).

---

## 1. 무엇을 하려는가

**목표**: 백엔드를 Render 무료(15분 유휴 스핀다운, 복귀 30~60초)에서 **끊기지 않는 무료**
환경으로 옮기고, 이후 서버를 옮겨도 앱 재배포가 필요 없게 만든다.

### 아키텍처 (목표 상태)
```
iOS 앱 (Packing, me.iyungui.Packing)
  └→ https://packing-api.iyungui.dev              ← 앱에 박힌 고정 주소 (Endpoints.swift 한 줄)
       └→ Cloudflare Worker (packing-api-proxy)    ← 백엔드 이전 시 여기 ORIGIN만 변경
            └→ Cloud Run (packing-server, 서울 asia-northeast3)
                 ├→ MongoDB Atlas (Network Access 0.0.0.0/0)
                 └→ AWS S3 (이미지)
```

### 이번에 만든 것 (코드/파일)
- **Cloud Run 배포 자산** — `Dockerfile`, `.dockerignore`, `scripts/gcp-{config,setup-secrets,deploy}.sh`, `CLOUD_RUN_DEPLOY.md`
- **Cloudflare Worker 프록시** — `cloudflare/{wrangler.toml, src/index.js, README.md}`
- **서버 코드 보강** — `src/app.js`에 `/health/ready`(DB 연결 확인), `src/server.js`의 포트 폴백을 비프로덕션 한정으로 가드
- **iOS fastlane** — `Packing-iOS/Packing/{fastlane/Fastfile, fastlane/Appfile, Gemfile}`, `.gitignore` 보강
- **핸드오프** — 이 문서 + `HANDOFF-MANUAL-PROMPTS.md`

### 아직 안 한 것 (컷오버/수동)
- 실제 GCP 프로젝트 생성·배포, OAuth 콘솔 재등록, Cloudflare Worker 배포 → `HANDOFF-MANUAL-PROMPTS.md`
- `Endpoints.swift`의 `baseURL` 교체 → **Worker가 라이브가 된 뒤**에만. 현재는 여전히 `packing-server-x09g.onrender.com`.

---

## 2. ⚠️ Packing 고유 주의 (QuoteHub 단순 복사 아님)

1. **웹 OAuth 3종(Google/Kakao/Naver) 콜백 재등록** — 도메인이 바뀌면 `.env`의
   `GOOGLE_CALLBACK_URL`·`KAKAO_CALLBACK_URL`·`NAVER_CALLBACK_URL` host를 새 도메인으로 바꾸고,
   **각 개발자 콘솔에도 같은 redirect URI를 등록**해야 로그인이 안 깨진다. 경로는 현재 값 그대로,
   host만 `packing-api.iyungui.dev`로. (콜백 값은 코드에서 `src/config/passport.js`가 env로 읽는다.)
   - Apple은 **네이티브 플로우**(iOS가 처리 후 `POST /auth/apple/verify`로 검증)라 서버 콜백이
     없다. `APPLE_CALLBACK_URL`은 `.env`에 있으나 코드에서 미사용 → 재등록 불필요.
2. **socket.io는 지금 휴면** — 서버는 소켓을 띄우지만 **iOS 앱은 접속하지 않는다**(순수 REST).
   그래서 Worker는 단순 프록시로 충분하고 지금 당장 문제 없다. Cloud Run엔 예방적으로
   `--session-affinity`·`--timeout=3600`을 켜뒀다. 향후 실시간 클라이언트가 붙으면
   `CLOUD_RUN_DEPLOY.md`의 "socket.io 주의"를 볼 것(Redis 어댑터 등).
3. **GCP 새 프로젝트도 무료** — 무료 한도는 결제계정 단위라 QuoteHub와 분리된 새 프로젝트를
   만들어도 추가 비용 0.

---

## 3. iOS 배포 방법 (fastlane)

### 사전 준비 (최초 1회) — `HANDOFF-MANUAL-PROMPTS.md`의 "App Store Connect" 참고
- App Store Connect **API 키**(.p8) 발급 → `Packing-iOS/Packing/fastlane/.env` 작성(gitignore됨):
  ```
  ASC_KEY_ID=xxxxxxxxxx
  ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ASC_KEY_PATH=./fastlane/AuthKey_XXXXXXXXXX.p8
  ```
- `.p8` 키 파일은 `fastlane/` 안에 둔다(gitignore됨). **분실 주의 — 재발급만 가능, 원본 재다운로드 불가.**
- 앱 정보: 번들 `me.iyungui.Packing`, 팀 `285ZKW5MPR`, 스킴 `Packing`. 현재 버전 `1.3` (build 5).

### 명령 (실행 위치: `Packing-iOS/Packing/`)
```bash
bundle install               # 최초 1회
bundle exec fastlane beta                 # TestFlight 업로드
bundle exec fastlane release              # App Store 업로드 (자동 제출 안 함)
bundle exec fastlane release version:1.4  # 마케팅 버전까지 올려서
```

### 알아야 할 것
- 빌드 번호는 **자동 증가**(TestFlight 최신 +1을 xcargs로 주입). pbxproj는 안 건드린다.
- `release`는 **업로드까지만** 한다. 실제 심사는 App Store Connect에서 사람이 "심사 제출"을 눌러야 시작.
- **사용자 터미널에서 실행할 것** — 코드 서명 시 키체인 팝업이 뜰 수 있어 자동화 환경에선 멈춘다.
- ⚠️ fastlane 실행 시 `fastlane/README.md`가 자동 생성/덮어써질 수 있다(정상).
- **컷오버 순서**: 서버(Cloud Run+Worker)가 새 도메인에서 정상 응답하는 것을 확인한 **뒤**
  `Endpoints.swift`의 `baseURL`을 `https://packing-api.iyungui.dev`로 바꾸고 새 빌드를 올린다.

---

## 4. 잔재 정리 TODO

### 🔴 새 앱 빌드가 App Store에 실제 출시된 것을 확인한 "후에"
- [ ] **Render 서비스 삭제.** 그 전엔 금지 — 옛 빌드 유저가 아직 Render(onrender.com)를 본다.
- [ ] 삭제 후 `render.yaml` 제거.

### 🟡 지금 할 수 있는 것
- [ ] **OAuth 3종 콘솔 redirect URI 재등록** (Google/Kakao/Naver) + `.env` 콜백 값 교체 → 재배포.
- [ ] **Uptime 모니터를 새 주소로 재조준**: `packing-api.iyungui.dev/health`.
- [ ] **도메인 자동 갱신(Auto-renew) ON 확인** (Cloudflare, `iyungui.dev`). 만료 시 전 서비스 중단.
- [ ] Atlas Network Access가 `0.0.0.0/0`인지 확인.

### 🟢 선택
- [ ] (원하면) GitHub Actions로 fastlane CI/CD 자동화 — 지금은 수동. ASC 키를 Secret으로.
- [ ] `npm audit` 정리(특히 `multer` 1.x → 2.x는 breaking 주의), `aws-sdk` v2 → v3 검토.
- [ ] socket.io를 실제로 쓰게 되면 Redis 어댑터 도입.
- [ ] QuoteHub 레포 `cloudflare/DOMAIN-GUIDE.md`의 "사용 중인 서브도메인 대장"에
      `packing-api.iyungui.dev` 행 추가(도메인 대장 일원화).

---

## 5. 관련 문서
- `CLOUD_RUN_DEPLOY.md` — Cloud Run 배포·운영·롤백·비용
- `cloudflare/README.md` — Worker 프록시
- `HANDOFF-MANUAL-PROMPTS.md` — 브라우저/콘솔 수동 단계(복붙 프롬프트)
- (도메인 큰 그림) QuoteHub 레포 `cloudflare/DOMAIN-GUIDE.md`
