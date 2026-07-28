// src/services/invitePreviewService.js
// 초대 코드 → "무슨 여행인지"를 조회하는 단일 진입점.
// 웹 랜딩(app.js), 미리보기 API(journeyController), 둘이 같은 판정·같은 노출 범위를 쓰도록 여기 모은다.
const Journey = require('../models/Journey');
const { normalizeCode, isValidCode } = require('../utils/inviteCode');
const { isInviteExpired } = require('../utils/inviteExpiry');

/**
 * 초대 코드로 여행을 찾는다.
 * 거부 판정 순서: 코드 형식 → 조회 → isPrivate → 만료.
 * @param {*} rawCode 사용자/URL 입력
 * @param {Date} [now] 기준 시각 (테스트 주입용)
 * @returns {Promise<{ok: false, reason: 'notfound'|'expired'} | {ok: true, journey: object}>}
 */
const getInvitePreview = async (rawCode, now = new Date()) => {
  const code = normalizeCode(rawCode);

  // 형식 검증 없이 DB에 넘기면 객체/정규식 주입이 된다(joinByInviteCode와 같은 이유).
  if (!isValidCode(code)) {
    return { ok: false, reason: 'notfound' };
  }

  const journey = await Journey.findOne({ inviteCode: code });

  // 혼자 여행은 notfound와 똑같이 취급한다 — 여행이 존재한다는 사실조차 알릴 이유가 없다.
  if (!journey || journey.isPrivate) {
    return { ok: false, reason: 'notfound' };
  }

  if (isInviteExpired(journey, now)) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, journey };
};

/**
 * 초대받은 사람에게 보여도 되는 필드만 추린다.
 * 참가자 이름·프로필, 준비물, 여행 ID, 출발지(origin)는 **의도적으로 뺀다**.
 * @param {object} journey
 */
const toPreviewPayload = (journey) => ({
  title: journey.title,
  destination: journey.destination,
  startDate: journey.startDate,
  endDate: journey.endDate,
  participantCount: journey.participants.length,
  imageUrl: journey.imageUrl
});

module.exports = { getInvitePreview, toPreviewPayload };
