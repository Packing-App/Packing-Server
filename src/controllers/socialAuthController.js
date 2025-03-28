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

    // 디바이스 ID 로깅
    const deviceId = req.session && req.session.deviceId;
    logger.info(`Using device ID for redirect: ${deviceId || 'Not provided'}`);

    // iOS 앱으로 리디렉션 (딥링크 사용)
    const redirectUrl = `packingapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`;
    
    logger.info(`Social login successful for user: ${user.email}`);
    logger.info(`Redirecting to: ${redirectUrl}`);
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


const appleVerify = async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;

    // 필수 데이터 검증
    if (!userId) {
      return res.status(400).json({
        success: false, 
        message: 'Apple User ID is required'
      });
    }

    // 데이터 로깅
    logger.info(`Apple Login Verification: 
      User ID: ${userId}, 
      Email: ${email || 'N/A'}, 
      Name: ${fullName ? `${fullName.givenName} ${fullName.familyName}` : 'N/A'}`
    );

    // 사용자 찾기 또는 생성
    let user = await User.findOne({
      socialId: userId,
      socialType: 'apple'
    });

    // 사용자가 없으면 새로 생성
    if (!user) {
      const userName = fullName 
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() 
        : `AppleUser-${userId}`;
        
      user = await User.create({
        name: userName,
        email: email || `apple_${userId}@example.com`,
        socialId: userId,
        socialType: 'apple'
      });

      logger.info(`New Apple user created with ID: ${user._id}`);
    } else {
      logger.info(`Existing Apple user found with ID: ${user._id}`);
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();

    // 다른 소셜 로그인과 동일한 응답 형식 유지
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id
    });
  } catch (error) {
    logger.error(`Apple Login Verification Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '로그인 검증 중 오류 발생'
    });
  }
};

module.exports = {
  socialLoginSuccess,
  appleVerify
};