// src/utils/appleAuth.js
const jwt = require('jsonwebtoken');

/**
 * Apple Client Secret 생성
 * 
 * Apple Sign In을 위한 클라이언트 시크릿을 JWT 형태로 생성
 * 참고: https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret
 * 
 * @returns {string} 생성된 JWT 토큰
 */
const createAppleClientSecret = () => {
  try {
    // 프라이빗 키를 파일이 아닌 환경변수에서 직접 가져옴
    const privateKey = process.env.APPLE_PRIVATE_KEY_STRING;

    // 필요한 경우 개행문자 추가 처리
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // 현재 시간 (초)
    const now = Math.floor(Date.now() / 1000);
    
    // JWT 페이로드
    const payload = {
      iss: process.env.APPLE_TEAM_ID,           // Apple Developer Team ID (10자리 문자열)
      iat: now,                                 // 발급 시간 (현재 시간)
      exp: now + 15777000,                      // 만료 시간 (최대 6개월)
      aud: 'https://appleid.apple.com',         // 고정 값
      sub: process.env.APPLE_SERVICE_ID,        // Services ID (앱의 Sign in with Apple 서비스 ID)
    };
    
    // JWT 헤더
    const header = {
      alg: 'ES256',                             // ECDSA with SHA-256 암호화
      kid: process.env.APPLE_KEY_ID             // Key ID (개발자 계정에서 확인)
    };
    
    // JWT 서명 옵션
    const options = {
      algorithm: 'ES256',                       // ECDSA SHA-256 알고리즘 사용
      header: header
    };
    
    // JWT 토큰 생성
    const clientSecret = jwt.sign(payload, formattedPrivateKey, options);
    
    return clientSecret;
  } catch (error) {
    console.error('Error creating Apple client secret:', error.message);
    console.error(error.stack);
    throw new Error('Failed to create Apple client secret');
  }
};

module.exports = {
  createAppleClientSecret
};