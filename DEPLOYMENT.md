# Packing-Server — 배포·운영 가이드

백엔드를 배포하고 운영하는 데 필요한 절차 전부. 코드에서 읽을 수 없는 것(콘솔 수동 단계, 비용 가드
근거, 인프라 제약)을 여기에 모았다.

## 구성

```
iOS 앱 (me.iyungui.Packing)
  └→ https://packing-api.iyungui.dev          ← 앱에 박힌 고정 주소 (baseURL 한 줄)
       └→ Cloudflare Worker (packing-api-proxy) ← 백엔드를 옮기면 여기 ORIGIN만 바꾼다
            └→ Cloud Run (packing-server, asia-northeast3 서울)
                 ├→ MongoDB Atlas (Network Access 0.0.0.0/0)
                 └→ AWS S3 (이미지)
```

앱과 백엔드 사이에 Worker를 한 겹 둔 이유는 **백엔드를 옮겨도 앱 재배포가 필요 없게** 하기 위해서다.
`cloudflare/src/index.js`의 `ORIGIN` 상수 한 줄이 Cloud Run 호스트를 가리킨다.

현재 상태: Cloud Run 리비전 `packing-server-00007-hnw`, `main` = `7b6ebfc`.
**CI 없음.** `dev` → `main` 병합 후 로컬에서 수동 실행한다.

## 배포 절차

사전 조건: `gcloud` CLI 설치 + 로그인(확인 `gcloud auth list`), 그리고 `.env`가 최신일 것.
Worker 배포용 wrangler는 `npx`로 받으므로 별도 설치가 필요 없다.

```bash
# 서버 코드 배포 — 코드가 바뀔 때마다
./scripts/gcp-deploy.sh

# 시크릿 등록 — 최초 1회 / .env의 시크릿 값이 바뀔 때만
./scripts/gcp-setup-secrets.sh

# 앞단 프록시 — Cloud Run 호스트(ORIGIN)가 바뀔 때만
cd cloudflare && npx wrangler deploy
```

`gcp-deploy.sh`는 로컬 Docker 없이 소스를 Cloud Build로 올려 `Dockerfile`로 빌드한다.
첫 배포 3~5분, 이후 1~2분. 끝나면 서비스 URL과 `/health`·`/health/ready` 응답을 출력한다.

`gcp-setup-secrets.sh`는 `.env`를 읽어 민감한 값을 Secret Manager에 등록하고 전용 서비스 계정
`packing-run`에 읽기 권한을 준다. 값이 그대로면 새 버전을 만들지 않으므로 여러 번 실행해도 안전하다.

### 설정 단일 출처 — `scripts/gcp-config.sh`

| 항목 | 값 |
|---|---|
| `PROJECT_ID` | `packing-503507` |
| `REGION` | `asia-northeast3` (서울) |
| `SERVICE_NAME` | `packing-server` |
| `SERVICE_ACCOUNT_NAME` | `packing-run` |

`.env`의 값 중 `SECRET_KEYS` 배열에 든 것은 Secret Manager로, `PLAIN_KEYS` 배열에 든 것은 평문
환경변수로 주입된다.
⚠️ **새 env를 추가하면 이 배열 중 하나에 반드시 넣어야 배포본에 반영된다.** 넣지 않으면 로컬에서만
동작하고 Cloud Run에서는 `undefined`가 된다.

### 무엇이 바뀌었을 때 무엇을 하나

| 바뀐 것 | 할 일 |
|---|---|
| 서버 코드 | `./scripts/gcp-deploy.sh` |
| `.env`의 시크릿 값 | `./scripts/gcp-setup-secrets.sh` → `./scripts/gcp-deploy.sh` |
| 콜백 URL·`CLIENT_URL` 등 평문 env | `.env` 수정 → `./scripts/gcp-deploy.sh` |
| 리전·서비스명·시크릿 목록 | `scripts/gcp-config.sh` 수정 → 재배포 |
| Cloud Run 호스트(백엔드 이전) | `cloudflare/src/index.js`의 `ORIGIN` 교체 → `npx wrangler deploy` |
| 공개 도메인 자체 | `cloudflare/wrangler.toml`의 route + `.env` 콜백 + OAuth 콘솔 + iOS `Packing/Packing/Data/Network/Endpoints.swift`의 `baseURL` |

