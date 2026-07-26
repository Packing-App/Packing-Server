// src/controllers/journeyController.js
const Journey = require('../models/Journey');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PackingItem = require('../models/PackingItem');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');
const { getDestinationImage } = require('../utils/externalApiUtils');
const { notifyUser } = require('../services/notificationService');
const { isParticipant, isCreator } = require('../middlewares/journeyAccess');
const { generateInviteCode } = require('../utils/inviteCode');

// 초대 링크의 공개 도메인.
// iOS 앱 entitlement(`applinks:packing-api.iyungui.dev`)에 박혀 있는 값과 반드시 같아야
// 유니버설 링크가 걸린다. 요청 헤더에서 뽑으면 안 된다 — Cloudflare Worker가 Cloud Run으로
// 프록시하면서 Host를 `*.run.app`으로 바꿔 보내기 때문에 앱이 안 여는 링크가 나간다.
const INVITE_LINK_ORIGIN = 'https://packing-api.iyungui.dev';

/**
 * 사용자의 여행 목록 조회
 * @route GET /api/journeys
 * @access Private
 */
const getJourneys = async (req, res) => {
  try {
    // 사용자가 참여한 모든 여행 조회 (participants 배열에 사용자 ID가 포함된 여행)
    const journeys = await Journey.find({ participants: req.user._id })
      .populate('participants', 'email name profileImage socialType')
      .sort({ startDate: 1 }); // 시작일 기준 오름차순 정렬

    return sendSuccess(res, 200, '여행 목록을 성공적으로 조회했습니다', journeys);
  } catch (error) {
    logger.error(`여행 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 특정 여행 조회
 * @route GET /api/journeys/:id
 * @access Private
 */
const getJourneyById = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate('participants', 'name profileImage')
      .populate('creatorId', 'name profileImage');

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 참여자 확인 (보안 검사)
    if (!isParticipant(journey, req.user._id)) {
      return sendError(res, 403, '이 여행에 접근할 권한이 없습니다');
    }

    return sendSuccess(res, 200, '여행 정보를 성공적으로 조회했습니다', journey);
  } catch (error) {
    logger.error(`여행 상세 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 새로운 여행 생성
 * @route POST /api/journeys
 * @access Private
 */
const createJourney = async (req, res) => {
  try {
    const { 
      title, 
      transportType, 
      origin, 
      destination, 
      startDate, 
      endDate, 
      themes, // 변경: theme -> themes (배열)
      isPrivate = false 
    } = req.body;

    // 필수 필드 검증
    if (!title || !transportType || !origin || !destination || !startDate || !endDate || !themes) {
      return sendError(res, 400, '모든 필수 정보를 입력해주세요');
    }

    // 테마 배열 검증
    if (!Array.isArray(themes) || themes.length === 0) {
      return sendError(res, 400, '최소 1개 이상의 테마를 선택해주세요');
    }

    // 날짜 검증
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return sendError(res, 400, '종료 날짜는 시작 날짜 이후여야 합니다');
    }
    
    // 첫 번째 테마를 이미지 검색에 사용
    const imageData = await getDestinationImage(destination, themes[0]);

    // 새 여행 생성
    const journey = await Journey.create({
      title,
      transportType,
      origin,
      destination,
      startDate: start,
      endDate: end,
      themes, // 복수 테마 지원
      isPrivate,
      creatorId: req.user._id,
      participants: [req.user._id], // 생성자를 참가자로 자동 추가
      imageUrl: imageData ? imageData.imageUrl : null // 이미지 URL 저장
    });

    const populatedJourney = await Journey.findById(journey._id)
      .populate('participants', 'email name profileImage socialType');

    return sendSuccess(res, 201, '여행이 성공적으로 생성되었습니다', populatedJourney);
  } catch (error) {
    logger.error(`여행 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 정보 업데이트
 * @route PUT /api/journeys/:id
 * @access Private
 */
const updateJourney = async (req, res) => {
  try {
    // 로드·404·생성자 권한 확인은 loadJourneyRequireParticipant + requireJourneyCreator 미들웨어가 처리
    const journey = req.journey;

    const {
      title, 
      transportType, 
      origin, 
      destination, 
      startDate, 
      endDate, 
      themes, // 변경: theme -> themes (배열)
      isPrivate 
    } = req.body;

    // 필수 필드 검증
    if (!title || !transportType || !origin || !destination || !startDate || !endDate || !themes) {
      return sendError(res, 400, '모든 필수 정보를 입력해주세요');
    }
    // 테마 배열 검증
    if (!Array.isArray(themes) || themes.length === 0) {
      return sendError(res, 400, '최소 1개 이상의 테마를 선택해주세요');
    }

    // 날짜 검증
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return sendError(res, 400, '종료 날짜는 시작 날짜 이후여야 합니다');
      }
    }

    // 업데이트할 필드 설정
    if (title) journey.title = title;
    if (transportType) journey.transportType = transportType;
    if (origin) journey.origin = origin;
    if (destination) journey.destination = destination;
    if (startDate) journey.startDate = new Date(startDate);
    if (endDate) journey.endDate = new Date(endDate);
    if (themes) journey.themes = themes;
    if (isPrivate !== undefined) journey.isPrivate = isPrivate;

    // 저장
    await journey.save();

    return sendSuccess(res, 200, '여행 정보가 성공적으로 업데이트되었습니다', journey);
  } catch (error) {
    logger.error(`여행 업데이트 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 삭제
 * @route DELETE /api/journeys/:id
 * @access Private
 */
const deleteJourney = async (req, res) => {
  try {
    // 로드·404·생성자 권한 확인은 미들웨어가 처리
    const journey = req.journey;

    // 여행 삭제
    await journey.deleteOne();

    // 관련 알림 삭제 (Journey ID와 연결된 모든 알림)
    await Notification.deleteMany({ journeyId: req.params.id });

    // 여행 관련 준비물 삭제
    await PackingItem.deleteMany({ journeyId: req.params.id });

    return sendSuccess(res, 200, '여행이 성공적으로 삭제되었습니다');
  } catch (error) {
    logger.error(`여행 삭제 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행에 참가자 초대
 * @route POST /api/journeys/:id/participants
 * @access Private
 */
const inviteParticipant = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (여행 참가자만 초대 가능)
    if (!isParticipant(journey, req.user._id)) {
      return sendError(res, 403, '이 여행에 참가자를 초대할 권한이 없습니다');
    }

    // 혼자 여행인 경우 초대 불가
    if (journey.isPrivate) {
      return sendError(res, 400, '혼자 여행으로 설정된 여행에는 참가자를 초대할 수 없습니다');
    }

    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, '초대할 사용자의 이메일을 입력해주세요');
    }

    // 사용자 찾기
    const invitedUser = await User.findOne({ email });

    if (!invitedUser) {
      return sendError(res, 404, '해당 이메일을 가진 사용자를 찾을 수 없습니다');
    }

    // 자기 자신 초대 방지
    if (invitedUser._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, '자기 자신을 초대할 수 없습니다');
    }

    // 이미 참가자인 경우 확인
    if (isParticipant(journey, invitedUser._id)) {
      return sendError(res, 400, '이미 여행에 참가 중인 사용자입니다');
    }

    // 초대 알림 생성 + 소켓 + 푸시
    const notification = await notifyUser(invitedUser, {
      type: 'invitation',
      journeyId: journey._id,
      content: `${req.user.name}님이 '${journey.title}' 여행에 초대했습니다.`
    }, {
      title: '여행 초대',
      pushData: { journeyId: journey._id.toString() }
    });

    return sendSuccess(res, 200, '여행 초대가 성공적으로 전송되었습니다', { notification });
  } catch (error) {
    logger.error(`여행 참가자 초대 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 참가자 제거
 * @route DELETE /api/journeys/:id/participants/:userId
 * @access Private
 */
const removeParticipant = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    const userIdToRemove = req.params.userId;

    // 본인이 나가는 경우 또는 여행 생성자가 참가자 제거하는 경우 확인
    const isSelfRemoval = userIdToRemove === req.user._id.toString();
    const userIsCreator = isCreator(journey, req.user._id);

    if (!isSelfRemoval && !userIsCreator) {
      return sendError(res, 403, '참가자를 제거할 권한이 없습니다');
    }

    // 생성자는 제거할 수 없음 (생성자가 나가면 여행 삭제 처리 필요)
    if (userIdToRemove === journey.creatorId.toString() && !isSelfRemoval) {
      return sendError(res, 400, '여행 생성자는 제거할 수 없습니다');
    }

    // 참가자 목록에서 제거
    if (!journey.participants.includes(userIdToRemove)) {
      return sendError(res, 400, '해당 사용자는 참가자 목록에 없습니다');
    }

    journey.participants = journey.participants.filter(
      id => id.toString() !== userIdToRemove
    );

    // 생성자가 나가는 경우 여행 삭제
    if (isSelfRemoval && userIsCreator) {
      await journey.deleteOne();
      // 관련 알림 및 패킹 아이템 삭제 로직 추가 필요
      return sendSuccess(res, 200, '여행이 성공적으로 삭제되었습니다');
    } else {
      await journey.save();
      return sendSuccess(res, 200, '참가자가 성공적으로 제거되었습니다');
    }
  } catch (error) {
    logger.error(`여행 참가자 제거 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 초대 응답 (수락/거절)
 * @route PUT /api/journeys/invitations/:id
 * @access Private
 */
const respondToInvitation = async (req, res) => {
  try {
    const { accept } = req.body;
    
    if (accept === undefined) {
      return sendError(res, 400, '초대 응답(수락/거절)을 입력해주세요');
    }

    // 알림 찾기
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return sendError(res, 404, '초대를 찾을 수 없습니다');
    }

    // 권한 확인 (본인 알림만 응답 가능)
    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '이 초대에 응답할 권한이 없습니다');
    }

    // 타입 확인 (초대 알림만 응답 가능)
    if (notification.type !== 'invitation') {
      return sendError(res, 400, '유효한 초대 알림이 아닙니다');
    }

    // 여행 찾기
    const journey = await Journey.findById(notification.journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 알림을 읽음 처리
    notification.isRead = true;
    await notification.save();

    // 수락한 경우 참가자 추가
    if (accept) {
      // 이미 참가자가 아니면 추가
      if (!isParticipant(journey, req.user._id)) {
        journey.participants.push(req.user._id);
        await journey.save();
      }

      // 여행 생성자 정보 가져오기
      const creator = await User.findById(journey.creatorId);
      
      // 생성자에게 수락 알림 생성 + 소켓 + 푸시
      await notifyUser(creator, {
        type: 'journeyInvitationResponse',
        journeyId: journey._id,
        content: `${req.user.name}님이 '${journey.title}' 여행 초대를 수락했습니다.`
      }, {
        title: '초대 수락',
        pushData: { journeyId: journey._id.toString() }
      });

      return sendSuccess(res, 200, '여행 초대를 수락했습니다');
    } else {
      return sendSuccess(res, 200, '여행 초대를 거절했습니다');
    }
  } catch (error) {
    logger.error(`여행 초대 응답 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 테마별 추천 준비물 조회
 * @route GET /api/journeys/:id/recommendations
 * @access Private
 */
// journeyController.js의 getRecommendations 함수 수정

const getRecommendations = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id)
    .populate('participants', 'email name profileImage socialType');

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 추천 조회 가능)
    if (!isParticipant(journey, req.user._id)) {
      return sendError(res, 403, '이 여행의 준비물을 조회할 권한이 없습니다');
    }

    // 준비물 추천 서비스 호출
    const itemRecommendationService = require('../services/itemRecommendationService');
    const recommendedItems = await itemRecommendationService.getRecommendedItems(journey);

    // 결과 분류 (옷차림, 필수품 등으로 구분)
    const categories = {
      clothing: { name: '옷차림', items: [] },
      electronics: { name: '전자기기', items: [] },
      toiletries: { name: '세면용품', items: [] },
      documents: { name: '서류', items: [] },
      medicines: { name: '의약품', items: [] },
      essentials: { name: '필수품', items: [] },
      other: { name: '기타', items: [] }
    };

    // 카테고리별로 아이템 분류
    recommendedItems.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].items.push(item);
      } else {
        categories.other.items.push(item);
      }
    });

    return sendSuccess(res, 200, '여행 정보에 맞는 추천 준비물 목록입니다', {
      journey: journey,
      categories: categories
    });
  } catch (error) {
    logger.error(`추천 준비물 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 딥링크 초대 링크 발급 (참가자만)
 * @route POST /api/journeys/:id/invite-link
 * @access Private
 * req.journey는 loadJourneyRequireParticipant 미들웨어가 주입.
 */
const getInviteLink = async (req, res) => {
  try {
    const journey = req.journey;

    if (journey.isPrivate) {
      return sendError(res, 400, '혼자 여행은 초대할 수 없습니다');
    }

    // 코드가 없으면 생성 (충돌 시 최대 5회 재시도)
    if (!journey.inviteCode) {
      let code;
      for (let i = 0; i < 5; i++) {
        code = generateInviteCode();
        const exists = await Journey.exists({ inviteCode: code });
        if (!exists) break;
      }
      journey.inviteCode = code;
      await journey.save();
    }

    // CLIENT_URL은 `/api` 접미사가 붙은 API 베이스라 여기 쓰면 `/api/join/<code>`가 되어
    // 랜딩(404)도 AASA의 paths(`/join/*`)도 못 맞춘다.
    const inviteUrl = `${INVITE_LINK_ORIGIN}/join/${journey.inviteCode}`;

    return sendSuccess(res, 200, '초대 링크가 생성되었습니다', {
      inviteCode: journey.inviteCode,
      inviteUrl
    });
  } catch (error) {
    logger.error(`초대 링크 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 초대 코드로 여행 참여
 * @route POST /api/journeys/join
 * @access Private
 * 미가입자가 링크로 유입→가입 후, 클라이언트가 저장해둔 코드로 이 API를 호출한다.
 */
const joinByInviteCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return sendError(res, 400, '초대 코드를 입력해주세요');
    }

    const journey = await Journey.findOne({ inviteCode: code });
    if (!journey) {
      return sendError(res, 404, '유효하지 않은 초대 코드입니다');
    }

    if (journey.isPrivate) {
      return sendError(res, 400, '혼자 여행에는 참여할 수 없습니다');
    }

    const populate = (id) =>
      Journey.findById(id).populate('participants', 'email name profileImage socialType');

    // 이미 참가자면 재진입 허용 (참여 화면으로 그대로 이동)
    if (isParticipant(journey, req.user._id)) {
      const already = await populate(journey._id);
      return sendSuccess(res, 200, '이미 참여 중인 여행입니다', already);
    }

    journey.participants.push(req.user._id);
    await journey.save();

    // 방장에게 참여 알림
    const creator = await User.findById(journey.creatorId);
    if (creator) {
      await notifyUser(creator, {
        type: 'journeyInvitationResponse',
        journeyId: journey._id,
        content: `${req.user.name}님이 '${journey.title}' 여행에 참여했습니다.`
      }, {
        title: '여행 참여',
        pushData: { journeyId: journey._id.toString() }
      });
    }

    const joined = await populate(journey._id);
    return sendSuccess(res, 200, '여행에 참여했습니다', joined);
  } catch (error) {
    logger.error(`초대 코드 참여 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  getJourneys,
  getJourneyById,
  createJourney,
  updateJourney,
  deleteJourney,
  inviteParticipant,
  removeParticipant,
  respondToInvitation,
  getRecommendations,
  getInviteLink,
  joinByInviteCode
};