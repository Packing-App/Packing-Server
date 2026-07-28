// src/middlewares/rateLimit.js
// 초대 코드 관련 공개 경로의 무차별 조회를 막는다.
// 미리보기를 비인증으로 열면서 8자 코드를 마음껏 두드릴 수 있게 됐기 때문에 함께 들어왔다.
//
// ⚠️ 카운트는 인스턴스 메모리다(기본 MemoryStore). Cloud Run이 여러 인스턴스로 늘면
//    실효 제한이 인스턴스 수만큼 느슨해진다. 지금 트래픽에선 무의미한 차이라 공유 스토어는 두지 않는다.
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

const WINDOW_MS = 5 * 60 * 1000; // 5분

/**
 * 실제 클라이언트 IP를 고른다.
 *
 * Cloudflare Worker → Cloud Run → express 구조라 `req.ip`는 항상 프록시 주소다.
 * 그대로 키로 쓰면 **전 세계가 한 버킷을 공유**해 정상 사용자가 먼저 막힌다.
 * 그렇다고 `trust proxy`를 켜면 X-Forwarded-For 위조로 제한을 우회할 수 있으므로 켜지 않고,
 * Cloudflare가 직접 넣어주는 `CF-Connecting-IP`를 우선으로 본다(위조해도 Cloudflare가 덮어쓴다).
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
const resolveClientIp = (req) => {
  const headers = req.headers || {};

  const cloudflareIp = String(headers['cf-connecting-ip'] ?? '').trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  // Cloudflare를 거치지 않는 경로(직접 Cloud Run 호출 등) 폴백. 첫 항목이 원 클라이언트다.
  const forwarded = String(headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  if (forwarded) {
    return forwarded;
  }

  return req.ip || 'unknown';
};

// IPv6는 /56 단위로 묶는다(한 사용자가 주소를 갈아끼우며 제한을 우회하는 것 방지).
const clientIpKey = (req) => ipKeyGenerator(resolveClientIp(req));

const createLimiter = ({ limit, handler }) =>
  rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIpKey,
    handler,
    // trust proxy를 일부러 끈 채 CF-Connecting-IP를 직접 읽으므로 이 경고는 오탐이다.
    validate: { xForwardedForHeader: false }
  });

const logAndCount = (req) => {
  logger.warn(`rate limit 초과: ${req.method} ${req.originalUrl}`);
};

// API 경로 — 응답 규약(sendError)을 따른다.
const apiLimitHandler = (req, res) => {
  logAndCount(req);
  return sendError(res, 429, '요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
};

// 랜딩은 브라우저가 여는 페이지라 JSON을 주면 읽을 수 없다.
const landingLimitHandler = (req, res) => {
  logAndCount(req);
  return res.status(429).type('text/plain; charset=utf-8')
    .send('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
};

module.exports = {
  resolveClientIp,
  clientIpKey,
  // GET /join/:code — 웹 랜딩
  landingLimiter: createLimiter({ limit: 60, handler: landingLimitHandler }),
  // GET /journeys/preview/:code — 비인증 미리보기
  previewLimiter: createLimiter({ limit: 60, handler: apiLimitHandler }),
  // POST /journeys/join — 실제 참여
  joinLimiter: createLimiter({ limit: 20, handler: apiLimitHandler })
};