## 운영

```bash
# 로그 실시간
gcloud run services logs tail packing-server --project=packing-503507 --region=asia-northeast3

# 현재 상태 / 리비전 확인
gcloud run services describe packing-server --project=packing-503507 --region=asia-northeast3

# 직전 리비전으로 롤백 (위에서 리비전 이름 확인 후)
gcloud run services update-traffic packing-server --to-revisions=REVISION_NAME=100 \
  --project=packing-503507 --region=asia-northeast3
```

헬스체크 엔드포인트는 두 개다(`src/app.js`).

- `/health` — liveness. 무조건 200. 컨테이너가 떴는지만 본다.
- `/health/ready` — readiness. MongoDB 연결이 끊겨 있으면 503. 모니터링은 이쪽을 보는 게 유용하다.

Uptime 모니터 대상: `https://packing-api.iyungui.dev/health`.

## 비용 가드

무료 한도를 넘지 않게 `scripts/gcp-deploy.sh`에 박아둔 값. **바꾸기 전에 이유를 먼저 볼 것.**

- `--min-instances=0` — 유휴 시 과금 없음. 대신 콜드스타트 1~3초.
- `--max-instances=3` — 트래픽 급증·공격 시 과금 폭주 상한.
- `--concurrency=80` — 인스턴스당 동시 요청을 높게 잡아 vCPU-초 절약.
- `--memory=512Mi`, `--cpu=1` — 최소 사양.
- `--timeout=3600`, `--session-affinity` — socket.io 대비(아래 참고).

Cloud Run 무료 한도(월 200만 요청, 180k vCPU-초, 360k GiB-초)는 **결제 계정 단위**로 부여된다.
그래서 프로젝트를 새로 파도 추가 비용이 들지 않는다. 결제 계정 연결 자체는 무료 한도를 쓰기 위해 필수다.
예산 알림: https://console.cloud.google.com/billing/budgets

## 인프라 제약

- **MongoDB Atlas Network Access는 `0.0.0.0/0`이어야 한다.** Cloud Run은 이그레스 IP가 고정되지
  않아서 특정 IP만 허용하면 DB 연결이 실패한다. 고정 IP를 쓰려면 VPC 커넥터 + Cloud NAT가 필요한데
  이건 **유료**다.
- **socket.io는 현재 휴면.** 서버는 `src/socket/socketSetup.js`에서 소켓을 띄우지만 iOS 앱은 접속하지
  않는다(순수 REST). 그래서 Worker의 단순 패스스루로 충분하고 `--timeout=3600`의 비용 영향도 사실상 0이다.
  실시간 클라이언트가 실제로 붙게 되면:
  - polling→websocket 업그레이드가 같은 인스턴스로 가야 한다 → `--session-affinity`(이미 켬)로 완화.
  - 다중 인스턴스로 확장되면 room 상태가 인스턴스별로 쪼개진다 → Socket.IO **Redis 어댑터** 필요(현재 미구성).
  - `socketSetup.js`의 CORS origin은 `CLIENT_URL` 기반이고 `credentials: true`라 `CLIENT_URL`을
    정확히 지정해야 한다(와일드카드 `*`는 credentialed CORS에서 무효).
- **공개 URL 생성 시 함정 2개**(`req.get('host')` 금지 / `CLIENT_URL`은 실은 API 베이스)는
  [CLAUDE.md의 "공개 주소 — 함정 2개"](CLAUDE.md) 참고. 코드를 쓸 때 반드시 먼저 볼 것.
- **웹 OAuth 3종(Google/Kakao/Naver)은 도메인이 바뀌면 콘솔 재등록이 필요하다.** `.env`의
  `*_CALLBACK_URL`을 고치는 것만으로는 부족하고, **각 개발자 콘솔에도 같은 redirect URI를 등록**해야
  로그인이 안 깨진다(아래 "콘솔 수동 단계" 4~6). 콜백 값은 `src/config/passport.js`가 env에서 읽는다.
