// src/controllers/authController.js
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

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

// 토큰 갱신
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

// Apple 계정 연결 해제
const revokeAppleAccount = async (user) => {
  try {
    if (!user.socialId) {
      logger.warn(`No socialId found for Apple user: ${user._id}`);
      return;
    }
    
    // Apple의 OAuth 토큰 설정
    const client_id = process.env.APPLE_CLIENT_ID;
    const client_secret = createAppleClientSecret(); // Apple 토큰 생성 함수
    
    // Apple 연결 해제 API 호출
    // 참고: https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens
    const response = await axios.post('https://appleid.apple.com/auth/revoke', {
      client_id,
      client_secret,
      token: user.socialId,
      token_type_hint: 'access_token'
    });
    
    logger.info(`Apple account revoked for user: ${user._id}`);
  } catch (error) {
    logger.error(`Error revoking Apple account: ${error.message}`);
    throw error;
  }
};

// Google 계정 연결 해제
const revokeGoogleAccount = async (user) => {
  try {
    if (!user.socialId) {
      logger.warn(`No socialId found for Google user: ${user._id}`);
      return;
    }
    
    // Google의 토큰 취소 API 호출
    // 참고: https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
    const response = await axios.post(`https://accounts.google.com/o/oauth2/revoke?token=${user.socialId}`);
    
    logger.info(`Google account revoked for user: ${user._id}`);
  } catch (error) {
    logger.error(`Error revoking Google account: ${error.message}`);
    throw error;
  }
};

// Kakao 계정 연결 해제
const revokeKakaoAccount = async (user) => {
  try {
    if (!user.socialId) {
      logger.warn(`No socialId found for Kakao user: ${user._id}`);
      return;
    }
    
    // Kakao 연결 해제 API 호출
    // 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#unlink
    const response = await axios.post('https://kapi.kakao.com/v1/user/unlink', null, {
      headers: {
        'Authorization': `Bearer ${process.env.KAKAO_ADMIN_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        target_id_type: 'user_id',
        target_id: user.socialId
      }
    });
    
    logger.info(`Kakao account revoked for user: ${user._id}`);
  } catch (error) {
    logger.error(`Error revoking Kakao account: ${error.message}`);
    throw error;
  }
};

// Naver 계정 연결 해제
const revokeNaverAccount = async (user) => {
  try {
    if (!user.socialId) {
      logger.warn(`No socialId found for Naver user: ${user._id}`);
      return;
    }
    
    // Naver 연결 해제 API 호출
    // 참고: https://developers.naver.com/docs/login/api/api.md#5-3-4-%EC%97%B0%EB%8F%99-%ED%95%B4%EC%A0%9C%ED%95%98%EA%B8%B0
    const response = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
      params: {
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        access_token: user.socialId,
        grant_type: 'delete',
        service_provider: 'NAVER'
      }
    });
    
    logger.info(`Naver account revoked for user: ${user._id}`);
  } catch (error) {
    logger.error(`Error revoking Naver account: ${error.message}`);
    throw error;
  }
};

const { createAppleClientSecret } = require('../utils/appleAuth');

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  deleteAccount
};