const mongoose = require('mongoose');


// 날씨 캐시 스키마 정의 (수정 필요)
const weatherCacheSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    forecastData: {
      temperature: Number,
      condition: String,
      precipitation: Number,
      humidity: Number,
      windSpeed: Number
    },
    fetchedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }
);

// 위치와 날짜로 검색하기 위한 복합 인덱스
weatherCacheSchema.index({ location: 1, date: 1 }, { unique: true });

// 만료 시간에 따른 자동 삭제 인덱스
weatherCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const WeatherCache = mongoose.model('WeatherCache', weatherCacheSchema);

module.exports = WeatherCache;