- **Apple 로그인은 서버 콜백이 없다.** iOS가 네이티브로 처리한 뒤 `POST /auth/apple/verify`로 검증한다.
  `.env`의 `APPLE_CALLBACK_URL`은 코드에서 미사용이라 도메인이 바뀌어도 손댈 필요 없다.

---

# 콘솔 수동 단계 (사람이 브라우저에서 해야 하는 것)

CLI로 자동화할 수 없는 단계들. **환경을 새로 구축하거나 도메인·키를 바꿀 때** 순서대로 따른다.
각 블록은 브라우저를 제어하는 AI에게 그대로 붙여넣을 수 있게 목표·URL·입력값·확인 방법을 담았다.

> ⚠️ **로그인·결제·자격증명 입력은 사람이 직접 승인한다.** AI는 화면 안내·이동까지만.

## 값 준비

| 플레이스홀더 | 뜻 | 어디서 얻나 |
|---|---|---|
| `<GCP_PROJECT_ID>` | Cloud Run 프로젝트 ID | 현재 `packing-503507`. 새로 만들면 아래 1번 |
| `<CLOUD_RUN_URL>` | Cloud Run 서비스 URL | `./scripts/gcp-deploy.sh` 출력 |
| `<GOOGLE_CB_PATH>` | 구글 콜백 경로 | `.env`의 `GOOGLE_CALLBACK_URL`에서 host 뒤 경로 (예: `/api/auth/google/callback`) |
| `<KAKAO_CB_PATH>` | 카카오 콜백 경로 | `.env`의 `KAKAO_CALLBACK_URL`에서 host 뒤 경로 |
| `<NAVER_CB_PATH>` | 네이버 콜백 경로 | `.env`의 `NAVER_CALLBACK_URL`에서 host 뒤 경로 |

> 콜백 URL 규칙: **`.env` 값에서 host만 공개 도메인으로 바꾸고 경로(path)는 그대로.**
> 즉 값 = `https://packing-api.iyungui.dev` + `<..._CB_PATH>`.

## 1. GCP — 프로젝트 생성 + 결제 연결

> 현재 프로젝트(`packing-503507`)를 계속 쓴다면 건너뛴다. 새 환경을 만들 때만.

⚠️ 결제 계정 연결은 사람이 승인.

```
목표: Packing 백엔드를 올릴 Google Cloud 프로젝트를 만들고 결제 계정을 연결한다.

1. https://console.cloud.google.com/projectcreate 로 이동.
2. Project name에 "packing" 입력하고 생성. 생성 후 상단 프로젝트 선택기에서 방금 만든
   프로젝트의 "프로젝트 ID"(예: packing-470xxx)를 정확히 읽어 나에게 알려줘. ← 이게 <GCP_PROJECT_ID>
3. https://console.cloud.google.com/billing 로 이동해, 이 프로젝트에 결제 계정을 연결.
   (결제 수단 입력/동의는 사람이 직접 한다. 나는 화면 위치만 안내한다.)
4. 연결 확인: https://console.cloud.google.com/billing/linkedaccount?project=<GCP_PROJECT_ID>
   에서 "billing is enabled" 상태인지 확인해 알려줘.

주의: 무료 한도(월 200만 요청 등)는 결제계정 단위로 부여되고, --max-instances=3 상한이 걸려 있어
폭주 과금은 막혀 있다. 실제 배포는 사람이 로컬에서 ./scripts/gcp-deploy.sh 로 한다(너는 하지 않는다).
```

확정 후 → `scripts/gcp-config.sh`의 `PROJECT_ID`를 `<GCP_PROJECT_ID>`로 교체.

## 2. MongoDB Atlas — 네트워크 접근 확인

```
목표: Cloud Run이 MongoDB Atlas에 붙을 수 있도록 네트워크 접근이 열려 있는지 확인한다.

1. https://cloud.mongodb.com 로그인(사람이 승인) → 해당 클러스터 선택.
2. 좌측 "Network Access" → IP Access List 확인.
3. 0.0.0.0/0 (모든 IP 허용) 항목이 있는지 확인해 알려줘.
   없으면 "ADD IP ADDRESS" → "ALLOW ACCESS FROM ANYWHERE"(0.0.0.0/0) 추가.

이유: Cloud Run은 이그레스 IP가 고정되지 않아 특정 IP만 허용하면 DB 연결이 실패한다.
```

