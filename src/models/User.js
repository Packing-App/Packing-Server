const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '이름을 입력해주세요'],
      trim: true,
      maxlength: [50, '이름은 50자 이내로 입력해주세요']
    },
    email: {
      type: String,
      required: [true, '이메일을 입력해주세요'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, '유효한 이메일 주소를 입력해주세요']
    },
    password: {
      type: String,
      minlength: [8, '비밀번호는 8자 이상이어야 합니다'],
      select: false // API 응답에서 제외
    },
    profileImage: {
      type: String,
      default: null
    },
    intro: {
      type: String,
      maxlength: [200, '자기소개는 200자 이내로 입력해주세요'],
      default: null
    },
    socialType: {
      type: String,
      enum: ['email', 'kakao', 'naver', 'google', 'apple'],
      default: 'email'
    },
    socialId: {
      type: String,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    pushNotificationEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
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