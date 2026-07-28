// src/middlewares/auth.js
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../config/logger');

// Authorization: Bearer <token> 에서 토큰만 뽑는다. 없으면 undefined.
const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer')) {
    return header.split(' ')[1];
  }
  return undefined;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);

  // 토큰이 없는 경우
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '이 리소스에 접근하기 위한 인증이 필요합니다'
    });
  }

  try {
    // 토큰 검증
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    
    // 토큰이 유효하지 않은 경우
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '토큰이 유효하지 않거나 만료되었습니다'
      });
    }

    // 사용자 정보 가져오기
    const user = await User.findById(decoded.id);
    
    // 사용자가 없는 경우
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: '인증에 실패했습니다'
    });
  }
};

// 토큰이 있으면 해석해 req.user를 채우고, 없거나 유효하지 않아도 그냥 통과시킨다.
// 비인증으로도 열려야 하지만 로그인 상태라면 응답을 더 채울 수 있는 경로에 쓴다
// (초대 링크 미리보기 — 로그인했으면 "이미 참가 중"인지 알려준다).
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // 인증 실패는 이 경로에서 오류가 아니다. 익명 요청으로 이어간다.
    logger.warn(`optionalAuth: 토큰 해석 실패 (${error.message})`);
  }

  next();
};

module.exports = { protect, optionalAuth };