## 3. Cloudflare — Worker + 서브도메인 + 도메인 자동갱신

> Cloud Run 배포가 끝나 `<CLOUD_RUN_URL>`이 나온 뒤 실행. Worker 배포 자체는 사람이 로컬에서
> `cd cloudflare && npx wrangler deploy`로 하는 게 안전하다(아래는 브라우저 확인·설정용).
> `cloudflare/wrangler.toml`의 route는 `packing-api.iyungui.dev` **custom_domain**이라 배포 시 DNS 레코드와
> TLS 인증서가 자동 생성된다.

⚠️ `wrangler login`은 브라우저 OAuth 승인이 필요(사람).

```
목표: packing-api.iyungui.dev 커스텀 도메인이 Cloudflare Worker로 살아있는지 확인하고,
     iyungui.dev 도메인 자동 갱신을 켠다.

1. https://dash.cloudflare.com 로그인(사람 승인) → 계정 선택.
2. Workers & Pages 에서 "packing-api-proxy" Worker가 있는지 확인.
   (없으면: 사람이 로컬 Packing-Server/cloudflare 에서 `npx wrangler login` 후 `npx wrangler deploy` 실행.)
3. 그 Worker의 Triggers/Custom Domains 에 packing-api.iyungui.dev 가 연결됐는지 확인해 알려줘.
4. 브라우저에서 https://packing-api.iyungui.dev/health 를 열어 응답이
   {"status":"ok",...} 인지 확인해 알려줘. (DNS/인증서 전파에 수 분 걸릴 수 있음)
5. iyungui.dev 도메인으로 이동 → Configuration(또는 Registration) → Auto-renew 가 ON 인지 확인.
   OFF면 ON으로. (만료되면 이 도메인에 걸린 모든 서비스가 끊긴다.)
```

## 4. Google OAuth — 승인된 redirect URI

⚠️ 콘솔 로그인은 사람 승인.

```
목표: 구글 로그인 콜백을 새 도메인으로 받도록 승인된 리디렉션 URI를 추가한다.

1. https://console.cloud.google.com/apis/credentials 로 이동(사람 로그인).
   ※ 이 OAuth 클라이언트는 Packing이 원래 쓰던 프로젝트에 있다. 배포용 프로젝트가
     아니라, 기존 OAuth 동의화면/클라이언트가 있는 프로젝트를 선택해야 한다.
2. "OAuth 2.0 클라이언트 ID" 목록에서 Packing이 쓰는 웹 클라이언트를 연다.
   (.env의 GOOGLE_CLIENT_ID 앞부분과 일치하는 것)
3. "승인된 리디렉션 URI"에 다음을 추가(기존 항목은 지우지 말고 병행):
       https://packing-api.iyungui.dev<GOOGLE_CB_PATH>
   예: https://packing-api.iyungui.dev/api/auth/google/callback
4. 저장. 반영에 수 분 걸릴 수 있음. 저장됐는지 확인해 알려줘.
```

## 5. Kakao — Redirect URI

⚠️ 콘솔 로그인은 사람 승인.

```
목표: 카카오 로그인 Redirect URI에 새 도메인을 추가한다.

1. https://developers.kakao.com/console/app 로 이동(사람 로그인) → Packing 앱 선택.
   (.env의 KAKAO_CLIENT_ID = 카카오 앱의 REST API 키/앱 ID와 매칭)
2. 좌측 "카카오 로그인" → "Redirect URI" 로 이동.
3. 다음 URI를 추가(기존 항목 병행 유지):
       https://packing-api.iyungui.dev<KAKAO_CB_PATH>
4. 저장 후 등록됐는지 확인해 알려줘.
   (참고: 카카오 로그인 활성화 상태와 동의항목은 기존 그대로 두면 됨.)
```

## 6. Naver — Callback URL

⚠️ 콘솔 로그인은 사람 승인.

```
목표: 네이버 로그인 Callback URL에 새 도메인을 추가한다.

1. https://developers.naver.com/apps/#/myapps 로 이동(사람 로그인) → Packing 애플리케이션 선택.
   (.env의 NAVER_CLIENT_ID와 매칭)
2. "API 설정" 탭 → "로그인 오픈API 서비스 환경" → "서비스 URL / Callback URL".
3. Callback URL에 다음을 추가(기존 항목 병행 유지):
       https://packing-api.iyungui.dev<NAVER_CB_PATH>
4. 저장 후 등록됐는지 확인해 알려줘.
```

