// src/controllers/socialAuthController.js
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

const socialLoginSuccess = async (req, res) => {
  try {
    if (!req.user) {
      logger.error('No user object found in social login');
      return sendError(res, 401, '소셜 로그인 처리 중 오류가 발생했습니다');
    }

    const user = req.user;
    
    // Validate user object
    if (!user._id) {
      logger.error('Invalid user object: Missing _id');
      return sendError(res, 401, '유효하지 않은 사용자입니다');
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

    // 리디렉션 응답
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error(`Social login success handler error: ${error.message}`);
    logger.error(`Error Stack: ${error.stack}`);

    const errorRedirectUrl = `packingapp://auth/error?message=${encodeURIComponent('소셜 로그인 처리 중 오류가 발생했습니다')}`;
    res.redirect(errorRedirectUrl);

    // res.status(500).json({
    //   success: false,
    //   message: '소셜 로그인 처리 중 오류가 발생했습니다'
    // });
  }
};

const appleVerify = async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;

    // 필수 데이터 검증
    if (!userId) {
      return sendError(res, 400, 'APPLE USER ID는 필수입니다');
    }

    // 데이터 로깅
    logger.info(`Apple Login Verification: 
      User ID: ${userId}, 
      Email: ${email || 'N/A'}, 
      Name: ${fullName ? `${fullName.givenName} ${fullName.familyName}` : ''}`
    );

    // 사용자 찾기
    let user = await User.findOne({
      socialId: userId,
      socialType: 'apple'
    });

    // 사용자가 없으면 새로 생성
    if (!user) {
      // 이름이 없는 경우 기본값으로 대체
      const userName = fullName && (fullName.givenName || fullName.familyName)
      ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim().substring(0, 10) 
      : `Apple-${userId.substring(0, 4)}`;
      
        
      // 이메일도 검증
      const userEmail = email && email.length > 0 
        ? email 
        : `apple_${userId}@example.com`;
      
      // 새 사용자 생성
      user = await User.create({
        name: userName,  // 반드시 값이 있도록 보장
        email: userEmail,
        socialId: userId,
        socialType: 'apple'
      });

      logger.info(`New Apple user created with ID: ${user._id}, name: ${userName}`);
    } else {
      logger.info(`Existing Apple user found with ID: ${user._id}`);
      
      // 리프레시 토큰 업데이트 (findByIdAndUpdate로 유효성 검사 우회)
      const refreshToken = generateRefreshToken(user._id);
      await User.findByIdAndUpdate(user._id, { refreshToken });
      user.refreshToken = refreshToken;  // 응답을 위해 메모리 내 객체도 업데이트
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user._id);

    // 사용자 응답 데이터 구성
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      socialType: user.socialType
    };

    return sendSuccess(res, 200, 'Apple 로그인이 성공적으로 완료되었습니다', {
      accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    logger.error(`Apple Login Verification Error: ${error.message}`);
    return sendError(res, 500, '로그인 검증 중 오류 발생');
  }
};

module.exports = {
  socialLoginSuccess,
  appleVerify
};