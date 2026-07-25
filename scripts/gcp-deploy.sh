#!/usr/bin/env bash
# Packing 백엔드를 Cloud Run에 배포한다.
# 로컬 Docker 불필요 — 소스를 Cloud Build로 올려 빌드한다(Dockerfile 사용).
#
# 최초 1회만 gcp-setup-secrets.sh를 먼저 실행하면 되고,
# 이후 코드 배포는 이 스크립트만 반복 실행하면 된다.
#
# 실행: ./scripts/gcp-deploy.sh

set -euo pipefail

cd "$(dirname "$0")/.."
source ./scripts/gcp-config.sh

if [ "${PROJECT_ID}" = "__PACKING_PROJECT_ID__" ]; then
  echo "오류: scripts/gcp-config.sh의 PROJECT_ID를 실제 값으로 먼저 채우세요." >&2
  exit 1
fi

read_env() {
  node -e "require('dotenv').config();const v=process.env[process.argv[1]];if(v===undefined){process.exit(3)};process.stdout.write(v)" "$1"
}

echo "==> 필요한 API 활성화 (이미 켜져 있으면 즉시 통과)"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="${PROJECT_ID}"

echo
echo "==> 시크릿 매핑 구성"
SECRET_ARGS=""
for KEY in "${SECRET_KEYS[@]}"; do
  if gcloud secrets describe "${KEY}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    SECRET_ARGS="${SECRET_ARGS}${SECRET_ARGS:+,}${KEY}=${KEY}:latest"
  else
    echo "경고: 시크릿 ${KEY} 없음. gcp-setup-secrets.sh를 먼저 실행하세요." >&2
  fi
done

echo "==> 평문 환경변수 구성"
ENV_ARGS="NODE_ENV=production"
for KEY in "${PLAIN_KEYS[@]}"; do
  if VALUE="$(read_env "${KEY}")"; then
    ENV_ARGS="${ENV_ARGS},${KEY}=${VALUE}"
  fi
done

echo
echo "==> Cloud Run 배포 시작 (첫 배포는 3~5분 소요)"
# --min-instances=0     : 유휴 시 0으로 축소해 무료 한도를 지킨다.
# --max-instances=3     : 트래픽 급증 시 과금 폭주를 막는 상한선.
# --concurrency=80      : 인스턴스당 동시 요청. 높을수록 무료 한도를 아낀다.
# --timeout=3600        : socket.io(웹소켓) 장수명 연결이 60초에 끊기지 않도록 상향.
#                         (iOS 앱은 현재 소켓 미사용이라 실제 비용 영향은 사실상 0.)
# --session-affinity    : socket.io polling→websocket 업그레이드가 같은 인스턴스로 가도록.
gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --source=. \
  --service-account="${SERVICE_ACCOUNT_EMAIL}" \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=3 \
  --concurrency=80 \
  --timeout=3600 \
  --session-affinity \
  --set-env-vars="${ENV_ARGS}" \
  --set-secrets="${SECRET_ARGS}"

URL="$(gcloud run services describe "${SERVICE_NAME}" \
        --project="${PROJECT_ID}" --region="${REGION}" \
        --format='value(status.url)')"

echo
echo "==> 배포 완료"
echo "서비스 URL: ${URL}"
echo
echo "==> 헬스체크"
curl -s -w "\n[HTTP %{http_code}]\n" "${URL}/health"
curl -s -w "\n[HTTP %{http_code}]\n" "${URL}/health/ready"
echo
echo "다음 단계:"
echo "  1) 이 URL(호스트 부분)을 cloudflare/src/index.js의 ORIGIN에 반영 후 wrangler deploy"
echo "  2) 컷오버 시 iOS Endpoints.swift의 baseURL을 https://packing-api.iyungui.dev 로 교체"
