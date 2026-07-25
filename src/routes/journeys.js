// src/routes/journeys.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  loadJourneyRequireParticipant,
  requireJourneyCreator
} = require('../middlewares/journeyAccess');
const journeyController = require('../controllers/journeyController');

// 모든 여행 정보 조회 (사용자의 참여 여행만)
router.get('/', protect, journeyController.getJourneys);

// 특정 여행 상세 조회
router.get('/:id', protect, journeyController.getJourneyById);

// 새로운 여행 생성
router.post('/', protect, journeyController.createJourney);

// 여행 정보 업데이트 (생성자만)
router.put(
  '/:id',
  protect,
  loadJourneyRequireParticipant,
  requireJourneyCreator('여행 정보를 수정할 권한이 없습니다'),
  journeyController.updateJourney
);

// 여행 삭제 (생성자만)
router.delete(
  '/:id',
  protect,
  loadJourneyRequireParticipant,
  requireJourneyCreator('여행을 삭제할 권한이 없습니다'),
  journeyController.deleteJourney
);

// 여행 참가자 추가 (친구 초대)
router.post('/:id/participants', protect, journeyController.inviteParticipant);

// 여행 참가자 제거
router.delete('/:id/participants/:userId', protect, journeyController.removeParticipant);

// 여행 초대 수락/거절
router.put('/invitations/:id', protect, journeyController.respondToInvitation);

// 여행 테마별 추천 준비물 조회
router.get('/:id/recommendations', protect, journeyController.getRecommendations);

// 딥링크 초대 링크 발급 (참가자만)
router.post(
  '/:id/invite-link',
  protect,
  loadJourneyRequireParticipant,
  journeyController.getInviteLink
);

// 초대 코드로 여행 참여
router.post('/join', protect, journeyController.joinByInviteCode);

module.exports = router;