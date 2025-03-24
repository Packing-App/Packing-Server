const ThemeTemplate = require('../models/ThemeTemplate');
const logger = require('./logger');

const themeTemplateData = [
  {
    themeName: 'waterSports',
    items: [
      { name: '수영복', category: 'clothing', isEssential: true },
      { name: '선크림', category: 'essentials', isEssential: true },
      { name: '선글라스', category: 'essentials', isEssential: true },
      { name: '비치타올', category: 'essentials', isEssential: true },
      { name: '방수팩', category: 'electronics', isEssential: false },
      { name: '샌들', category: 'clothing', isEssential: true }
    ]
  },
  {
    themeName: 'mountain',
    items: [
      { name: '등산화', category: 'clothing', isEssential: true },
      { name: '등산복', category: 'clothing', isEssential: true },
      { name: '물통', category: 'essentials', isEssential: true },
      { name: '등산 양말', category: 'clothing', isEssential: true },
      { name: '구급상자', category: 'medicines', isEssential: true },
      { name: '선크림', category: 'essentials', isEssential: true }
    ]
  },
  // 다른 테마들도 추가
];

const seedThemeTemplates = async () => {
  try {
    // 기존 데이터 수 확인
    const count = await ThemeTemplate.countDocuments();
    
    // 데이터가 없을 때만 초기 데이터 추가
    if (count === 0) {
      await ThemeTemplate.insertMany(themeTemplateData);
      logger.info('Theme templates seeded successfully');
    } else {
      logger.info('Theme templates already exist, skipping seed');
    }
  } catch (error) {
    logger.error(`Error seeding theme templates: ${error.message}`);
  }
};

module.exports = { seedThemeTemplates };