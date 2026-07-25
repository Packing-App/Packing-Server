// src/middlewares/journeyAccess.js
// 여행 접근 권한(참가자/생성자) 확인을 표준화한다.
// 컨트롤러마다 흩어져 있던 "findById → 404 → 참가자/생성자 확인" 3단 패턴 중복을 줄인다.
const Journey = require('../models/Journey');
const { sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

// participants가 populate됐든(문서) 아니든(ObjectId) 안전하게 비교한다.
// (raw ObjectId 배열의 .includes(ObjectId)는 상황에 따라 어긋날 수 있어 helper로 통일)
const isParticipant = (journey, userId) =>
  journey.participants.some((p) => (p._id || p).toString() === userId.toString());

const isCreator = (journey, userId) => journey.creatorId.toString() === userId.toString();

// journeyId를 params.id → params.journeyId → body.journeyId 순으로 찾아 로드하고,
// 없으면 404, 참가자가 아니면 403. 로드된 여행은 req.journey에 주입한다.
const loadJourneyRequireParticipant = async (req, res, next) => {
  try {
    const journeyId = req.params.id || req.params.journeyId || req.body.journeyId;
    if (!journeyId) {
      return sendError(res, 400, '여행 ID를 입력해주세요');
    }

    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }
    if (!isParticipant(journey, req.user._id)) {
      return sendError(res, 403, '이 여행에 접근할 권한이 없습니다');
    }

    req.journey = journey;
    next();
  } catch (error) {
    logger.error(`여행 접근 확인 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

// req.journey가 이미 로드된 상태(loadJourneyRequireParticipant 뒤)에서 생성자만 통과시킨다.
const requireJourneyCreator =
  (message = '이 작업을 수행할 권한이 없습니다') =>
  (req, res, next) => {
    if (!isCreator(req.journey, req.user._id)) {
      return sendError(res, 403, message);
    }
    next();
  };

module.exports = {
  isParticipant,
  isCreator,
  loadJourneyRequireParticipant,
  requireJourneyCreator
};
