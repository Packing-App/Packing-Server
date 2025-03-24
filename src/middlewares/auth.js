// src/middlewares/auth.js
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../config/logger');

const protect = async (req, res, next) => {
  let token;

  // 헤더에서 토큰 확인
  // Authorization
  if (
    // Bearer token
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // 토큰 추출
    token = req.headers.authorization.split(' ')[1];
  }

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

module.exports = { protect };