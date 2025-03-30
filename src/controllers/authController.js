// src/controllers/authController.js
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { revokeAppleAccount, revokeGoogleAccount, revokeKakaoAccount, revokeNaverAccount } = require('./socialAuthController');
const logger = require('../config/logger');
const crypto = require('crypto');

// 이메일 회원가입
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 필수 데이터 검증
    if (!name || !email || !password) {
      return sendError(res, 400, '이름, 이메일, 비밀번호는 필수 입력 사항입니다');
    }
    
    // 이메일 중복 확인
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 400, '이미 사용 중인 이메일입니다');
    }

    // 사용자 생성
    const user = await User.create({
      name,
      email,
      password,
      socialType: 'email'
    });


    // 이메일 검증 토큰 생성
// 이메일 검증 토큰 생성 시 로깅 추가
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    console.log('Generated token:', verificationToken);
    console.log('Saved hashed token:', user.emailVerificationToken);


    // 이메일 검증 링크 전송
    await sendVerificationEmail(
      user.email, user.name, verificationToken
    );

    // 토큰 생성 (이메일 미검증 상태여도 토큰은 생성)
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      intro: user.intro,
      socialType: user.socialType
    };

    return sendSuccess(res, 201, '회원가입 성공', {
      accessToken,
      refreshToken,
      user: userData
    });

  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    return sendError(res, 500, '회원가입 중 오류가 발생했습니다');
  }
};


// 이메일 검증
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    console.log('Received token:', token);

    // 토큰 해시
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('Hashed token:', hashedToken);
    
    // 해당 토큰을 가진 사용자 찾기 (만료되지 않은 토큰)
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });
    

    console.log('Found user:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Expire time:', user.emailVerificationExpire);
      console.log('Current time:', new Date());
    }

    if (!user) {
      return sendError(res, 400, '유효하지 않거나 만료된 토큰입니다');
    }
    
    // 사용자 이메일 인증 처리
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    
    await user.save();
    
    return sendSuccess(res, 200, '이메일 인증이 완료되었습니다');
  } catch (error) {
    logger.error(`Email verification error: ${error.message}`);
    return sendError(res, 500, '이메일 인증 중 오류가 발생했습니다');
  }
};

// 이메일 재전송
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return sendError(res, 404, '해당 이메일로 등록된 사용자가 없습니다');
    }
    
    if (user.isEmailVerified) {
      return sendError(res, 400, '이미 인증된 이메일입니다');
    }
    
    // 새 이메일 검증 토큰 생성
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // 이메일 검증 메일 발송
    await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
    
    return sendSuccess(res, 200, '인증 이메일이 재전송되었습니다');
  } catch (error) {
    logger.error(`Resend verification email error: ${error.message}`);
    return sendError(res, 500, '이메일 재전송 중 오류가 발생했습니다');
  }
};

// 비밀번호 재설정 요청

// 비밀번호 찾기 요청 (재설정 이메일 발송)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 이메일로 사용자 찾기
    const user = await User.findOne({ email });
    
    if (!user) {
      return sendError(res, 404, '해당 이메일로 등록된 사용자가 없습니다');
    }
    
    // 소셜 로그인 사용자인 경우
    if (user.socialType !== 'email') {
      return sendError(res, 400, `${user.socialType} 로그인을 사용 중인 계정입니다. 소셜 로그인으로 로그인해주세요.`);
    }
    
    // 비밀번호 재설정 토큰 생성
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // 비밀번호 재설정 이메일 발송
    try {
      await sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken
      );
      
      return sendSuccess(res, 200, '비밀번호 재설정 이메일이 발송되었습니다');
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      logger.error(`Password reset email error: ${error.message}`);
      return sendError(res, 500, '이메일 발송 중 오류가 발생했습니다');
    }
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    return sendError(res, 500, '비밀번호 찾기 중 오류가 발생했습니다');
  }
};

// 비밀번호 재설정 토큰 검증
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    // 토큰 해시
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // 해당 토큰을 가진 사용자 찾기 (만료되지 않은 토큰)
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return sendError(res, 400, '유효하지 않거나 만료된 토큰입니다');
    }
    
    return sendSuccess(res, 200, '유효한 토큰입니다');
  } catch (error) {
    logger.error(`Validate reset token error: ${error.message}`);
    return sendError(res, 500, '토큰 검증 중 오류가 발생했습니다');
  }
};

