// src/controllers/socialAuthController.js
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../config/logger');

const socialLoginSuccess = async (req, res) => {
  try {
    if (!req.user) {
      logger.error('No user object found in social login');
      return res.status(401).json({
        success: false,
        message: '인증에 실패했습니다'
      });
    }

    const user = req.user;
    
    // Validate user object
    if (!user._id) {
      logger.error('Invalid user object: Missing _id');
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다'
      });
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();

    // iOS 앱으로 리디렉션 (딥링크 사용)
    const redirectUrl = `packingapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`;
    
    logger.info(`Social login successful for user: ${user.email}`);
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error(`Social login success handler error: ${error.message}`);
    logger.error(`Error Stack: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: '소셜 로그인 처리 중 오류가 발생했습니다'
    });
  }
};

const socialLoginFailure = (req, res) => {
  logger.warn('Social login attempt failed');
  res.status(401).json({
    success: false,
    message: '소셜 로그인에 실패했습니다'
  });
};

module.exports = {
  socialLoginSuccess,
  socialLoginFailure
};