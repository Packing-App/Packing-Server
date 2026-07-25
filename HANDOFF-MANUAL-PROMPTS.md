# 수동 단계 핸드오프 프롬프트 (Aside-AI용)

브라우저/콘솔에서 **사람이 직접 해야 했던** 단계를, 브라우저를 제어하는 다른 AI("aside AI")에게
그대로 넘길 수 있게 **복붙 가능한 프롬프트 블록**으로 정리했다. 각 블록은 목표·정확한 URL·입력 값·
완료 확인 방법을 담는다.

> 사용법: 아래 "0. 값 준비"의 빈칸(`<...>`)을 먼저 채운 뒤, 각 프롬프트 블록을 순서대로
> aside AI에게 붙여넣는다. **로그인·결제·자격증명 입력은 사람이 직접 승인**한다(AI는 안내·이동만).
> 승인이 필요한 지점은 각 블록에 ⚠️로 표시했다.

---

## 0. 값 준비 (핸드오프 전에 채우기)

| 플레이스홀더 | 뜻 | 어디서 얻나 |
|---|---|---|
| `<GCP_PROJECT_ID>` | Cloud Run 올릴 새 프로젝트 ID | 아래 1번에서 생성 후 확정 |
| `<CLOUD_RUN_URL>` | 배포된 Cloud Run 서비스 URL | `./scripts/gcp-deploy.sh` 출력 |
| `<GOOGLE_CB_PATH>` | 구글 콜백 경로 | `.env`의 `GOOGLE_CALLBACK_URL`에서 host 뒤 경로 (예: `/api/auth/google/callback`) |
| `<KAKAO_CB_PATH>` | 카카오 콜백 경로 | `.env`의 `KAKAO_CALLBACK_URL`에서 host 뒤 경로 |
| `<NAVER_CB_PATH>` | 네이버 콜백 경로 | `.env`의 `NAVER_CALLBACK_URL`에서 host 뒤 경로 |

> 콜백 URL 규칙(공통): **현재 `.env` 값에서 host만 `packing-api.iyungui.dev`로 바꾸고 경로(path)는 그대로.**
> 즉 새 값 = `https://packing-api.iyungui.dev` + `<..._CB_PATH>`.
> 커스텀 도메인: **`packing-api.iyungui.dev`** (기존 `iyungui.dev`의 한 단계 서브도메인).

---

## 1. GCP — 새 프로젝트 생성 + 결제 연결

⚠️ 결제 계정 연결은 사람이 승인. (Cloud Run 무료 한도를 쓰려면 결제 연결 자체는 필수, 한도 내 청구 0)

```
목표: Packing 백엔드를 올릴 새 Google Cloud 프로젝트를 만들고 결제 계정을 연결한다.

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

확정 후 → `scripts/gcp-config.sh`의 `PROJECT_ID="__PACKING_PROJECT_ID__"`를 `<GCP_PROJECT_ID>`로 교체.

---

## 2. MongoDB Atlas — 네트워크 접근 확인

```
목표: Cloud Run이 MongoDB Atlas에 붙을 수 있도록 네트워크 접근이 열려 있는지 확인한다.

1. https://cloud.mongodb.com 로그인(사람이 승인) → 해당 클러스터 선택.
2. 좌측 "Network Access" → IP Access List 확인.
3. 0.0.0.0/0 (모든 IP 허용) 항목이 있는지 확인해 알려줘.
   없으면 "ADD IP ADDRESS" → "ALLOW ACCESS FROM ANYWHERE"(0.0.0.0/0) 추가.

이유: Cloud Run은 이그레스 IP가 고정되지 않아 특정 IP만 허용하면 DB 연결이 실패한다.
```

---

## 3. Cloudflare — Worker 배포 + 서브도메인 + 도메인 자동갱신

> 이 단계는 **Cloud Run 배포가 끝나 `<CLOUD_RUN_URL>`이 나온 뒤** 실행. Worker 배포 자체는
> 사람이 로컬에서 `cd cloudflare && npx wrangler deploy`로 하는 게 안전하다(아래는 브라우저 확인·설정용).

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

---

## 4. Google OAuth — 승인된 redirect URI 추가

⚠️ 콘솔 로그인은 사람 승인.

```
목표: 구글 로그인 콜백을 새 도메인으로도 받도록 승인된 리디렉션 URI를 추가한다.

1. https://console.cloud.google.com/apis/credentials 로 이동(사람 로그인).
   ※ 이 OAuth 클라이언트는 Packing이 원래 쓰던 프로젝트에 있다. 새로 만든 배포용 프로젝트가
     아니라, 기존 OAuth 동의화면/클라이언트가 있는 프로젝트를 선택해야 한다.
