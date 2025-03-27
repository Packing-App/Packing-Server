// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { // 이름
      type: String,
      required: [true, '이름을 입력해주세요'],
      trim: true,
      maxlength: [10, '이름은 10자 이내로 입력해주세요']
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
    }
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

const User = mongoose.model('User', userSchema);

module.exports = User;