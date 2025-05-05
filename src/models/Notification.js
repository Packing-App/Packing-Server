const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {   // 사용자 ID
      type: mongoose.Schema.Types.ObjectId, // User 스키마와 연결
      ref: 'User',
      required: true
    },
    journeyId: {    // 여행 ID
      type: mongoose.Schema.Types.ObjectId, // Journey 스키마와 연결
      ref: 'Journey',
      default: null
    },
    type: { // 알림 타입
      type: String,
      // reminder: 일정 알림, weather: 날씨 알림, invitation: 초대 알림
      enum: ['reminder', 'weather', 'invitation'], 
      required: true
    },
    content: {  // 알림 내용
      type: String,
      required: true,
      maxlength: [500, '알림 내용은 500자 이내로 입력해주세요']
    },
    isRead: { // 읽음 여부
      type: Boolean,
      default: false
    },
    scheduledAt: { // 예약 시간
      type: Date,
      default: null
    },
    metadata: {  // 추가 메타데이터 (친구 요청 ID 등)
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true // createdAt, updatedAt 필드 추가
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;