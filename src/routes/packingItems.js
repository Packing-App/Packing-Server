// src/routes/packingItems.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const packingItemController = require('../controllers/packingItemController');

// 여행별 준비물 목록 조회
router.get('/journey/:journeyId', protect, packingItemController.getPackingItemsByJourney);

// 준비물 생성
router.post('/', protect, packingItemController.createPackingItem);

// 준비물 일괄 생성 (테마 템플릿에서 가져오기)
router.post('/bulk', protect, packingItemController.createBulkPackingItems);

// 추천 준비물에서 선택한 항목들을 일괄 등록
router.post('/from-recommendations', protect, packingItemController.createSelectedRecommendedItems);

// 준비물 업데이트
router.put('/:id', protect, packingItemController.updatePackingItem);

// 준비물 체크 상태 토글
router.put('/:id/toggle', protect, packingItemController.togglePackingItem);

// 준비물 삭제
router.delete('/:id', protect, packingItemController.deletePackingItem);

// 카테고리별 준비물 조회
router.get('/categories/:journeyId', protect, packingItemController.getPackingItemsByCategory);

// 테마별 준비물 템플릿 목록 조회
router.get('/templates', protect, packingItemController.getThemeTemplates);

// 특정 테마의 준비물 템플릿 조회
router.get('/templates/:themeName', protect, packingItemController.getThemeTemplateByName);

module.exports = router;