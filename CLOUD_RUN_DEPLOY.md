# Cloud Run 배포 가이드 (Packing)

Render 무료 플랜의 15분 유휴 스핀다운(복귀 30~60초)을 없애기 위해 Google Cloud Run으로 옮긴다.
Cloud Run은 유휴 시 0으로 축소되지만 요청이 오면 1~3초 내 응답하고, 인스턴스-시간 한도 소진이나
유휴 회수로 인한 중단이 없다.

> 브라우저/콘솔에서 사람이 직접 해야 하는 단계(프로젝트 생성·결제 연결·OAuth 콘솔·Cloudflare 등)는
> `HANDOFF-MANUAL-PROMPTS.md`에 복붙 가능한 프롬프트로 따로 정리돼 있다. 이 문서는 CLI 절차 중심이다.

## 사전 조건

- `gcloud` CLI 설치 및 로그인 (확인: `gcloud auth list`)
- **Packing 전용 새 GCP 프로젝트**에 결제 계정 연결
  - Cloud Run 무료 한도(월 200만 요청, 180k vCPU-초, 360k GiB-초)를 쓰려면 결제 연결 자체는 필수다.
  - 무료 한도는 **결제 계정 단위**로 부여된다. 그래서 QuoteHub와 별개의 새 프로젝트를 만들어도
    추가 비용이 없다(같은 결제 계정을 공유하면 한도를 나눠 쓰지만, 두 앱 모두 취미 규모라 넉넉하다).
  - `--max-instances=3` 상한으로 폭주도 막아둔다.
  - 프로젝트 생성·결제 연결은 `HANDOFF-MANUAL-PROMPTS.md`의 "1. GCP" 프롬프트 참고.
  - 생성한 프로젝트 ID를 `scripts/gcp-config.sh`의 `PROJECT_ID`에 채운다.
- **MongoDB Atlas 네트워크 접근이 `0.0.0.0/0`으로 열려 있을 것**
  - Cloud Run은 이그레스 IP가 고정되지 않는다. 특정 IP만 허용해두면 DB 연결이 실패한다.
  - 고정 IP가 필요하면 VPC 커넥터 + Cloud NAT가 필요한데 이건 **유료**다.
  - 확인: Atlas → Network Access → IP Access List
- **`.env`의 `*_CALLBACK_URL`·`CLIENT_URL`을 새 도메인으로 갱신했을 것**
  - `GOOGLE_CALLBACK_URL`·`KAKAO_CALLBACK_URL`·`NAVER_CALLBACK_URL`의 host를
    `packing-api.iyungui.dev`로 바꾼다(경로는 유지). 그리고 **각 OAuth 콘솔에도 같은 URL을 등록**해야
    로그인이 안 깨진다(`HANDOFF-MANUAL-PROMPTS.md`의 OAuth 프롬프트). Apple은 네이티브라 제외.

## 배포 절차

```bash
cd Packing-Server
```

**1단계 — 시크릿 등록 (최초 1회, 값이 바뀔 때만 다시)**

```bash
./scripts/gcp-setup-secrets.sh
```

`.env`를 읽어 민감한 값들을 Secret Manager에 등록하고, 전용 서비스 계정
`packing-run`을 만들어 읽기 권한을 부여한다. 값이 그대로면 새 버전을 만들지 않으므로
여러 번 실행해도 안전하다.

**2단계 — 배포 (코드 바뀔 때마다 반복)**

```bash
./scripts/gcp-deploy.sh
```

로컬 Docker 없이 소스를 Cloud Build로 올려 `Dockerfile`로 빌드한다. 첫 배포는 3~5분, 이후는 1~2분.
끝나면 서비스 URL과 `/health`, `/health/ready` 응답을 출력한다.

**3단계 — Cloudflare Worker에 URL 반영**

