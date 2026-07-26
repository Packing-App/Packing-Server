// src/utils/inviteCode.js
// 여행 초대 코드 생성. 암호학적으로 안전한 crypto.randomBytes 사용
// (기존 인증코드의 Math.random 6자리와 달리 추측/충돌 저항).
const crypto = require('crypto');

// 혼동하기 쉬운 문자(0/O, 1/I/L) 제외한 URL-safe 알파벳
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// 8자 코드 형식. 손으로 쓴 범위(예: A-HJ-N)는 L을 다시 끌어들이는 등 ALPHABET과
// 어긋나기 쉬우므로 ALPHABET에서 직접 파생시킨다. ALPHABET은 영숫자뿐이라
// 문자 클래스에 그대로 넣어도 안전하다.
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{8}$`);

/**
 * URL-safe 초대 코드 생성
 * @param {number} length 코드 길이 (기본 8)
 * @returns {string}
 */
const generateInviteCode = (length = 8) => {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
};

/**
 * 사용자 입력 코드를 비교 가능한 형태로 정규화
 * @param {*} raw 사용자 입력 (null/undefined 허용)
 * @returns {string}
 */
const normalizeCode = (raw) => String(raw ?? '').trim().toUpperCase();

/**
 * 코드 형식 검증. 정규식 메타문자나 길이가 다른 입력을 전부 거른다.
 * @param {*} raw 사용자 입력
 * @returns {boolean}
 */
const isValidCode = (raw) => CODE_PATTERN.test(normalizeCode(raw));

module.exports = { generateInviteCode, normalizeCode, isValidCode };