2. "OAuth 2.0 클라이언트 ID" 목록에서 Packing이 쓰는 웹 클라이언트를 연다.
   (.env의 GOOGLE_CLIENT_ID 앞부분과 일치하는 것)
3. "승인된 리디렉션 URI"에 다음을 추가(기존 onrender 항목은 지우지 말고 병행):
       https://packing-api.iyungui.dev<GOOGLE_CB_PATH>
   예: https://packing-api.iyungui.dev/api/auth/google/callback
4. 저장. 반영에 수 분 걸릴 수 있음. 저장됐는지 확인해 알려줘.
```

---

## 5. Kakao — Redirect URI 추가

⚠️ 콘솔 로그인은 사람 승인.

```
목표: 카카오 로그인 Redirect URI에 새 도메인을 추가한다.

1. https://developers.kakao.com/console/app 로 이동(사람 로그인) → Packing 앱 선택.
   (.env의 KAKAO_CLIENT_ID = 카카오 앱의 REST API 키/앱 ID와 매칭)
2. 좌측 "카카오 로그인" → "Redirect URI" 로 이동.
3. 다음 URI를 추가(기존 onrender 항목 병행 유지):
       https://packing-api.iyungui.dev<KAKAO_CB_PATH>
4. 저장 후 등록됐는지 확인해 알려줘.
   (참고: 카카오 로그인 활성화 상태와 동의항목은 기존 그대로 두면 됨.)
```

---

## 6. Naver — Callback URL 추가

⚠️ 콘솔 로그인은 사람 승인.

```
목표: 네이버 로그인 Callback URL에 새 도메인을 추가한다.

1. https://developers.naver.com/apps/#/myapps 로 이동(사람 로그인) → Packing 애플리케이션 선택.
   (.env의 NAVER_CLIENT_ID와 매칭)
2. "API 설정" 탭 → "로그인 오픈API 서비스 환경" → "서비스 URL / Callback URL".
3. Callback URL에 다음을 추가(기존 onrender 항목 병행 유지):
       https://packing-api.iyungui.dev<NAVER_CB_PATH>
4. 저장 후 등록됐는지 확인해 알려줘.
```

> 4~6 완료 후: `.env`의 `GOOGLE_CALLBACK_URL`·`KAKAO_CALLBACK_URL`·`NAVER_CALLBACK_URL`도 새 값으로
> 바꾸고(사람) `./scripts/gcp-deploy.sh`로 재배포해 Cloud Run env에 반영한다. 그래야 서버가
> 콜백을 새 도메인으로 생성한다.

---

## 7. App Store Connect — fastlane용 API 키 발급

⚠️ 키 발급·다운로드는 사람. (.p8은 재다운로드 불가)

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

## 8. (컷오버 검증 후) Render 정리 + Uptime 모니터 재조준

> **새 앱 빌드가 App Store에 실제 출시되고, 옛 빌드 유저 비중이 무시할 만해진 뒤**에만.

```
목표: 새 인프라 검증 후 Render를 정리하고 모니터링을 새 주소로 옮긴다.

1. Uptime 모니터(UptimeRobot 등) 로그인(사람) → 감시 대상 URL을
   https://packing-api.iyungui.dev/health 로 변경. Render URL 핑은 중단.
2. (검증 완료 확신 후) https://dashboard.render.com 에서 packing-server 서비스 삭제.
   ⚠️ 그 전엔 절대 금지 — 옛 빌드 유저가 아직 onrender.com 을 본다. 삭제는 사람이 확인 후 실행.
3. 삭제 후 리포지토리에서 render.yaml 제거(사람, 커밋).
```

---

## 완료 체크리스트
- [ ] 1. GCP 프로젝트 생성 + 결제 연결, `gcp-config.sh`에 PROJECT_ID 반영
- [ ] 2. Atlas Network Access 0.0.0.0/0 확인
- [ ] (사람) `./scripts/gcp-setup-secrets.sh` → `./scripts/gcp-deploy.sh` 로 배포, `<CLOUD_RUN_URL>` 확보
- [ ] 4·5·6. Google/Kakao/Naver redirect URI 추가 + `.env` 콜백 교체 후 재배포
- [ ] 3. Worker `ORIGIN` = `<CLOUD_RUN_URL>` 호스트로 배포, `packing-api.iyungui.dev/health` 200 확인
- [ ] iyungui.dev Auto-renew ON 확인
- [ ] 7. ASC API 키 발급 + `fastlane/.env` 작성
- [ ] (사람) `Endpoints.swift` baseURL 교체 → `bundle exec fastlane beta`
- [ ] 앱 출시·검증 후 → 8. Render 정리 + 모니터 재조준
