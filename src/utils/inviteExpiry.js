// src/utils/inviteExpiry.js
// 초대 링크 만료 판정. 새 필드를 두지 않고 여행 종료일(endDate)로만 판단한다.
//
// grace 1일을 두는 이유: endDate는 `type: Date`라 KST 자정이 UTC 자정으로 저장될 수 있고,
// 그대로 비교하면 "여행 마지막 날 낮"에 이미 만료된다. +24시간이면 마지막 날 KST 전체를 덮는다.
const GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * 초대 링크가 만료됐는지 판정한다.
 * @param {{ endDate?: Date|string }} journey 여행 문서(또는 endDate를 가진 객체)
 * @param {Date} [now] 기준 시각 (테스트 주입용)
 * @returns {boolean} endDate가 없거나 파싱 불가면 false(만료로 취급하지 않는다)
 */
const isInviteExpired = (journey, now = new Date()) => {
  const deadline = new Date(journey?.endDate ?? NaN).getTime() + GRACE_MS;
  if (Number.isNaN(deadline)) {
    return false;
  }
  return now.getTime() > deadline;
};

module.exports = { isInviteExpired, GRACE_MS };
