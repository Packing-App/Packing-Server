# Packing API 프록시 (Cloudflare Worker)

`packing-api.iyungui.dev` → Cloud Run 백엔드로 프록시하는 Worker.
앱과 백엔드 사이에 안정적인 주소 한 겹을 둬서, 나중에 백엔드를 옮겨도 앱 재배포가
필요 없게 만든다.

## 최초 배포

```bash
cd Packing-Server/cloudflare

# 0) src/index.js의 ORIGIN을 Cloud Run 서비스 호스트로 채운다.
#    (gcp-deploy.sh 출력 URL에서 https:// 뺀 호스트. 예: packing-server-xxxx.asia-northeast3.run.app)

# 1) Cloudflare 로그인 (브라우저가 열리고 승인하면 됨)
npx wrangler login

# 2) 배포 — Worker + DNS 레코드 + TLS 인증서가 자동 생성됨
npx wrangler deploy
```

배포가 끝나면 `https://packing-api.iyungui.dev/health` 가 `{"status":"ok",...}` 를 반환한다.
(DNS·인증서 전파에 수 분 걸릴 수 있다.)

## 백엔드를 옮겼을 때

`src/index.js`의 `ORIGIN` 값을 새 백엔드 호스트로 바꾸고:

```bash
npx wrangler deploy
```

앱은 그대로 두면 된다. 이게 이 Worker의 존재 이유다.

## 로컬 테스트

```bash
npx wrangler dev
```

## 구조

```
iOS 앱 → packing-api.iyungui.dev (Cloudflare Worker) → Cloud Run → MongoDB Atlas / S3
```

> 참고: `iyungui.dev` 도메인에 다른 앱/블로그를 서브도메인으로 얹는 법은
> QuoteHub 레포의 `QuoteHub-server/cloudflare/DOMAIN-GUIDE.md`에 정리돼 있다.
> Packing은 그 도메인의 `packing-api` 서브도메인 하나를 쓰는 소비자다.
