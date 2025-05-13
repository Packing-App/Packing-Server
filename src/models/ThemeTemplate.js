const mongoose = require('mongoose');

const themeTemplateSchema = new mongoose.Schema(
  {
    themeName: {
      type: String,
      required: [true, '테마 이름을 입력해주세요'],
      unique: true,
      enum: ['waterSports', 'cycling', 'camping', 'picnic',
        'mountain', 'skiing', 'fishing', 'shopping', 'themepark',
        'business', 'beach', 'cultural', 'photography', 'family',
        'backpacking', 'wellness', 'safari', 'cruise', 'desert',
        'sports', 'roadtrip', 'study', 'glamping', 'medical',
        'adventure', 'diving', 'music', 'wine', 'urban', 'island',
        'other'
      ]
    },
    items: [{   // 준비물 목록
      name: {   // 아이템 이름
        type: String,
        required: true,
        trim: true
      },
      category: {   // 카테고리
        type: String,
        required: true,
        enum: ['clothing', 'electronics', 'toiletries', 'documents', 'medicines', 'essentials', 'other']
      },
      isEssential: {    // 필수 여부
        type: Boolean,
        default: true
      }
    }]
  },
  {
    timestamps: true    // createdAt, updatedAt 필드 추가
  }
);

const ThemeTemplate = mongoose.model('ThemeTemplate', themeTemplateSchema);

module.exports = ThemeTemplate;