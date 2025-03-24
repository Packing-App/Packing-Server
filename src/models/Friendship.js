const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    requesterId: {  // 요청자 ID (초대 보낸 사람)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {   // 수신자 ID (초대 받은 사람)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {   // 상태 (pending: 대기 중, accepted: 수락, rejected: 거절)
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true    // createdAt, updatedAt 필드 추가
  }
);

// 중복 요청 방지를 위한 복합 인덱스
// 요청자 ID와 수신자 ID가 중복되지 않도록 설정
friendshipSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

// Friendship 모델 생성
const Friendship = mongoose.model('Friendship', friendshipSchema);

// Friendship 모델 내보내기
module.exports = Friendship;