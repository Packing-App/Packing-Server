// src/controllers/userController.js
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');
const AWS = require('aws-sdk');

// S3 인스턴스 생성
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * 현재 사용자 프로필 조회
 * @route GET /api/v1/users/me
 * @access Private
 */
const getMyProfile = async (req, res) => {
  try {
    // req.user는 인증 미들웨어에서 설정됨
    const user = req.user;

    // 필요한 사용자 정보만 반환
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      intro: user.intro,
      socialType: user.socialType,
      isEmailVerified: user.isEmailVerified
    };

    return sendSuccess(res, 200, '프로필 조회 성공', { user: userData });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    return sendError(res, 500, '프로필 조회 중 오류가 발생했습니다');
  }
};

/**
 * 특정 사용자 프로필 조회
 * @route GET /api/v1/users/:id
 * @access Public
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }

    // 공개 프로필 정보만 반환
    const userData = {
      id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      intro: user.intro
    };

    return sendSuccess(res, 200, '프로필 조회 성공', { user: userData });
  } catch (error) {
    logger.error(`Get user profile error: ${error.message}`);
    return sendError(res, 500, '프로필 조회 중 오류가 발생했습니다');
  }
};

/**
 * 현재 사용자 프로필 수정
 * @route PUT /api/v1/users/me
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, intro } = req.body;
    const userId = req.user._id;

    // 이름 유효성 검증
    if (name && (name.length < 2 || name.length > 20)) {
      return sendError(res, 400, '이름은 2자 이상 20자 이하로 입력해주세요');
    }

    // 자기소개 유효성 검증
    if (intro && intro.length > 200) {
      return sendError(res, 400, '자기소개는 200자 이내로 입력해주세요');
    }

    // 업데이트할 필드 구성
    const updateFields = {};
    if (name) updateFields.name = name;
    if (intro !== undefined) updateFields.intro = intro; // 빈 문자열도 허용

    // 프로필 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true } // 업데이트된 문서 반환
    );

    if (!updatedUser) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }

    // 응답 데이터 구성
    const userData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      intro: updatedUser.intro,
      socialType: updatedUser.socialType,
      isEmailVerified: updatedUser.isEmailVerified
    };

    return sendSuccess(res, 200, '프로필이 성공적으로 업데이트되었습니다', { user: userData });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    return sendError(res, 500, '프로필 업데이트 중 오류가 발생했습니다');
  }
};

/**
 * 프로필 이미지 업데이트
 * @route PUT /api/v1/users/me/profile-image
 * @access Private
 */
const updateProfileImage = async (req, res) => {
  try {
    // multer-s3에서 처리한 파일 정보 확인
    if (!req.file) {
      return sendError(res, 400, '이미지 파일을 업로드해주세요');
    }

    const userId = req.user._id;
    
    // multer-s3가 제공하는 S3에 업로드된 파일 URL
    const profileImageUrl = req.file.location;
    
    // 기존 프로필 이미지가 있는 경우 S3에서 삭제
    const user = await User.findById(userId);
    if (user.profileImage) {
      // S3 URL에서 키 추출
      const oldImageKey = extractKeyFromS3Url(user.profileImage);
      if (oldImageKey) {
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: oldImageKey
          }).promise();
          logger.info(`Old profile image deleted: ${oldImageKey}`);
        } catch (deleteError) {
          logger.error(`Error deleting old profile image: ${deleteError.message}`);
          // 이전 이미지 삭제 실패는 치명적이지 않으므로 진행
        }
      }
    }

    // 프로필 이미지 URL 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profileImage: profileImageUrl } },
      { new: true }
    );

    if (!updatedUser) {
      return sendError(res, 404, '사용자를 찾을 수 없습니다');
    }

    return sendSuccess(res, 200, '프로필 이미지가 성공적으로 업데이트되었습니다', {
      profileImage: updatedUser.profileImage
    });
  } catch (error) {
    logger.error(`Update profile image error: ${error.message}`);
    return sendError(res, 500, '프로필 이미지 업데이트 중 오류가 발생했습니다');
  }
};

/**
 * S3 URL에서 객체 키 추출
 * @param {string} url - S3 객체 URL
 * @returns {string|null} 추출된 S3 객체 키 또는 null
 */
const extractKeyFromS3Url = (url) => {
  try {
    if (!url) return null;
    
    // URL 파싱
    const parsedUrl = new URL(url);
    
    // 버킷 이름 이후의 경로를 키로 사용
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    let key = parsedUrl.pathname;
    
    // 경로에서 앞에 있는 '/' 제거
    if (key.startsWith('/')) {
      key = key.substring(1);
    }
    
    // 버킷 이름이 경로에 포함된 경우 (일부 S3 URL 형식)
    if (key.startsWith(`${bucketName}/`)) {
      key = key.substring(bucketName.length + 1);
    }
    
    return key;
  } catch (error) {
    logger.error(`Error extracting key from S3 URL: ${error.message}`);
    return null;
  }
};

module.exports = {
  getMyProfile,
  getUserProfile,
  updateProfile,
  updateProfileImage
};