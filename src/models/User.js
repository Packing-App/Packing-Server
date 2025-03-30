// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { // 이름
      type: String,
      required: [true, '이름을 입력해주세요'],
      trim: true,
      maxlength: [20, '이름은 20자 이내로 입력해주세요']
    },
    email: {  // 이메일
      type: String,
      required: [true, '이메일을 입력해주세요'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        '유효한 이메일 주소를 입력해주세요'
      ]
    },
    password: { // 비밀번호
      type: String,
      required: function () {
        return this.socialType === 'email';
      },
      minlength: [8, '비밀번호는 8자 이상이어야 합니다'],
      select: false // API 응답에서 제외
    },
    profileImage: { // 프로필 이미지
      type: String,
      default: null
    },
    intro: {  // 자기소개
      type: String,
      maxlength: [200, '자기소개는 200자 이내로 입력해주세요'],
      default: null
    },
    socialType: { // 소셜 로그인 타입
      type: String,
      enum: ['email', 'kakao', 'naver', 'google', 'apple'],
      default: 'email'
    },
    socialId: { // 소셜 로그인 ID
      type: String,
      default: null
    },
    refreshToken: { // 리프레시 토큰
      type: String,
      default: null
    },
    pushNotificationEnabled: {  // 푸시 알림 설정
      type: Boolean,
      default: true
    },
    // 이메일 검증 관련 필드 추가
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: String,
    emailVerificationExpire: Date,
    
    // 비밀번호 재설정 관련 필드 추가
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true  // createdAt, updatedAt 필드 추가
  }
);

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// 이메일 검증 토큰 생성 메서드
userSchema.methods.generateEmailVerificationToken = function() {
  // 랜덤 토큰 생성
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  // 토큰 해시 저장
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // 만료 시간 설정 (24시간)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// 비밀번호 재설정 토큰 생성 메서드
userSchema.methods.generatePasswordResetToken = function() {
  // 랜덤 토큰 생성
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // 토큰 해시 저장
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // 만료 시간 설정 (1시간)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;