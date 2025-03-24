// src/controllers/socialAuthController.js
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../config/logger');

// 소셜 로그인 성공 후 처리
const socialLoginSuccess = async (req, res) => {
  try {
    const user = req.user;
    
    // 토큰 생성
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();

    // iOS 앱으로 리디렉션 (딥링크 사용)
    const redirectUrl = `packingapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error(`Social login success handler error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '소셜 로그인 처리 중 오류가 발생했습니다'
    });
  }
};

// 소셜 로그인 실패 처리
const socialLoginFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: '소셜 로그인에 실패했습니다'
  });
};

module.exports = {
  socialLoginSuccess,
  socialLoginFailure
};