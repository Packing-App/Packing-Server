// src/utils/inviteCode.js
// 여행 초대 코드 생성. 암호학적으로 안전한 crypto.randomBytes 사용
// (기존 인증코드의 Math.random 6자리와 달리 추측/충돌 저항).
const crypto = require('crypto');

// 혼동하기 쉬운 문자(0/O, 1/I/L) 제외한 URL-safe 알파벳
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

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

module.exports = { generateInviteCode };
