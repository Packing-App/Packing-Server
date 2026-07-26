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
    friendCode: { // 친구 검색용 8자 코드. 최초 프로필 조회 시 지연 발급된다
      type: String,
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
    // 푸시 알림 관련 필드 추가
    pushNotificationEnabled: {
      type: Boolean,
      default: true
    },
    deviceToken: {
      type: String,
      default: null
    },
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web', null],
      default: null
    },
    // 이메일 검증 관련 필드 수정
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    verificationCode: { // 이메일 인증번호
      type: String,
      default: null
    },
    verificationCodeExpire: { // 인증번호 만료시간
      type: Date,
      default: null
    },
    
    // 비밀번호 재설정 관련 필드 수정
    resetPasswordCode: { // 비밀번호 재설정 인증번호
      type: String,
      default: null
    },
    resetPasswordCodeExpire: { // 인증번호 만료시간
      type: Date,
      default: null
    }
  },
  {
    timestamps: true  // createdAt, updatedAt 필드 추가
  }
);

// 친구 코드 유니크 인덱스.
// sparse는 필드 누락만 건너뛰고 null은 색인하므로, default: null과 함께 쓰면
// 코드가 없는 사용자 두 명째에서 중복키가 난다. 부분 인덱스로 문자열만 색인한다.
userSchema.index(
  { friendCode: 1 },
  { unique: true, partialFilterExpression: { friendCode: { $type: 'string' } } }
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

// 이메일 검증 인증번호 생성 메서드
userSchema.methods.generateEmailVerificationCode = function() {
  // 6자리 인증번호 생성
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 인증번호 저장 (해싱하여 저장)
  this.verificationCode = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');
  
  // 만료 시간 설정 (30분)
  this.verificationCodeExpire = Date.now() + 30 * 60 * 1000;
  
  return verificationCode;
};

// 비밀번호 재설정 인증번호 생성 메서드
userSchema.methods.generatePasswordResetCode = function() {
  // 6자리 인증번호 생성
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 인증번호 저장 (해싱하여 저장)
  this.resetPasswordCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');
  
  // 만료 시간 설정 (30분)
  this.resetPasswordCodeExpire = Date.now() + 30 * 60 * 1000;
  
  return resetCode;
};

const User = mongoose.model('User', userSchema);

module.exports = User;