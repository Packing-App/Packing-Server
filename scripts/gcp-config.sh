#!/usr/bin/env bash
# 다른 스크립트들이 공통으로 읽는 설정값.
# 프로젝트나 리전을 바꾸려면 이 파일만 수정하면 된다.

# ⚠️ Packing 전용 새 GCP 프로젝트 ID를 여기 채운다.
#    (DEPLOYMENT.md의 "1. GCP — 프로젝트 생성 + 결제 연결" 절차대로 만든 뒤 값 복사)
#    예: packing-470000  ← gcloud가 생성 시 부여한 실제 ID
PROJECT_ID="packing-503507"

REGION="asia-northeast3"          # 서울. 한국 사용자 지연시간 최소.
SERVICE_NAME="packing-server"
SERVICE_ACCOUNT_NAME="packing-run"

# Secret Manager에 저장할 민감한 값 (.env에서 읽어옴).
# 값이 노출되면 안 되는 것들 — 키·시크릿·DB 접속 문자열·개인키.
SECRET_KEYS=(
  MONGODB_URI
  JWT_SECRET
  JWT_REFRESH_SECRET
  SESSION_SECRET
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  KAKAO_CLIENT_ID
  KAKAO_ADMIN_KEY
  NAVER_CLIENT_ID
  NAVER_CLIENT_SECRET
  APPLE_SERVICE_ID
  APPLE_CLIENT_ID
  APPLE_TEAM_ID
  APPLE_KEY_ID
  APPLE_PRIVATE_KEY_STRING
  SENDGRID_API_KEY
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  WEATHER_API_KEY
  OPENWEATHER_API_KEY
  UNSPLASH_ACCESS_KEY
)

# 민감하지 않아 평문 환경변수로 넣는 값 (.env에서 읽어옴).
# ★ *_CALLBACK_URL 은 도메인 이전 시 값 자체가 packing-api.iyungui.dev 로 바뀐다.
#   .env를 새 도메인으로 먼저 고친 뒤 배포하면 Cloud Run에 새 값이 반영된다.
PLAIN_KEYS=(
  JWT_ACCESS_EXPIRY
  JWT_REFRESH_EXPIRY
  EMAIL_FROM
  CLIENT_URL
  GOOGLE_CALLBACK_URL
  KAKAO_CALLBACK_URL
  NAVER_CALLBACK_URL
  APPLE_CALLBACK_URL
  AWS_REGION
  AWS_S3_BUCKET_NAME
)

SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
