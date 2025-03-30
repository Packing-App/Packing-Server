// src/routes/users.js
const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const router = express.Router();

// AWS S3 설정
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const logger = require('../config/logger');

// AWS 설정
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// 파일 업로드 미들웨어 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read', // 업로드된 파일은 공개적으로 읽을 수 있음
    contentType: multerS3.AUTO_CONTENT_TYPE, // 파일 타입 자동 감지
    key: function (req, file, cb) {
      const userId = req.user._id;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      // 파일 경로: profiles/사용자ID/현재시간_랜덤숫자.확장자
      cb(null, `profiles/${userId}/${uniqueSuffix}${ext}`);
    }
  }),
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 허용할 파일 유형
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 오류 핸들링 미들웨어
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 오류 처리
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '파일 크기는 5MB를 초과할 수 없습니다.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `파일 업로드 오류: ${err.message}`
    });
  } else if (err) {
    // 기타 오류
    logger.error(`File upload error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message || '파일 업로드 중 오류가 발생했습니다.'
    });
  }
  next();
};

// 내 프로필 조회
router.get('/me', protect, userController.getMyProfile);

// 특정 사용자 프로필 조회
router.get('/:id', userController.getUserProfile);

// 내 프로필 수정 (이름, 자기소개)
router.put('/me', protect, userController.updateProfile);

// 프로필 이미지 업로드/수정
router.put(
  '/me/profile-image', 
  protect, 
  upload.single('profileImage'), 
  handleMulterError, 
  userController.updateProfileImage
);

module.exports = router;