// src/middlewares/localization.js
module.exports = (req, res, next) => {
    // Accept-Language 헤더에서 언어 코드 추출
    const acceptLanguage = req.headers['accept-language'] || 'ko';
    
    // 지원하는 언어 목록
    const supportedLanguages = ['ko', 'en'];
    
    // 언어 코드 파싱 (예: en-US -> en)
    const langCode = acceptLanguage.toLowerCase().split(/[-_]/)[0];
    
    // 요청된 언어가 지원되는지 확인
    req.lang = supportedLanguages.includes(langCode) ? langCode : 'ko';
    
    next();
};