// 비밀번호 재설정
const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;
    
    // 비밀번호 유효성 검사
    if (!password || password.length < 8) {
      return sendError(res, 400, '비밀번호는 8자 이상이어야 합니다');
    }
    
    // 토큰 해시
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // 해당 토큰을 가진 사용자 찾기 (만료되지 않은 토큰)
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return sendError(res, 400, '유효하지 않거나 만료된 토큰입니다');
    }
    
    // 비밀번호 업데이트
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // 토큰 생성 (자동 로그인용)
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();
    
    // 사용자 응답 데이터
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      intro: user.intro,
      socialType: user.socialType,
      isEmailVerified: user.isEmailVerified
    };
    
    return sendSuccess(res, 200, '비밀번호가 성공적으로 재설정되었습니다', {
      accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    return sendError(res, 500, '비밀번호 재설정 중 오류가 발생했습니다');
  }
};

// 비밀번호 변경 (로그인 상태)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 현재 사용자 (인증 미들웨어에서 설정됨)
    const user = await User.findById(req.user._id).select('+password');
    
    // 비밀번호 확인
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return sendError(res, 401, '현재 비밀번호가 일치하지 않습니다');
    }

    // 새 비밀번호가 현재 비밀번호와 같은 경우
    if (currentPassword === newPassword) {
      return sendError(res, 400, '새 비밀번호는 현재 비밀번호와 달라야 합니다');
    }
    
    // 비밀번호 변경
    user.password = newPassword;
    await user.save();
    
    return sendSuccess(res, 200, '비밀번호가 성공적으로 변경되었습니다');
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    return sendError(res, 500, '비밀번호 변경 중 오류가 발생했습니다');
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, '이메일과 비밀번호는 필수 입력 사항입니다');
    }

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return sendError(res, 401, '이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 소셜 로그인 사용자가 이메일 로그인 시도하는 경우
    if (user.socialType !== 'email') {
      return sendError(res, 401, '이 계정은 ${user.socialType} 소셜 로그인으로 가입되었습니다. 소셜 로그인으로 로그인 해주세요');
    }

    // 비밀번호 확인
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return sendError(res, 401, '이메일 또는 비밀번호가 일치하지 않습니다');
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      intro: user.intro,
      socialType: user.socialType
    };

    return sendSuccess(res, 200, '로그인 성공', {
      accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다'
    });
  }
};

// 액세스 토큰 갱신
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, '리프레시 토큰이 제공되지 않았습니다.');
    }

    // 토큰 검증
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (!decoded) {
      return sendError(res, 401, '리프레시 토큰이 유효하지 않거나 만료되었습니다. 다시 로그인 해주세요.');
    }


    // 사용자 찾기
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 401, '인증에 실패하였습니다. 다시 로그인 해주세요.');
    }

    // 새 액세스 토큰 생성
    const accessToken = generateAccessToken(user._id);

    return sendSuccess(res, 200, '토큰 갱신 성공', {
      accessToken
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    return sendError(res, 500, '토큰 갱신 중 오류가 발생했습니다');
  }
};

// 로그아웃
const logout = async (req, res) => {
  try {
    // 사용자에서 리프레시 토큰 제거
    req.user.refreshToken = null;
    await req.user.save();

    return sendSuccess(res, 200, '로그아웃되었습니다');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return sendError(res, 500, '로그아웃 중 오류가 발생했습니다');
  }
};


// 계정 삭제
const deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    
    // 소셜 로그인 계정인 경우 추가 처리
    if (user.socialType !== 'email') {
      try {
        await handleSocialAccountRevocation(user);
      } catch (socialError) {
        // 소셜 연결 해제 실패 로깅
        logger.error(`Social account revocation error: ${socialError.message}`);
        // 소셜 연결 해제 실패는 계정 삭제를 중단시키지 않음 (선택사항)
      }
    }
    
    // 사용자 관련 데이터 정리 (필요에 따라 구현)
    // 예: 사용자가 작성한 게시물, 댓글 등 처리
    // await cleanupUserData(user._id);
    
    // 사용자 계정 삭제
    await User.findByIdAndDelete(user._id);
    
    return sendSuccess(res, 200, '계정이 성공적으로 삭제되었습니다');
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    return sendError(res, 500, '계정 삭제 중 오류가 발생했습니다');
  }
};


// 소셜 계정 연결 해제 핸들러
const handleSocialAccountRevocation = async (user) => {
  switch (user.socialType) {
    case 'apple':
      await revokeAppleAccount(user);
      break;
    case 'google':
      await revokeGoogleAccount(user);
      break;
    case 'kakao':
      await revokeKakaoAccount(user);
      break;
    case 'naver':
      await revokeNaverAccount(user);
      break;
    default:
      logger.warn(`Unknown social type: ${user.socialType}`);
  }
};


module.exports = {
  register,
  login,
  refreshToken,
  logout,
  deleteAccount,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword
};