배포 출력 URL의 호스트 부분(`https://` 제외)을 `cloudflare/src/index.js`의 `ORIGIN`에 붙여넣고
`cloudflare/`에서 `npx wrangler deploy` (상세: `cloudflare/README.md`).

**4단계 — iOS 앱에 도메인 반영 (컷오버)**

Worker가 라이브가 된 뒤, `Packing/Packing/Data/Network/Endpoints.swift`의 `baseURL`을
`https://packing-api.iyungui.dev`로 바꾼다. 앱 전체에서 서버 주소를 참조하는 곳은 여기 한 군데다.

## 설정 값이 바뀔 때

| 바뀐 것 | 할 일 |
|---|---|
| `.env`의 시크릿 값 | `./scripts/gcp-setup-secrets.sh` 후 `./scripts/gcp-deploy.sh` |
| 서버 코드 | `./scripts/gcp-deploy.sh` |
| 콜백 URL·CLIENT_URL 등 평문 env | `.env` 수정 후 `./scripts/gcp-deploy.sh` |
| 리전·서비스명·시크릿 목록 | `scripts/gcp-config.sh` 수정 |

## 운영

```bash
# 로그 실시간 확인
gcloud run services logs tail packing-server --project=<PROJECT_ID> --region=asia-northeast3

# 현재 상태
gcloud run services describe packing-server --project=<PROJECT_ID> --region=asia-northeast3

# 직전 리비전으로 롤백 (리비전 목록에서 이름 확인 후)
gcloud run services update-traffic packing-server --to-revisions=REVISION_NAME=100 \
  --project=<PROJECT_ID> --region=asia-northeast3
```

## 비용 관리

무료 한도를 넘지 않게 잡아둔 설정(`scripts/gcp-deploy.sh`):

- `--min-instances=0` — 유휴 시 과금 없음
- `--max-instances=3` — 트래픽 급증/공격 시 상한
- `--concurrency=80` — 인스턴스당 동시 요청을 높게 잡아 vCPU-초 절약
- `--memory=512Mi`, `--cpu=1` — 최소 사양
- `--timeout=3600`, `--session-affinity` — socket.io 웹소켓 대비. iOS 앱은 현재 소켓을
  쓰지 않아 실제 연결이 없으므로 비용 영향은 사실상 0. 다만 향후 웹/실시간 클라이언트가
  붙어 소켓을 장시간 물고 있으면 인스턴스가 유지돼 과금될 수 있음을 유념.

예산 알림을 걸어두면 더 안전하다: https://console.cloud.google.com/billing/budgets

## socket.io 관련 주의 (지금은 휴면, 향후 대비)

- 서버는 `src/socket/socketSetup.js`에서 socket.io를 띄우지만 **iOS 앱은 접속하지 않는다**(순수 REST).
- 실시간 클라이언트가 생기면:
  - Worker의 단순 패스스루가 WebSocket 업그레이드를 넘겨주긴 하나, polling→websocket 업그레이드는
    같은 인스턴스로 가야 한다 → `--session-affinity`(이미 켬)로 완화.
  - 다중 인스턴스로 확장되면 방(room) 상태가 인스턴스별로 쪼개진다. 그때는 Socket.IO **Redis 어댑터**가
    필요하다(현재 미구성).
  - `socketSetup.js`의 CORS origin은 `CLIENT_URL` 기반이고 `credentials:true`이므로 `CLIENT_URL`을
    정확히 지정해야 한다(와일드카드 `*`는 credentialed CORS에서 무효).

## Render와 병행

Cloud Run이 안정화되고 새 앱 빌드가 실제 출시된 것을 확인하기 전까지 **Render 서비스를 지우지 말 것.**
두 서비스가 같은 Atlas DB와 S3 버킷을 보므로 동시에 떠 있어도 데이터는 일관된다.
문제가 생기면 iOS의 `baseURL` 또는 Worker `ORIGIN`만 되돌리면 즉시 복귀할 수 있다.