> 4~6 완료 후: `.env`의 `GOOGLE_CALLBACK_URL`·`KAKAO_CALLBACK_URL`·`NAVER_CALLBACK_URL`도 새 값으로
> 바꾸고 `./scripts/gcp-deploy.sh`로 재배포해 Cloud Run env에 반영한다. 그래야 서버가 콜백을
> 새 도메인으로 생성한다.

## 7. App Store Connect — fastlane용 API 키 발급

> iOS 배포 절차 자체는 [Packing-iOS/CLAUDE.md](../Packing-iOS/CLAUDE.md)의 "빌드 / 배포(fastlane)"에
> 있다. 서버 작업은 아니지만 **키 발급이 콘솔 수동 단계**라 여기 둔다.

⚠️ 키 발급·다운로드는 사람. (.p8은 재다운로드 불가 — 분실 시 재발급만 가능)

```
목표: fastlane가 TestFlight/App Store 업로드에 쓸 App Store Connect API 키를 만든다.

1. https://appstoreconnect.apple.com/access/integrations/api 로 이동(사람 로그인).
2. "Team Keys"에서 "Generate API Key"(또는 +) → 이름 "packing-fastlane",
   Access는 "App Manager" 이상으로 생성.
3. 생성 후:
   - Key ID 를 읽어 알려줘.               ← ASC_KEY_ID
   - 상단의 Issuer ID 를 읽어 알려줘.       ← ASC_ISSUER_ID
   - "Download API Key"로 .p8 파일을 받아 Packing-iOS/Packing/fastlane/ 에 저장(사람).
     파일명 예: AuthKey_XXXXXXXXXX.p8   ← ASC_KEY_PATH 는 ./fastlane/AuthKey_XXXXXXXXXX.p8
4. 또한 https://appstoreconnect.apple.com/apps 에서 번들 me.iyungui.Packing 앱 레코드가
   존재하는지 확인해 알려줘. (없으면 "새 앱"으로 등록 필요 — 사람.)
```

발급 후 → `Packing-iOS/Packing/fastlane/.env`(gitignore됨)에 아래 작성(사람):

```
ASC_KEY_ID=<위 Key ID>
ASC_ISSUER_ID=<위 Issuer ID>
ASC_KEY_PATH=./fastlane/AuthKey_XXXXXXXXXX.p8
```

---

## 남은 정리 항목

- [ ] **Render 서비스 삭제** — https://dashboard.render.com 의 `packing-server`. 대시보드 작업이라
      사람이 해야 한다. 출시 게이트는 이미 풀렸다(App Store 1.5가 2026-07-30 출시, 새 도메인 사용).
      옛 서비스는 이미 502로 죽어 있어 롤백 가치도 없다(2026-08-02 확인).
- [x] 리포지토리에서 `render.yaml` 제거 (2026-08-02).
- [ ] Uptime 모니터를 `https://packing-api.iyungui.dev/health`로 재조준하고 Render URL 핑 중단.
- [ ] `iyungui.dev` 도메인 Auto-renew ON 확인 (만료 시 전 서비스 중단).
- [ ] `npm audit` 정리 — 특히 `multer` 1.x → 2.x는 breaking 주의. `aws-sdk` v2 → v3 검토.
- [ ] QuoteHub 레포 `cloudflare/DOMAIN-GUIDE.md`의 "사용 중인 서브도메인 대장"에
      `packing-api.iyungui.dev` 행 추가(도메인 대장 일원화).

## 관련 문서

- [CLAUDE.md](CLAUDE.md) — 서버 개발 가이드. 공개 URL 함정 2개는 여기.
- [cloudflare/README.md](cloudflare/README.md) — Worker 프록시 배포 상세.
- [README.md](README.md) — 프로젝트 개요·API 목록.
- [Packing-iOS/CLAUDE.md](../Packing-iOS/CLAUDE.md) — iOS 빌드·fastlane 배포.
