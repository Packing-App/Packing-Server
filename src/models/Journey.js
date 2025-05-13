const mongoose = require('mongoose');

// 목적지 (destination)는 사용자 입력이 아닌,
// API 에서 제공하는 장소로 설정해야, 날씨정보 받아올 때 오류가 없을 것임.

const journeySchema = new mongoose.Schema(
  {
    creatorId: {    // 생성자 ID
      type: mongoose.Schema.Types.ObjectId, // User 스키마와 연결
      ref: 'User',
      required: true
    },
    title: {    // 여행 제목
      type: String,
      required: [true, '여행 제목을 입력해주세요'],
      trim: true,
      maxlength: [100, '제목은 100자 이내로 입력해주세요']
    },
    transportType: {    // 교통 수단
      type: String,
      // 비행기, 기차, 배, 버스, 도보, 기타
      enum: ['plane', 'train', 'ship', 'bus', 'walk', 'other'],
      required: [true, '교통 수단을 선택해주세요']
    },
    origin: {   // 출발지
      type: String,
      required: [true, '출발지를 입력해주세요'],
      trim: true,
      maxlength: [100, '출발지는 100자 이내로 입력해주세요']
    },
    destination: {  // 도착지
      type: String,
      required: [true, '도착지를 입력해주세요'],
      trim: true,
      maxlength: [100, '도착지는 100자 이내로 입력해주세요']
    },
    startDate: {    // 시작 날짜
      type: Date,
      required: [true, '시작 날짜를 입력해주세요']
    },
    endDate: {  // 종료 날짜
      type: Date,
      required: [true, '종료 날짜를 입력해주세요']
    },
    themes: [{ // 여행 테마 (복수 선택 가능)
      type: String,
      required: [true, '여행 테마를 선택해주세요'],
      enum: ['waterSports', 'cycling', 'camping', 'picnic',
        'mountain', 'skiing', 'fishing', 'shopping', 'themepark',
        'business', 'beach', 'cultural', 'photography', 'family',
        'backpacking', 'wellness', 'safari', 'cruise', 'desert',
        'sports', 'roadtrip', 'study', 'glamping', 'medical',
        'adventure', 'diving', 'music', 'wine', 'urban', 'island',
        'other'
      ]
    }],
    imageUrl: { // 대표 이미지 URL
      type: String,
      default: null
    },
    isPrivate: { // 혼자 여행인지 여부
      type: Boolean,
      default: false
    },
    participants: [{    // 여행 참가자 ID 목록
      type: mongoose.Schema.Types.ObjectId, // User 스키마와 연결
      ref: 'User'
    }]
  },
  {
    timestamps: true    // createdAt, updatedAt 필드 추가
  }
);

// 생성자를 자동으로 참가자에 추가하는 미들웨어
journeySchema.pre('save', function(next) {
  if (this.isNew && !this.participants.includes(this.creatorId)) {
    this.participants.push(this.creatorId);
  }
  next();
});

// 최소 1개 이상의 테마 선택 필수
journeySchema.pre('save', function(next) {
  if (this.themes && this.themes.length === 0) {
    return next(new Error('최소 1개 이상의 테마를 선택해주세요'));
  }
  next();
});

const Journey = mongoose.model('Journey', journeySchema);

module.exports = Journey;