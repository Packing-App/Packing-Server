const mongoose = require('mongoose');

const packingItemSchema = new mongoose.Schema(
  {
    journeyId: {    // 여행 ID
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true
    },
    name: { // 준비물 이름
      type: String,
      required: [true, '준비물 이름을 입력해주세요'],
      trim: true,
      maxlength: [100, '이름은 100자 이내로 입력해주세요']
    },
    count: {    // 준비물 수량
      type: Number,
      required: true,
      min: [1, '수량은 1 이상이어야 합니다'],
      default: 1
    },
    isChecked: {    // 챙겼는지 여부
      type: Boolean,
      default: false
    },
    category: { // 준비물 카테고리
      type: String,
      required: [true, '카테고리를 입력해주세요'],
      enum: ['clothing', 'electronics', 'toiletries', 'documents', 'medicines', 'essentials', 'other']
    },
    isShared: { // 공유 준비물 여부
      type: Boolean,
      default: false
    },
    assignedTo: {   // 할당된 사용자 ID
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdBy: {    // 생성자 ID
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true    // createdAt, updatedAt 필드 추가
  }
);

const PackingItem = mongoose.model('PackingItem', packingItemSchema);

module.exports = PackingItem;