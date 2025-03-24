// src/controllers/authController.js
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const logger = require('../config/logger');

// 이메일 회원가입
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 이메일 중복 확인
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다'
      });
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
    
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        intro: user.intro,
        socialType: user.socialType
      }
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다'
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 일치하지 않습니다'
      });
    }

    // 소셜 로그인 사용자가 이메일 로그인 시도하는 경우
    if (user.socialType !== 'email') {
      return res.status(400).json({
        success: false,
        message: `이 계정은 ${user.socialType} 로그인으로 가입되었습니다`
      });
    }

    // 비밀번호 확인
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 일치하지 않습니다'
      });
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        intro: user.intro,
        socialType: user.socialType
      }
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
      return res.status(400).json({
        success: false,
        message: '리프레시 토큰이 제공되지 않았습니다'
      });
    }

    // 토큰 검증
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '리프레시 토큰이 유효하지 않거나 만료되었습니다'
      });
    }

    // 사용자 찾기
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: '인증에 실패했습니다'
      });
    }

    // 새 액세스 토큰 생성
    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '토큰 갱신 중 오류가 발생했습니다'
    });
  }
};

// 로그아웃
const logout = async (req, res) => {
  try {
    // 사용자에서 리프레시 토큰 제거
    req.user.refreshToken = null;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: '로그아웃되었습니다'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '로그아웃 중 오류가 발생했습니다'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};