// src/routes/journeys.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/auth');
const {
  loadJourneyRequireParticipant,
  requireJourneyCreator
} = require('../middlewares/journeyAccess');
const { validateObjectIdParam } = require('../middlewares/validators');
const { previewLimiter, joinLimiter } = require('../middlewares/rateLimit');
const journeyController = require('../controllers/journeyController');

// :id, :userId가 ObjectId 형식이 아니면 컨트롤러 전에 400으로 끊는다
router.param('id', validateObjectIdParam);
router.param('userId', validateObjectIdParam);

// 초대 코드 미리보기 (비인증 허용).
// `/:id`(1세그먼트)와 경로가 겹치지는 않지만, 공개 라우트라는 걸 눈에 띄게 맨 위에 둔다.
// 비인증으로 열리는 만큼 8자 코드 무차별 조회를 막을 rate limit이 붙는다.
router.get('/preview/:code', previewLimiter, optionalAuth, journeyController.previewInviteCode);

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

// 딥링크 초대 링크 조회 (참가자 전원). 코드가 아직 없을 때의 최초 발급만 방장으로 제한한다
// — 그 분기는 컨트롤러 안에 있다(상태 의존이라 미들웨어로 못 나눈다).
router.post(
  '/:id/invite-link',
  protect,
  loadJourneyRequireParticipant,
  journeyController.getInviteLink
);

// 초대 링크 폐기 (방장만). 유출 대응 수단.
router.delete(
  '/:id/invite-link',
  protect,
  loadJourneyRequireParticipant,
  requireJourneyCreator('초대 링크를 폐기할 권한이 없습니다'),
  journeyController.revokeInviteLink
);

// 초대 코드로 여행 참여
router.post('/join', joinLimiter, protect, journeyController.joinByInviteCode);

module.exports = router;